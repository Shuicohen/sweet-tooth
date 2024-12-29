import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext"; // Import UserContext
import "./CheckoutPage.css";

const CheckoutPage = ({ cartItems, setCartItems }) => {
    const { user } = useUser(); // Access user from context
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Props in CheckoutPage:", { cartItems, user });
        if (!user || !user.token) {
            navigate("/login", { replace: true }); // Redirect unauthenticated users
        }
    }, [user, navigate]);

    const handleConfirmPurchase = async () => {
        if (!user || !user.token) {
            alert("You need to log in to confirm your purchase.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("https://sweet-tooth-lqt1.onrender.com/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`, // Use token from context
                },
                body: JSON.stringify({ userId: user.id, cartItems }),
            });

            if (response.ok) {
                alert("Order confirmed! Check your email for details.");

                // Clear the cart
                setCartItems([]);

                // Navigate to the orders page
                navigate("/my-orders");
            } else {
                const error = await response.json();
                alert(error.message || "Error confirming purchase.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to confirm purchase.");
        } finally {
            setLoading(false);
        }
    };

    const totalPrice = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    return (
        <div className="checkout-page">
            <h1>Checkout</h1>
            <div className="checkout-items">
                {cartItems.map((item, index) => (
                    <div key={index} className="checkout-item">
                        <img src={item.images} alt={item.name} />
                        <div>
                            <h4>{item.name}</h4>
                            <p>Price: R{item.price}</p>
                            <p>Quantity: {item.quantity}</p>
                            <p>Total: R{item.price * item.quantity}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="checkout-summary">
                <h2>Total: R{totalPrice.toFixed(2)}</h2>
                <button
                    className="checkout-confirm-btn"
                    onClick={handleConfirmPurchase}
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Confirm Purchase"}
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
