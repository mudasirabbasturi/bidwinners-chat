import { useState, useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
    MdSend,
    MdAttachFile,
    MdReply,
    MdDelete,
    MdClose,
    MdPictureAsPdf,
    MdInsertDriveFile,
    MdOpenInNew,
    MdFilePresent,
    MdMessage,
    MdDoneAll,
    MdDownload,
    MdMic,
    MdStop,
    MdGraphicEq,
    MdZoomIn,
} from 'react-icons/md';

import './DirectChat.css';
import Ably from 'ably';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ablyApiKey = import.meta.env.VITE_ABLY_API_KEY;
const ablyClient = ablyApiKey
    ? new Ably.Realtime({
        key: ablyApiKey,
        clientId: String(JSON.parse(localStorage.getItem('user') || '{}').id || 'anonymous'),
    })
    : null;

// Deterministic avatar color from name
const USER_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
const getAvatarColor = (name) => {
    if (!name) return USER_COLORS[0];
    const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % USER_COLORS.length;
    return USER_COLORS[idx];
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const renderFormattedText = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
        if (/^(https?:\/\/|www\.)/i.test(part)) {
            let url = part;
            let trailing = '';
            const matchTrailing = url.match(/[.,!?)]+$/);
            if (matchTrailing) {
                trailing = matchTrailing[0];
                url = url.slice(0, -trailing.length);
            }
            const href = url.toLowerCase().startsWith('www.') ? `https://${url}` : url;
            return (
                <span key={index}>
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {url}
                    </a>
                    {trailing}
                </span>
            );
        }
        return part;
    });
};

/**
 * DirectChat
 * Props:
 *   partnerId   – integer  (the other user's id)
 *   partnerName – string   (the other user's name)
 */
function DirectChat({ partnerId, partnerName }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [partnerNameState, setPartnerNameState] = useState(partnerName || '');
    const [isDragging, setIsDragging] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);

    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);
    const dragCounter = useRef(0);
    const inputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    /* ─── Drag and Drop Handlers ────────────────────────────────── */
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    /* ─── Fetch partner name if not provided ────────────────────── */
    useEffect(() => {
        if (partnerName) {
            setPartnerNameState(partnerName);
            return;
        }
        if (!partnerId) return;

        const fetchPartnerName = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/chat-user-list`, {
                    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.users) {
                    const found = data.users.find(u => Number(u.id) === Number(partnerId));
                    if (found) {
                        setPartnerNameState(found.name);
                    }
                }
            } catch (err) {
                console.error('Error fetching partner name:', err);
            }
        };
        fetchPartnerName();
    }, [partnerId, partnerName]);

    /* ─── Ably real-time subscription ───────────────────────────── */
    useEffect(() => {
        if (!partnerId || !ablyClient) return;

        // Symmetric channel: sort the two IDs so both sides land on the same channel
        const channelId = [Number(currentUser.id), Number(partnerId)].sort((a, b) => a - b).join('-');
        const channelName = `direct-chat-${channelId}`;
        const channel = ablyClient.channels.get(channelName);

        const handleEvent = (msg) => {
            if (msg.clientId === String(currentUser.id)) return;
            const { action, data } = msg.data;
            console.log('📥 RECEIVED DATA:', JSON.stringify(data, null, 2))
            if (action === 'message') {
                setMessages(prev => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });
                scrollToBottom();
            } else if (action === 'delete') {
                setMessages(prev => prev.filter(m => m.id !== data.id));
            }
        };

        channel.subscribe('direct-chat-event', handleEvent);
        return () => {
            channel.unsubscribe('direct-chat-event', handleEvent);
        };
    }, [partnerId, currentUser.id]);

    /* ─── Fetch message history when partner changes ─────────────── */
    useEffect(() => {
        if (!partnerId) return;

        const fetchMessages = async () => {
            setLoading(true);
            setMessages([]);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(
                    `${API_BASE_URL}/api/direct-chat-messages/${partnerId}`,
                    { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }
                );
                const data = await res.json();
                if (data.chat_messages) {
                    setMessages(data.chat_messages);
                    scrollToBottom();
                }
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
        setReplyTo(null);
        setSelectedFile(null);
        setInputText('');
    }, [partnerId]);

    /* ─── Helpers ────────────────────────────────────────────────── */
    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                const el = scrollRef.current.getScrollElement();
                if (el) el.scrollTop = el.scrollHeight;
            }
        }, 100);
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleDateString([], {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const getFileType = (name) => {
        if (!name) return 'other';
        const ext = name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['webm', 'ogg', 'mp3', 'wav', 'm4a', 'aac'].includes(ext)) return 'audio';
        return 'other';
    };

    /* ─── Audio Recording ───────────────────────────────────────── */
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                const ext = recorder.mimeType.includes('webm') ? 'webm' : 'ogg';
                const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: recorder.mimeType });
                setSelectedFile(file);
                stream.getTracks().forEach(t => t.stop());
                setIsRecording(false);
                clearInterval(recordingTimerRef.current);
                setRecordingSeconds(0);
            };
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
            setRecordingSeconds(0);
            recordingTimerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
        } catch (err) {
            console.error('Microphone error:', err);
            alert('Microphone permission denied or not available.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const formatRecordingTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const getFileUrl = (file) => {
        if (!file) return '';
        if (!file.url) return '';
        if (file.url.startsWith('http')) return file.url;
        if (file.url.startsWith('/')) return `${API_BASE_URL}${file.url}`;
        const path = file.url || `uploads/media/direct_chat/${file.name}`;
        return `${API_BASE_URL}/${path}`;
    };

    /* ─── File rendering ─────────────────────────────────────── */
    const renderFileBubble = (file, isSelf) => {
        const type = getFileType(file.name);
        const url = getFileUrl(file);

        if (type === 'image') {
            return (
                <div className="dc-file-image-wrapper" onClick={() => setLightboxUrl(url)}>
                    <img src={url} alt={file.name} className="dc-file-image-preview"
                        onError={e => { e.target.style.display = 'none'; }} />
                    <div className="dc-file-image-overlay"><MdZoomIn size={20} /></div>
                </div>
            );
        }

        if (type === 'audio') {
            return (
                <div className="dc-audio-player-wrapper">
                    <div className="dc-audio-icon"><MdGraphicEq size={20} /></div>
                    <audio controls className="dc-audio-player" src={url} />
                </div>
            );
        }

        return (
            <div className={`dc-file-doc-item ${isSelf ? 'self' : ''}`}>
                <div className="dc-file-doc-icon">
                    {type === 'pdf'
                        ? <MdPictureAsPdf size={26} className="dc-file-icon-pdf" />
                        : <MdInsertDriveFile size={26} className="dc-file-icon-other" />}
                </div>
                <div className="dc-file-doc-info">
                    <span className="dc-file-doc-name">{file.name}</span>
                    <span className="dc-file-doc-type">
                        {type === 'pdf' ? 'PDF Document' : 'File Attachment'}
                    </span>
                </div>
                <div className="dc-file-doc-actions">
                    <button className="dc-file-action-btn" title="Open in tab" onClick={() => window.open(url, '_blank')}>
                        <MdOpenInNew size={14} />
                    </button>
                    <a className="dc-file-action-btn" title="Download" href={url} download={file.name}>
                        <MdDownload size={14} />
                    </a>
                </div>
            </div>
        );
    };

    /* ─── Send (WhatsApp-like: wait for server, no optimistic blob) ── */
    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim() && !selectedFile) return;

        // 1. Show a sending placeholder immediately (no blob URL for file)
        const tempId = `sending-${Date.now()}`;
        const tempMsg = {
            id: tempId,
            senderId: currentUser.id,
            receiverId: partnerId,
            user_name: currentUser.name || 'You',
            content: inputText,
            timestamp: new Date().toISOString(),
            reply_to_id: replyTo ? replyTo.id : null,
            reply_to_message: replyTo ? replyTo.content : null,
            reply_to_user_name: replyTo ? replyTo.userName : null,
            file: selectedFile ? { name: selectedFile.name, url: null } : null,
            sending: true,
        };

        setMessages(prev => [...prev, tempMsg]);
        const inputTextSnapshot = inputText;
        const replyToSnapshot = replyTo;
        setInputText('');
        setSelectedFile(null);
        setReplyTo(null);
        scrollToBottom();

        // 2. Upload to server
        const formData = new FormData();
        formData.append('receiver_id', partnerId);
        if (inputTextSnapshot.trim()) formData.append('message', inputTextSnapshot);
        if (replyToSnapshot) formData.append('reply_to_id', replyToSnapshot.id);
        if (selectedFile) formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/direct-chat-send-message`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.message) {
                // 3. Replace placeholder with the real server response
                const serverMsg = data.message;
                serverMsg.sending = false;
                setMessages(prev => prev.map(m => m.id === tempId ? serverMsg : m));

                // 4. Publish server response to Ably so other users see it
                if (ablyClient) {
                    const channelId = [Number(currentUser.id), Number(partnerId)].sort((a, b) => a - b).join('-');
                    const channel = ablyClient.channels.get(`direct-chat-${channelId}`);
                    channel.publish('direct-chat-event', { action: 'message', data: serverMsg });
                }
            } else {
                // Mark as failed
                setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sending: false, failed: true } : m));
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, sending: false, failed: true } : m));
        }
    };

    /* ─── Retry failed ───────────────────────────────────────────── */
    const handleRetry = async (failedMsg) => {
        setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, failed: false, sending: true } : m));
        try {
            const formData = new FormData();
            formData.append('receiver_id', partnerId);
            if (failedMsg.content?.trim()) formData.append('message', failedMsg.content);
            if (failedMsg.reply_to_id) formData.append('reply_to_id', failedMsg.reply_to_id);

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/direct-chat-send-message`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.message) {
                const serverMsg = data.message;
                serverMsg.sending = false;
                setMessages(prev => prev.map(m => m.id === failedMsg.id ? serverMsg : m));
                if (ablyClient) {
                    const channelId = [Number(currentUser.id), Number(partnerId)].sort((a, b) => a - b).join('-');
                    const channel = ablyClient.channels.get(`direct-chat-${channelId}`);
                    channel.publish('direct-chat-event', { action: 'message', data: serverMsg });
                }
            } else {
                setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, sending: false, failed: true } : m));
            }
        } catch {
            setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, sending: false, failed: true } : m));
        }
    };

    /* ─── Delete ─────────────────────────────────────────────────── */
    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm('Delete this message?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/direct-chat-message/${msgId}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setMessages(prev => prev.filter(m => m.id !== msgId));

                if (ablyClient) {
                    const channelId = [Number(currentUser.id), Number(partnerId)].sort((a, b) => a - b).join('-');
                    const channel = ablyClient.channels.get(`direct-chat-${channelId}`);
                    channel.publish('direct-chat-event', { action: 'delete', data: { id: msgId } });
                }
            }
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    };

    /* ─── Reply ──────────────────────────────────────────────────── */
    const handleReplyClick = (msg) => {
        setReplyTo({
            id: msg.id,
            userName: msg.user_name || 'Unknown',
            content: msg.content || msg.message || (msg.file ? `📎 ${msg.file.name}` : ''),
        });
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

    /* ─── File picker ────────────────────────────────────────────── */
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    /* ─── Render ─────────────────────────────────────────────────── */
    if (!partnerId) {
        return (
            <div className="dc-no-selection">
                <div className="dc-no-selection-icon"><MdMessage size={56} /></div>
                <h3>Your Messages</h3>
                <p>Select a user from the sidebar to start chatting</p>
            </div>
        );
    }

    return (
        <div
            className="dc-chat-inner"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* ── Image Lightbox ── */}
            {lightboxUrl && (
                <div className="dc-lightbox-overlay" onClick={() => setLightboxUrl(null)}>
                    <div className="dc-lightbox-inner" onClick={e => e.stopPropagation()}>
                        <img src={lightboxUrl} alt="preview" className="dc-lightbox-img" />
                        <div className="dc-lightbox-actions">
                            <a href={lightboxUrl} download className="dc-lightbox-btn">
                                <MdDownload size={20} /> Download
                            </a>
                            <button className="dc-lightbox-btn close" onClick={() => setLightboxUrl(null)}>
                                <MdClose size={20} /> Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isDragging && (
                <div className="dc-drag-drop-overlay">
                    <div className="dc-drag-drop-content">
                        <MdAttachFile size={48} className="dc-drag-drop-icon" />
                        <p>Drop file here to upload</p>
                    </div>
                </div>
            )}
            {/* ── Header ── */}
            <div className="dc-chat-header">
                <div
                    className="dc-chat-header-avatar"
                    style={{ background: getAvatarColor(partnerNameState) }}
                >
                    <span>{getInitials(partnerNameState)}</span>
                </div>
                <div className="dc-chat-header-info">
                    <h3 className="dc-chat-header-name">{partnerNameState}</h3>
                    <span className="dc-chat-header-status">Direct message</span>
                </div>
            </div>

            {/* ── Messages ── */}
            <SimpleBar ref={scrollRef} className="dc-messages-scroll">
                <div className="dc-messages-container">
                    {loading && messages.length === 0 ? (
                        <div className="dc-loading-msg">Loading messages…</div>
                    ) : messages.length === 0 ? (
                        <div className="dc-empty-messages">
                            <MdMessage size={40} />
                            <p>No messages yet. Say hello! 👋</p>
                        </div>
                    ) : (
                        (() => {
                            let lastDate = '';
                            return messages.map(msg => {
                                const ts = msg.timestamp || msg.created_at;
                                const msgDate = new Date(ts).toDateString();
                                const showSep = msgDate !== lastDate;
                                if (showSep) lastDate = msgDate;

                                const senderId = msg.senderId || msg.senderid || msg.user_id;
                                const isSelf = Number(senderId) === Number(currentUser.id);
                                const userName = msg.user_name || 'Unknown';
                                const bgColor = getAvatarColor(userName);

                                return (
                                    <div key={msg.id} id={`dc-msg-${msg.id}`}>
                                        {showSep && (
                                            <div className="dc-date-separator">
                                                {formatDateSeparator(ts)}
                                            </div>
                                        )}

                                        <div className={`dc-message-row ${isSelf ? 'self' : ''}`}>
                                            {/* Other user avatar */}
                                            {!isSelf && (
                                                <div
                                                    className="dc-message-avatar"
                                                    style={{ background: bgColor }}
                                                >
                                                    <span>{getInitials(userName)}</span>
                                                </div>
                                            )}

                                            <div className="dc-message-content">
                                                <div className="dc-bubble-row">
                                                    {/* Actions left of bubble (self) */}
                                                    {isSelf && (
                                                        <div className="dc-message-actions">
                                                            <button
                                                                className="dc-action-btn"
                                                                title="Reply"
                                                                onClick={() => handleReplyClick(msg)}
                                                            >
                                                                <MdReply size={14} />
                                                            </button>
                                                            <button
                                                                className="dc-action-btn delete"
                                                                title="Delete"
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                            >
                                                                <MdDelete size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="dc-message-bubble">
                                                        {/* Reply preview */}
                                                        {/* {msg.reply_to_message && (
                                                            <div
                                                                className="dc-bubble-reply-preview"
                                                                onClick={() => {
                                                                    const el = document.getElementById(
                                                                        `dc-msg-${msg.reply_to_id}`
                                                                    );
                                                                    if (el) {
                                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        el.style.outline = '2px solid var(--primary-color)';
                                                                        setTimeout(() => { el.style.outline = ''; }, 1500);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="dc-bubble-reply-name">
                                                                    {msg.reply_to_user_name || 'User'}
                                                                </div>
                                                                <div className="dc-bubble-reply-text">
                                                                    {msg.reply_to_message}
                                                                </div>
                                                            </div>
                                                        )} */}
                                                        {msg.reply_to_id && (
                                                            <div
                                                                className="dc-bubble-reply-preview"
                                                                onClick={() => {
                                                                    const el = document.getElementById(`dc-msg-${msg.reply_to_id}`);
                                                                    if (el) {
                                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        el.style.outline = '2px solid var(--primary-color)';
                                                                        setTimeout(() => { el.style.outline = ''; }, 1500);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="dc-bubble-reply-name">
                                                                    {msg.reply_to_user_name || 'User'}
                                                                </div>
                                                                <div className="dc-bubble-reply-text">
                                                                    {msg.reply_to_message || '📎 File attachment'}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Sending indicator */}
                                                        {msg.sending && (
                                                            <div className="dc-bubble-sending">
                                                                <span className="dc-sending-spinner" />
                                                                <span>Sending{msg.file?.name ? ' file...' : '...'}</span>
                                                            </div>
                                                        )}

                                                        {/* Failed indicator */}
                                                        {msg.failed && (
                                                            <div className="dc-bubble-failed">
                                                                <span>Failed to send. </span>
                                                                <button onClick={() => handleRetry(msg)}>Retry</button>
                                                            </div>
                                                        )}

                                                        {/* File */}
                                                        {msg.file && msg.file.url && !msg.sending && (
                                                            <div className="dc-bubble-files">
                                                                {renderFileBubble(msg.file, isSelf)}
                                                            </div>
                                                        )}

                                                        {/* Text */}
                                                        {(msg.content || msg.message) && (
                                                            <span>{renderFormattedText(msg.content || msg.message)}</span>
                                                        )}
                                                    </div>

                                                    {/* Actions right of bubble (other) */}
                                                    {!isSelf && (
                                                        <div className="dc-message-actions">
                                                            <button
                                                                className="dc-action-btn"
                                                                title="Reply"
                                                                onClick={() => handleReplyClick(msg)}
                                                            >
                                                                <MdReply size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="dc-message-time">
                                                    {formatTime(ts)}
                                                    {isSelf && (
                                                        <MdDoneAll size={12} className="dc-read-icon" />
                                                    )}
                                                </span>
                                            </div>

                                            {/* Self avatar */}
                                            {isSelf && (
                                                <div
                                                    className="dc-message-avatar self-avatar"
                                                    style={{ background: getAvatarColor(currentUser.name) }}
                                                >
                                                    <span>{getInitials(currentUser.name)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>
            </SimpleBar>

            {/* ── Reply Bar ── */}
            {replyTo && (
                <div className="dc-reply-bar">
                    <div className="dc-reply-bar-line" />
                    <div className="dc-reply-bar-info">
                        Replying to{' '}
                        <span className="dc-reply-bar-name">{replyTo.userName}</span>:{' '}
                        <span className="dc-reply-bar-text">{replyTo.content}</span>
                    </div>
                    <button className="dc-reply-bar-close" onClick={() => setReplyTo(null)}>
                        <MdClose size={18} />
                    </button>
                </div>
            )}

            {/* ── File Preview ── */}
            {selectedFile && (
                <div className="dc-files-preview">
                    <div className="dc-file-preview-item">
                        {selectedFile.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(selectedFile)} alt="upload preview" />
                        ) : (
                            <MdFilePresent size={36} />
                        )}
                        <button className="dc-file-preview-remove" onClick={handleRemoveFile}>
                            <MdClose size={12} />
                        </button>
                    </div>
                    <span className="dc-file-preview-name">{selectedFile.name}</span>
                </div>
            )}

            {/* ── Input ── */}
            <form className="dc-input-area" onSubmit={handleSend}>
                <div className="dc-input-wrapper">
                    {!isRecording && (
                        <button
                            type="button"
                            className="dc-input-btn"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach file"
                        >
                            <MdAttachFile size={20} />
                        </button>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    {isRecording ? (
                        <div className="dc-recording-indicator">
                            <span className="dc-recording-dot" />
                            <span className="dc-recording-time">{formatRecordingTime(recordingSeconds)}</span>
                            <span className="dc-recording-label">Recording…</span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            ref={inputRef}
                            className="dc-text-input"
                            placeholder={`Message ${partnerNameState}…`}
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                        />
                    )}

                    <button
                        type="button"
                        className={`dc-input-btn dc-mic-btn${isRecording ? ' recording' : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        title={isRecording ? 'Stop recording' : 'Record voice message'}
                    >
                        {isRecording ? <MdStop size={20} /> : <MdMic size={20} />}
                    </button>
                </div>
                <button
                    type="submit"
                    className="dc-send-btn"
                    disabled={!inputText.trim() && !selectedFile}
                >
                    <MdSend size={18} />
                </button>
            </form>
        </div>
    );
}

export default DirectChat;
