import { useState, useEffect, useRef } from 'react';
import { MdClose, MdEdit, MdAdd, MdCheck } from 'react-icons/md';
import './JoinProject.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const INITIAL_STATE = {
    project_id: null,
    user_id: null,
    steps: [],
    status: 'in_progress',
};

const DEFAULT_STEPS = [
    { key: 'Marking', label: 'Marking' },
    { key: 'Excel Sheet', label: 'Excel Sheet' },
    { key: 'Project Pricing', label: 'Project Pricing' },
    { key: 'Quality Assurance', label: 'Quality Assurance' },
];

function EditJoinProject({ open, onClose, onSuccess, teamMember, project, showToast, publishProjectEvent }) {
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState(INITIAL_STATE);
    const [selectedSteps, setSelectedSteps] = useState([]);
    const [customSteps, setCustomSteps] = useState([]);
    const [newStepInput, setNewStepInput] = useState('');
    const newStepInputRef = useRef(null);

    // Initialize form when modal opens
    useEffect(() => {
        if (open && teamMember && project) {
            let existingSteps = [];
            try {
                // Determine if teamMember.steps is already parsed or is a string
                let parsedSteps = typeof teamMember.steps === 'string' ? JSON.parse(teamMember.steps) : teamMember.steps;
                // Sometimes it might be double encoded if the backend returns a JSON string inside a JSON string
                if (typeof parsedSteps === 'string') {
                    parsedSteps = JSON.parse(parsedSteps);
                }

                if (Array.isArray(parsedSteps)) {
                    existingSteps = parsedSteps;
                }
                console.log("Parsed steps for editing:", existingSteps);
            } catch (e) {
                console.error("Failed to parse steps", e, teamMember.steps);
            }

            setValues({
                project_id: project.id,
                user_id: teamMember.user_id,
                steps: existingSteps,
                status: teamMember.status || 'in_progress',
            });
            setSelectedSteps(existingSteps);

            // Determine custom steps
            const existingCustom = existingSteps
                .filter(stepKey => !DEFAULT_STEPS.some(d => d.key === stepKey))
                .map(stepKey => ({
                    key: stepKey,
                    // If it's a custom step, just use the key formatted nicely as a fallback
                    label: stepKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }));

            setCustomSteps(existingCustom);
            setNewStepInput('');
        }
    }, [open, teamMember, project]);


    const handleStepChange = (stepKey, checked) => {
        setSelectedSteps(prev =>
            checked ? [...prev, stepKey] : prev.filter(s => s !== stepKey)
        );
        setValues(prev => ({
            ...prev,
            steps: checked
                ? [...prev.steps, stepKey]
                : prev.steps.filter(s => s !== stepKey),
        }));
    };

    const handleStatusChange = (e) => {
        setValues(prev => ({
            ...prev,
            status: e.target.value
        }));
    };

    const handleAddCustomStep = () => {
        const key = newStepInput.trim().toLowerCase().replace(/\s+/g, '_');
        const label = newStepInput.trim();

        if (!key || !label) return;

        // Check if step already exists
        const allSteps = [...DEFAULT_STEPS, ...customSteps];
        if (allSteps.find(s => s.key === key)) {
            showToast('warning', 'Duplicate Step', 'This step already exists');
            return;
        }

        const newStep = { key, label };
        setCustomSteps(prev => [...prev, newStep]);
        setNewStepInput('');

        if (newStepInputRef.current) {
            newStepInputRef.current.focus();
        }
    };

    const handleNewStepKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddCustomStep();
        }
    };

    const handleSubmit = async () => {
        if (selectedSteps.length === 0) {
            showToast('warning', 'No Steps Selected', 'Please select at least one task');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/project/team-member/update/${teamMember.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            });
            const data = await response.json();

            if (data.status) {
                onSuccess?.(data.data || data.project || project);
                onClose();
                showToast?.('success', 'Tasks Updated', data.message || 'Tasks updated successfully');
                publishProjectEvent?.('edit-join', project, project?.name);
            } else {
                showToast?.('error', 'Update Failed', data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error updating tasks:', error);
            showToast?.('error', 'Network Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    const allSteps = [...DEFAULT_STEPS, ...customSteps];

    return (
        <>
            {open && (
                <div className="join-project-overlay" onClick={handleClose}>
                    <div className="join-project-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="join-project-header">
                            <div className="join-project-header-icon">
                                <MdEdit size={24} />
                            </div>
                            <div className="join-project-header-text">
                                <h3>Edit Tasks</h3>
                                <p>{project?.name || 'Update your tasks'}</p>
                            </div>
                            <button className="join-project-close" onClick={handleClose}>
                                <MdClose size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="join-project-body">
                            <div className="join-project-section" style={{ marginBottom: '20px' }}>
                                <h4 className="join-project-section-title">Status</h4>
                                <select
                                    value={values.status}
                                    onChange={handleStatusChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="in_progress">In Progress</option>
                                    <option value="needs_review">Needs Review</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="join-project-section">
                                <h4 className="join-project-section-title">Update Your Tasks</h4>

                                <div className="join-project-steps">
                                    {allSteps.map((step) => {
                                        const isSelected = selectedSteps.includes(step.key);
                                        const isCustom = customSteps.some(s => s.key === step.key);

                                        return (
                                            <label
                                                key={step.key}
                                                className={`join-project-step ${isSelected ? 'selected' : ''} ${isCustom ? 'custom' : ''}`}
                                            >
                                                <div className="join-project-step-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleStepChange(step.key, e.target.checked)}
                                                    />
                                                    <span className="join-project-step-checkmark">
                                                        {isSelected && <MdCheck size={14} />}
                                                    </span>
                                                </div>
                                                <span className="join-project-step-label">{step.label}</span>
                                                {isCustom && (
                                                    <span className="join-project-step-badge">Custom</span>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add Custom Step */}
                            <div className="join-project-add-step">
                                <div className="join-project-add-step-input-wrapper">
                                    <input
                                        ref={newStepInputRef}
                                        type="text"
                                        className="join-project-add-step-input"
                                        placeholder="Add custom task..."
                                        value={newStepInput}
                                        onChange={(e) => setNewStepInput(e.target.value)}
                                        onKeyDown={handleNewStepKeyDown}
                                    />
                                    <button
                                        className="join-project-add-step-btn"
                                        onClick={handleAddCustomStep}
                                        disabled={!newStepInput.trim()}
                                    >
                                        <MdAdd size={18} />
                                        <span>Add</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="join-project-footer">
                            <div className="join-project-footer-info">
                                <span className="join-project-step-count">
                                    {selectedSteps.length} step{selectedSteps.length !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="join-project-footer-actions">
                                <button className="join-project-btn-cancel" onClick={handleClose}>
                                    Cancel
                                </button>
                                <button
                                    className="join-project-btn-submit"
                                    onClick={handleSubmit}
                                    disabled={loading || selectedSteps.length === 0}
                                >
                                    {loading ? (
                                        <>
                                            <span className="join-project-spinner" />
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <MdEdit size={18} />
                                            Update Tasks
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default EditJoinProject;
