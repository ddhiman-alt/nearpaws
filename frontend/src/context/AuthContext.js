import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const response = await authAPI.getMe();
                const userData = response.data.data;
                // Normalize user object to always have 'id' field as string
                const rawId = userData._id || userData.id;
                const id =
                    typeof rawId === "string"
                        ? rawId
                        : rawId?.toString?.() || String(rawId);
                setUser({
                    ...userData,
                    id: id,
                });
            } catch (err) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || "Login failed";
            setError(message);
            return { success: false, message };
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.register(userData);
            const { token, user } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);
            return { success: true };
        } catch (err) {
            const message =
                err.response?.data?.message || "Registration failed";
            setError(message);
            return { success: false, message };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

    const updateUser = async (userData) => {
        try {
            const response = await authAPI.updateProfile(userData);
            setUser(response.data.data);
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || "Update failed";
            return { success: false, message };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                register,
                logout,
                updateUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
