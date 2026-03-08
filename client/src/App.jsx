import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing from "./pages/Public/Landing";
import Auth from "./pages/Public/Auth";

import Dashboard from "./pages/Student/Dashboard";
import LiveTracking from "./pages/Student/LiveTracking";
import History from "./pages/Student/History";
import Support from "./pages/Student/Support";

import AdminDashboard from "./pages/Admin/AdminDashboard";


const ProtectedRoute = ({ children, roles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!role) return null;
  if (roles && !roles.includes(role)) return <Navigate to="/dashboard" replace />;

  return children;
};

const RoleRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading || !role) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (role === "admin" || role === "superadmin") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
};


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* After login, go here and get redirected based on role */}
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
              <ProtectedRoute roles={["admin", "superadmin", "driver"]}>
                <AdminDashboard />
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