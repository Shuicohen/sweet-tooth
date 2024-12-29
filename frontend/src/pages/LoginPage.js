import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../UserContext";

const LoginPage = () => {
    const { login } = useUser();
    const [formData, setFormData] = useState({ identifier: "", password: "" });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const { user, token } = await response.json();
                login(user, token); // Save user and token in context
                navigate("/");
            } else {
                const error = await response.json();
                alert(error.message || "Login failed");
            }
        } catch (err) {
            alert("An error occurred during login.");
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username or Email"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <p>
                    Don't have an account? <Link to="/register">Register</Link>.
                </p>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginPage;
