// components/Projects/JoinProject.jsx
import { useState, useEffect, useRef } from 'react';
import { MdClose, MdPersonAdd, MdAdd, MdCheck } from 'react-icons/md';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
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

function JoinProject({ open, onClose, onSuccess, project, showToast, publishProjectEvent }) {
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState(INITIAL_STATE);
    const [selectedSteps, setSelectedSteps] = useState([]);
    const [customSteps, setCustomSteps] = useState([]);
    const [newStepInput, setNewStepInput] = useState('');
    const newStepInputRef = useRef(null);

    // Initialize form when modal opens
    useEffect(() => {
        if (open && project) {
            const user = localStorage.getItem('user');
            const userData = user ? JSON.parse(user) : null;

            setValues({
                project_id: project.id,
                user_id: userData?.id || null,
                steps: [],
                status: 'in_progress',
            });
            setSelectedSteps([]);
            setCustomSteps([]);
            setNewStepInput('');
        }
    }, [open, project]);

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

    const handleAddCustomStep = () => {
        const key = newStepInput.trim().toLowerCase().replace(/\s+/g, '_');
        const label = newStepInput.trim();

        if (!key || !label) return;

        // Check if step already exists in default or custom steps
        const allSteps = [...DEFAULT_STEPS, ...customSteps];
        if (allSteps.find(s => s.key === key)) {
            showToast('warning', 'Duplicate Step', 'This step already exists');
            return;
        }

        const newStep = { key, label };
        setCustomSteps(prev => [...prev, newStep]);
        setNewStepInput('');

        // Focus back on input
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
            showToast?.('warning', 'No Steps Selected', 'Please select at least one task');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/project/team-member/join/${project.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(values),
            });
            const data = await response.json();

            if (data.status) {
                setValues(INITIAL_STATE);
                setSelectedSteps([]);
                setCustomSteps([]);
                setNewStepInput('');
                onSuccess?.(data.project || data.data);
                onClose();
                showToast?.('success', 'Joined Successfully', data.message || 'You have joined the project');
                publishProjectEvent?.('join-project', data.project || data.data || values, project.name);
            } else {
                showToast?.('error', 'Failed to Join', data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error joining project:', error);
            showToast?.('error', 'Network Error', 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setValues(INITIAL_STATE);
        setSelectedSteps([]);
        setCustomSteps([]);
        setNewStepInput('');
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
                                <MdPersonAdd size={24} />
                            </div>
                            <div className="join-project-header-text">
                                <h3>Join Project</h3>
                                <p>{project?.name || 'Select tasks to join'}</p>
                            </div>
                            <button className="join-project-close" onClick={handleClose}>
                                <MdClose size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <SimpleBar className="join-project-body" style={{ maxHeight: '50vh' }}>
                            <div className="join-project-section">
                                <h4 className="join-project-section-title">Choose Tasks To Join The Project</h4>

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

                                {allSteps.length === 0 && (
                                    <div className="join-project-empty">
                                        <p>No steps available. Add custom steps below.</p>
                                    </div>
                                )}
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
                        </SimpleBar>

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
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <MdPersonAdd size={18} />
                                            Join Project
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

export default JoinProject;