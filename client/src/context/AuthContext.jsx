import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires for the existing session too (INITIAL_SESSION event)
    // So we ONLY use this — no separate getSession() call to avoid double-firing
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user || null;
        setUser(sessionUser);

        if (sessionUser) {
          const metaRole = sessionUser.user_metadata?.role;
          if (metaRole) {
            setRole(metaRole);
            localStorage.setItem("role", metaRole);
          } else {
            const cached = localStorage.getItem("role");
            setRole(cached || null);
          }
        } else {
          setRole(null);
          localStorage.removeItem("role");
        }

        // Always stop loading after first event
        setLoading(false);
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
