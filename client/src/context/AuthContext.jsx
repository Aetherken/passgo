import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = (session) => {
    const sessionUser = session?.user || null;
    setUser(sessionUser);

    if (sessionUser) {
      // Role comes free from the JWT — no DB query needed
      const metaRole = sessionUser.user_metadata?.role;
      if (metaRole) {
        setRole(metaRole);
        localStorage.setItem("role", metaRole);
      } else {
        // Fallback to cache (for existing sessions before metadata was set)
        const cached = localStorage.getItem("role");
        if (cached) setRole(cached);
      }
    } else {
      setRole(null);
      localStorage.removeItem("role");
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      applySession(data?.session);
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        applySession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, setRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
