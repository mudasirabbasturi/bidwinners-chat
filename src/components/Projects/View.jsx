import { useState, useEffect, useCallback } from 'react';
import {
    MdRocketLaunch,
    MdPerson,
    MdConstruction,
    MdStairs,
    MdLink,
    MdCalendarToday,
    MdStar,
    MdOpenInNew,
    MdClose,
    MdRefresh,
    MdAttachMoney,
    MdOutlineSettings,
    MdFormatListNumbered,
    MdNote,
    MdWarning,
    MdTimer,
    MdFolderOpen,
    MdSource,
    MdPreview,
    MdBusiness,
    MdLocationOn,
    MdDescription,
    MdAccountTree,
    MdListAlt,
    MdAdminPanelSettings,
    MdEngineering,
    MdLock,
} from 'react-icons/md';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import Modal from '../Modal/Modal';
import { Row, Col } from '../Grid/Grid';
import './view.css';

import { getUserPermissions } from '../../utils/permissions';

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
    return STATUS_MAP[raw] || { label: raw || 'N/A', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };
}

/* ── Small reusable info row ─────────────────────────────────── */
function InfoRow({ icon: Icon, label, value, href, fallback = 'N/A' }) {
    const isEmpty = !value || value === '' || value === '<p><br></p>' || value?.trim?.() === '';

    return (
        <div className="vp-info-row">
            <div className="vp-info-icon"><Icon size={14} /></div>
            <div className="vp-info-body">
                <span className="vp-info-label">{label}</span>
                {href && !isEmpty ? (
                    <a className="vp-info-value vp-link" href={href} target="_blank" rel="noreferrer">
                        Click to Open <MdOpenInNew size={11} />
                    </a>
                ) : (
                    <span className={`vp-info-value ${isEmpty ? 'vp-fallback' : ''}`}>
                        {!isEmpty ? value : fallback}
                    </span>
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
function RichContent({ html, placeholder = 'Not provided' }) {
    if (!html || html === '<p><br></p>' || html.trim() === '') {
        return <p className="vp-empty">{placeholder}</p>;
    }
    return (
        <div
            className="vp-rich-content ql-editor"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

/* ── Rich content card with icon and accent border ───────────── */
function RichCard({ icon: Icon, label, html, placeholder, accentColor = 'var(--primary-color)' }) {
    const isEmpty = !html || html === '<p><br></p>' || html.trim() === '';

    return (
        <div className="vp-rich-card">
            <div className="vp-rich-card-label" style={{ borderLeftColor: accentColor }}>
                <div className="vp-rich-card-icon" style={{ background: `${accentColor}15`, color: accentColor }}>
                    <Icon size={14} />
                </div>
                <span>{label}</span>
            </div>
            <div className="vp-rich-card-content">
                {isEmpty ? (
                    <p className="vp-empty">N/A</p>
                ) : (
                    <div
                        className="vp-rich-content ql-editor"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                )}
            </div>
        </div>
    );
}

/* ── Format date helper ──────────────────────────────────────── */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return 'N/A';
    }
}

/* ── Format currency helper ──────────────────────────────────── */
function formatCurrency(value) {
    if (!value && value !== 0) return 'N/A';
    const num = parseFloat(value);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

/* ── Metric chip component ───────────────────────────────────── */
function MetricChip({ label, value, icon: Icon, fallback = 'N/A' }) {
    const displayValue = value || fallback;
    const isEmpty = !value || value === '' || value === '<p><br></p>' || value?.trim?.() === '';

    return (
        <div className="vp-metric">
            <span className="vp-metric-label">
                {Icon && <Icon size={12} style={{ marginRight: 4 }} />}
                {label}
            </span>
            <span className={`vp-metric-value ${isEmpty ? 'vp-fallback' : ''}`}>
                {displayValue}
            </span>
        </div>
    );
}

/* ── Main ViewProject component ──────────────────────────────── */
function ViewProject({ open, onClose, projectId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [permissions, setPermissions] = useState([]);

    useEffect(() => {
        getUserPermissions().then(result => {
            if (result) {
                setPermissions(result.permissions);
            }
        });
    }, []);

    const can = useCallback((permName) => {
        return permissions.some(p => p.name === permName);
    }, [permissions]);

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

    /* ── Permission-based field visibility ────────────────────── */
    const canViewClientName = can('View Client Personal') || can('View Client Admin');
    const canViewClientId = can('View Client Personal') || can('Add Project Client') || can('Update Project Client');
    const canViewConstructionType = can('View Projects') || can('View All Projects') || can('Add Construction Type') || can('Update Construction Type');
    const canViewFloorNumber = can('View Projects') || can('View All Projects') || can('Add Floor Number') || can('Update Floor Number');
    const canViewTemplate = can('View Projects') || can('View All Projects') || can('Add Project Template') || can('Update Project Template');
    const canViewPricing = can('View Projects') || can('View All Projects') || can('Add Project Pricing') || can('Update Project Pricing');
    const canViewArea = can('View Projects') || can('View All Projects') || can('Add Project Area') || can('Update Project Area');
    const canViewLineItems = can('View Projects') || can('View All Projects') || can('Add LineItems Pricing') || can('Update LineItems Pricing');
    const canViewSource = can('View Projects') || can('View All Projects') || can('Add Project Source') || can('Update Project Source');
    const canViewInitLink = can('View Initial Link(onside)') || can('Add Initial Link') || can('Update Initial Link');
    const canViewFinalLink = can('View Final Link(offside)') || can('Add Final Link') || can('Update Final Link');
    const canViewDueDate = can('View Projects') || can('View All Projects') || can('Add Due Date') || can('Update Due Date');
    const canViewPoints = can('View All Points') || can('View Personal Points') || can('Add Project Points') || can('Update Project Points');
    const canViewMainScope = can('View Projects') || can('View All Projects') || can('Add Main Scope') || can('Update Main Scope');
    const canViewScopeDetails = can('View Projects') || can('View All Projects') || can('Add Scope Details') || can('Update Scope Details');
    const canViewAddress = can('View Projects') || can('View All Projects') || can('Add Project Address') || can('Update Project Address');
    const canViewAdminNotes = can('View Admin Notes') || can('Add Admin Notes') || can('Update Admin Notes');
    const canViewEstimatorNotes = can('View Projects') || can('View All Projects') || can('Add Estimator Notes') || can('Update Estimator Notes');
    const canViewPrivateNotes = can('View Client Personal') || can('Add ClientAdmin Notes') || can('Update ClientAdmin Notes');
    const canViewTeam = can('View Project Team');
    const canViewBudget = can('View Budget');
    const canViewDeduction = can('View Deduction');
    const canViewPreviewStatus = can('View Projects') || can('View All Projects') || can('Add Preview Status') || can('Update Preview Status');
    const canViewClientNotes = can('View Client Personal') || can('View Client Admin') || can('Add Notes') || can('Update Notes') || can('View Notes');

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
                        <h2>{data?.project_title || data?.name || 'Project Details'}</h2>
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
                                {/* Project Info */}
                                <SectionLabel>Project Info</SectionLabel>
                                <div className="vp-card">
                                    {canViewClientName && (
                                        <InfoRow icon={MdPerson} label="Client Name (Admin)" value={data.client_name_for_admin} fallback="N/A" />
                                    )}
                                    {canViewClientId && (
                                        <>
                                            <InfoRow icon={MdFormatListNumbered} label="Client" value={data.client_name || data.client_id} fallback="N/A" />
                                            {data.client_notes && data.client_notes.trim() !== '' && data.client_notes !== '<p><br></p>' && (
                                                <div className="vp-client-notes">
                                                    <div className="vp-client-notes-label">
                                                        <MdNote size={12} />
                                                        Client Notes
                                                    </div>
                                                    <RichContent html={data.client_notes} placeholder="" />
                                                </div>
                                            )}
                                            {(!data.client_notes || data.client_notes.trim() === '' || data.client_notes === '<p><br></p>') && (
                                                <div className="vp-client-notes vp-client-notes-empty">
                                                    <div className="vp-client-notes-label">
                                                        <MdNote size={12} />
                                                        Client Notes
                                                    </div>
                                                    <p className="vp-empty">N/A</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {canViewConstructionType && (
                                        <InfoRow icon={MdConstruction} label="Construction Type" value={data.project_construction_type} fallback="N/A" />
                                    )}
                                    {canViewFloorNumber && (
                                        <InfoRow icon={MdStairs} label="Floor Number" value={data.project_floor_number} fallback="N/A" />
                                    )}
                                    {canViewTemplate && (
                                        <InfoRow icon={MdFolderOpen} label="Project Template" value={data.project_template} fallback="N/A" />
                                    )}
                                    {canViewPreviewStatus && (
                                        <InfoRow icon={MdPreview} label="Preview Status" value={data.preview_status} fallback="N/A" />
                                    )}
                                    {!canViewClientName && !canViewClientId && !canViewConstructionType && !canViewFloorNumber && !canViewTemplate && !canViewPreviewStatus && (
                                        <p className="vp-empty">No project info available</p>
                                    )}
                                </div>

                                {/* Metrics & Config */}
                                <SectionLabel>Metrics &amp; Config</SectionLabel>
                                <div className="vp-card">
                                    <div className="vp-metric-grid">
                                        {canViewPricing && (
                                            <MetricChip label="Pricing" value={data.project_pricing} icon={MdAttachMoney} fallback="N/A" />
                                        )}
                                        {canViewArea && (
                                            <MetricChip label="Area" value={data.project_area} icon={MdOutlineSettings} fallback="N/A" />
                                        )}
                                        {canViewLineItems && (
                                            <MetricChip label="Line Items Pricing" value={data.project_line_items_pricing} icon={MdAttachMoney} fallback="N/A" />
                                        )}
                                        {canViewSource && (
                                            <MetricChip label="Source" value={data.project_source} icon={MdSource} fallback="N/A" />
                                        )}
                                        {canViewBudget && (
                                            <MetricChip label="Budget Total" value={formatCurrency(data.budget_total)} icon={MdAttachMoney} fallback="N/A" />
                                        )}
                                        {canViewDeduction && (
                                            <MetricChip label="Deduction" value={formatCurrency(data.deduction_amount)} icon={MdAttachMoney} fallback="N/A" />
                                        )}
                                    </div>
                                    {!canViewPricing && !canViewArea && !canViewLineItems && !canViewSource && !canViewBudget && !canViewDeduction && (
                                        <p className="vp-empty">No metrics available</p>
                                    )}
                                </div>

                                {/* Links */}
                                {(canViewInitLink || canViewFinalLink) && (
                                    <>
                                        <SectionLabel>Links</SectionLabel>
                                        <div className="vp-card">
                                            {canViewInitLink && (
                                                <InfoRow
                                                    icon={MdLink}
                                                    label="Initial Link"
                                                    value={data.project_init_link ? 'Click to Open Initial Link' : null}
                                                    href={data.project_init_link}
                                                    fallback="N/A"
                                                />
                                            )}
                                            {canViewFinalLink && (
                                                <InfoRow
                                                    icon={MdLink}
                                                    label="Final Link"
                                                    value={data.project_final_link ? 'Click to Open Final Link' : null}
                                                    href={data.project_final_link}
                                                    fallback="N/A"
                                                />
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Timeline */}
                                <SectionLabel>Timeline</SectionLabel>
                                <div className="vp-card">
                                    <div className="vp-metric-grid">
                                        {canViewDueDate && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">
                                                    <MdCalendarToday size={12} style={{ marginRight: 4 }} />
                                                    Due Date
                                                </span>
                                                <span className="vp-metric-value">
                                                    {formatDate(data.project_due_date)}
                                                </span>
                                            </div>
                                        )}
                                        {canViewPoints && (
                                            <div className="vp-metric">
                                                <span className="vp-metric-label">
                                                    <MdStar size={12} style={{ marginRight: 4 }} />
                                                    Points
                                                </span>
                                                <span className={`vp-metric-value vp-points ${!data.project_points ? 'vp-fallback' : ''}`}>
                                                    {data.project_points || 'N/A'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="vp-metric">
                                            <span className="vp-metric-label">
                                                <MdCalendarToday size={12} style={{ marginRight: 4 }} />
                                                Created
                                            </span>
                                            <span className="vp-metric-value">{formatDate(data.created_at)}</span>
                                        </div>
                                        <div className="vp-metric">
                                            <span className="vp-metric-label">
                                                <MdTimer size={12} style={{ marginRight: 4 }} />
                                                Updated
                                            </span>
                                            <span className="vp-metric-value">{formatDate(data.updated_at)}</span>
                                        </div>
                                        <div className="vp-metric">
                                            <span className="vp-metric-label">
                                                <MdWarning size={12} style={{ marginRight: 4 }} />
                                                Late
                                            </span>
                                            <span className={`vp-metric-value ${data.late ? 'vp-late-yes' : ''}`}>
                                                {data.late ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Team Members */}
                                {canViewTeam && (
                                    <>
                                        <SectionLabel>Team Members ({members.length})</SectionLabel>
                                        <div className="vp-card">
                                            {members.length > 0 ? (
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
                                            ) : (
                                                <p className="vp-empty">N/A</p>
                                            )}
                                        </div>
                                    </>
                                )}

                            </Col>

                            {/* ── Right column ── */}
                            <Col className="col-12 col-md-6">

                                {/* Scope */}
                                <SectionLabel>Scope</SectionLabel>
                                <div className="vp-card vp-card-rich">
                                    {canViewMainScope && (
                                        <RichCard
                                            icon={MdAccountTree}
                                            label="Main Scope"
                                            html={data.project_main_scope}
                                            placeholder="N/A"
                                            accentColor="#3b82f6"
                                        />
                                    )}
                                    {canViewMainScope && canViewScopeDetails && <div className="vp-divider" />}
                                    {canViewScopeDetails && (
                                        <RichCard
                                            icon={MdListAlt}
                                            label="Scope Details"
                                            html={data.project_scope_details}
                                            placeholder="N/A"
                                            accentColor="#8b5cf6"
                                        />
                                    )}
                                    {!canViewMainScope && !canViewScopeDetails && (
                                        <p className="vp-empty">No scope information available</p>
                                    )}
                                </div>

                                {/* Address */}
                                {canViewAddress && (
                                    <>
                                        <SectionLabel>Address</SectionLabel>
                                        <div className="vp-card vp-card-rich">
                                            <RichCard
                                                icon={MdLocationOn}
                                                label="Project Address"
                                                html={data.project_address}
                                                placeholder="N/A"
                                                accentColor="#f59e0b"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Notes */}
                                <SectionLabel>Notes</SectionLabel>
                                <div className="vp-card vp-card-rich">
                                    {canViewAdminNotes && (
                                        <RichCard
                                            icon={MdAdminPanelSettings}
                                            label="Admin Notes"
                                            html={data.project_admin_notes}
                                            placeholder="N/A"
                                            accentColor="#ef4444"
                                        />
                                    )}
                                    {canViewAdminNotes && canViewEstimatorNotes && <div className="vp-divider" />}
                                    {canViewEstimatorNotes && (
                                        <RichCard
                                            icon={MdEngineering}
                                            label="Estimator Notes"
                                            html={data.project_notes_estimator}
                                            placeholder="N/A"
                                            accentColor="#10b981"
                                        />
                                    )}
                                    {(canViewAdminNotes || canViewEstimatorNotes) && canViewPrivateNotes && <div className="vp-divider" />}
                                    {canViewPrivateNotes && (
                                        <RichCard
                                            icon={MdLock}
                                            label="Private Notes"
                                            html={data.notes_private}
                                            placeholder="N/A"
                                            accentColor="#ec4899"
                                        />
                                    )}
                                    {!canViewAdminNotes && !canViewEstimatorNotes && !canViewPrivateNotes && (
                                        <p className="vp-empty">No notes available</p>
                                    )}
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