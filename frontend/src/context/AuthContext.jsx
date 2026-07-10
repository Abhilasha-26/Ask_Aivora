import { createContext, useContext, useEffect, useState } from "react";
import api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // No token to look for in localStorage anymore - the browser already sent
  // the httpOnly auth cookie (if any) along with this request automatically.
  // We just ask the backend "who am I?" and let it validate the cookie.
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
  };

  const register = async (name, email, password, country) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      country,
    });
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
