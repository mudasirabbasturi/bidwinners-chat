import React from 'react';
import { MdClose, MdAccessTime, MdCheckCircle, MdCancel } from 'react-icons/md';

function ViewInvitations({ open, onClose, project }) {
    if (!open) return null;

    const invitations = project.invitations || [];

    return (
        <div className="invite-modal-overlay">
            <div className="invite-modal-box">
                <div className="invite-modal-header">
                    <h4>Project Invitations ({invitations.length})</h4>
                    <button className="invite-close-btn" onClick={onClose}><MdClose size={20} /></button>
                </div>
                <div className="invite-modal-body">
                    {invitations.length === 0 ? (
                        <p className="invite-empty-state">No invitations sent for this project yet.</p>
                    ) : (
                        <div className="invite-list-wrapper">
                            {invitations.map(invite => (
                                <div key={invite.id} className="invite-list-item">
                                    <div className="invite-item-details">
                                        <span className="invite-receiver-name">{invite.receiver?.name}</span>
                                        <span className="invite-sender-meta">Invited by {invite.sender?.name}</span>
                                    </div>
                                    <span className={`invite-status-badge ${invite.status}`}>
                                        {invite.status === 'pending' && <MdAccessTime size={14} />}
                                        {invite.status === 'accepted' && <MdCheckCircle size={14} />}
                                        {invite.status === 'rejected' && <MdCancel size={14} />}
                                        {invite.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="invite-modal-footer">
                    <button className="invite-btn-cancel" onClick={onClose} style={{ width: '100%' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default ViewInvitations;