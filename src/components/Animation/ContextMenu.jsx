import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MdEdit } from 'react-icons/md';
import './context-menu.css';

/**
 * Animated context menu — renders in a portal so z-index/overflow never clips it.
 *
 * Props:
 *   open     {boolean}   — whether menu is visible
 *   onClose  {function}  — called when user clicks outside or presses Escape
 *   anchor   {RefObject} — ref to the trigger element (positions the menu relative to it)
 *   items    {Array}     — [{ key, label, icon: ReactNode, value, onEdit }]
 */
function ContextMenu({ open, onClose, anchor, items = [] }) {
    const menuRef = useRef(null);

    /* ── Position the menu below the anchor on every open ── */
    useEffect(() => {
        if (!open || !anchor?.current || !menuRef.current) return;

        const rect = anchor.current.getBoundingClientRect();
        const menu = menuRef.current;

        // Reset so we can measure natural width
        menu.style.left = '0px';
        menu.style.top = '0px';

        const menuW = menu.offsetWidth || 280;
        const menuH = menu.offsetHeight || 400;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Prefer right side of the anchor
        let left = rect.right + 6;
        // Flip to left side if it overflows the viewport on the right
        if (left + menuW > vw - 8) {
            left = rect.left - menuW - 6;
        }

        // Align top with anchor's top
        let top = rect.top;
        // If it overflows the viewport at the bottom, shift it up
        if (top + menuH > vh - 8) {
            top = vh - menuH - 8;
        }

        // Final safety check so it doesn't render off-screen left/top
        if (left < 8) left = 8;
        if (top < 8) top = 8;

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
    }, [open, anchor]);

    /* ── Close on outside click / Escape ── */
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        const onMouse = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) &&
                anchor?.current && !anchor.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', onMouse);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onMouse);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose, anchor]);

    /* ── Strip HTML tags for plain text display ── */
    const stripHtml = (html) => {
        if (!html) return null;
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text || null;
    };

    const formatValue = (item) => {
        const raw = item.value;
        if (!raw && raw !== 0) return null;
        const plain = typeof raw === 'string' ? (stripHtml(raw) || raw) : String(raw);
        return plain.length > 40 ? plain.slice(0, 38) + '…' : plain;
    };

    return createPortal(
        <div className={`cm-backdrop ${open ? 'cm-open' : ''}`}>
            <div ref={menuRef} className={`cm-menu ${open ? 'cm-menu-open' : ''}`}>
                <div className="cm-header">
                    <span className="cm-header-title">Edit Project Fields</span>
                    <span className="cm-header-count">{items.length} fields</span>
                </div>
                <div className="cm-list">
                    {items.map((item, idx) => {
                        const val = formatValue(item);
                        return (
                            <div
                                key={item.key}
                                className="cm-item"
                                style={{ animationDelay: open ? `${idx * 22}ms` : '0ms' }}
                            >
                                <div className="cm-item-icon">{item.icon}</div>
                                <div className="cm-item-body">
                                    <span className="cm-item-label">{item.label}</span>
                                    {/* <span className={`cm-item-value ${!val ? 'cm-empty' : ''}`}>
                                        {val || 'Not set'}
                                    </span> */}
                                </div>
                                <button
                                    className="cm-edit-btn"
                                    title={`Edit ${item.label}`}
                                    onClick={(e) => { e.stopPropagation(); item.onEdit?.(); }}
                                >
                                    <MdEdit size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ContextMenu;
