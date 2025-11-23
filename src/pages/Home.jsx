import { Link } from 'react-router-dom'

function Home() {
    return (
        <div className="page-container">
            <h1>Dashboard</h1>
            <div className="dashboard-grid">
                <div className="card dashboard-card">
                    <h2>Machines</h2>
                    <p>Manage your industrial machines.</p>
                    <Link to="/machines" className="btn-primary">Go to Machines</Link>
                </div>
                <div className="card dashboard-card">
                    <h2>Products</h2>
                    <p>Manage your product inventory.</p>
                    <Link to="/products" className="btn-primary">Go to Products</Link>
                </div>
            </div>
        </div>
    )
}

export default Home
