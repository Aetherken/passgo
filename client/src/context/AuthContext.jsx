import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAndSetRole = async (userObj) => {
    if (!userObj) {
      setRole(null);
      localStorage.removeItem("role");
      return;
    }
    // Try localStorage first for speed, then verify from DB
    const cached = localStorage.getItem("role");
    if (cached) {
      setRole(cached);
    }
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("email", userObj.email)
      .single();

    if (profile?.role) {
      setRole(profile.role);
      localStorage.setItem("role", profile.role);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUser(sessionUser);
      await fetchAndSetRole(sessionUser); // ← wait for role before loading=false
      setLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user || null;
        setUser(sessionUser);
        await fetchAndSetRole(sessionUser);
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