import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { token } = useAuth()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [activeTab, setActiveTab] = useState('bom') // 'bom' or 'bop'

    // BOM state
    const [bomEntries, setBomEntries] = useState([])
    const [allProducts, setAllProducts] = useState([])
    const [newBomEntry, setNewBomEntry] = useState({ component_product_id: '', quantity: '' })
    const [editingBomId, setEditingBomId] = useState(null)
    const [editingBomQuantity, setEditingBomQuantity] = useState('')

    // BOP state
    const [bopEntries, setBopEntries] = useState([])
    const [allMachines, setAllMachines] = useState([])
    const [newBopEntry, setNewBopEntry] = useState({ machine_id: '', operation_time: '' })
    const [editingBopId, setEditingBopId] = useState(null)
    const [editingBopTime, setEditingBopTime] = useState('')

    useEffect(() => {
        if (token) {
            fetchProduct()
            fetchAllProducts()
            fetchAllMachines()
        }
    }, [id, token])

    const fetchProduct = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/products/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setProduct(data)
                setEditForm(data)

                // Fetch BOM and BOP if it's a manufactured product
                if (data.type === 'manufactured') {
                    fetchBOM()
                    fetchBOP()
                }
            } else {
                throw new Error('Failed to fetch product')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchAllProducts = async () => {
        try {
            const response = await fetch('http://localhost:8000/products/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAllProducts(data)
            }
        } catch (err) {
            console.error('Failed to fetch products:', err)
        }
    }

    const fetchAllMachines = async () => {
        try {
            const response = await fetch('http://localhost:8000/machines/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAllMachines(data)
            }
        } catch (err) {
            console.error('Failed to fetch machines:', err)
        }
    }

    const fetchBOM = async () => {
        try {
            const response = await fetch(`http://localhost:8000/bom/products/${id}/bom`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setBomEntries(data)
            }
        } catch (err) {
            console.error('Failed to fetch BOM:', err)
        }
    }

    const fetchBOP = async () => {
        try {
            const response = await fetch(`http://localhost:8000/bop/products/${id}/bop`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setBopEntries(data)
            }
        } catch (err) {
            console.error('Failed to fetch BOP:', err)
        }
    }

    // BOM Handlers
    const handleAddBomEntry = async () => {
        if (!newBomEntry.component_product_id || !newBomEntry.quantity) return

        try {
            const response = await fetch(`http://localhost:8000/bom/products/${id}/bom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    component_product_id: parseInt(newBomEntry.component_product_id),
                    quantity: parseFloat(newBomEntry.quantity)
                })
            })

            if (response.ok) {
                fetchBOM()
                setNewBomEntry({ component_product_id: '', quantity: '' })
            } else {
                const errorData = await response.json()
                setError(errorData.detail || 'Failed to add BOM entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleUpdateBomQuantity = async (bomId) => {
        try {
            const response = await fetch(`http://localhost:8000/bom/${bomId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    quantity: parseFloat(editingBomQuantity)
                })
            })

            if (response.ok) {
                fetchBOM()
                setEditingBomId(null)
                setEditingBomQuantity('')
            } else {
                throw new Error('Failed to update BOM entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteBomEntry = async (bomId) => {
        if (!window.confirm('Remove this component from the BOM?')) return

        try {
            const response = await fetch(`http://localhost:8000/bom/${bomId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                fetchBOM()
            } else {
                throw new Error('Failed to delete BOM entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    // BOP Handlers
    const handleAddBopEntry = async () => {
        if (!newBopEntry.machine_id || !newBopEntry.operation_time) return

        try {
            const response = await fetch(`http://localhost:8000/bop/products/${id}/bop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    machine_id: parseInt(newBopEntry.machine_id),
                    operation_time: parseFloat(newBopEntry.operation_time)
                })
            })

            if (response.ok) {
                fetchBOP()
                setNewBopEntry({ machine_id: '', operation_time: '' })
            } else {
                const errorData = await response.json()
                setError(errorData.detail || 'Failed to add BOP entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleUpdateBopTime = async (bopId) => {
        try {
            const response = await fetch(`http://localhost:8000/bop/${bopId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    operation_time: parseFloat(editingBopTime)
                })
            })

            if (response.ok) {
                fetchBOP()
                setEditingBopId(null)
                setEditingBopTime('')
            } else {
                throw new Error('Failed to update BOP entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteBopEntry = async (bopId) => {
        if (!window.confirm('Remove this operation from the BOP?')) return

        try {
            const response = await fetch(`http://localhost:8000/bop/${bopId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                fetchBOP()
            } else {
                throw new Error('Failed to delete BOP entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleEditChange = (e) => {
        const { name, value } = e.target
        setEditForm(prev => ({ ...prev, [name]: value }))
    }

    const handleUpdate = async () => {
        try {
            const response = await fetch(`http://localhost:8000/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editForm,
                    price: parseFloat(editForm.price)
                })
            })

            if (response.ok) {
                await fetchProduct()
                setIsEditing(false)
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Failed to update product')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this product?')) return

        try {
            const response = await fetch(`http://localhost:8000/products/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                navigate('/products')
            } else {
                throw new Error('Failed to delete product')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    // Filter available products for BOM (exclude self and already added components)
    const availableProducts = allProducts.filter(p =>
        p.id !== parseInt(id) &&
        !bomEntries.some(bom => bom.component_product_id === p.id)
    )

    // Filter available machines for BOP (exclude already added machines)
    const availableMachines = allMachines.filter(m =>
        !bopEntries.some(bop => bop.machine_id === m.id)
    )

    if (loading) return <div className="page-container"><p>Loading...</p></div>
    if (error) return <div className="page-container"><p className="error-message">{error}</p></div>
    if (!product) return <div className="page-container"><p>Product not found</p></div>

    return (
        <div className="page-container">
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/products" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    ← Back to Products
                </Link>
            </div>

            <h1>Product Details</h1>

            {isEditing ? (
                <div className="detail-card">
                    <div className="detail-row">
                        <label><strong>Name:</strong></label>
                        <input
                            type="text"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            className="inline-input"
                        />
                    </div>

                    <div className="detail-row">
                        <label><strong>Description:</strong></label>
                        <textarea
                            name="description"
                            value={editForm.description || ''}
                            onChange={handleEditChange}
                            className="inline-input"
                            rows="3"
                        />
                    </div>

                    <div className="detail-row">
                        <label><strong>Price:</strong></label>
                        <input
                            type="number"
                            name="price"
                            value={editForm.price}
                            onChange={handleEditChange}
                            className="inline-input"
                            step="0.01"
                        />
                    </div>

                    <div className="detail-row">
                        <label><strong>Class:</strong></label>
                        <input
                            type="text"
                            name="part_class"
                            value={editForm.part_class || ''}
                            onChange={handleEditChange}
                            className="inline-input"
                        />
                    </div>

                    <div className="detail-row">
                        <label><strong>Type:</strong></label>
                        <select
                            name="type"
                            value={editForm.type}
                            onChange={handleEditChange}
                            className="inline-select"
                        >
                            <option value="manufactured">Manufactured</option>
                            <option value="purchased">Purchased</option>
                        </select>
                    </div>

                    <div className="detail-actions">
                        <button onClick={handleUpdate} className="action-btn btn-save">Save Changes</button>
                        <button onClick={() => setIsEditing(false)} className="action-btn btn-cancel">Cancel</button>
                    </div>
                </div>
            ) : (
                <div className="detail-card">
                    <div className="detail-row">
                        <strong>ID:</strong>
                        <span>{product.id}</span>
                    </div>

                    <div className="detail-row">
                        <strong>Name:</strong>
                        <span>{product.name}</span>
                    </div>

                    <div className="detail-row">
                        <strong>Description:</strong>
                        <span>{product.description || 'No description'}</span>
                    </div>

                    <div className="detail-row">
                        <strong>Price:</strong>
                        <span>${product.price}</span>
                    </div>

                    <div className="detail-row">
                        <strong>Class:</strong>
                        <span>{product.part_class || '-'}</span>
                    </div>

                    <div className="detail-row">
                        <strong>Type:</strong>
                        <span className={`type-badge ${product.type}`}>
                            {product.type}
                        </span>
                    </div>

                    <div className="detail-actions">
                        <button onClick={() => setIsEditing(true)} className="action-btn btn-edit">Edit</button>
                        <button onClick={handleDelete} className="action-btn btn-delete">Delete</button>
                    </div>
                </div>
            )}

            {/* Manufacturing Details Section - Tabs */}
            {product.type === 'manufactured' && (
                <div style={{ marginTop: '3rem' }}>
                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === 'bom' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bom')}
                        >
                            Bill of Materials
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'bop' ? 'active' : ''}`}
                            onClick={() => setActiveTab('bop')}
                        >
                            Bill of Operations
                        </button>
                    </div>

                    <div className="bom-container">
                        {activeTab === 'bom' ? (
                            <>
                                <h2>Bill of Materials</h2>
                                {bomEntries.length > 0 ? (
                                    <table className="bom-table">
                                        <thead>
                                            <tr>
                                                <th>Component</th>
                                                <th>Quantity</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bomEntries.map(bom => (
                                                <tr key={bom.id}>
                                                    <td>{bom.component_product.name}</td>
                                                    <td>
                                                        {editingBomId === bom.id ? (
                                                            <input
                                                                type="number"
                                                                value={editingBomQuantity}
                                                                onChange={(e) => setEditingBomQuantity(e.target.value)}
                                                                className="inline-input"
                                                                style={{ width: '100px' }}
                                                                step="0.1"
                                                            />
                                                        ) : (
                                                            bom.quantity
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editingBomId === bom.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateBomQuantity(bom.id)}
                                                                    className="action-btn btn-save"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => { setEditingBomId(null); setEditingBomQuantity('') }}
                                                                    className="action-btn btn-cancel"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Link to={`/products/${bom.component_product_id}`} className="action-btn" style={{ textDecoration: 'none', marginRight: '0.5rem', marginLeft: '0.5rem' }}>
                                                                    View
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingBomId(bom.id)
                                                                        setEditingBomQuantity(bom.quantity)
                                                                    }}
                                                                    className="action-btn btn-edit"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBomEntry(bom.id)}
                                                                    className="action-btn btn-delete"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No components added yet</p>
                                )}

                                {/* Add Component Form */}
                                <div className="bom-add-form">
                                    <h3>Add Component</h3>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 2 }}>
                                            <label><strong>Component Product:</strong></label>
                                            <select
                                                value={newBomEntry.component_product_id}
                                                onChange={(e) => setNewBomEntry({ ...newBomEntry, component_product_id: e.target.value })}
                                                className="inline-select"
                                            >
                                                <option value="">Select a product...</option>
                                                {availableProducts.map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} (${product.price})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label><strong>Quantity:</strong></label>
                                            <input
                                                type="number"
                                                value={newBomEntry.quantity}
                                                onChange={(e) => setNewBomEntry({ ...newBomEntry, quantity: e.target.value })}
                                                className="inline-input"
                                                placeholder="Quantity"
                                                step="0.1"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddBomEntry}
                                            className="action-btn btn-add"
                                            disabled={!newBomEntry.component_product_id || !newBomEntry.quantity}
                                        >
                                            Add Component
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2>Bill of Operations</h2>
                                {bopEntries.length > 0 ? (
                                    <table className="bom-table">
                                        <thead>
                                            <tr>
                                                <th>Machine</th>
                                                <th>Operation Time (hrs)</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bopEntries.map(bop => (
                                                <tr key={bop.id}>
                                                    <td>{bop.machine ? bop.machine.name : `Machine #${bop.machine_id}`}</td>
                                                    <td>
                                                        {editingBopId === bop.id ? (
                                                            <input
                                                                type="number"
                                                                value={editingBopTime}
                                                                onChange={(e) => setEditingBopTime(e.target.value)}
                                                                className="inline-input"
                                                                style={{ width: '100px' }}
                                                                step="0.1"
                                                            />
                                                        ) : (
                                                            bop.operation_time
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editingBopId === bop.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateBopTime(bop.id)}
                                                                    className="action-btn btn-save"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    onClick={() => { setEditingBopId(null); setEditingBopTime('') }}
                                                                    className="action-btn btn-cancel"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingBopId(bop.id)
                                                                        setEditingBopTime(bop.operation_time)
                                                                    }}
                                                                    className="action-btn btn-edit"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBopEntry(bop.id)}
                                                                    className="action-btn btn-delete"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No operations added yet</p>
                                )}

                                {/* Add Operation Form */}
                                <div className="bom-add-form">
                                    <h3>Add Operation</h3>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 2 }}>
                                            <label><strong>Machine:</strong></label>
                                            <select
                                                value={newBopEntry.machine_id}
                                                onChange={(e) => setNewBopEntry({ ...newBopEntry, machine_id: e.target.value })}
                                                className="inline-select"
                                            >
                                                <option value="">Select a machine...</option>
                                                {availableMachines.map(machine => (
                                                    <option key={machine.id} value={machine.id}>
                                                        {machine.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label><strong>Time (hrs):</strong></label>
                                            <input
                                                type="number"
                                                value={newBopEntry.operation_time}
                                                onChange={(e) => setNewBopEntry({ ...newBopEntry, operation_time: e.target.value })}
                                                className="inline-input"
                                                placeholder="Hours"
                                                step="0.1"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddBopEntry}
                                            className="action-btn btn-add"
                                            disabled={!newBopEntry.machine_id || !newBopEntry.operation_time}
                                        >
                                            Add Operation
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Procurement Details Section - Tab */}
            {product.type === 'purchased' && (
                <div style={{ marginTop: '3rem' }}>
                    <div className="tabs">
                        <button className="tab-btn active">
                            Procurement
                        </button>
                    </div>

                    <div className="bom-container">
                        <h2>Procurement Details</h2>

                        {isEditing ? (
                            <div className="detail-card" style={{ marginTop: '1rem', border: 'none', padding: 0 }}>
                                <div className="detail-row">
                                    <label><strong>On Hand (Stock):</strong></label>
                                    <input
                                        type="number"
                                        name="on_hand"
                                        value={editForm.on_hand}
                                        onChange={handleEditChange}
                                        className="inline-input"
                                        min="0"
                                    />
                                </div>
                                <div className="detail-row">
                                    <label><strong>Lead Time (Days):</strong></label>
                                    <input
                                        type="number"
                                        name="lead_time"
                                        value={editForm.lead_time || ''}
                                        onChange={handleEditChange}
                                        className="inline-input"
                                        min="0"
                                    />
                                </div>
                                <div className="detail-actions">
                                    <button onClick={handleUpdate} className="action-btn btn-save">Save Changes</button>
                                    <button onClick={() => setIsEditing(false)} className="action-btn btn-cancel">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="detail-card" style={{ marginTop: '1rem', border: 'none', padding: 0 }}>
                                <div className="detail-row">
                                    <strong>On Hand (Stock):</strong>
                                    <span>{product.on_hand} units</span>
                                </div>
                                <div className="detail-row">
                                    <strong>Lead Time:</strong>
                                    <span>{product.lead_time ? `${product.lead_time} days` : 'Not set'}</span>
                                </div>
                                <div className="detail-actions">
                                    <button onClick={() => setIsEditing(true)} className="action-btn btn-edit">Edit Procurement Data</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductDetail
