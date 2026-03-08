import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

        setLoading(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("role");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
