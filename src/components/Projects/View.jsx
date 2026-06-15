import { useState, useEffect } from 'react';
import {
    MdRocketLaunch,
    MdLocationOn,
    MdPerson,
    MdConstruction,
    MdStairs,
    MdLink,
    MdCalendarToday,
    MdStar,
    MdOpenInNew,
    MdClose,
    MdRefresh,
} from 'react-icons/md';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import Modal from '../Modal/Modal';
import { Row, Col } from '../Grid/Grid';
import './view.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_PROFILE_BASE_URL = 'https://enterprise.bidwinners.net';

/* ── Status config ───────────────────────────────────────────── */
const STATUS_MAP = {
    'Pending': { label: 'Pending', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    'Takeoff On Progress': { label: 'Takeoff In Progress', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
    'Pricing In Progress': { label: 'Pricing In Progress', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
    'Completed': { label: 'Completed', color: '#10b981', bg: '#f0fdf4', border: '#bbf7d0' },
    'Revision': { label: 'Revision', color: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
    'Hold': { label: 'Hold', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
    'Deliver': { label: 'Deliver', color: '#06b6d4', bg: '#ecfeff', border: '#a5f3fc' },
    'Cancelled': { label: 'Cancelled', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
};

function getStatus(raw) {
    return STATUS_MAP[raw] || { label: raw || '—', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
}

/* ── Small reusable info row ─────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, href }) {
    if (!value) return null;
    return (
        <div className="vp-info-row">
            <div className="vp-info-icon"><Icon size={14} /></div>
            <div className="vp-info-body">
                <span className="vp-info-label">{label}</span>
                {href ? (
                    <a className="vp-info-value vp-link" href={href} target="_blank" rel="noreferrer">
                        {value} <MdOpenInNew size={11} />
                    </a>
                ) : (
                    <span className="vp-info-value">{value}</span>
                )}
            </div>
        </div>
    );
}

/* ── Section heading ─────────────────────────────────────────── */
function SectionLabel({ children }) {
    return <div className="vp-section-label">{children}</div>;
}

/* ── Rich text preview ───────────────────────────────────────── */
function RichContent({ html, placeholder }) {
    if (!html || html === '<p><br></p>' || html.trim() === '') {
        return <p className="vp-empty">{placeholder || 'Not provided'}</p>;
    }
    return (
        <div
            className="vp-rich-content ql-editor"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/* ── Main ViewProject component ──────────────────────────────── */
function ViewProject({ open, onClose, projectId, permissions }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !projectId) return;
        setData(null);
        setError(null);
        setLoading(true);

        const token = localStorage.getItem('token');
        fetch(`${API_BASE_URL}/api/project-view/${projectId}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        })
            .then(r => r.json())
            .then(res => {
                if (res.status) setData(res.data);
                else setError(res.message || 'Failed to load project');
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [open, projectId]);

    const status = data ? getStatus(data.project_status) : null;

    /* ── Unique team members from team_members array ── */
    const members = data?.team_members
        ? Array.from(new Map(data.team_members.map(m => [m.user_id, m])).values())
        : [];

    const hasPermission = (name) => {
        return permissions?.some(p => p.name === name);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={
                <div className="vp-modal-title">
                    <div className="vp-modal-icon">
                        <MdRocketLaunch size={20} />
                    </div>
                    <div>
                        <h2>{data?.project_title || 'Project Details'}</h2>
                        <p>
                            {status && (
                                <span
                                    className="vp-status-pill"
                                    style={{ color: status.color, background: status.bg, borderColor: status.border }}
                                >
                                    <span className="vp-status-dot" style={{ background: status.color }} />
                                    {status.label}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
            }
            width={860}
            footer={
                <div className="vp-footer">
                    <span className="vp-footer-id">
                        {data?.id ? `Project #${data.id}` : ''}
                    </span>
                    <button className="vp-close-btn" onClick={onClose}>
                        <MdClose size={16} /> Close
                    </button>
                </div>
            }
        >
            <SimpleBar className="vp-scroll">
                {/* ── Loading ── */}
                {loading && (
                    <div className="vp-skeleton-wrap">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="vp-skeleton-block">
                                <div className="vp-sk vp-sk-label" />
                                <div className="vp-sk vp-sk-line w-75" />
                                <div className="vp-sk vp-sk-line w-50" />
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Error ── */}
                {!loading && error && (
                    <div className="vp-error">
                        <p>{error}</p>
                        <button onClick={() => { setLoading(true); setError(null); }}>
                            <MdRefresh size={16} /> Retry
                        </button>
                    </div>
                )}

                {/* ── Content ── */}
                {!loading && data && (
                    <div className="vp-body">
                        <Row className="g-3">

                            {/* ── Left column ── */}
                            <Col className="col-12 col-md-6">

                                <SectionLabel>Project Info</SectionLabel>
                                <div className="vp-card">
                                    {hasPermission('View Client Personal') && <InfoRow icon={MdPerson} label="Client" value={data.client_name_for_admin} />}
                                    <InfoRow icon={MdConstruction} label="Construction Type" value={data.project_construction_type} />
                                    <InfoRow icon={MdStairs} label="Floor" value={data.project_floor_number} />
                                    <InfoRow icon={MdStar} label="Template" value={data.project_template} />
                                </div>

                                <SectionLabel>Metrics &amp; Config</SectionLabel>
                                <div className="vp-card">
                                    <div className="vp-metric-grid">
                                        {data.project_pricing && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">Pricing</span>
                                                <span className="vp-metric-value">{data.project_pricing}</span>
                                            </div>
                                        )}
                                        {data.project_area && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">Area</span>
                                                <span className="vp-metric-value">{data.project_area}</span>
                                            </div>
                                        )}
                                        {data.project_line_items_pricing && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">Line Items</span>
                                                <span className="vp-metric-value">{data.project_line_items_pricing}</span>
                                            </div>
                                        )}
                                        {data.project_source && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">Source</span>
                                                <span className="vp-metric-value">{data.project_source}</span>
                                            </div>
                                        )}
                                    </div>
                                    {!data.project_pricing && !data.project_area && !data.project_line_items_pricing && (
                                        <p className="vp-empty">No metrics provided</p>
                                    )}
                                </div>

                                <SectionLabel>Links</SectionLabel>
                                <div className="vp-card">
                                    {/* <InfoRow icon={MdLink} label="Initial Link" value={data.project_init_link} href={data.project_init_link} /> */}
                                    <InfoRow icon={MdLink} label="Initial Link" value={`Click To Project Initial Link...`} href={data.project_init_link} />
                                    {/* <InfoRow icon={MdLink} label="Final Link" value={data.project_final_link} href={data.project_final_link} /> */}
                                    <InfoRow icon={MdLink} label="Final Link" value={`Click To Project Final Link...`} href={data.project_final_link} />
                                    {!data.project_init_link && !data.project_final_link && (
                                        <p className="vp-empty">No links provided</p>
                                    )}
                                </div>

                                <SectionLabel>Timeline</SectionLabel>
                                <div className="vp-card">
                                    <div className="vp-metric-grid">
                                        {data.project_due_date && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">Due Date</span>
                                                <span className="vp-metric-value">
                                                    <MdCalendarToday size={12} style={{ marginRight: 4 }} />
                                                    {new Date(data.project_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        )}
                                        {data.project_points && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">Points</span>
                                                <span className="vp-metric-value vp-points">
                                                    <MdStar size={13} /> {data.project_points}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {!data.project_due_date && !data.project_points && (
                                        <p className="vp-empty">No timeline data</p>
                                    )}
                                </div>

                                {/* Team Members */}
                                {members.length > 0 && (
                                    <>
                                        <SectionLabel>Team Members ({members.length})</SectionLabel>
                                        <div className="vp-card">
                                            <div className="vp-members">
                                                {members.map((m, i) => (
                                                    <div key={i} className="vp-member">
                                                        <div className="vp-member-avatar">
                                                            {m.user?.media?.file_path ? (
                                                                <img
                                                                    src={`${USER_PROFILE_BASE_URL}/${m.user.media.file_path}`}
                                                                    alt={m.user?.name}
                                                                    onError={e => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <span style={m.user?.media?.file_path ? { display: 'none' } : {}}>
                                                                {m.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </span>
                                                        </div>
                                                        <span className="vp-member-name">{m.user?.name || 'Unknown'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                            </Col>

                            {/* ── Right column ── */}
                            <Col className="col-12 col-md-6">

                                <SectionLabel>Scope</SectionLabel>
                                <div className="vp-card vp-card-rich">
                                    <p className="vp-rich-section-title">Main Scope</p>
                                    <RichContent html={data.project_main_scope} placeholder="No main scope provided" />
                                    <div className="vp-divider" />
                                    <p className="vp-rich-section-title">Scope Details</p>
                                    <RichContent html={data.project_scope_details} placeholder="No scope details provided" />
                                </div>

                                <SectionLabel>Address </SectionLabel>
                                <div className="vp-card vp-card-rich">
                                    <RichContent html={data.project_address} placeholder="No address provided" />
                                </div>

                                <SectionLabel>Notes</SectionLabel>
                                <div className="vp-card vp-card-rich">
                                    <p className="vp-rich-section-title">Admin Notes</p>
                                    <RichContent html={data.project_admin_notes} placeholder="No admin notes" />
                                    <div className="vp-divider" />
                                    <p className="vp-rich-section-title">Estimator Notes</p>
                                    <RichContent html={data.project_notes_estimator} placeholder="No estimator notes" />
                                    <div className="vp-divider" />
                                    <p className="vp-rich-section-title">Private Notes</p>
                                    <RichContent html={data.notes_private} placeholder="No private notes" />
                                </div>

                            </Col>

                        </Row>
                    </div>
                )}
            </SimpleBar>
        </Modal>
    );
}

export default ViewProject;
