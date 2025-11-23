import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import TreeView from '../components/TreeView'
import ConfirmationModal from '../components/ConfirmationModal'

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
    const [bomTree, setBomTree] = useState(null)  // Tree structure
    const [allProducts, setAllProducts] = useState([])
    const [newBomEntry, setNewBomEntry] = useState({ component_product_id: '', quantity: '' })
    const [editingBomId, setEditingBomId] = useState(null)
    const [editingBomQuantity, setEditingBomQuantity] = useState('')
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, id: null, name: null }) // Unified delete state

    // BOP state
    const [bopEntries, setBopEntries] = useState([])
    const [allMachines, setAllMachines] = useState([])
    const [machineClasses, setMachineClasses] = useState([])
    const [newBopEntry, setNewBopEntry] = useState({ machine_class: '', operation_time: '' })
    const [editingBopId, setEditingBopId] = useState(null)
    const [editingBopTime, setEditingBopTime] = useState('')
    const [draggedBopId, setDraggedBopId] = useState(null)

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
                    fetchBOMTree()  // NEW: Also fetch tree structure
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
                // Extract unique machine classes
                const classes = [...new Set(data.map(m => m.machine_class).filter(Boolean))]
                setMachineClasses(classes)
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

    const fetchBOMTree = async () => {
        try {
            const response = await fetch(`http://localhost:8000/bom/products/${id}/bom/tree`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setBomTree(data)
            }
        } catch (err) {
            console.error('Failed to fetch BOM tree:', err)
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
                fetchBOMTree() // Refresh tree view
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
                fetchBOMTree() // Refresh tree view
                setEditingBomId(null)
                setEditingBomQuantity('')
            } else {
                throw new Error('Failed to update BOM entry')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteBomClick = (bomId, componentName) => {
        setDeleteConfirmation({
            isOpen: true,
            type: 'bom',
            id: bomId,
            name: componentName,
            title: 'Confirm Removal',
            message: `Are you sure you want to remove ${componentName} from the Bill of Materials?`
        })
    }

    const confirmDelete = async () => {
        if (!deleteConfirmation.isOpen) return

        try {
            let url = ''
            let successCallback = null

            if (deleteConfirmation.type === 'bom') {
                url = `http://localhost:8000/bom/${deleteConfirmation.id}`
                successCallback = () => {
                    fetchBOM()
                    fetchBOMTree()
                }
            } else if (deleteConfirmation.type === 'bop') {
                url = `http://localhost:8000/bop/${deleteConfirmation.id}`
                successCallback = fetchBOP
            } else if (deleteConfirmation.type === 'product') {
                url = `http://localhost:8000/products/${deleteConfirmation.id}`
                successCallback = () => navigate('/products')
            }

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                if (successCallback) successCallback()
                setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null })
            } else {
                throw new Error('Failed to delete item')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    // BOP Handlers
    const handleAddBopEntry = async () => {
        if (!newBopEntry.machine_class || !newBopEntry.operation_time) return

        try {
            const response = await fetch(`http://localhost:8000/bop/products/${id}/bop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    machine_class: newBopEntry.machine_class,
                    operation_time: parseFloat(newBopEntry.operation_time)
                })
            })

            if (response.ok) {
                fetchBOP()
                setNewBopEntry({ machine_class: '', operation_time: '' })
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

    const handleDeleteBopEntry = (bopId) => {
        setDeleteConfirmation({
            isOpen: true,
            type: 'bop',
            id: bopId,
            name: 'this operation',
            title: 'Remove Operation',
            message: 'Remove this operation from the BOP?'
        })
    }

    // Drag and Drop Handlers for BOP Reordering
    const handleDragStart = (e, bopId) => {
        setDraggedBopId(bopId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e, targetBopId) => {
        e.preventDefault()

        if (!draggedBopId || draggedBopId === targetBopId) {
            setDraggedBopId(null)
            return
        }

        // Find positions
        const draggedIndex = bopEntries.findIndex(b => b.id === draggedBopId)
        const targetIndex = bopEntries.findIndex(b => b.id === targetBopId)

        if (draggedIndex === -1 || targetIndex === -1) return

        // Reorder array
        const newBopEntries = [...bopEntries]
        const [draggedItem] = newBopEntries.splice(draggedIndex, 1)
        newBopEntries.splice(targetIndex, 0, draggedItem)

        // Update operation_order for all entries
        const reorderItems = newBopEntries.map((bop, index) => ({
            bop_id: bop.id,
            operation_order: index + 1
        }))

        // Optimistically update UI
        setBopEntries(newBopEntries)
        setDraggedBopId(null)

        // Send update to backend
        try {
            const response = await fetch(`http://localhost:8000/bop/products/${id}/bop/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reorderItems)
            })

            if (!response.ok) {
                throw new Error('Failed to reorder operations')
            }

            // Refresh to ensure consistency
            await fetchBOP()
        } catch (err) {
            setError(err.message)
            // Revert on error
            fetchBOP()
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

    const handleDeleteProduct = () => {
        setDeleteConfirmation({
            isOpen: true,
            type: 'product',
            id: product.id,
            name: product.name,
            title: 'Delete Product',
            message: `Are you sure you want to delete ${product.name}?`,
            isDanger: true
        })
    }

    // Filter available products for BOM (exclude self and already added components)
    const availableProducts = allProducts.filter(p =>
        p.id !== parseInt(id) &&
        !bomEntries.some(bom => bom.component_product_id === p.id)
    )

    // Filter available machine classes for BOP (exclude already added classes)
    const availableMachineClasses = machineClasses.filter(mc =>
        !bopEntries.some(bop => bop.machine_class === mc)
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

                                {/* Unified Tree View with Editing */}
                                {bomTree && bomTree.components && bomTree.components.length > 0 ? (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <TreeView
                                            data={bomTree.components}
                                            getNodeId={(node) => `bom-${node.component_id}`}
                                            getChildren={(node) => node.children || []}
                                            renderNode={(node, level, hasChildren, isExpanded) => {
                                                // Find corresponding BOM entry for first-level materials (for editing)
                                                const bomEntry = level === 0
                                                    ? bomEntries.find(b => b.component_product_id === node.component_id)
                                                    : null;
                                                const isEditing = bomEntry && editingBomId === bomEntry.id;

                                                return (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '8px 0',
                                                        gap: '12px'
                                                    }}>
                                                        <span style={{
                                                            fontWeight: level === 0 ? 'bold' : 'normal',
                                                            flex: '1'
                                                        }}>
                                                            {node.component_name}
                                                        </span>

                                                        {/* Quantity - Editable for first level only */}
                                                        {level === 0 && isEditing ? (
                                                            <input
                                                                type="number"
                                                                value={editingBomQuantity}
                                                                onChange={(e) => setEditingBomQuantity(e.target.value)}
                                                                className="inline-input"
                                                                style={{ width: '100px' }}
                                                                step="0.1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        ) : (
                                                            <span style={{
                                                                color: '#666',
                                                                minWidth: '80px'
                                                            }}>
                                                                Qty: {node.quantity}
                                                            </span>
                                                        )}

                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            color: node.type === 'manufactured' ? '#2563eb' : '#059669',
                                                            backgroundColor: node.type === 'manufactured' ? '#dbeafe' : '#d1fae5',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            minWidth: '100px',
                                                            textAlign: 'center'
                                                        }}>
                                                            {node.type}
                                                        </span>

                                                        {/* Actions - Only for first level */}
                                                        {level === 0 && bomEntry ? (
                                                            isEditing ? (
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleUpdateBomQuantity(bomEntry.id);
                                                                        }}
                                                                        className="action-btn btn-save"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingBomId(null);
                                                                            setEditingBomQuantity('');
                                                                        }}
                                                                        className="action-btn btn-cancel"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <Link
                                                                        to={`/products/${node.component_id}`}
                                                                        className="action-btn"
                                                                        style={{ textDecoration: 'none', fontSize: '0.85rem' }}
                                                                    >
                                                                        View
                                                                    </Link>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingBomId(bomEntry.id);
                                                                            setEditingBomQuantity(bomEntry.quantity);
                                                                        }}
                                                                        className="action-btn btn-edit"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            e.stopPropagation();
                                                                            handleDeleteBomClick(bomEntry.id, node.component_name);
                                                                        }}
                                                                        className="action-btn btn-delete"
                                                                        style={{ fontSize: '0.85rem' }}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            )
                                                        ) : (
                                                            /* View link for nested materials */
                                                            <Link
                                                                to={`/products/${node.component_id}`}
                                                                className="action-btn"
                                                                style={{ textDecoration: 'none', fontSize: '0.85rem' }}
                                                            >
                                                                View
                                                            </Link>
                                                        )}
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>
                                ) : bomEntries.length > 0 ? (
                                    <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '2rem' }}>Loading tree structure...</p>
                                ) : (
                                    <p style={{ color: '#6b7280', fontStyle: 'italic', marginBottom: '2rem' }}>No components added yet</p>
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
                                <p style={{ color: '#6c757d', marginBottom: '1rem' }}>Drag rows to reorder operations</p>
                                {bopEntries.length > 0 ? (
                                    <table className="bom-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '60px' }}>Order</th>
                                                <th>Machine Class</th>
                                                <th>Available Machines</th>
                                                <th>Operation Time (hrs)</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bopEntries.map((bop, index) => (
                                                <tr
                                                    key={bop.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, bop.id)}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, bop.id)}
                                                    style={{
                                                        cursor: 'move',
                                                        opacity: draggedBopId === bop.id ? 0.5 : 1,
                                                        backgroundColor: draggedBopId === bop.id ? '#f0f0f0' : 'transparent'
                                                    }}
                                                >
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#3b82f6' }}>
                                                        <span style={{ fontSize: '1.2rem' }}>{bop.operation_order || index + 1}</span>
                                                        {index < bopEntries.length - 1 && (
                                                            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>↓</div>
                                                        )}
                                                    </td>
                                                    <td><strong>{bop.machine_class}</strong></td>
                                                    <td>
                                                        {bop.available_machines && bop.available_machines.length > 0 ? (
                                                            <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                                                {bop.available_machines.map(m => m.name).join(', ')}
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '0.9rem', color: '#ef4444' }}>No machines available</span>
                                                        )}
                                                    </td>
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
                                            <label><strong>Machine Class:</strong></label>
                                            <select
                                                value={newBopEntry.machine_class}
                                                onChange={(e) => setNewBopEntry({ ...newBopEntry, machine_class: e.target.value })}
                                                className="inline-select"
                                            >
                                                <option value="">Select a machine class...</option>
                                                {availableMachineClasses.map(mc => (
                                                    <option key={mc} value={mc}>
                                                        {mc} ({allMachines.filter(m => m.machine_class === mc).length} machines)
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
                                            disabled={!newBopEntry.machine_class || !newBopEntry.operation_time}
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
                                    <label><strong>Lead Time:</strong></label>
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
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, name: null })}
                onConfirm={confirmDelete}
                title={deleteConfirmation.title}
                message={deleteConfirmation.message}
                confirmText="Remove"
                isDanger={true}
            />
        </div>
    )
}

export default ProductDetail
