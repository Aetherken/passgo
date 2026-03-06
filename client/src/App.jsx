import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Public/Landing';
import Auth from './pages/Public/Auth';
import Dashboard from './pages/Student/Dashboard';
import LiveTracking from './pages/Student/LiveTracking';
import History from './pages/Student/History';
import Support from './pages/Student/Support';
import AdminDashboard from './pages/Admin/AdminDashboard';

const ProtectedRoute = ({ children, roles }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/auth" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute roles={['student']}>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/tracking" element={
                        <ProtectedRoute roles={['student', 'admin', 'superadmin', 'driver']}>
                            <LiveTracking />
                        </ProtectedRoute>
                    } />
                    <Route path="/history" element={
                        <ProtectedRoute roles={['student']}>
                            <History />
                        </ProtectedRoute>
                    } />
                    <Route path="/support" element={<Support />} />
                    <Route path="/admin" element={
                        <ProtectedRoute roles={['admin', 'superadmin', 'driver']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
