// components/Projects/ColumnEdit.jsx
import { useState, useEffect, useRef } from 'react';
import { MdClose, MdCheck } from 'react-icons/md';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Input from '../Input/Input';
import DropdownSelect from '../DropdownSelect/DropdownSelect';
import './ColumnEdit.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define field configurations
const FIELD_CONFIG = {
    project_title: { type: 'text', label: 'Project Title', placeholder: 'Enter project title' },
    project_address: { type: 'richtext', label: 'Project Address', placeholder: 'Enter project address' },
    client_name_for_admin: { type: 'text', label: 'Client Name (Admin)', placeholder: 'Enter client name' },
    client_id: {
        type: 'client_select',
        label: 'Client Name',
        placeholder: 'Select Client'
    },
    project_pricing: { type: 'text', label: 'Pricing', placeholder: 'Enter pricing' },
    project_area: { type: 'text', label: 'Area', placeholder: 'Enter area' },
    project_construction_type: {
        type: 'select',
        label: 'Construction Type',
        placeholder: 'Select type',
        options: [
            { value: "commercial", label: "Commercial" },
            { value: "residential", label: "Residential" },
            // { value: "industrial", label: "Industrial", readOnly: true },
            // { value: "infrastructure", label: "Infrastructure", readOnly: true },
            // { value: "mixed_use", label: "Mixed Use", readOnly: true },
        ]
    },
    project_line_items_pricing: { type: 'text', label: 'Line Items Pricing', placeholder: 'Enter line items pricing' },
    project_floor_number: { type: 'text', label: 'Floor Number', placeholder: 'Enter floor number' },
    project_main_scope: { type: 'richtext', label: 'Main Scope', placeholder: 'Describe main scope' },
    project_scope_details: { type: 'richtext', label: 'Scope Details', placeholder: 'Describe scope details' },
    project_template: { type: 'text', label: 'Project Template', placeholder: 'Enter template name' },
    project_init_link: { type: 'text', label: 'Initial Link', placeholder: 'Enter initial link' },
    project_final_link: { type: 'text', label: 'Final Link', placeholder: 'Enter final link' },
    project_admin_notes: { type: 'richtext', label: 'Admin Notes', placeholder: 'Enter admin notes' },
    project_notes_estimator: { type: 'richtext', label: 'Estimator Notes', placeholder: 'Enter estimator notes' },
    notes_private: { type: 'richtext', label: 'Private Notes', placeholder: 'Enter private notes' },
    budget_total: { type: 'text', label: 'Budget Total', placeholder: 'Enter budget total' },
    deduction_amount: { type: 'text', label: 'Deduction Amount', placeholder: 'Enter deduction amount' },
    project_due_date: { type: 'date', label: 'Due Date', placeholder: 'Select due date' },
    project_points: { type: 'number', label: 'Points', placeholder: 'Enter points' },
    project_status: {
        type: 'select',
        label: 'Status',
        placeholder: 'Select status',
        options: [
            { value: "Planned", label: "Planned" },
            { value: "Pending", label: "Pending" },
            { value: "Takeoff On Progress", label: "Takeoff On Progress" },
            { value: "Pricing On Progress", label: "Pricing On Progress" },
            { value: "Completed", label: "Completed" },
            { value: "Hold", label: "Hold" },
            { value: "Revision", label: "Revision" },
            { value: "Cancelled", label: "Cancelled" },
            { value: "Deliver", label: "Deliver" },
        ]
    },
    project_source: {
        type: 'select',
        label: 'Source',
        placeholder: 'Select source',
        options: [
            { value: "InSource", label: "In Source" },
            { value: "OutSource", label: "Out Source" },
        ]
    },
    preview_status: {
        type: 'select',
        label: 'Preview Status',
        placeholder: 'Select preview status',
        options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
        ]
    },
};

// Reset state helper
const getInitialState = () => ({
    value: '',
    originalValue: '',
    selectedClientNotes: '',
});

function ColumnEdit({ open, onClose, onSuccess, projectId, field, showToast, publishProjectEvent, selectedProject }) {
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [{ value, originalValue, selectedClientNotes }, setFieldState] = useState(getInitialState());

    // Client specific states
    const [clients, setClients] = useState([]);
    const [clientsLoading, setClientsLoading] = useState(false);

    // Use ref to track the latest value for async operations
    const valueRef = useRef('');

    const fieldConfig = FIELD_CONFIG[field] || { type: 'text', label: field, placeholder: 'Enter value' };

    // Reset ALL states when modal opens or field/projectId changes
    useEffect(() => {
        if (open && projectId && field) {
            // Reset all states first
            setFieldState(getInitialState());
            setClients([]);
            setClientsLoading(false);
            setLoading(false);
            setFetchLoading(false);
            valueRef.current = '';

            // Fetch clients first if this is the client_id field, then fetch current value
            if (field === 'client_id') {
                fetchClientsAndValue();
            } else {
                fetchCurrentValue();
            }
        } else if (!open) {
            // Reset everything when modal closes
            setFieldState(getInitialState());
            setClients([]);
            setClientsLoading(false);
            setLoading(false);
            setFetchLoading(false);
            valueRef.current = '';
        }
    }, [open, projectId, field]);

    // Keep ref in sync with state
    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const fetchClientsAndValue = async () => {
        setFetchLoading(true);
        setClientsLoading(true);

        try {
            const token = localStorage.getItem('token');

            // Fetch both clients and current value in parallel
            const [clientsRes, valueRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/client`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }).then(r => r.json()),
                fetch(`${API_BASE_URL}/api/project/column/${projectId}?field=${field}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }).then(r => r.json())
            ]);

            // Handle clients data
            if (clientsRes.status) {
                setClients(clientsRes.data);
            }

            // Handle current value
            if (valueRes.status) {
                const val = valueRes.value || '';
                valueRef.current = val;

                // Find selected client notes from the fetched clients
                let notes = '';
                if (val && clientsRes.status && clientsRes.data) {
                    const selectedClient = clientsRes.data.find(c => c.id === val);
                    notes = selectedClient?.notes || '';
                }

                setFieldState({
                    value: val,
                    originalValue: val,
                    selectedClientNotes: notes,
                });
            } else {
        showToastLocal('error', 'Failed to load', valueRes.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            showToastLocal('error', 'Network Error', 'Failed to load data');
        } finally {
            setFetchLoading(false);
            setClientsLoading(false);
        }
    };

    const fetchCurrentValue = async () => {
        setFetchLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/project/column/${projectId}?field=${field}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (data.status) {
                const val = data.value || '';
                valueRef.current = val;
                setFieldState(prev => ({
                    ...prev,
                    value: val,
                    originalValue: val,
                }));
            } else {
                showToastLocal('error', 'Failed to load', data.message);
            }
        } catch (error) {
            console.error('Error fetching column value:', error);
            showToastLocal('error', 'Network Error', 'Failed to load data');
        } finally {
            setFetchLoading(false);
        }
    };

    const clientOptions = clients.map(client => ({
        value: client.id,
        label: client.name,
    }));

    const showToastLocal = (type, message, description = '') => {
        showToast?.(type, message, description);
    };

    const handleValueChange = (newValue) => {
        valueRef.current = newValue;
        setFieldState(prev => ({ ...prev, value: newValue }));
    };

    const handleClientChange = (clientId) => {
        const newValue = clientId || '';
        valueRef.current = newValue;

        if (clientId) {
            const selectedClient = clients.find(client => client.id === clientId);
            setFieldState({
                value: newValue,
                originalValue: originalValue,
                selectedClientNotes: selectedClient?.notes || '',
            });
        } else {
            setFieldState({
                value: '',
                originalValue: originalValue,
                selectedClientNotes: '',
            });
        }
    };

    const handleSave = async () => {
        const currentValue = valueRef.current;

        if (currentValue === originalValue) {
            showToast?.('info', 'No Changes', 'No modifications were made');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/project/column/update/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ field, value: currentValue }),
            });
            const data = await response.json();
            if (data.status) {
                // Reset state before closing
                setFieldState(getInitialState());
                setClients([]);
                valueRef.current = '';
                onSuccess?.({ projectId, field, value: currentValue });
                onClose();
                showToast?.('success', 'Updated Successfully', `${fieldConfig.label} has been updated`);
                publishProjectEvent?.(
                    'column-edit',
                    selectedProject || { id: projectId },
                    selectedProject?.name || selectedProject?.project_title || 'Unknown Project'
                );
            } else {
                showToast?.('error', 'Failed to Update', data.message || 'Something went wrong');
            }
        } catch (error) {
            console.error('Error updating column:', error);
            showToast?.('error', 'Network Error', 'Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Reset all states
        setFieldState(getInitialState());
        setClients([]);
        setClientsLoading(false);
        setLoading(false);
        setFetchLoading(false);
        valueRef.current = '';
        onClose();
    };

    const renderField = () => {
        // Show loading state for client select
        if (field === 'client_id' && (clientsLoading || fetchLoading)) {
            return (
                <div className="column-edit-loading">
                    <div className="column-edit-skeleton" />
                </div>
            );
        }

        switch (fieldConfig.type) {
            case 'richtext':
                return (
                    <div className="column-edit-richtext">
                        <ReactQuill
                            theme="snow"
                            value={value}
                            onChange={handleValueChange}
                            placeholder={fieldConfig.placeholder}
                        />
                    </div>
                );

            case 'client_select':
                return (
                    <>
                        <DropdownSelect
                            options={clientOptions}
                            value={value}
                            onChange={handleClientChange}
                            placeholder={fieldConfig.placeholder}
                            searchable={true}
                            allowClear={true}
                        />
                        {value && selectedClientNotes && (
                            <div className="column-edit-client-notes">
                                <label className="column-edit-label">Client Notes</label>
                                <ReactQuill
                                    theme="snow"
                                    value={selectedClientNotes}
                                    readOnly={true}
                                />
                            </div>
                        )}
                    </>
                );

            case 'select':
                return (
                    <DropdownSelect
                        options={fieldConfig.options}
                        value={value}
                        onChange={handleValueChange}
                        placeholder={fieldConfig.placeholder}
                        searchable={fieldConfig.options.length > 5}
                    />
                );

            case 'date':
                return (
                    <Input
                        type="date"
                        value={value}
                        onChange={(e) => handleValueChange(e.target.value)}
                    />
                );

            case 'number':
                return (
                    <Input
                        type="number"
                        placeholder={fieldConfig.placeholder}
                        value={value}
                        onChange={(e) => handleValueChange(e.target.value)}
                    />
                );

            default:
                return (
                    <Input
                        placeholder={fieldConfig.placeholder}
                        value={value}
                        onChange={(e) => handleValueChange(e.target.value)}
                    />
                );
        }
    };

    return (
        <>
            {open && (
                <div className="column-edit-overlay" onClick={handleClose}>
                    <div className={`column-edit-modal ${field === 'client_id' && value && selectedClientNotes ? 'column-edit-modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="column-edit-header">
                            <div className="column-edit-title">
                                <h3>Edit {fieldConfig.label}</h3>
                                <p>Update this field and save changes</p>
                            </div>
                            <button className="column-edit-close" onClick={handleClose}>
                                <MdClose size={20} />
                            </button>
                        </div>

                        <div className="column-edit-body">
                            {fetchLoading && field !== 'client_id' ? (
                                <div className="column-edit-loading">
                                    <div className="column-edit-skeleton" />
                                </div>
                            ) : (
                                <div className="column-edit-field">
                                    <label className="column-edit-label">{fieldConfig.label}</label>
                                    {renderField()}
                                </div>
                            )}
                        </div>

                        <div className="column-edit-footer">
                            <button className="column-edit-btn-cancel" onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className="column-edit-btn-save"
                                onClick={handleSave}
                                disabled={loading || fetchLoading || clientsLoading || value === originalValue}
                            >
                                {loading ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <MdCheck size={18} />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ColumnEdit;