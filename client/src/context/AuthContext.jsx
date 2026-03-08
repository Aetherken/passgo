import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveRole = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      setRole(null);
      localStorage.removeItem("role");
      setLoading(false);
      return;
    }

    setUser(sessionUser);

    // 1. Try user_metadata first (instant, no network)
    const metaRole = sessionUser.user_metadata?.role;
    if (metaRole) {
      setRole(metaRole);
      localStorage.setItem("role", metaRole);
      setLoading(false);
      return;
    }

    // 2. Try localStorage cache
    const cached = localStorage.getItem("role");
    if (cached) {
      setRole(cached);
      setLoading(false);
      return;
    }

    // 3. Fallback: fetch from DB (for users without metadata role set)
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("email", sessionUser.email)
        .single();

      const dbRole = profile?.role || "student";
      setRole(dbRole);
      localStorage.setItem("role", dbRole);
    } catch (err) {
      console.error("Role fetch failed:", err.message);
      setRole("student"); // safe default
      localStorage.setItem("role", "student");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Clear cache on fresh sign-in so role is re-fetched
        if (_event === "SIGNED_IN") {
          localStorage.removeItem("role");
        }
        resolveRole(session?.user || null);
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
