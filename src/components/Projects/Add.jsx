import { useState, useEffect } from 'react';
import { MdRocketLaunch } from 'react-icons/md';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import Input from '../Input/Input';
import Modal from '../Modal/Modal';
import DropdownSelect from '../DropdownSelect/DropdownSelect';
import Toast from '../Toast/Toast';
import { Row, Col } from '../Grid/Grid';
import './style.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const INITIAL_STATE = {
    project_title: '',
    project_address: '',
    client_name_for_admin: '',
    client_id: '',
    project_pricing: '',
    project_area: '',
    project_construction_type: '',
    project_line_items_pricing: '',
    project_floor_number: '',
    project_main_scope: '',
    project_scope_details: '',
    project_template: '',
    project_init_link: '',
    project_final_link: '',
    project_admin_notes: '',
    project_notes_estimator: '',
    notes_private: '',
    project_due_date: '',
    project_points: '',
    project_status: 'Pending',
    project_source: 'InSource',
    preview_status: 'active',
};

function AddProject({ open, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);
    const [selectedClientNotes, setSelectedClientNotes] = useState('');
    const [toast, setToast] = useState({ show: false, type: 'success', message: '', description: '' });

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            fetchClients();
        } else {
            // Reset when modal closes
            setFormData(INITIAL_STATE);
            setSelectedClientNotes('');
        }
    }, [open]);

    const showToast = (type, message, description = '') => {
        setToast({ show: true, type, message, description });
    };

    const fetchClients = async () => {
        setClientsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/client`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.status) {
                setClients(data.data);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            showToast('error', 'Failed to load clients', error.message);
        } finally {
            setClientsLoading(false);
        }
    };

    const clientOptions = clients.map(client => ({
        value: client.id,
        label: client.name,
    }));

    const constructionTypeOptions = [
        { value: "commercial", label: "Commercial" },
        { value: "residential", label: "Residential" },
        // { value: "industrial", label: "Industrial", readOnly: true },
        // { value: "infrastructure", label: "Infrastructure", readOnly: true },
        // { value: "mixed_use", label: "Mixed Use", readOnly: true },
    ];

    const statusOptions = [
        { value: "Planned", label: "Planned" },
        { value: "Pending", label: "Pending" },
        { value: "Takeoff On Progress", label: "Takeoff On Progress" },
        { value: "Pricing On Progress", label: "Pricing On Progress" },
        { value: "Completed", label: "Completed" },
        { value: "Hold", label: "Hold" },
        { value: "Revision", label: "Revision" },
        { value: "Cancelled", label: "Cancelled" },
        { value: "Deliver", label: "Deliver" },
    ];

    const sourceOptions = [
        { value: "InSource", label: "In Source" },
        { value: "OutSource", label: "Out Source" },
    ];

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleClientChange = (clientId) => {
        if (clientId) {
            const selectedClient = clients.find(client => client.id === clientId);
            setFormData(prev => ({
                ...prev,
                client_id: clientId,
            }));
            setSelectedClientNotes(selectedClient?.notes || '');
        } else {
            setFormData(prev => ({
                ...prev,
                client_id: '',
            }));
            setSelectedClientNotes('');
        }
    };

    const handleSubmit = async () => {
        if (!formData.project_title.trim()) {
            showToast('warning', 'Validation Error', 'Project title is required');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (data.status) {
                setFormData(INITIAL_STATE);
                setSelectedClientNotes('');
                onSuccess?.();
                onClose();
                showToast('success', 'Project Created', 'Project has been created successfully');
            } else {
                showToast('error', 'Failed to Create Project', data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error creating project:', error);
            showToast('error', 'Network Error', 'Failed to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData(INITIAL_STATE);
        setSelectedClientNotes('');
        onClose();
    };

    return (
        <>
            <Toast
                type={toast.type}
                message={toast.message}
                description={toast.description}
                show={toast.show}
                duration={4000}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
                position="top-right"
            />

            <Modal
                open={open}
                onClose={handleClose}
                title={
                    <div className="project-modal-title">
                        <div className="project-modal-icon">
                            <MdRocketLaunch size={22} />
                        </div>
                        <div>
                            <h2>Add New Project</h2>
                            <p>Fill in the project details below</p>
                        </div>
                    </div>
                }
                width={900}
                footer={
                    <div className="project-modal-footer">
                        <button className="project-btn-cancel" onClick={handleClose}>Cancel</button>
                        <button
                            className="project-btn-submit"
                            onClick={handleSubmit}
                            disabled={loading || !formData.project_title.trim()}
                        >
                            {loading ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>
                }
            >
                <SimpleBar className="project-scroll">
                    <div className="project-form">
                        <Row className="g-3">

                            {/* ── Left Column ── */}
                            <Col className="col-12 col-md-6">

                                <div className="project-section-label">Project Info</div>

                                <Input
                                    label="Project Title *"
                                    placeholder="Enter project title"
                                    value={formData.project_title}
                                    onChange={(e) => handleChange('project_title', e.target.value)}
                                    required
                                />

                                <div className="project-field">
                                    <label className="project-label">Project Address</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.project_address}
                                        onChange={(content) => handleChange('project_address', content)}
                                        placeholder="Enter project address..."
                                    />
                                </div>
                                <Input
                                    className='mt-3'
                                    label="Client Name (Admin)"
                                    placeholder="Enter client name for admin"
                                    value={formData.client_name_for_admin}
                                    onChange={(e) => handleChange('client_name_for_admin', e.target.value)}
                                />
                                <div className="project-field mb-3">
                                    <label className="project-label">Client Name</label>
                                    <DropdownSelect
                                        options={clientOptions}
                                        value={formData.client_id}
                                        onChange={handleClientChange}
                                        placeholder="Select Client"
                                        searchable={true}
                                    />
                                </div>
                                {formData.client_id && (
                                    <>
                                        {selectedClientNotes && (
                                            <div className="project-field mt-3 mb-3">
                                                <label className="project-label">Client Notes</label>
                                                <ReactQuill
                                                    theme="snow"
                                                    value={selectedClientNotes}
                                                    readOnly={true}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                <Input
                                    label="Project Template"
                                    placeholder="Template name"
                                    value={formData.project_template}
                                    onChange={(e) => handleChange('project_template', e.target.value)}
                                />

                                <div className="project-section-label">Metrics &amp; Config</div>

                                <Row className="g-2">
                                    <Col className="col-6">
                                        <Input
                                            label="Pricing"
                                            placeholder="Project pricing"
                                            value={formData.project_pricing}
                                            onChange={(e) => handleChange('project_pricing', e.target.value)}
                                        />
                                    </Col>
                                    <Col className="col-6">
                                        <Input
                                            label="Area"
                                            placeholder="Project area"
                                            value={formData.project_area}
                                            onChange={(e) => handleChange('project_area', e.target.value)}
                                        />
                                    </Col>
                                </Row>

                                <Row className="g-2">
                                    <Col className="col-6">
                                        <div className="project-field">
                                            <label className="project-label">Construction Type</label>
                                            <DropdownSelect
                                                options={constructionTypeOptions}
                                                value={formData.project_construction_type}
                                                onChange={(value) => handleChange('project_construction_type', value)}
                                                placeholder="Select Type"
                                                searchable={false}
                                            />
                                        </div>
                                    </Col>
                                    <Col className="col-6">
                                        <Input
                                            label="Floor Number"
                                            placeholder="Floor number"
                                            value={formData.project_floor_number}
                                            onChange={(e) => handleChange('project_floor_number', e.target.value)}
                                        />
                                    </Col>
                                </Row>

                                <Input
                                    label="Line Items Pricing"
                                    placeholder="Line items pricing"
                                    value={formData.project_line_items_pricing}
                                    onChange={(e) => handleChange('project_line_items_pricing', e.target.value)}
                                />

                                <div className="project-section-label">Project Settings</div>

                                <Row className="g-2">
                                    <Col className="col-6">
                                        <div className="project-field">
                                            <label className="project-label">Status</label>
                                            <DropdownSelect
                                                options={statusOptions}
                                                value={formData.project_status}
                                                onChange={(value) => handleChange('project_status', value)}
                                                placeholder="Select Status"
                                                searchable={true}
                                            />
                                        </div>
                                    </Col>
                                    <Col className="col-6">
                                        <div className="project-field">
                                            <label className="project-label">Source</label>
                                            <DropdownSelect
                                                options={sourceOptions}
                                                value={formData.project_source}
                                                onChange={(value) => handleChange('project_source', value)}
                                                placeholder="Select Source"
                                                searchable={false}
                                            />
                                        </div>
                                    </Col>
                                </Row>

                                <div className="project-section-label mt-4">Links</div>

                                <Row className="g-2">
                                    <Col className="col-6">
                                        <Input
                                            label="Initial Link"
                                            placeholder="Initial link"
                                            value={formData.project_init_link}
                                            onChange={(e) => handleChange('project_init_link', e.target.value)}
                                        />
                                    </Col>
                                    <Col className="col-6">
                                        <Input
                                            label="Final Link"
                                            placeholder="Final link"
                                            value={formData.project_final_link}
                                            onChange={(e) => handleChange('project_final_link', e.target.value)}
                                        />
                                    </Col>
                                </Row>

                                <div className="project-section-label">Budget &amp; Timeline</div>

                                <Row className="g-2">
                                    <Col className="col-6">
                                        <Input
                                            label="Due Date"
                                            type="date"
                                            value={formData.project_due_date}
                                            onChange={(e) => handleChange('project_due_date', e.target.value)}
                                        />
                                    </Col>
                                    <Col className="col-6">
                                        <Input
                                            label="Points"
                                            type="number"
                                            placeholder="Project points"
                                            value={formData.project_points}
                                            onChange={(e) => handleChange('project_points', e.target.value)}
                                        />
                                    </Col>
                                </Row>

                            </Col>

                            {/* ── Right Column ── */}
                            <Col className="col-12 col-md-6">

                                <div className="project-section-label">Scope</div>

                                <div className="project-field">
                                    <label className="project-label">Main Scope</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.project_main_scope}
                                        onChange={(content) => handleChange('project_main_scope', content)}
                                        placeholder="Describe main scope..."
                                    />
                                </div>

                                <div className="project-field mt-4">
                                    <label className="project-label">Scope Details</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.project_scope_details}
                                        onChange={(content) => handleChange('project_scope_details', content)}
                                        placeholder="Detailed scope description..."
                                    />
                                </div>

                                <div className="project-section-label mt-4">Notes</div>

                                <div className="project-field">
                                    <label className="project-label">Admin Notes</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.project_admin_notes}
                                        onChange={(content) => handleChange('project_admin_notes', content)}
                                        placeholder="Notes for administrators..."
                                    />
                                </div>

                                <div className="project-field mt-4">
                                    <label className="project-label">Estimator Notes</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.project_notes_estimator}
                                        onChange={(content) => handleChange('project_notes_estimator', content)}
                                        placeholder="Notes for estimators..."
                                    />
                                </div>

                                <div className="project-field mt-4">
                                    <label className="project-label">Private Notes</label>
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.notes_private}
                                        onChange={(content) => handleChange('notes_private', content)}
                                        placeholder="Private notes..."
                                    />
                                </div>

                            </Col>

                        </Row>
                    </div>
                </SimpleBar>
            </Modal>
        </>
    );
}

export default AddProject;