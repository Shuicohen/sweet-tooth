import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import "./styles/main.css";

const App = () => {
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogin = (loggedInUser) => {
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    const removeFromCart = (index) => {
        setCartItems((prev) => prev.filter((_, i) => i !== index));
    };

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === product.id);
            const formattedProduct = {
                ...product,
                images: Array.isArray(product.images) ? product.images : [product.images],
            };

            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + formattedProduct.quantity }
                        : item
                );
            } else {
                return [...prevItems, formattedProduct];
            }
        });
    };

    return (
        <Router>
            <Header
                user={user}
                cartItems={cartItems}
                removeFromCart={removeFromCart}
                handleLogout={handleLogout}
            />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductPage addToCart={addToCart} />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route
                        path="/checkout"
                        element={
                            <ProtectedRoute>
                                <CheckoutPage
                                    cartItems={cartItems}
                                    removeFromCart={removeFromCart}
                                    user={user}
                                    setCartItems={setCartItems}
                                />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/my-orders" element={<MyOrdersPage user={user} />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );
};

export default App;
