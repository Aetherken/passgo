import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("passgo_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem("role") || user?.role || null;
  });

  const [loading, setLoading] = useState(true);

  const setAuthUser = (userObj) => {
    if (userObj) {
      setUser(userObj);
      setRole(userObj.role);
      localStorage.setItem("role", userObj.role);
      localStorage.setItem("passgo_user", JSON.stringify(userObj));
    }
  };

  const checkAuth = async (initialUser = null) => {
    if (initialUser) {
      setAuthUser(initialUser);
      setLoading(false);
      return initialUser;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        setAuthUser(response.data.user);
        return response.data.user;
      }
    } catch (err) {
      // If auth check fails and we have no valid local user, clear
      const currentSaved = localStorage.getItem("passgo_user");
      if (!currentSaved) {
        setUser(null);
        setRole(null);
        localStorage.removeItem("role");
        localStorage.removeItem("passgo_user");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem("role");
      localStorage.removeItem("passgo_user");
      setUser(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, loading, logout, checkAuth, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
