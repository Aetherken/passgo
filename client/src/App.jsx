import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Public/Landing";
import Auth from "./pages/Public/Auth";
import VerifyEmail from "./pages/Public/VerifyEmail";

import Dashboard from "./pages/Student/Dashboard";
import LiveTracking from "./pages/Student/LiveTracking";
import History from "./pages/Student/History";
import Support from "./pages/Student/Support";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import DriverDashboard from "./pages/Driver/DriverDashboard";


const Spinner = () => (
  <div style={{
    minHeight: '100vh',
    background: '#131718',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    letterSpacing: '2px'
  }}>
    LOADING...
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!role) return <Spinner />;

  // Enforce email verification for students
  if (role === 'student' && !user.is_verified) {
    return <Navigate to="/verify" replace />;
  }

  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
};

const RoleRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading || !role) return <Spinner />;
  if (!user) return <Navigate to="/auth" replace />;

  if (role === 'student' && !user.is_verified) {
    return <Navigate to="/verify" replace />;
  }

  if (role === "admin" || role === "superadmin") return <Navigate to="/admin" replace />;
  if (role === "driver") return <Navigate to="/driver" replace />;
  return <Navigate to="/dashboard" replace />;
};


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify" element={<VerifyEmail />} />

          <Route path="/redirect" element={<RoleRedirect />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["student", "admin", "superadmin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tracking"
            element={
              <ProtectedRoute roles={["student", "admin", "superadmin", "driver"]}>
                <LiveTracking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute roles={["student"]}>
                <History />
              </ProtectedRoute>
            }
          />

          <Route path="/support" element={<Support />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/driver"
            element={
              <ProtectedRoute roles={["driver", "admin", "superadmin"]}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
