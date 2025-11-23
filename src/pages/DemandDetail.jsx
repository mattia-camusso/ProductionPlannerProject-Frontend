import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function DemandDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { token } = useAuth()
    const [demand, setDemand] = useState(null)
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('details');
    const [plan, setPlan] = useState(null);
    const [planLoading, setPlanLoading] = useState(false);

    useEffect(() => {
        if (token && id) {
            fetchDemandDetails()
        }
    }, [token, id])

    useEffect(() => {
        if (activeTab === 'plan' && !plan) {
            fetchPlan();
        }
    }, [activeTab]);

    const fetchPlan = async () => {
        setPlanLoading(true);
        try {
            const response = await fetch('http://localhost:8000/planner/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to generate plan');

            const allPlans = await response.json();
            const myPlan = allPlans.find(p => p.demand_id === parseInt(id));
            setPlan(myPlan || { production_orders: [], purchase_orders: [] });

        } catch (err) {
            console.error("Error fetching plan:", err);
        } finally {
            setPlanLoading(false);
        }
    };

    const fetchDemandDetails = async () => {
        setLoading(true)
        try {
            // Fetch demand
            const demandRes = await fetch(`http://localhost:8000/demand/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!demandRes.ok) throw new Error('Failed to fetch demand details')
            const demandData = await demandRes.json()
            setDemand(demandData)
            setEditForm(demandData)

            // Fetch associated product
            const productRes = await fetch(`http://localhost:8000/products/${demandData.product_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (productRes.ok) {
                const productData = await productRes.json()
                setProduct(productData)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        try {
            const response = await fetch(`http://localhost:8000/demand/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...editForm,
                    quantity: parseFloat(editForm.quantity)
                })
            })

            if (response.ok) {
                const updatedDemand = await response.json()
                setDemand(updatedDemand)
                setIsEditing(false)
            } else {
                throw new Error('Failed to update demand')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this demand entry?')) return

        try {
            const response = await fetch(`http://localhost:8000/demand/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                navigate('/demand')
            } else {
                throw new Error('Failed to delete demand')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setEditForm(prev => ({ ...prev, [name]: value }))
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    if (loading) return <div className="page-container"><p>Loading...</p></div>
    if (error) return <div className="page-container"><p className="error-message">{error}</p></div>
    if (!demand) return <div className="page-container"><p>Demand not found</p></div>

    return (
        <div className="page-container">
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/demand" className="back-link">← Back to Demand List</Link>
            </div>

            <div className="detail-header">
                <h1>Demand #{demand.id}</h1>
                <div className="action-buttons">
                    {!isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(true)} className="action-btn btn-edit">Edit</button>
                            <button onClick={handleDelete} className="action-btn btn-delete">Delete</button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleUpdate} className="action-btn btn-save">Save Changes</button>
                            <button onClick={() => setIsEditing(false)} className="action-btn btn-cancel">Cancel</button>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e5e7eb', marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('details')}
                    style={{
                        padding: '0.75rem 1rem',
                        borderBottom: activeTab === 'details' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'details' ? '#2563eb' : '#6b7280',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottomWidth: '2px',
                        borderBottomStyle: 'solid'
                    }}
                >
                    Details
                </button>
                <button
                    onClick={() => setActiveTab('plan')}
                    style={{
                        padding: '0.75rem 1rem',
                        borderBottom: activeTab === 'plan' ? '2px solid #2563eb' : '2px solid transparent',
                        color: activeTab === 'plan' ? '#2563eb' : '#6b7280',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottomWidth: '2px',
                        borderBottomStyle: 'solid'
                    }}
                >
                    Production Plan
                </button>
            </div>

            {activeTab === 'details' ? (
                <div className="detail-card">
                    <div className="detail-section">
                        <h2>Details</h2>
                        {isEditing ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={editForm.quantity}
                                        onChange={handleChange}
                                        className="form-input"
                                        step="0.1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Need Date</label>
                                    <input
                                        type="date"
                                        name="need_date"
                                        value={editForm.need_date}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={editForm.status}
                                        onChange={handleChange}
                                        className="form-select"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="fulfilled">Fulfilled</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Status: </label>
                                    <span className={`status-badge ${demand.status}`}>
                                        {demand.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Quantity: </label>
                                    <span>{demand.quantity}</span>
                                </div>
                                <div className="info-item">
                                    <label>Need Date: </label>
                                    <span>{demand.need_date}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="detail-section">
                        <h2>Product Information</h2>
                        {product ? (
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Name: </label>
                                    <Link to={`/products/${product.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}>
                                        {product.name}
                                    </Link>
                                </div>
                                <div className="info-item">
                                    <label>Description: </label>
                                    <span>{product.description || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Type: </label>
                                    <span className={`type-badge ${product.type}`}>
                                        {product.type}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p>Product ID: {demand.product_id} (Details not available)</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="plan-section">
                    {planLoading ? (
                        <p>Generating Plan...</p>
                    ) : plan ? (
                        <>
                            <div className="detail-card" style={{ marginBottom: '2rem' }}>
                                <h3>Production Orders</h3>
                                {plan.production_orders && plan.production_orders.length > 0 ? (
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Machine</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.production_orders.map((order, index) => (
                                                    <tr key={index} style={order.is_delayed ? { backgroundColor: '#fee2e2' } : {}}>
                                                        <td style={{ fontWeight: 500 }}>{order.product_name}</td>
                                                        <td>{order.quantity}</td>
                                                        <td>{order.required_machine_name || '-'}</td>
                                                        <td>{formatDateTime(order.start_date)}</td>
                                                        <td>{formatDateTime(order.end_date)}</td>
                                                        <td>
                                                            {order.is_delayed ? (
                                                                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                                                    Delayed ({order.delay_days} days)
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#059669' }}>On Time</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p>No production orders.</p>}
                            </div>

                            <div className="detail-card">
                                <h3>Purchase Orders</h3>
                                {plan.purchase_orders && plan.purchase_orders.length > 0 ? (
                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Lead Time</th>
                                                    <th>Order Date</th>
                                                    <th>Available Date</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {plan.purchase_orders.map((order, index) => (
                                                    <tr key={index} style={order.is_delayed ? { backgroundColor: '#fee2e2' } : {}}>
                                                        <td style={{ fontWeight: 500 }}>{order.product_name}</td>
                                                        <td>{order.quantity}</td>
                                                        <td>{order.lead_time} days</td>
                                                        <td style={{ color: '#d97706', fontWeight: 500 }}>{formatDate(order.order_date)}</td>
                                                        <td>{formatDate(order.need_date)}</td>
                                                        <td>
                                                            {order.is_delayed ? (
                                                                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                                                                    Delayed ({order.delay_days} days)
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#059669' }}>On Time</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : <p>No purchase orders.</p>}
                            </div>
                        </>
                    ) : (
                        <p>No plan found for this demand. Try generating the plan in the Planner.</p>
                    )}
                </div>
            )}
        </div>
    )
}

export default DemandDetail
