import { useState, useEffect, useRef } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
    MdSend,
    MdAttachFile,
    MdReply,
    MdDelete,
    MdClose,
    MdPeople,
    MdPictureAsPdf,
    MdInsertDriveFile,
    MdImage,
    MdOpenInNew,
    MdFilePresent
} from 'react-icons/md';

import './ProjectChat.css';

import Ably from 'ably';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_PROFILE_BASE_URL = 'https://enterprise.bidwinners.net';

// Initialize Ably client (using the direct API Key provided in .env)
const ablyApiKey = import.meta.env.VITE_ABLY_API_KEY;
const ablyClient = ablyApiKey ? new Ably.Realtime({ key: ablyApiKey, clientId: String(JSON.parse(localStorage.getItem('user') || '{}').id || 'anonymous') }) : null;

function ProjectChat({ projectId, project }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Subscribe to real-time chat channel
    useEffect(() => {
        if (!projectId || !ablyClient) return;

        const channelName = `project-chat-${projectId}`;
        const channel = ablyClient.channels.get(channelName);

        // Handle incoming real-time messages
        const handleNewMessage = (message) => {
            // Ignore messages sent by ourselves since we've already appended and updated them locally
            if (message.clientId === String(currentUser.id)) {
                return;
            }

            const { action, data } = message.data;

            if (action === 'message') {
                setMessages((prev) => {
                    // Prevent duplicate if message already exists
                    if (prev.some((m) => m.id === data.id)) return prev;
                    return [...prev, data];
                });
                scrollToBottom();
            } else if (action === 'delete') {
                setMessages((prev) => prev.filter((m) => m.id !== data.id));
            }
        };

        channel.subscribe('chat-event', handleNewMessage);

        return () => {
            channel.unsubscribe('chat-event', handleNewMessage);
        };
    }, [projectId, currentUser.id]);

    // Fetch messages when project ID changes
    useEffect(() => {
        if (!projectId) return;

        let active = true;
        setMessages([]); // Clear previous project messages immediately
        const fetchMessages = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/chat-project-messages/${projectId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (active && data.chat_messages) {
                    setMessages(data.chat_messages);
                    scrollToBottom();
                }
            } catch (error) {
                console.error('Error fetching chat messages:', error);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchMessages();
        setReplyTo(null);
        setSelectedFile(null);
        setInputText('');

        return () => {
            active = false;
        };
    }, [projectId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                const scrollElement = scrollRef.current.getScrollElement();
                if (scrollElement) {
                    scrollElement.scrollTop = scrollElement.scrollHeight;
                }
            }
        }, 100);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim() && !selectedFile) return;

        const formData = new FormData();
        formData.append('project_id', projectId);
        formData.append('user_id', currentUser.id);
        if (inputText.trim()) {
            formData.append('message', inputText);
        }
        if (replyTo) {
            formData.append('reply_to_id', replyTo.id);
        }
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        // Temporary local message state for speed
        const tempId = `temp-${Date.now()}`;
        const tempMsg = {
            id: tempId,
            senderId: currentUser.id,
            user_name: currentUser.name || 'You',
            content: inputText,
            timestamp: new Date().toISOString(),
            reply_to_id: replyTo ? replyTo.id : null,
            reply_to_message: replyTo ? replyTo.content : null,
            reply_to_user_name: replyTo ? replyTo.userName : null,
            file: selectedFile ? { name: selectedFile.name, url: URL.createObjectURL(selectedFile) } : null
        };

        setMessages(prev => [...prev, tempMsg]);
        setInputText('');
        setSelectedFile(null);
        setReplyTo(null);
        scrollToBottom();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/chat-project-send-message`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await response.json();

            if (data.success && data.message) {
                // Replace temp message with correct database record
                setMessages(prev =>
                    prev.map(m => m.id === tempId ? data.message : m)
                );

                // Publish real-time event via Ably to other participants
                if (ablyClient) {
                    const channelName = `project-chat-${projectId}`;
                    const channel = ablyClient.channels.get(channelName);
                    channel.publish('chat-event', {
                        action: 'message',
                        data: data.message
                    });
                }
            } else {
                console.error('Failed to send message:', data.message);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/chat-project-message/${msgId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setMessages(prev => prev.filter(m => m.id !== msgId));

                // Publish deletion event via Ably to other participants
                if (ablyClient) {
                    const channelName = `project-chat-${projectId}`;
                    const channel = ablyClient.channels.get(channelName);
                    channel.publish('chat-event', {
                        action: 'delete',
                        data: { id: msgId }
                    });
                }
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };


    const handleReplyClick = (msg) => {
        setReplyTo({
            id: msg.id,
            userName: msg.user_name || msg.user?.name || 'Unknown',
            content: msg.content || msg.message || (msg.file ? `📎 File: ${msg.file.name}` : '')
        });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Format helpers
    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (timeStr) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Determine file type from filename
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
        // If full URL already given, use it
        if (file.url && file.url.startsWith('http')) return file.url;
        // If URL starts with /, add API_BASE_URL
        if (file.url && file.url.startsWith('/')) return `${API_BASE_URL}${file.url}`;
        // Fallback: construct from path
        const path = file.url || `uploads/media/project_chat/${file.name}`;
        return `${API_BASE_URL}/${path}`;
    };

    // Render file attachment inside a chat bubble
    const renderFileBubble = (file, isSelf) => {
        const type = getFileType(file.name);
        const url = getFileUrl(file);

        if (type === 'image') {
            return (
                <div className="chat-file-image-wrapper" onClick={() => window.open(url, '_blank')}>
                    <img
                        src={url}
                        alt={file.name}
                        className="chat-file-image-preview"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="chat-file-image-overlay">
                        <MdOpenInNew size={18} />
                    </div>
                </div>
            );
        }

        return (
            <div className={`chat-file-doc-item ${isSelf ? 'self' : ''}`} onClick={() => window.open(url, '_blank')}>
                <div className="chat-file-doc-icon">
                    {type === 'pdf'
                        ? <MdPictureAsPdf size={28} className="file-icon-pdf" />
                        : <MdInsertDriveFile size={28} className="file-icon-other" />
                    }
                </div>
                <div className="chat-file-doc-info">
                    <span className="chat-file-doc-name">{file.name}</span>
                    <span className="chat-file-doc-type">{type === 'pdf' ? 'PDF Document' : 'File Attachment'}</span>
                </div>
                <MdOpenInNew size={16} className="chat-file-doc-open" />
            </div>
        );
    };


    return (
        <div className="chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    <h3 className="chat-header-title">{project?.name || 'Project Chat'}</h3>
                    <div className="chat-header-meta">
                        <span className="chat-header-members">
                            <MdPeople size={16} />
                            {project?.team_members?.length || 0} members joined
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <SimpleBar ref={scrollRef} className="chat-messages-scroll">
                <div className="chat-messages-container">
                    {loading && messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                            Loading conversation history...
                        </div>
                    ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No messages in this project workspace yet. Send a message to start!
                        </div>
                    ) : (
                        (() => {
                            let lastDate = '';
                            return messages.map((msg) => {
                                const msgDate = new Date(msg.timestamp || msg.created_at).toDateString();
                                const showSeparator = msgDate !== lastDate;
                                if (showSeparator) {
                                    lastDate = msgDate;
                                }

                                const senderId = msg.senderId || msg.senderid || msg.user_id;
                                const isSelf = senderId == currentUser.id;
                                const userName = msg.user_name || msg.user?.name || 'Unknown';
                                const userAvatar = msg.user_avatar || msg.user?.media?.file_path;

                                return (
                                    <div key={msg.id} id={`chat-msg-${msg.id}`}>
                                        {showSeparator && (
                                            <div className="chat-date-separator">
                                                {formatDateSeparator(msg.timestamp || msg.created_at)}
                                            </div>
                                        )}
                                        <div className={`chat-message-row ${isSelf ? 'self' : ''}`}>
                                            {/* Avatar - hidden for self, shown on left for others */}
                                            {!isSelf && (
                                                <div className="chat-message-avatar">
                                                    {userAvatar ? (
                                                        <img
                                                            src={`${USER_PROFILE_BASE_URL}/${userAvatar}`}
                                                            alt={userName}
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <span style={{ display: userAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                        {getInitials(userName)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="chat-message-content">
                                                {!isSelf && <span className="chat-message-sender">{userName}</span>}

                                                {/* Bubble + inline action buttons side by side */}
                                                <div className="chat-bubble-row">
                                                    {/* Actions appear to the LEFT of bubble for self messages */}
                                                    {isSelf && (
                                                        <div className="chat-message-actions">
                                                            <button className="chat-action-btn" title="Reply" onClick={() => handleReplyClick(msg)}>
                                                                <MdReply size={14} />
                                                            </button>
                                                            <button className="chat-action-btn delete" title="Delete" onClick={() => handleDeleteMessage(msg.id)}>
                                                                <MdDelete size={14} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="chat-message-bubble">
                                                        {msg.reply_to_id && (
                                                            <div
                                                                className="chat-bubble-reply-preview"
                                                                onClick={() => {
                                                                    const targetMsg = document.getElementById(`chat-msg-${msg.reply_to_id}`);
                                                                    if (targetMsg) {
                                                                        targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        targetMsg.style.outline = '2px solid var(--primary-color)';
                                                                        setTimeout(() => { targetMsg.style.outline = ''; }, 1500);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="chat-bubble-reply-name">{msg.reply_to_user_name || 'User'}</div>
                                                                <div className="chat-bubble-reply-text">
                                                                    {msg.reply_to_message || '📎 File attachment'}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {msg.file && (
                                                            <div className="chat-bubble-files">
                                                                {renderFileBubble(msg.file, isSelf)}
                                                            </div>
                                                        )}

                                                        {msg.content || msg.message}
                                                    </div>

                                                    {/* Actions appear to the RIGHT of bubble for others */}
                                                    {!isSelf && (
                                                        <div className="chat-message-actions">
                                                            <button className="chat-action-btn" title="Reply" onClick={() => handleReplyClick(msg)}>
                                                                <MdReply size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="chat-message-time">{formatTime(msg.timestamp || msg.created_at)}</span>
                                            </div>

                                            {/* Avatar placeholder for self to keep layout consistent */}
                                            {isSelf && (
                                                <div className="chat-message-avatar">
                                                    {userAvatar ? (
                                                        <img
                                                            src={`${USER_PROFILE_BASE_URL}/${userAvatar}`}
                                                            alt={userName}
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <span style={{ display: userAvatar ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                                        {getInitials(userName)}
                                                    </span>
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

            {/* Reply Bar */}
            {replyTo && (
                <div className="chat-reply-bar">
                    <div className="chat-reply-bar-info">
                        Replying to <span className="chat-reply-bar-name">{replyTo.userName}</span>: <span className="chat-reply-bar-text">{replyTo.content}</span>
                    </div>
                    <button className="chat-reply-bar-close" onClick={() => setReplyTo(null)}>
                        <MdClose size={18} />
                    </button>
                </div>
            )}

            {/* File Previews */}
            {selectedFile && (
                <div className="chat-files-preview">
                    <div className="chat-file-preview-item">
                        {selectedFile.type.startsWith('image/') ? (
                            <img src={URL.createObjectURL(selectedFile)} alt="upload preview" />
                        ) : (
                            <MdFilePresent size={36} />
                        )}
                        <button className="chat-file-preview-remove" onClick={handleRemoveFile}>
                            <MdClose size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Input Footer */}
            <form className="chat-input-area" onSubmit={handleSend}>
                <div className="chat-input-wrapper">
                    <button
                        type="button"
                        className="chat-input-btn"
                        onClick={() => fileInputRef.current?.click()}
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
                        className="chat-text-input"
                        placeholder="Write a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="chat-input-btn chat-send-btn"
                    disabled={!inputText.trim() && !selectedFile}
                >
                    <MdSend size={18} />
                </button>
            </form>
        </div>
    );
}

export default ProjectChat;
