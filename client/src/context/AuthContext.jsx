import { createContext, useContext, useState } from "react";
import apiRequest from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    catch {
      return null;
    }
  });

  const saveAuth = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (formData) => {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: formData
    });
    saveAuth(data);
    return data;
  };

  const login = async (formData) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: formData
    });
    saveAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: Boolean(token && user), register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};