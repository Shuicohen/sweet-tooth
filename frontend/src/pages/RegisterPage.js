import React, { useState } from "react";
import { Link } from "react-router-dom";
import './RegisterPage.css';


const RegisterPage = ({ onRegister }) => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                }),
            });
    
            if (response.ok) {
                const userData = await response.json();
                onRegister(userData);
            } else {
                const error = await response.json();
                alert(error.message || "Error registering user");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };
    

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                }
            />
            <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
                type="password"
                placeholder="Password"
                autoComplete="new-password" // Suggested fix
                value={formData.password}
                onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                }
            />
            <p>
                Already have an account? <Link to="/login">Login</Link>.
            </p>
            <button type="submit">Register</button>
        </form>
    );
};

export default RegisterPage;
