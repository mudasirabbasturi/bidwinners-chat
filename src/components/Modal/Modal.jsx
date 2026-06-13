// components/Modal/Modal.jsx
import React, { useEffect, useCallback } from 'react';
import { MdClose } from 'react-icons/md';
import './Modal.css';

const Modal = ({
    open,
    onClose,
    title,
    children,
    footer,
    width = 520,
    centered = false,
    closable = true,
    maskClosable = true,
    destroyOnClose = false,
    className = '',
    zIndex = 1000,
}) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape' && closable) {
            onClose();
        }
    }, [onClose, closable]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    const handleMaskClick = (e) => {
        if (e.target === e.currentTarget && maskClosable) {
            onClose();
        }
    };

    return (
        <div
            className="modal-root"
            style={{ zIndex }}
            onClick={handleMaskClick}
        >
            <div
                className={`modal-wrapper ${centered ? 'modal-centered' : ''} ${className}`}
                style={{ maxWidth: width }}
            >
                {closable && (
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <MdClose size={20} />
                    </button>
                )}

                {title && (
                    <div className="modal-header">
                        <h3 className="modal-title">{title}</h3>
                    </div>
                )}

                <div className="modal-body">
                    {children}
                </div>

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;