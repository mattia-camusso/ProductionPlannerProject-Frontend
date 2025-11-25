import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function Navbar() {
    const { user, logout } = useAuth()

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">Dashboard</Link>
            </div>
            <div className="navbar-menu">
                <Link to="/dashboard" className="navbar-item">Dashboard</Link>
                <Link to="/" className="navbar-item">Home</Link>
                <Link to="/machines" className="navbar-item">Machines</Link>
                <Link to="/products" className="navbar-item">Products</Link>
                <Link to="/demand" className="navbar-item">Demand</Link>
                <Link to="/planner" className="navbar-item">Planner</Link>
            </div>
            <div className="navbar-end">
                <span className="user-email">{user?.email}</span>
                <button onClick={logout} className="logout-btn">Logout</button>
            </div>
        </nav>
    )
}

export default Navbar
