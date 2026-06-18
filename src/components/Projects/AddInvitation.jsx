import React, { useState, useEffect } from 'react';
import { MdClose, MdMailOutline } from 'react-icons/md';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function AddInvitation({ open, onClose, project, showToast }) {
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            // Fetch users available to be invited
            const token = localStorage.getItem('token');
            fetch(`${API_BASE_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    // Filter out existing team members if needed
                    const existingMemberIds = project.team_members?.map(m => m.user_id) || [];
                    const list = (data.users || data).filter(u => !existingMemberIds.includes(u.id));
                    setUsers(list);
                })
                .catch(err => console.error(err));
        }
    }, [open, project]);

    const handleSend = async () => {
        if (!selectedUserId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/project-invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    project_id: project.id,
                    receiver_id: selectedUserId
                })
            });
            const data = await response.json();
            if (response.ok || data.status) {
                showToast('success', 'Invitation Sent', 'User invited successfully');
                onClose();
            } else {
                showToast('error', 'Failed', data.message || 'Something went wrong');
            }
        } catch (error) {
            showToast('error', 'Error', 'Network connection error');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="invite-modal-overlay">
            <div className="invite-modal-box">
                <div className="invite-modal-header">
                    <h4>Invite to {project.name || project.project_title}</h4>
                    <button className="invite-close-btn" onClick={onClose}><MdClose size={20} /></button>
                </div>
                <div className="invite-modal-body">
                    <label className="invite-label">Select Team Member</label>
                    <select
                        className="invite-select"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                    >
                        <option value="">-- Select a User --</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email || 'No email'})</option>
                        ))}
                    </select>
                </div>
                <div className="invite-modal-footer">
                    <button className="invite-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="invite-btn-submit" onClick={handleSend} disabled={loading || !selectedUserId}>
                        <MdMailOutline size={16} /> {loading ? 'Sending...' : 'Send Invitation'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddInvitation;