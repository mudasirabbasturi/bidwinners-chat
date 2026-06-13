import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import {
    MdSearch,
    MdMenu,
    MdClose,
    MdAdd,
    MdFolder,
    MdPersonAdd,
    MdMoreHoriz,
    MdCircle,
    MdVisibility,
    MdEdit,
    MdChat,
    MdLogout,
} from 'react-icons/md';

import DropdownSelect from '../DropdownSelect/DropdownSelect';
import Input from '../Input/Input';
import Modal from '../Modal/Modal';
import './Sidebar.css';
import AddProject from '../Projects/Add';
import ViewProject from '../Projects/View';
import EditProject from '../Projects/Edit';
import ContextMenu from '../Animation/ContextMenu';
import { 
    MdFolderOpen, MdPerson, MdAttachMoney, MdOutlineSettings, 
    MdTimer, MdDescription, MdLocationOn, MdBuild, MdFormatListNumbered,
    MdLayers, MdLink, MdNote, MdWarning, MdFlag, MdDateRange 
} from 'react-icons/md';
// Constants
const API_BASE_URL = 'http://127.0.0.1:8000';
const USER_PROFILE_BASE_URL = 'https://enterprise.bidwinners.net';

// Memoized Project Card
const ProjectCard = memo(({ project, onChatClick, onViewProject, onEditProject, getStatusInfo, getMemberAvatars, getUniqueMemberCount }) => {
    const statusInfo = getStatusInfo(project.project_status);
    const memberAvatars = getMemberAvatars(project.team_members);
    const memberCount = getUniqueMemberCount(project.team_members);
    
    const [menuOpen, setMenuOpen] = useState(false);
    const moreBtnRef = useRef(null);

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        if (e.target.nextSibling) {
            e.target.nextSibling.style.display = 'flex';
        }
    };

    const contextMenuItems = [
        {
            key: 'project_title',
            label: 'Project Title',
            icon: <MdFolderOpen size={16} />,
            value: project.project_title || project.name,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_address',
            label: 'Project Address',
            icon: <MdLocationOn size={16} />,
            value: project.project_address,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'client_name_for_admin',
            label: 'Client Name',
            icon: <MdPerson size={16} />,
            value: project.client_name_for_admin,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'client_id',
            label: 'Client ID',
            icon: <MdFormatListNumbered size={16} />,
            value: project.client_id,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_pricing',
            label: 'Pricing',
            icon: <MdAttachMoney size={16} />,
            value: project.project_pricing,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_area',
            label: 'Area',
            icon: <MdOutlineSettings size={16} />,
            value: project.project_area,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_construction_type',
            label: 'Construction Type',
            icon: <MdBuild size={16} />,
            value: project.project_construction_type,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_line_items_pricing',
            label: 'Line Items Pricing',
            icon: <MdAttachMoney size={16} />,
            value: project.project_line_items_pricing,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_floor_number',
            label: 'Floor Number',
            icon: <MdLayers size={16} />,
            value: project.project_floor_number,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_main_scope',
            label: 'Main Scope',
            icon: <MdDescription size={16} />,
            value: project.project_main_scope,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_scope_details',
            label: 'Scope Details',
            icon: <MdDescription size={16} />,
            value: project.project_scope_details,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_template',
            label: 'Project Template',
            icon: <MdFolderOpen size={16} />,
            value: project.project_template,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_init_link',
            label: 'Initial Link',
            icon: <MdLink size={16} />,
            value: project.project_init_link,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_final_link',
            label: 'Final Link',
            icon: <MdLink size={16} />,
            value: project.project_final_link,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_admin_notes',
            label: 'Admin Notes',
            icon: <MdNote size={16} />,
            value: project.project_admin_notes,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_notes_estimator',
            label: 'Estimator Notes',
            icon: <MdNote size={16} />,
            value: project.project_notes_estimator,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'notes_private',
            label: 'Private Notes',
            icon: <MdNote size={16} />,
            value: project.notes_private,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'budget_total',
            label: 'Budget Total',
            icon: <MdAttachMoney size={16} />,
            value: project.budget_total,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'deduction_amount',
            label: 'Deduction Amount',
            icon: <MdAttachMoney size={16} />,
            value: project.deduction_amount,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_due_date',
            label: 'Due Date',
            icon: <MdTimer size={16} />,
            value: project.project_due_date,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_points',
            label: 'Points',
            icon: <MdFlag size={16} />,
            value: project.project_points,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_status',
            label: 'Status',
            icon: <MdOutlineSettings size={16} />,
            value: project.project_status,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'project_source',
            label: 'Source',
            icon: <MdOutlineSettings size={16} />,
            value: project.project_source,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'preview_status',
            label: 'Preview Status',
            icon: <MdOutlineSettings size={16} />,
            value: project.preview_status,
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'late',
            label: 'Late Status',
            icon: <MdWarning size={16} />,
            value: project.late ? 'Yes' : 'No',
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'created_at',
            label: 'Created At',
            icon: <MdDateRange size={16} />,
            value: project.created_at ? new Date(project.created_at).toLocaleDateString() : '',
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        },
        {
            key: 'updated_at',
            label: 'Updated At',
            icon: <MdDateRange size={16} />,
            value: project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '',
            onEdit: () => { setMenuOpen(false); onEditProject(project); }
        }
    ];

    return (
        <div className="project-card">
            <div className="project-card-header">
                <div className="project-icon-wrapper">
                    <MdFolder size={20} />
                </div>
                <div className="project-title-section">
                    <h4 className="project-title" title={project.name}>
                        {project.name}
                    </h4>
                    <span className={`project-status ${statusInfo.class}`}>
                        <span className="status-dot-indicator"></span>
                        {statusInfo.label}
                    </span>
                </div>
                <div className="project-actions">
                    <a
                        href={`#chat/${project.id}`}
                        className="chat-btn"
                        title="Open Chat"
                        onClick={(e) => onChatClick(e, project)}
                    >
                        <MdChat size={18} />
                    </a>
                    <button 
                        ref={moreBtnRef}
                        className="more-btn" 
                        title="More options"
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(true);
                        }}
                    >
                        <MdMoreHoriz size={18} />
                    </button>
                    <ContextMenu
                        open={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        anchor={moreBtnRef}
                        items={contextMenuItems}
                    />
                </div>
            </div>

            <div className="project-card-footer">
                <div className="member-avatars">
                    {memberAvatars.length > 0 ? (
                        <>
                            {memberAvatars.slice(0, 3).map((avatar, index) => (
                                <div
                                    key={index}
                                    className="member-avatar"
                                    style={{ zIndex: memberAvatars.length - index }}
                                >
                                    {avatar.image ? (
                                        <>
                                            <img
                                                src={`${USER_PROFILE_BASE_URL}/${avatar.image}`}
                                                alt={avatar.name}
                                                className="avatar-img"
                                                onError={handleImageError}
                                            />
                                            <span className="avatar-fallback" style={{ display: 'none' }}>
                                                {avatar.name}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="avatar-fallback">{avatar.name}</span>
                                    )}
                                </div>
                            ))}
                            {memberAvatars.length > 3 && (
                                <div className="member-avatar member-count">
                                    +{memberAvatars.length - 3}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="member-avatar no-members">
                            <MdPersonAdd size={12} />
                        </div>
                    )}
                    <span className="member-label">
                        {memberCount > 0 ? `${memberCount} member${memberCount > 1 ? 's' : ''}` : 'No members'}
                    </span>
                </div>

                <div className="footer-actions">
                    <button className="join-btn" title="Join Project">
                        <MdPersonAdd size={16} />
                        <span>Join</span>
                    </button>
                    <button
                        className="action-icon-btn view-btn"
                        title="View Project"
                        onClick={() => onViewProject(project)}
                    >
                        <MdVisibility size={15} />
                    </button>
                    <button
                        className="action-icon-btn edit-btn"
                        title="Edit Project"
                        onClick={() => onEditProject(project)}
                    >
                        <MdEdit size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
});

ProjectCard.displayName = 'ProjectCard';

const Sidebar = ({ isOpen, onToggle }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [activeLink, setActiveLink] = useState('project');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // API states
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalProjects, setTotalProjects] = useState(0);
    const [error, setError] = useState(null);

    // Modal states
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // Form states
    const [editTitle, setEditTitle] = useState('');

    const parentRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const scrollElementRef = useRef(null);

    // Virtualizer
    const virtualizer = useVirtualizer({
        count: projects.length,
        getScrollElement: () => scrollElementRef.current,
        estimateSize: () => 140, // better initial estimate for project cards
        overscan: 5,
    });

    // Notify virtualizer when scroll element is ready
    useEffect(() => {
        if (scrollElementRef.current) {
            virtualizer.measure();
        }
    }, [scrollElementRef.current, projects.length]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch projects from API
    const fetchProjects = useCallback(async (page = 1, status = statusFilter, search = searchTerm) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());

            if (status && status !== 'All') {
                params.append('status', status);
            }

            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            const url = `${API_BASE_URL}/api/chat-project-list?${params.toString()}`;

            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data?.projects?.data) {
                setProjects(data.projects.data);
                setTotalProjects(data.projects.total);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchTerm]);

    useEffect(() => {
        fetchProjects(1, statusFilter, searchTerm);
    }, [statusFilter, fetchProjects]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            fetchProjects(1, statusFilter, value);
        }, 500);
    };

    const navLinks = [
        { id: 'project', label: 'Projects Chat', href: '#project' },
        { id: 'direct', label: 'Direct Chat', href: '#direct' }
    ];

    const statusOptions = [
        { value: 'All', label: 'All Projects', icon: <MdCircle size={6} />, statusClass: 'status-all' },
        { value: 'Pending', label: 'Pending', icon: <MdCircle size={6} />, statusClass: 'status-pending' },
        { value: 'Takeoff On Progress', label: 'Takeoff In Progress', icon: <MdCircle size={6} />, statusClass: 'status-takeoff' },
        { value: 'Pricing In Progress', label: 'Pricing In Progress', icon: <MdCircle size={6} />, statusClass: 'status-pricing' },
        { value: 'Completed', label: 'Completed', icon: <MdCircle size={6} />, statusClass: 'status-completed' },
        { value: 'Revision', label: 'Revision', icon: <MdCircle size={6} />, statusClass: 'status-revision' },
        { value: 'Hold', label: 'Hold', icon: <MdCircle size={6} />, statusClass: 'status-hold' },
        { value: 'Deliver', label: 'Deliver', icon: <MdCircle size={6} />, statusClass: 'status-deliver' },
        { value: 'Cancelled', label: 'Cancelled', icon: <MdCircle size={6} />, statusClass: 'status-cancelled' },
    ];

    const directChatList = [
        { id: 1, name: 'Alex Johnson', status: 'online', lastMessage: 'Hey, how are you?' },
        { id: 2, name: 'Sarah Williams', status: 'offline', lastMessage: 'See you tomorrow!' },
        { id: 3, name: 'Mike Brown', status: 'online', lastMessage: 'The project is ready' },
    ];

    const handleNavClick = (id, href) => {
        setActiveLink(id);
    };

    const handleChatClick = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Open chat for project:', project.id);
    };

    const handleViewProject = (project) => {
        setSelectedProject(project);
        setViewModalOpen(true);
    };

    const handleEditProject = (project) => {
        setSelectedProject(project);
        setEditTitle(project.name);
        setEditModalOpen(true);
    };

    const handleAddSuccess = () => {
        fetchProjects(1, statusFilter, searchTerm);
    };

    const handleUpdateProject = () => {
        if (editTitle.trim()) {
            console.log('Updating project:', selectedProject.id, editTitle);
            setEditModalOpen(false);
            fetchProjects(1, statusFilter, searchTerm);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Takeoff On Progress': return { label: 'Takeoff In Progress', class: 'status-takeoff' };
            case 'Pricing In Progress': return { label: 'Pricing In Progress', class: 'status-pricing' };
            case 'Completed': return { label: 'Completed', class: 'status-completed' };
            case 'Pending': return { label: 'Pending', class: 'status-pending' };
            case 'Revision': return { label: 'Revision', class: 'status-revision' };
            case 'Hold': return { label: 'Hold', class: 'status-hold' };
            case 'Deliver': return { label: 'Deliver', class: 'status-deliver' };
            case 'Cancelled': return { label: 'Cancelled', class: 'status-cancelled' };
            default: return { label: status, class: '' };
        }
    };

    const getMemberAvatars = (teamMembers) => {
        if (!teamMembers || teamMembers.length === 0) return [];
        const uniqueUsers = new Map();
        teamMembers.forEach(member => {
            if (!uniqueUsers.has(member.user_id)) {
                uniqueUsers.set(member.user_id, {
                    name: member.user?.name?.charAt(0)?.toUpperCase() || '?',
                    image: member.user?.media?.file_path || null
                });
            }
        });
        return Array.from(uniqueUsers.values()).slice(0, 4);
    };

    const getUniqueMemberCount = (teamMembers) => {
        if (!teamMembers || teamMembers.length === 0) return 0;
        const uniqueUsers = new Set(teamMembers.map(member => member.user_id));
        return uniqueUsers.size;
    };

    const renderContent = () => {
        switch (activeLink) {
            case 'project':
                return (
                    <div className="content-list">
                        <div className="content-list-header">
                            <DropdownSelect
                                options={statusOptions}
                                value={statusFilter}
                                onChange={setStatusFilter}
                                searchable={true}
                                className="status-dropdown"
                            />
                            <button className="add-btn" title="Add Project" onClick={() => setAddModalOpen(true)}>
                                <MdAdd size={20} />
                            </button>

                        </div>
                        {error && (
                            <div className="error-state">
                                <p>{error}</p>
                                <button onClick={() => fetchProjects(1, statusFilter, searchTerm)}>Retry</button>
                            </div>
                        )}

                        {loading ? (
                            <div className="loading-state">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="skeleton-card">
                                        <div className="skeleton-header">
                                            <div className="skeleton-icon"></div>
                                            <div className="skeleton-lines">
                                                <div className="skeleton-line w-75"></div>
                                                <div className="skeleton-line w-50"></div>
                                            </div>
                                        </div>
                                        <div className="skeleton-footer">
                                            <div className="skeleton-avatars">
                                                <div className="skeleton-avatar"></div>
                                                <div className="skeleton-avatar"></div>
                                                <div className="skeleton-avatar"></div>
                                            </div>
                                            <div className="skeleton-line w-25"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="project-list-container" ref={parentRef}>
                                {projects.length > 0 ? (
                                    <>
                                        <div className="project-list-info">
                                            <span>Showing {projects.length} of {totalProjects} projects</span>
                                        </div>
                                        <div
                                            style={{
                                                height: `${virtualizer.getTotalSize()}px`,
                                                width: '100%',
                                                position: 'relative',
                                            }}
                                        >
                                            {virtualizer.getVirtualItems().map((virtualItem) => (
                                                <div
                                                    key={virtualItem.key}
                                                    data-index={virtualItem.index}
                                                    ref={virtualizer.measureElement}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        transform: `translateY(${virtualItem.start}px)`,
                                                        padding: '0 0 8px 0',
                                                    }}
                                                >
                                                    <ProjectCard
                                                        project={projects[virtualItem.index]}
                                                        onChatClick={handleChatClick}
                                                        onViewProject={handleViewProject}
                                                        onEditProject={handleEditProject}
                                                        getStatusInfo={getStatusInfo}
                                                        getMemberAvatars={getMemberAvatars}
                                                        getUniqueMemberCount={getUniqueMemberCount}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        {/* Bottom padding to ensure last items are visible */}
                                        <div style={{ height: '20px', flexShrink: 0 }} />
                                    </>
                                ) : (
                                    <div className="no-projects">
                                        <MdFolder size={48} />
                                        <p>No projects found</p>
                                        <span>Try changing the filter or search term</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'direct':
                return (
                    <div className="content-list">
                        <div className="content-list-header">
                            <h3>Direct Messages</h3>
                            <button className="add-btn" title="New Message">
                                <MdAdd size={20} />
                            </button>
                        </div>
                        {directChatList.map(user => (
                            <div key={user.id} className="content-item">
                                <div className="content-item-avatar">
                                    <span>{user.name.charAt(0)}</span>
                                    <span className={`status-dot ${user.status}`}></span>
                                </div>
                                <div className="content-item-info">
                                    <span className="content-item-name">{user.name}</span>
                                    <span className="content-item-meta">{user.lastMessage}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {isMobile && (
                <button
                    className={`sidebar-toggle-btn ${isOpen ? 'open' : ''}`}
                    onClick={onToggle}
                    aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
                >
                    {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
                </button>
            )}

            {isMobile && isOpen && (
                <div className="sidebar-overlay" onClick={onToggle} />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : 'desktop'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-header-top">
                        <div className="sidebar-brand">
                            <img src="/bidwinners_chat_logo.png" alt="Bidwinners Chat" className="sidebar-logo" />
                        </div>
                        <div className="sidebar-user">
                            <div className="user-avatar">
                                <span>{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name?.charAt(0)?.toUpperCase() : '?'}</span>
                            </div>
                            <button className="logout-btn" onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                window.location.reload();
                            }} title="Logout">
                                <MdLogout size={18} />
                            </button>
                        </div>
                    </div>

                    <nav className="nav-tabs">
                        {navLinks.map((link) => (
                            <a
                                key={link.id}
                                href={link.href}
                                className={`nav-tab ${activeLink === link.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavClick(link.id, link.href);
                                }}
                            >
                                <span className="nav-tab-label">{link.label}</span>
                            </a>
                        ))}
                        <div className="nav-tab-indicator" style={{
                            transform: `translateX(${activeLink === 'project' ? '0' : '100%'})`
                        }} />
                    </nav>

                    <div className="search-wrapper">
                        <MdSearch className="search-icon" size={18} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder={activeLink === 'project' ? 'Search projects...' : 'Search messages...'}
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                <SimpleBar scrollableNodeProps={{ ref: scrollElementRef }} style={{ height: '100%', flex: 1, minHeight: 0 }}>
                    <div className="sidebar-content">
                        {renderContent()}
                        {/* Extra padding at bottom for scroll visibility */}
                        <div style={{ height: '16px' }} />
                    </div>
                </SimpleBar>
            </aside>

            {/* Add Project Modal */}
            <AddProject
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                onSuccess={handleAddSuccess}
            />
            <ViewProject
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                projectId={selectedProject?.id}
            />

            <EditProject
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSuccess={() => fetchProjects(1, statusFilter, searchTerm)}
                projectId={selectedProject?.id}
            />
        </>
    );
};

export default Sidebar;