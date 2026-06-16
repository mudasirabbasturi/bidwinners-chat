import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import ColumnEdit from '../Projects/ColumnEdit';
import ContextMenu from '../Animation/ContextMenu';
import JoinProject from '../Projects/JoinProject';
import EditJoinProject from '../Projects/EditJoinProject';
import { getUserPermissions } from '../../utils/permissions';

import {
    MdFolderOpen, MdPerson, MdAttachMoney, MdOutlineSettings,
    MdTimer, MdDescription, MdLocationOn, MdBuild, MdFormatListNumbered,
    MdLayers, MdLink, MdNote, MdWarning, MdFlag, MdDateRange
} from 'react-icons/md';

// Constants
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USER_PROFILE_BASE_URL = 'https://enterprise.bidwinners.net';

// Memoized Project Card
const ProjectCard = memo(({ project, activeProjectId, onChatClick, onViewProject, onEditProject, onColumnEdit, onJoinProject, onEditJoinProject, onLeaveProject, getStatusInfo, getMemberAvatars, getUniqueMemberCount, can }) => {
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

    const contextMenuItems = useMemo(() => {
        const allItems = [
            {
                key: 'project_title',
                label: 'Project Title',
                icon: <MdFolderOpen size={16} />,
                value: project.project_title || project.name,
                viewPermission: 'Update Project Title',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_title'); }
            },
            {
                key: 'project_address',
                label: 'Project Address',
                icon: <MdLocationOn size={16} />,
                value: project.project_address,
                viewPermission: 'Update Project Address',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_address'); }
            },
            {
                key: 'client_name_for_admin',
                label: 'Client Name ( only admin )',
                icon: <MdPerson size={16} />,
                value: project.client_name_for_admin,
                viewPermission: 'View Client Admin',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'client_name_for_admin'); }
            },
            {
                key: 'client_id',
                label: 'Client Name',
                icon: <MdFormatListNumbered size={16} />,
                value: project.client_id,
                viewPermission: 'Update Project Client',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'client_id'); }
            },
            {
                key: 'project_pricing',
                label: 'Pricing',
                icon: <MdAttachMoney size={16} />,
                value: project.project_pricing,
                viewPermission: 'Update Project Pricing',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_pricing'); }
            },
            {
                key: 'project_area',
                label: 'Area',
                icon: <MdOutlineSettings size={16} />,
                value: project.project_area,
                viewPermission: 'Update Project Area',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_area'); }
            },
            {
                key: 'project_construction_type',
                label: 'Construction Type',
                icon: <MdBuild size={16} />,
                value: project.project_construction_type,
                viewPermission: 'Update Construction Type',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_construction_type'); }
            },
            {
                key: 'project_line_items_pricing',
                label: 'Line Items Pricing',
                icon: <MdAttachMoney size={16} />,
                value: project.project_line_items_pricing,
                viewPermission: 'Update LineItems Pricing',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_line_items_pricing'); }
            },
            {
                key: 'project_floor_number',
                label: 'Floor Number',
                icon: <MdLayers size={16} />,
                value: project.project_floor_number,
                viewPermission: 'Update Floor Number',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_floor_number'); }
            },
            {
                key: 'project_main_scope',
                label: 'Main Scope',
                icon: <MdDescription size={16} />,
                value: project.project_main_scope,
                viewPermission: 'Update Main Scope',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_main_scope'); }
            },
            {
                key: 'project_scope_details',
                label: 'Scope Details',
                icon: <MdDescription size={16} />,
                value: project.project_scope_details,
                viewPermission: 'Update Scope Details',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_scope_details'); }
            },
            {
                key: 'project_template',
                label: 'Project Template',
                icon: <MdFolderOpen size={16} />,
                value: project.project_template,
                viewPermission: 'Update Project Template',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_template'); }
            },
            {
                key: 'project_init_link',
                label: 'Initial Link',
                icon: <MdLink size={16} />,
                value: project.project_init_link,
                viewPermission: 'View Initial Link(onside)',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_init_link'); }
            },
            {
                key: 'project_final_link',
                label: 'Final Link',
                icon: <MdLink size={16} />,
                value: project.project_final_link,
                viewPermission: 'View Final Link(offside)',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_final_link'); }
            },
            {
                key: 'project_admin_notes',
                label: 'Admin Notes',
                icon: <MdNote size={16} />,
                value: project.project_admin_notes,
                viewPermission: 'View Admin Notes',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_admin_notes'); }
            },
            {
                key: 'project_notes_estimator',
                label: 'Estimator Notes',
                icon: <MdNote size={16} />,
                value: project.project_notes_estimator,
                viewPermission: 'Update Estimator Notes',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_notes_estimator'); }
            },
            {
                key: 'notes_private',
                label: 'Private Notes',
                icon: <MdNote size={16} />,
                value: project.notes_private,
                viewPermission: 'View Client Personal',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'notes_private'); }
            },
            {
                key: 'budget_total',
                label: 'Budget Total',
                icon: <MdAttachMoney size={16} />,
                value: project.budget_total,
                viewPermission: 'View Budget',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'budget_total'); }
            },
            {
                key: 'deduction_amount',
                label: 'Deduction Amount',
                icon: <MdAttachMoney size={16} />,
                value: project.deduction_amount,
                viewPermission: 'View Deduction',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'deduction_amount'); }
            },
            {
                key: 'project_due_date',
                label: 'Due Date',
                icon: <MdTimer size={16} />,
                value: project.project_due_date,
                viewPermission: 'Update Due Date',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_due_date'); }
            },
            {
                key: 'project_points',
                label: 'Points',
                icon: <MdFlag size={16} />,
                value: project.project_points,
                viewPermission: 'View All Points',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_points'); }
            },
            {
                key: 'project_status',
                label: 'Status',
                icon: <MdOutlineSettings size={16} />,
                value: project.project_status,
                viewPermission: 'Update Project Status',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_status'); }
            },
            {
                key: 'project_source',
                label: 'Source',
                icon: <MdOutlineSettings size={16} />,
                value: project.project_source,
                viewPermission: 'Update Project Source',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'project_source'); }
            },
            {
                key: 'preview_status',
                label: 'Preview Status',
                icon: <MdOutlineSettings size={16} />,
                value: project.preview_status,
                viewPermission: 'Update Preview Status',
                onEdit: () => { setMenuOpen(false); onColumnEdit(project, 'preview_status'); }
            },
            {
                key: 'late',
                label: 'Late Status',
                icon: <MdWarning size={16} />,
                value: project.late ? 'Yes' : 'No',
                readOnly: true
            },
            {
                key: 'created_at',
                label: 'Created At',
                icon: <MdDateRange size={16} />,
                value: project.created_at ? new Date(project.created_at).toLocaleDateString() : '',
                readOnly: true
            },
            {
                key: 'updated_at',
                label: 'Updated At',
                icon: <MdDateRange size={16} />,
                value: project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '',
                readOnly: true
            }
        ];

        // Filter items based on permissions
        return allItems.filter(item => {
            if (item.readOnly) return true; // Always show read-only items
            if (item.viewPermission) {
                return can(item.viewPermission);
            }
            return true; // Show items without permission requirement
        });
    }, [project, onColumnEdit, can]);

    const isActive = project.id === activeProjectId;

    return (
        <div className={`project-card ${isActive ? 'active' : ''}`}>
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
                        href={`/project-chat/${project.id}`}
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
                    {(() => {
                        const userStr = localStorage.getItem('user');
                        const currentUser = userStr ? JSON.parse(userStr) : null;
                        const userTeamMember = currentUser ? project.team_members?.find(m => m.user_id === currentUser.id) : null;

                        if (userTeamMember) {
                            return (
                                <>
                                    <button className="join-btn" title="Edit Join" onClick={() => onEditJoinProject(project, userTeamMember)} style={{ background: 'var(--accent-color)', color: 'var(--bg-card)', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer' }}>
                                        <MdEdit size={14} />
                                        <span>Edit Join</span>
                                    </button>
                                    <button className="join-btn" title="Leave Project" onClick={() => onLeaveProject(project, userTeamMember)} style={{ background: '#ef4444', color: '#fff', padding: '4px 8px', fontSize: '11px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', cursor: 'pointer', marginLeft: '4px' }}>
                                        <MdClose size={14} />
                                        <span>Leave</span>
                                    </button>
                                </>
                            );
                        }

                        return (
                            <button className="join-btn" title="Join Project" onClick={() => onJoinProject(project)}>
                                <MdPersonAdd size={16} />
                                <span>Join</span>
                            </button>
                        );
                    })()}
                    <button
                        className="action-icon-btn view-btn"
                        title="View Project"
                        onClick={() => onViewProject(project)}
                    >
                        <MdVisibility size={15} />
                    </button>
                    {can('Update Project') && (
                        <button
                            className="action-icon-btn edit-btn"
                            title="Edit Project"
                            onClick={() => onEditProject(project)}
                        >
                            <MdEdit size={15} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

ProjectCard.displayName = 'ProjectCard';

const Sidebar = ({ isOpen, onToggle, onProjectsLoaded }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [permissions, setPermissions] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        getUserPermissions().then(result => {
            if (result) {
                setPermissions(result.permissions);
                setUser(result.user);
            }
        });
    }, []);

    const can = useCallback((permName) => {
        return permissions.some(p => p.name === permName);
    }, [permissions]);

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const activeLink = location.pathname.startsWith('/direct-chat') ? 'direct' : 'project';

    const projectMatch = location.pathname.match(/^\/project-chat\/(\d+)$/);
    const activeProjectId = projectMatch ? parseInt(projectMatch[1], 10) : null;

    const directMatch = location.pathname.match(/^\/direct-chat\/(\d+)$/);
    const partnerId = directMatch ? parseInt(directMatch[1], 10) : null;

    // API states
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const projects = useMemo(() => {
        return allProjects.filter(p => {
            const matchesStatus = statusFilter === 'All' || p.project_status === statusFilter;
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm ||
                (p.name && p.name.toLowerCase().includes(searchLower)) ||
                (p.project_title && p.project_title.toLowerCase().includes(searchLower)) ||
                (p.client_name_for_admin && p.client_name_for_admin.toLowerCase().includes(searchLower));

            return matchesStatus && matchesSearch;
        });
    }, [allProjects, statusFilter, searchTerm]);

    const totalProjects = allProjects.length;

    // Modal states
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const [columnEditOpen, setColumnEditOpen] = useState(false);
    const [columnEditField, setColumnEditField] = useState('');
    const [columnEditProjectId, setColumnEditProjectId] = useState(null);

    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [joinProjectData, setJoinProjectData] = useState(null);
    const [editJoinProjectData, setEditJoinProjectData] = useState(null);
    const [teamMemberToEdit, setTeamMemberToEdit] = useState(null);

    const handleJoinProject = (project) => {
        setJoinProjectData(project);
        setJoinModalOpen(true);
    };

    const handleEditJoinProject = (project, teamMember) => {
        setEditJoinProjectData(project);
        setTeamMemberToEdit(teamMember);
    };

    const handleLeaveProject = async (project, teamMember) => {
        if (!window.confirm('Are you sure you want to leave this project?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/project/team-member/delete/${teamMember.id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                }
            });
            const data = await response.json();

            if (data.status) {
                fetchProjects();
            } else {
                alert(data.message || 'Failed to leave project');
            }
        } catch (error) {
            console.error('Error leaving project:', error);
            alert('Network error while trying to leave project');
        }
    };

    const handleJoinSuccess = (updatedProject) => {
        if (updatedProject) {
            setAllProjects(prev =>
                prev.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p)
            );
        }
        fetchProjects();
    };

    const handleColumnEdit = useCallback((project, field) => {
        setSelectedProject(project);
        setColumnEditProjectId(project.id);
        setColumnEditField(field);
        setColumnEditOpen(true);
    }, []);

    const handleColumnEditSuccess = useCallback(() => {
        fetchProjects();
    }, []);

    // Form states
    const [editTitle, setEditTitle] = useState('');

    const parentRef = useRef(null);
    const scrollElementRef = useRef(null);

    // Virtualizer
    const virtualizer = useVirtualizer({
        count: projects.length,
        getScrollElement: () => scrollElementRef.current,
        estimateSize: () => 140,
        overscan: 5,
    });

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

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const url = `${API_BASE_URL}/api/chat-project-list`;
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
                setAllProjects(data.projects.data);
                onProjectsLoaded?.(data.projects.data);
            } else if (Array.isArray(data?.projects)) {
                setAllProjects(data.projects);
                onProjectsLoaded?.(data.projects);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Fetch direct users when direct tab is active
    useEffect(() => {
        if (activeLink === 'direct') {
            fetchDirectUsers();
        }
    }, [activeLink]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const navLinks = [
        { id: 'project', label: 'Projects Chat', href: '/project-chat' },
        { id: 'direct', label: 'Direct Chat', href: '/direct-chat' }
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

    // Direct chat users from API
    const [directUsers, setDirectUsers] = useState([]);
    const [directUsersLoading, setDirectUsersLoading] = useState(false);

    const fetchDirectUsers = useCallback(async () => {
        setDirectUsersLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/chat-user-list`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.users) setDirectUsers(data.users);
        } catch (err) {
            console.error('Error fetching direct users:', err);
        } finally {
            setDirectUsersLoading(false);
        }
    }, []);

    const handleNavClick = (id) => {
        if (id === 'direct') {
            navigate('/direct-chat');
        } else {
            navigate('/project-chat');
        }
    };

    const handleDirectUserClick = (user) => {
        navigate(`/direct-chat/${user.id}`);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Deterministic pastel color from name
    const getUserColor = (name) => {
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];
        if (!name) return colors[0];
        const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
        return colors[idx];
    };

    const handleChatClick = (e, project) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/project-chat/${project.id}`);
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
        fetchProjects();
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

                            {can('Create Project') &&
                                <button className="add-btn" title="Add Project" onClick={() => setAddModalOpen(true)}>
                                    <MdAdd size={20} />
                                </button>
                            }

                        </div>
                        {error && (
                            <div className="error-state">
                                <p>{error}</p>
                                <button onClick={() => fetchProjects()}>Retry</button>
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
                                                        activeProjectId={activeProjectId}
                                                        onChatClick={handleChatClick}
                                                        onViewProject={handleViewProject}
                                                        onEditProject={handleEditProject}
                                                        onColumnEdit={handleColumnEdit}
                                                        onJoinProject={handleJoinProject}
                                                        onEditJoinProject={handleEditJoinProject}
                                                        onLeaveProject={handleLeaveProject}
                                                        getStatusInfo={getStatusInfo}
                                                        getMemberAvatars={getMemberAvatars}
                                                        getUniqueMemberCount={getUniqueMemberCount}
                                                        can={can}
                                                    />
                                                </div>
                                            ))}
                                        </div>
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
                        </div>
                        {directUsersLoading ? (
                            <div className="loading-state">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="skeleton-card" style={{ height: 60 }}>
                                        <div className="skeleton-header">
                                            <div className="skeleton-icon"></div>
                                            <div className="skeleton-lines">
                                                <div className="skeleton-line w-75"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : directUsers.length === 0 ? (
                            <div className="no-projects" style={{ padding: '40px 20px' }}>
                                <MdPersonAdd size={36} />
                                <p>No users found</p>
                            </div>
                        ) : (
                            directUsers
                                .filter(u =>
                                    !searchTerm ||
                                    u.name.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(user => (
                                    <div
                                        key={user.id}
                                        className={`content-item dc-user-row ${Number(user.id) === Number(partnerId) ? 'active' : ''}`}
                                        onClick={() => handleDirectUserClick(user)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div
                                            className="content-item-avatar"
                                            style={{ background: getUserColor(user.name) }}
                                        >
                                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                                                {getInitials(user.name)}
                                            </span>
                                        </div>
                                        <div className="content-item-info">
                                            <span className="content-item-name">{user.name}</span>
                                            <span className="content-item-meta">Click to chat</span>
                                        </div>
                                    </div>
                                ))
                        )}
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
                                <span>{user?.name?.charAt(0)?.toUpperCase() || '?'}</span>
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
            {/* View Project Modal */}
            <ViewProject
                open={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                projectId={selectedProject?.id}
            />
            {/* Edit Project Modal */}
            <EditProject
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSuccess={() => fetchProjects()}
                projectId={selectedProject?.id}
            />
            {/* Column Edit Modal */}
            <ColumnEdit
                open={columnEditOpen}
                onClose={() => setColumnEditOpen(false)}
                onSuccess={handleColumnEditSuccess}
                projectId={columnEditProjectId}
                field={columnEditField}
            />
            {/* Join Project Modal */}
            <JoinProject
                open={joinModalOpen}
                onClose={() => { setJoinProjectData(null); setJoinModalOpen(false); }}
                onSuccess={handleJoinSuccess}
                project={joinProjectData}
            />
            {/* Edit Join Project Modal */}
            <EditJoinProject
                open={!!editJoinProjectData}
                onClose={() => {
                    setEditJoinProjectData(null);
                    setTeamMemberToEdit(null);
                }}
                onSuccess={() => fetchProjects()}
                teamMember={teamMemberToEdit}
                project={editJoinProjectData}
            />
        </>
    );
};

export default Sidebar;