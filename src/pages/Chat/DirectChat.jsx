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

    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

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
        const channelId = [currentUser.id, partnerId].sort().join('-');
        const channelName = `direct-chat-${channelId}`;
        const channel = ablyClient.channels.get(channelName);

        const handleEvent = (msg) => {
            // Ignore echoes of our own publishes
            if (msg.clientId === String(currentUser.id)) return;

            const { action, data } = msg.data;
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
        return 'other';
    };

    const getFileUrl = (file) => {
        if (!file) return '';
        // If url starts with blob:, use directly (local preview)
        if (file.url && file.url.startsWith('blob:')) return file.url;

        // If full URL already given, use it (backend might return this for safety)
        if (file.url && file.url.startsWith('http')) return file.url;

        // If URL starts with /, add API_BASE_URL
        if (file.url && file.url.startsWith('/')) return `${API_BASE_URL}${file.url}`;

        // Fallback: construct from path (if backend sends path only)
        const path = file.url || `uploads/media/direct_chat/${file.name}`;
        return `${API_BASE_URL}/${path}`;
    };
    /* ─── File rendering ─────────────────────────────────────────── */
    const renderFileBubble = (file, isSelf) => {
        const type = getFileType(file.name);
        const url = getFileUrl(file);

        if (type === 'image') {
            return (
                <div className="dc-file-image-wrapper" onClick={() => window.open(url, '_blank')}>
                    <img src={url} alt={file.name} className="dc-file-image-preview"
                        onError={e => { e.target.style.display = 'none'; }} />
                    <div className="dc-file-image-overlay"><MdOpenInNew size={18} /></div>
                </div>
            );
        }

        return (
            <div className={`dc-file-doc-item ${isSelf ? 'self' : ''}`}
                onClick={() => window.open(url, '_blank')}>
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
                <MdOpenInNew size={14} className="dc-file-doc-open" />
            </div>
        );
    };

    /* ─── Send ───────────────────────────────────────────────────── */
    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim() && !selectedFile) return;

        const formData = new FormData();
        formData.append('receiver_id', partnerId);
        if (inputText.trim()) formData.append('message', inputText);
        if (replyTo) formData.append('reply_to_id', replyTo.id);
        if (selectedFile) formData.append('file', selectedFile);

        // Optimistic local message
        const tempId = `temp-${Date.now()}`;
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
            file: selectedFile
                ? { name: selectedFile.name, url: URL.createObjectURL(selectedFile) }
                : null,
        };

        setMessages(prev => [...prev, tempMsg]);
        setInputText('');
        setSelectedFile(null);
        setReplyTo(null);
        scrollToBottom();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/direct-chat-send-message`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();

            if (data.success && data.message) {
                console.log(data)
                setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));

                // Publish to Ably
                if (ablyClient) {
                    const channelId = [currentUser.id, partnerId].sort().join('-');
                    const channel = ablyClient.channels.get(`direct-chat-${channelId}`);
                    channel.publish('direct-chat-event', { action: 'message', data: data.message });
                }
            }
        } catch (err) {
            console.error('Error sending message:', err);
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
                    const channelId = [currentUser.id, partnerId].sort().join('-');
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
        <div className="dc-chat-inner">
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

                                                        {/* File */}
                                                        {msg.file && (
                                                            <div className="dc-bubble-files">
                                                                {renderFileBubble(msg.file, isSelf)}
                                                            </div>
                                                        )}

                                                        {/* Text */}
                                                        {(msg.content || msg.message) && (
                                                            <span>{msg.content || msg.message}</span>
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
                    <button
                        type="button"
                        className="dc-input-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                    >
                        <MdAttachFile size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <input
                        type="text"
                        className="dc-text-input"
                        placeholder={`Message ${partnerNameState}…`}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                    />
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
