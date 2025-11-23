import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { Link } from 'react-router-dom'
import ConfirmationModal from '../components/ConfirmationModal'

function Demand() {
    const { token } = useAuth()
    const [demands, setDemands] = useState([])
    const [products, setProducts] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Inline creation state
    const [newDemand, setNewDemand] = useState({
        product_id: '',
        quantity: '',
        need_date: '',
        status: 'pending'
    })

    // Inline editing state
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch demands
            const demandRes = await fetch('http://localhost:8000/demand/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!demandRes.ok) throw new Error('Failed to fetch demand')
            const demandData = await demandRes.json()

            // Fetch products to map names
            const productRes = await fetch('http://localhost:8000/products/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!productRes.ok) throw new Error('Failed to fetch products')
            const productData = await productRes.json()

            // Create product map
            const prodMap = {}
            productData.forEach(p => prodMap[p.id] = p)
            setProducts(prodMap)

            setDemands(demandData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (token) {
            fetchData()
        }
    }, [token, fetchData])

    const handleCreateChange = (e) => {
        const { name, value } = e.target
        setNewDemand(prev => ({ ...prev, [name]: value }))
    }

    const handleCreate = async () => {
        if (!newDemand.product_id || !newDemand.quantity || !newDemand.need_date) return

        try {
            const response = await fetch('http://localhost:8000/demand/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    product_id: parseInt(newDemand.product_id),
                    quantity: parseFloat(newDemand.quantity),
                    need_date: newDemand.need_date,
                    status: newDemand.status
                })
            })

            if (response.ok) {
                fetchData()
                setNewDemand({
                    product_id: '',
                    quantity: '',
                    need_date: '',
                    status: 'pending'
                })
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to create demand')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const startEditing = (demand) => {
        setEditingId(demand.id)
        setEditForm({
            product_id: demand.product_id,
            quantity: demand.quantity,
            need_date: demand.need_date,
            status: demand.status
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
            const response = await fetch(`http://localhost:8000/demand/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editForm,
                    product_id: parseInt(editForm.product_id),
                    quantity: parseFloat(editForm.quantity)
                })
            })

            if (response.ok) {
                fetchData()
                setEditingId(null)
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to update demand')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteClick = (id) => {
        setDeleteConfirmation({
            isOpen: true,
            id: id
        })
    }

    const confirmDelete = async () => {
        if (!deleteConfirmation.isOpen) return

        try {
            const response = await fetch(`http://localhost:8000/demand/${deleteConfirmation.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                fetchData()
                setDeleteConfirmation({ isOpen: false, id: null })
            } else {
                throw new Error('Failed to delete demand')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'fulfilled': return 'status-badge active'
            case 'in_progress': return 'status-badge maintenance'
            default: return 'status-badge inactive'
        }
    }

    const formatStatus = (status) => {
        return status.replace('_', ' ').toUpperCase()
    }

    return (
        <div className="page-container">
            <h1>Demand Management</h1>
            {error && <p className="error-message">{error}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Need Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Creation Row */}
                        <tr className="creation-row">
                            <td>
                                <select
                                    name="product_id"
                                    value={newDemand.product_id}
                                    onChange={handleCreateChange}
                                    className="inline-select"
                                >
                                    <option value="">Select Product...</option>
                                    {Object.values(products).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    name="quantity"
                                    placeholder="Qty"
                                    value={newDemand.quantity}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                    step="0.1"
                                />
                            </td>
                            <td>
                                <input
                                    type="date"
                                    name="need_date"
                                    value={newDemand.need_date}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <select
                                    name="status"
                                    value={newDemand.status}
                                    onChange={handleCreateChange}
                                    className="inline-select"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="fulfilled">Fulfilled</option>
                                </select>
                            </td>
                            <td>
                                <button onClick={handleCreate} className="action-btn btn-add">
                                    Add Demand
                                </button>
                            </td>
                        </tr>

                        {/* Data Rows */}
                        {loading ? (
                            <tr><td colSpan="5">Loading...</td></tr>
                        ) : demands.length === 0 ? (
                            <tr><td colSpan="5">No demand entries found</td></tr>
                        ) : (
                            demands.map(demand => {
                                const product = products[demand.product_id]
                                return (
                                    <tr key={demand.id}>
                                        {editingId === demand.id ? (
                                            <>
                                                <td>
                                                    <select
                                                        name="product_id"
                                                        value={editForm.product_id}
                                                        onChange={handleEditChange}
                                                        className="inline-select"
                                                    >
                                                        {Object.values(products).map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        name="quantity"
                                                        value={editForm.quantity}
                                                        onChange={handleEditChange}
                                                        className="inline-input"
                                                        step="0.1"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        name="need_date"
                                                        value={editForm.need_date}
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
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="fulfilled">Fulfilled</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button onClick={() => handleUpdate(demand.id)} className="action-btn btn-save">Save</button>
                                                    <button onClick={cancelEditing} className="action-btn btn-cancel">Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    {product ? (
                                                        <Link to={`/products/${product.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                                            {product.name}
                                                        </Link>
                                                    ) : (
                                                        `Product #${demand.product_id}`
                                                    )}
                                                </td>
                                                <td>{demand.quantity}</td>
                                                <td>{demand.need_date}</td>
                                                <td>
                                                    <span className={getStatusBadgeClass(demand.status)}>
                                                        {formatStatus(demand.status)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link to={`/demand/${demand.id}`} className="action-btn" style={{ textDecoration: 'none', marginRight: '0.5rem' }}>
                                                        View
                                                    </Link>
                                                    <button onClick={() => startEditing(demand)} className="action-btn btn-edit">Edit</button>
                                                    <button onClick={() => handleDeleteClick(demand.id)} className="action-btn btn-delete">Delete</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Delete Demand"
                message="Are you sure you want to delete this demand entry?"
                confirmText="Delete"
                isDanger={true}
            />
        </div>
    )
}

export default Demand
