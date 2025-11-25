import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './AuthContext'
import AuthForm from './components/AuthForm'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Machines from './pages/Machines'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Demand from './pages/Demand'
import DemandDetail from './pages/DemandDetail'
import Planner from './pages/Planner'
import Dashboard from './pages/Dashboard'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/machines" element={
            <ProtectedRoute>
              <Machines />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          } />
          <Route path="/demand" element={
            <ProtectedRoute>
              <Demand />
            </ProtectedRoute>
          } />
          <Route path="/demand/:id" element={
            <ProtectedRoute>
              <DemandDetail />
            </ProtectedRoute>
          } />
          <Route path="/planner" element={
            <ProtectedRoute>
              <Planner />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
