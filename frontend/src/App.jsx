import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'

// Lazy load pages
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Residents = lazy(() => import('./pages/Residents'))
const Complaints = lazy(() => import('./pages/Complaints'))
const Payments = lazy(() => import('./pages/Payments'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const Society = lazy(() => import('./pages/Society'))

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 gap-3">
    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-emerald-200">
      <span className="text-white font-bold text-lg">P</span>
    </div>
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-200 border-t-emerald-600" />
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingFallback />
  return user ? children : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }) => {
  const { user } = useAuth()
  return user?.role === 'admin' ? children : <Navigate to="/" replace />
}

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <Suspense fallback={<LoadingFallback />}>
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
    </Suspense>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}

