import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Residents from './pages/Residents'
import Complaints from './pages/Complaints'
import Payments from './pages/Payments'
import Notifications from './pages/Notifications'
import Chatbot from './pages/Chatbot'
import Society from './pages/Society'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 gap-3">
      <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-emerald-200">
        <span className="text-white font-bold text-lg">P</span>
      </div>
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-200 border-t-emerald-600" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="residents" element={<AdminRoute><Residents /></AdminRoute>} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="payments" element={<Payments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="society" element={<AdminRoute><Society /></AdminRoute>} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
