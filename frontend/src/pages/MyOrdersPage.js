import React, { useEffect, useState } from "react";
import api from "../api/api";
import "./MyOrdersPage.css";

const MyOrdersPage = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;

        const fetchOrders = async () => {
            try {
                const response = await api.get(`/orders/${user.id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                });

                setOrders(response.data);
            } catch (err) {
                console.error("Error fetching orders:", err);
                setError("Failed to fetch orders. Please try again later.");
            }
        };

        fetchOrders();
    }, [user]);

    if (!user) {
        return <p>You must be logged in to view your orders.</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (orders.length === 0) {
        return <p className="no-orders">You have no orders.</p>;
    }

    // Group orders by date and time
    const groupedOrders = orders.reduce((groups, order) => {
        const orderDate = new Date(order.created_at).toLocaleDateString(); // Group by date only
        const key = `${new Date(order.created_at).toLocaleString()}`; // Group by full date and time

        if (!groups[orderDate]) {
            groups[orderDate] = [];
        }

        if (!groups[orderDate][key]) {
            groups[orderDate][key] = {
                dateTime: new Date(order.created_at).toLocaleString(), // Full date and time
                status: order.status === "pending" ? "Pending" : "Completed",
                total: 0,
                orders: [],
            };
        }

        groups[orderDate][key].orders.push(order);
        groups[orderDate][key].total += parseFloat(order.total_price); // Accumulate total price
        return groups;
    }, {});

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedOrders).sort(
        (a, b) => new Date(b) - new Date(a)
    );

    return (
        <div className="my-orders-page">
            <h1>My Orders</h1>
            {sortedDates
                .sort((a, b) => new Date(b) - new Date(a)) // Sort dates in descending order
                .map((date) => (
                    <div key={date} className="date-group">
                        <h2>{date}</h2>
                        {Object.values(groupedOrders[date])
                            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)) // Sort times within each date
                            .map((group, index) => (
                                <div key={index} className="order-group">
                                    
                                    <p><strong>Order Date & Time:</strong> {group.dateTime}</p>
                                    <p>
                                        <strong>Status:</strong>{" "}
                                        <span className={group.status.toLowerCase()}>
                                            {group.status}
                                        </span>
                                    </p>
                                    <div className="order-items">
                                        {group.orders.map((order) => (
                                            <div key={order.id} className="order-item">
                                                <div className="order-details">
                                                    <p><strong>Order ID:</strong> {order.order_id}</p>
                                                    <p><strong>Product:</strong> {order.product_name}</p>
                                                    <p><strong>Quantity:</strong> {order.quantity}</p>
                                                    <p><strong>Price:</strong> R{order.total_price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p>
                                        <strong>Total Order Amount:</strong> R{group.total.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                    </div>
                ))}
        </div>
    );
    
    
};

export default MyOrdersPage;
