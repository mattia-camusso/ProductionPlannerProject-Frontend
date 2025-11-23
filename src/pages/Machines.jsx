import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'

function Machines() {
    const { token } = useAuth()
    const [machines, setMachines] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Inline creation state
    const [newMachine, setNewMachine] = useState({
        name: '',
        description: '',
        capacity: '',
        status: 'active',
        machine_class: ''
    })

    // Inline editing state
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null, name: null })

    const fetchMachines = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('http://localhost:8000/machines/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setMachines(data)
            } else {
                throw new Error('Failed to fetch machines')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (token) {
            fetchMachines()
        }
    }, [token, fetchMachines])

    const handleCreateChange = (e) => {
        const { name, value } = e.target
        setNewMachine(prev => ({ ...prev, [name]: value }))
    }

    const handleCreate = async () => {
        if (!newMachine.name || !newMachine.capacity) return

        try {
            const response = await fetch('http://localhost:8000/machines/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newMachine,
                    capacity: parseFloat(newMachine.capacity)
                })
            })

            if (response.ok) {
                fetchMachines()
                setNewMachine({
                    name: '',
                    description: '',
                    capacity: '',
                    status: 'active',
                    machine_class: ''
                })
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to create machine')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const startEditing = (machine) => {
        setEditingId(machine.id)
        setEditForm({
            name: machine.name,
            description: machine.description || '',
            capacity: machine.capacity,
            status: machine.status,
            machine_class: machine.machine_class || ''
        })
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditForm({})
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditForm(prev => ({ ...prev, [name]: value }))
    }

    const handleUpdate = async (id) => {
        try {
            const response = await fetch(`http://localhost:8000/machines/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editForm,
                    capacity: parseFloat(editForm.capacity)
                })
            })

            if (response.ok) {
                fetchMachines()
                setEditingId(null)
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to update machine')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteClick = (machine) => {
        setDeleteConfirmation({
            isOpen: true,
            id: machine.id,
            name: machine.name
        })
    }

    const confirmDelete = async () => {
        if (!deleteConfirmation.isOpen) return

        try {
            const response = await fetch(`http://localhost:8000/machines/${deleteConfirmation.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                fetchMachines()
                setDeleteConfirmation({ isOpen: false, id: null, name: null })
            } else {
                throw new Error('Failed to delete machine')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="page-container">
            <h1>Machines Management</h1>
            {error && <p className="error-message">{error}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Capacity</th>
                            <th>Class</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Creation Row */}
                        <tr className="creation-row">
                            <td>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="New Machine Name"
                                    value={newMachine.name}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="description"
                                    placeholder="Description"
                                    value={newMachine.description}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    name="capacity"
                                    placeholder="Capacity"
                                    value={newMachine.capacity}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                    step="0.1"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="machine_class"
                                    placeholder="Machine Class"
                                    value={newMachine.machine_class}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <select
                                    name="status"
                                    value={newMachine.status}
                                    onChange={handleCreateChange}
                                    className="inline-select"
                                >
                                    <option value="active">Active</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="idle">Idle</option>
                                </select>
                            </td>
                            <td>
                                <button onClick={handleCreate} className="action-btn btn-add">
                                    Add Machine
                                </button>
                            </td>
                        </tr>

                        {/* Data Rows */}
                        {loading ? (
                            <tr><td colSpan="6">Loading...</td></tr>
                        ) : machines.length === 0 ? (
                            <tr><td colSpan="6">No machines found</td></tr>
                        ) : (
                            machines.map(machine => (
                                <tr key={machine.id}>
                                    {editingId === machine.id ? (
                                        <>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editForm.name}
                                                    onChange={handleEditChange}
                                                    className="inline-input"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="description"
                                                    value={editForm.description}
                                                    onChange={handleEditChange}
                                                    className="inline-input"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    name="capacity"
                                                    value={editForm.capacity}
                                                    onChange={handleEditChange}
                                                    className="inline-input"
                                                    step="0.1"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="machine_class"
                                                    value={editForm.machine_class}
                                                    onChange={handleEditChange}
                                                    className="inline-input"
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    name="status"
                                                    value={editForm.status}
                                                    onChange={handleEditChange}
                                                    className="inline-select"
                                                >
                                                    <option value="active">Active</option>
                                                    <option value="maintenance">Maintenance</option>
                                                    <option value="idle">Idle</option>
                                                </select>
                                            </td>
                                            <td>
                                                <button onClick={() => handleUpdate(machine.id)} className="action-btn btn-save">Save</button>
                                                <button onClick={cancelEditing} className="action-btn btn-cancel">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{machine.name}</td>
                                            <td>{machine.description}</td>
                                            <td>{machine.capacity}</td>
                                            <td>{machine.machine_class || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${machine.status}`}>
                                                    {machine.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button onClick={() => startEditing(machine)} className="action-btn btn-edit">Edit</button>
                                                <button onClick={() => handleDeleteClick(machine)} className="action-btn btn-delete">Delete</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, id: null, name: null })}
                onConfirm={confirmDelete}
                title="Delete Machine"
                message={`Are you sure you want to delete ${deleteConfirmation.name}?`}
                confirmText="Delete"
                isDanger={true}
            />
        </div>
    )
}

export default Machines
