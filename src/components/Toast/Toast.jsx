// components/Toast/Toast.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { MdCheckCircle, MdError, MdClose, MdWarning, MdInfo } from 'react-icons/md';
import './Toast.css';

const Toast = ({
    type = 'success', // success, error, warning, info
    message = '',
    description = '',
    duration = 4000,
    onClose,
    show = false,
    position = 'top-right' // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            setIsLeaving(false);

            if (duration > 0) {
                const timer = setTimeout(() => {
                    handleClose();
                }, duration);

                return () => clearTimeout(timer);
            }
        }
    }, [show, duration]);

    const handleClose = useCallback(() => {
        setIsLeaving(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300); // Match animation duration
    }, [onClose]);

    if (!isVisible) return null;

    const icons = {
        success: <MdCheckCircle size={22} />,
        error: <MdError size={22} />,
        warning: <MdWarning size={22} />,
        info: <MdInfo size={22} />
    };

    const positionClasses = {
        'top-right': 'toast-position-top-right',
        'top-left': 'toast-position-top-left',
        'bottom-right': 'toast-position-bottom-right',
        'bottom-left': 'toast-position-bottom-left',
        'top-center': 'toast-position-top-center',
        'bottom-center': 'toast-position-bottom-center'
    };

    return (
        <div className={`toast-wrapper ${positionClasses[position] || 'toast-position-top-right'}`}>
            <div className={`toast toast-${type} ${isLeaving ? 'toast-leaving' : 'toast-entering'}`}>
                <div className="toast-icon">
                    {icons[type]}
                </div>
                <div className="toast-content">
                    {message && <div className="toast-message">{message}</div>}
                    {description && <div className="toast-description">{description}</div>}
                </div>
                <button className="toast-close" onClick={handleClose}>
                    <MdClose size={16} />
                </button>

                {duration > 0 && (
                    <div className="toast-progress-bar">
                        <div
                            className={`toast-progress toast-progress-${type}`}
                            style={{ animationDuration: `${duration}ms` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

// Toast Container for managing multiple toasts
export const ToastContainer = ({ toasts, position = 'top-right' }) => {
    return (
        <div className={`toast-container toast-position-${position}`}>
            {toasts.map((toast, index) => (
                <div key={toast.id || index} className="toast-item">
                    {toast.content}
                </div>
            ))}
        </div>
    );
};

export default Toast;