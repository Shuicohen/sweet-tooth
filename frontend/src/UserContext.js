import React, { createContext, useState, useContext, useEffect } from "react";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = (userData, token) => {
        const userWithToken = { ...userData, token };
        setUser(userWithToken); // Save user and token
        localStorage.setItem("user", JSON.stringify(userWithToken));
        localStorage.setItem("token", token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const response = await fetch("https://sweet-tooth-lqt1.onrender.com/verify-token", {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUser({ ...userData, token });
                    } else {
                        logout(); // Token is invalid
                    }
                } catch {
                    logout();
                }
            }
        };

        verifyToken();
    }, []);

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};
