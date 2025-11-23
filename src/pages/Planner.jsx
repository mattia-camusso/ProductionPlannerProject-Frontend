import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'

function Planner() {
    const { token } = useAuth()
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedDemandId, setSelectedDemandId] = useState('full');
    const [lastGenerated, setLastGenerated] = useState(null);
    const [activeTab, setActiveTab] = useState('production'); // NEW: Tab state

    // Fetch current saved plan on component mount
    useEffect(() => {
        fetchCurrentPlan();
    }, [token]);

    const fetchCurrentPlan = async () => {
        if (!token) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/planner/current', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch current plan');
            }

            const data = await response.json();
            setPlans(data);
            setLastGenerated(new Date());

            // Default to Full Plan if data exists
            if (data.length > 0) {
                setSelectedDemandId('full');
            }
        } catch (err) {
            console.error("Error fetching current plan:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generatePlan = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/planner/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error generating plan');
            }

            const data = await response.json();
            setPlans(data);
            setLastGenerated(new Date());
            // Default to Full Plan if data exists
            if (data.length > 0) {
                setSelectedDemandId('full');
            }
        } catch (err) {
            console.error("Planner error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        let stringDate = new Date(dateString).toLocaleString();
        stringDate = stringDate.substring(0, stringDate.length - 3);
        return stringDate;
    };

    // Calculate Full Plan
    const fullPlan = {
        product_name: 'Full Production Plan',
        quantity: '-',
        due_date: null,
        is_delayed: plans.some(p => p.is_delayed),
        delay_days: Math.max(...plans.map(p => p.delay_days), 0),
        production_orders: plans.flatMap(p => p.production_orders).sort((a, b) => new Date(a.start_date) - new Date(b.start_date)),
        purchase_orders: plans.flatMap(p => p.purchase_orders).sort((a, b) => new Date(a.order_date) - new Date(b.order_date))
    };

    const selectedPlan = selectedDemandId === 'full' ? fullPlan : plans.find(p => p.demand_id === selectedDemandId);

    return (
        <div className="page-container">
            <div className="header-section">
                <h1>Production Planner</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {lastGenerated && (
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            Last generated: {lastGenerated.toLocaleString()}
                        </span>
                    )}
                    <button
                        className="btn-primary"
                        onClick={generatePlan}
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate Plan'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem' }}>
                    {error}
                </div>
            )}

            {plans.length > 0 && (
                <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                    {/* Sidebar / Tabs */}
                    <div style={{ width: '250px', flexShrink: 0 }}>
                        <h3 style={{ marginBottom: '1rem', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>
                            Views
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <button
                                onClick={() => setSelectedDemandId('full')}
                                style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    backgroundColor: selectedDemandId === 'full' ? '#fff' : '#f3f4f6',
                                    border: selectedDemandId === 'full' ? '1px solid #e5e7eb' : '1px solid transparent',
                                    borderLeft: selectedDemandId === 'full' ? '4px solid #7c3aed' : '4px solid transparent',
                                    borderRadius: '0.375rem',
                                    cursor: 'pointer',
                                    boxShadow: selectedDemandId === 'full' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    Full Plan
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    All Demands Aggregated
                                </div>
                            </button>
                        </div>

                        <h3 style={{ marginBottom: '1rem', color: '#6b7280', textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600 }}>
                            Demands
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {plans.map(plan => (
                                <button
                                    key={plan.demand_id}
                                    onClick={() => setSelectedDemandId(plan.demand_id)}
                                    style={{
                                        padding: '1rem',
                                        textAlign: 'left',
                                        backgroundColor: selectedDemandId === plan.demand_id ? '#fff' : '#f3f4f6',
                                        border: selectedDemandId === plan.demand_id ? '1px solid #e5e7eb' : '1px solid transparent',
                                        borderLeft: selectedDemandId === plan.demand_id ? '4px solid #2563eb' : '4px solid transparent',
                                        borderRadius: '0.375rem',
                                        cursor: 'pointer',
                                        boxShadow: selectedDemandId === plan.demand_id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {plan.product_name}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Qty: {plan.quantity}</span>
                                        <span>Due: {formatDate(plan.due_date)}</span>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        {plan.is_delayed ? (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                backgroundColor: '#fee2e2',
                                                color: '#dc2626',
                                                padding: '0.125rem 0.375rem',
                                                borderRadius: '9999px',
                                                fontWeight: 500
                                            }}>
                                                Delayed ({plan.delay_days}d)
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.75rem',
                                                backgroundColor: '#d1fae5',
                                                color: '#059669',
                                                padding: '0.125rem 0.375rem',
                                                borderRadius: '9999px',
                                                fontWeight: 500
                                            }}>
                                                On Time
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div style={{ flex: 1 }}>
                        {selectedPlan ? (
                            <>
                                {/* Tabs - Similar to ProductDetail */}
                                <div className="tabs" style={{ marginBottom: '1.5rem' }}>
                                    <button
                                        className={`tab-btn ${activeTab === 'production' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('production')}
                                    >
                                        Production Orders
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            backgroundColor: activeTab === 'production' ? '#2563eb' : '#d1d5db',
                                            color: activeTab === 'production' ? '#fff' : '#4b5563',
                                            borderRadius: '9999px',
                                            padding: '0.125rem 0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {selectedPlan.production_orders.length}
                                        </span>
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'purchase' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('purchase')}
                                    >
                                        Purchase Orders
                                        <span style={{
                                            marginLeft: '0.5rem',
                                            backgroundColor: activeTab === 'purchase' ? '#2563eb' : '#d1d5db',
                                            color: activeTab === 'purchase' ? '#fff' : '#4b5563',
                                            borderRadius: '9999px',
                                            padding: '0.125rem 0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {selectedPlan.purchase_orders.length}
                                        </span>
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="detail-card">
                                    {activeTab === 'production' ? (
                                        <>
                                            <h2 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                                Production Orders
                                            </h2>
                                            {selectedPlan.production_orders.length > 0 ? (
                                                <div className="table-container">
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Parent Product</th>
                                                                <th>Product</th>
                                                                <th>Quantity</th>
                                                                <th>Machine</th>
                                                                <th>Start Date</th>
                                                                <th>End Date</th>
                                                                <th>Duration</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedPlan.production_orders.map((order, index) => (
                                                                <tr key={index} style={order.is_delayed ? { backgroundColor: '#fee2e2' } : {}}>
                                                                    <td style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                                                        {order.parent_product_name ? (
                                                                            <span>{order.parent_product_name}</span>
                                                                        ) : (
                                                                            <span style={{ fontStyle: 'italic' }}>-</span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ fontWeight: 500 }}>{order.product_name}</td>
                                                                    <td>{order.quantity}</td>
                                                                    <td>{order.required_machine_name || '-'}</td>
                                                                    <td>{formatDateTime(order.start_date)}</td>
                                                                    <td>{formatDateTime(order.end_date)}</td>
                                                                    <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>{order.duration_days}</td>
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
                                            ) : (
                                                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No production orders required for this demand.</p>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                                                Purchase Orders
                                            </h2>
                                            {selectedPlan.purchase_orders.length > 0 ? (
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
                                                            {selectedPlan.purchase_orders.map((order, index) => (
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
                                            ) : (
                                                <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No purchase orders required for this demand.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                                Select a demand to view details
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Planner
