import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import ConfirmationModal from '../components/ConfirmationModal'

function Products() {
    const { token } = useAuth()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Inline creation state
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        part_class: '',
        type: 'manufactured'
    })

    // Inline editing state
    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({})
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null, name: null })

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('http://localhost:8000/products/', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setProducts(data)
            } else {
                throw new Error('Failed to fetch products')
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [token])

    useEffect(() => {
        if (token) {
            fetchProducts()
        }
    }, [token, fetchProducts])

    const handleCreateChange = (e) => {
        const { name, value } = e.target
        setNewProduct(prev => ({ ...prev, [name]: value }))
    }

    const handleCreate = async () => {
        if (!newProduct.name || !newProduct.price) return

        try {
            const response = await fetch('http://localhost:8000/products/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newProduct,
                    price: parseFloat(newProduct.price)
                })
            })

            if (response.ok) {
                fetchProducts()
                setNewProduct({
                    name: '',
                    description: '',
                    price: '',
                    part_class: '',
                    type: 'manufactured'
                })
            } else {
                throw new Error('Failed to create product')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const startEditing = (product) => {
        setEditingId(product.id)
        setEditForm({
            name: product.name,
            description: product.description || '',
            price: product.price,
            part_class: product.part_class || '',
            type: product.type
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
                fetchProducts()
                setEditingId(null)
            } else {
                throw new Error('Failed to update product')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDeleteClick = (product) => {
        setDeleteConfirmation({
            isOpen: true,
            id: product.id,
            name: product.name
        })
    }

    const confirmDelete = async () => {
        if (!deleteConfirmation.isOpen) return

        try {
            const response = await fetch(`http://localhost:8000/products/${deleteConfirmation.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                fetchProducts()
                setDeleteConfirmation({ isOpen: false, id: null, name: null })
            } else {
                throw new Error('Failed to delete product')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="page-container">
            <h1>Products Management</h1>
            {error && <p className="error-message">{error}</p>}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Class</th>
                            <th>Type</th>
                            <th>Price</th>
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
                                    placeholder="New Product Name"
                                    value={newProduct.name}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="description"
                                    placeholder="Description"
                                    value={newProduct.description}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <input
                                    type="text"
                                    name="part_class"
                                    placeholder="Class"
                                    value={newProduct.part_class}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                />
                            </td>
                            <td>
                                <select
                                    name="type"
                                    value={newProduct.type}
                                    onChange={handleCreateChange}
                                    className="inline-select"
                                >
                                    <option value="manufactured">Manufactured</option>
                                    <option value="purchased">Purchased</option>
                                </select>
                            </td>
                            <td>
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="Price"
                                    value={newProduct.price}
                                    onChange={handleCreateChange}
                                    className="inline-input"
                                    step="0.01"
                                />
                            </td>
                            <td>
                                <button onClick={handleCreate} className="action-btn btn-add">
                                    Add Product
                                </button>
                            </td>
                        </tr>

                        {/* Data Rows */}
                        {loading ? (
                            <tr><td colSpan="6">Loading...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan="6">No products found</td></tr>
                        ) : (
                            products.map(product => (
                                <tr key={product.id}>
                                    {editingId === product.id ? (
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
                                                    type="text"
                                                    name="part_class"
                                                    value={editForm.part_class}
                                                    onChange={handleEditChange}
                                                    className="inline-input"
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    name="type"
                                                    value={editForm.type}
                                                    onChange={handleEditChange}
                                                    className="inline-select"
                                                >
                                                    <option value="manufactured">Manufactured</option>
                                                    <option value="purchased">Purchased</option>
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    name="price"
                                                    value={editForm.price}
                                                    onChange={handleEditChange}
                                                    className="inline-input"
                                                    step="0.01"
                                                />
                                            </td>
                                            <td>
                                                <button onClick={() => handleUpdate(product.id)} className="action-btn btn-save">Save</button>
                                                <button onClick={cancelEditing} className="action-btn btn-cancel">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{product.name}</td>
                                            <td>{product.description}</td>
                                            <td>{product.part_class}</td>
                                            <td>
                                                <span className={`type-badge ${product.type}`}>
                                                    {product.type}
                                                </span>
                                            </td>
                                            <td>${product.price}</td>
                                            <td>
                                                <Link to={`/products/${product.id}`} className="action-btn" style={{ textDecoration: 'none', marginRight: '0.5rem' }}>
                                                    View
                                                </Link>
                                                <button onClick={() => startEditing(product)} className="action-btn btn-edit">Edit</button>
                                                <button onClick={() => handleDeleteClick(product)} className="action-btn btn-delete">Delete</button>
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
                title="Delete Product"
                message={`Are you sure you want to delete ${deleteConfirmation.name}?`}
                confirmText="Delete"
                isDanger={true}
            />
        </div>
    )
}

export default Products
