import React, { useState, useEffect } from "react";
import { useUser } from "../UserContext"; // Import UserContext
import api from "../api/api";
import "./DashboardPage.css";

const DashboardPage = () => {
    const { user } = useUser(); // Access user and token from context
    const token = user?.token;

    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "" });
    const [editingProduct, setEditingProduct] = useState(null);
    const [image, setImage] = useState(null);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState({});
    const [selectedTab, setSelectedTab] = useState("pending");

    useEffect(() => {
        if (token) {
            fetchProducts();
            fetchOrders();
        } else {
            console.error("User is not logged in or token is missing.");
        }
    }, [token]);

    const fetchProducts = async () => {
        try {
            const response = await api.get("/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchOrders = async () => {
        if (!token) {
            console.error("Token is missing. Please log in.");
            return;
        }

        try {
            const response = await api.get("/orders", {
                headers: { Authorization: `Bearer ${token}` },
            });

            const pending = response.data.filter((order) => order.status === "pending");
            const completed = response.data.filter((order) => order.status === "completed");

            setPendingOrders(pending);
            setCompletedOrders(completed);
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };
    

    const markSelectedAsCompleted = async () => {
        const selectedOrderIds = Object.keys(selectedOrders)
            .filter((id) => selectedOrders[id])
            .map((id) => parseInt(id, 10));
    
        if (selectedOrderIds.length === 0) {
            alert("No orders selected.");
            return;
        }
    
        try {
            const response = await api.post(
                "/orders/mark-completed",
                { orderIds: selectedOrderIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            const updatedOrders = response.data.updatedOrders;
    
            // Update pending and completed orders in the state
            setPendingOrders((prev) =>
                prev.filter((order) => !selectedOrderIds.includes(order.id))
            );
            setCompletedOrders((prev) => [...updatedOrders, ...prev]);
    
            // Clear selected orders
            setSelectedOrders({});
        } catch (error) {
            console.error("Error marking orders as completed:", error);
        }
    };
    

    const renderOrders = () => {
        const orders = selectedTab === "pending" ? pendingOrders : completedOrders;
    
        // Group orders by user email, date, and time
        const groupedOrders = orders.reduce((groups, order) => {
            const orderDate = new Date(order.created_at).toLocaleDateString(); // Group by date only
            const key = `${order.user_email}-${new Date(order.created_at).toLocaleString()}`; // Unique key by email and date-time
    
            if (!groups[orderDate]) {
                groups[orderDate] = [];
            }
    
            if (!groups[orderDate][key]) {
                groups[orderDate][key] = {
                    user_email: order.user_email,
                    username: order.username || "N/A",
                    dateTime: new Date(order.created_at).toLocaleString(), // Full date and time
                    completedAt: order.completed_at
                        ? new Date(order.completed_at).toLocaleString()
                        : "Not Completed",
                    total: 0,
                    orders: [],
                };
            }
    
            groups[orderDate][key].orders.push(order);
            groups[orderDate][key].total += parseFloat(order.total_price); // Accumulate total price
            return groups;
        }, {});
    
        // Sort dates and grouped orders
        const sortedDates = Object.keys(groupedOrders).sort(
            (a, b) => new Date(b) - new Date(a)
        );
    
        return (
            <div>
                {sortedDates.map((date) => (
                    <div key={date} className="date-group">
                        <h2>{date}</h2>
                        {Object.values(groupedOrders[date]).map((group, index) => (
                            <div key={index} className="order-group">
                                <p><strong>Username:</strong> {group.username}</p>
                                <p><strong>User Email:</strong> {group.user_email}</p>
                                <p><strong>Order Date & Time:</strong> {group.dateTime}</p>
                                <p><strong>Completed At:</strong> {group.completedAt}</p>
                                <div className="order-items">
                                    {group.orders.map((order) => (
                                        <div key={order.id} className="order-item">
                                            {selectedTab === "pending" && (
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedOrders[order.id]}
                                                    onChange={() =>
                                                        setSelectedOrders((prev) => ({
                                                            ...prev,
                                                            [order.id]: !prev[order.id],
                                                        }))
                                                    }
                                                />
                                            )}
                                            <div className="order-details">
                                                <p><strong>Order ID:</strong> {order.order_id}</p>
                                                <p><strong>Product:</strong> {order.product_name}</p>
                                                <p><strong>Quantity:</strong> {order.quantity}</p>
                                                <p><strong>Price:</strong> R{order.total_price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p><strong>Total Order Amount:</strong> R{group.total.toFixed(2)}</p>
                                {selectedTab === "pending" && (
                                    <button onClick={markSelectedAsCompleted}>
                                        Mark Selected as Completed
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    };
    
    

    const handleAddProduct = async () => {
        const formData = new FormData();
        formData.append("name", newProduct.name);
        formData.append("price", newProduct.price);
        formData.append("description", newProduct.description);
        if (image) formData.append("image", image);
    
        try {
            const response = await api.post("/products", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
    
            if (response.status === 201) {
                setProducts((prevProducts) => [...prevProducts, response.data]); // Update state
                setNewProduct({ name: "", price: "", description: "" });
                setImage(null);
                setIsAddFormOpen(false); // Close form
            }
        } catch (error) {
            console.error("Error adding product:", error);
        }
    };
    

    const handleUpdateProduct = async () => {
        const formData = new FormData();
        formData.append("name", editingProduct.name);
        formData.append("price", parseFloat(editingProduct.price));
        if (editingProduct.original_price) {
            formData.append("original_price", parseFloat(editingProduct.original_price));
        }
        if (editingProduct.discount) {
            formData.append("discount", parseFloat(editingProduct.discount));
        }
        formData.append("description", editingProduct.description);
        if (image) formData.append("image", image);
    
        try {
            const response = await api.put(`/products/${editingProduct.id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
    
            if (response.status === 200) {
                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id === editingProduct.id ? response.data : product
                    )
                ); // Update state
                setEditingProduct(null);
                setImage(null);
            }
        } catch (error) {
            console.error("Error updating product:", error);
        }
    };
    
    
    

    const handleDeleteProduct = async (productId) => {
        try {
            await api.delete(`/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProducts(products.filter((product) => product.id !== productId));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const renderProductImage = (product) => {
        const imageUrl = product.images
            ? product.images.startsWith("http")
                ? product.images
                : `http://localhost:5000${product.images}`
            : "/default-image.jpg";
        return <img src={imageUrl} alt={product.name} className="product-image" />;
    };
    
    



    return (
        <div className="dashboard-page">
            <h1>Admin Dashboard</h1>

            {/* Add Product Section */}
            <div className="product-management">
                <button className="add-button" onClick={() => setIsAddFormOpen(!isAddFormOpen)}>
                    {isAddFormOpen ? "Close Form" : "Add Product"}
                </button>
                {isAddFormOpen && (
                    <div className="product-form">
                        <h2>Add Product</h2>
                        <input
                            type="text"
                            placeholder="Name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                        <input
                            type="number"
                            placeholder="Price"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                        <textarea
                            placeholder="Description"
                            value={newProduct.description}
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, description: e.target.value })
                            }
                        />
                        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
                        <button onClick={handleAddProduct}>Submit</button>
                    </div>
                )}
            </div>

            {/* Product Cards */}
            <div className="product-grid">
                {products.map((product) => (
                    <div key={product.id} className="product-card">
                        {renderProductImage(product)}
                        <div className="product-details">
                            <p><strong>Name:</strong> {product.name}</p>
                            <p><strong>Price:</strong> R{product.price}</p>
                            <p><strong>Original Price:</strong> R{product.original_price || "N/A"}</p>
                            <p><strong>Discount:</strong> {product.discount || 0}%</p>
                            <p><strong>Description:</strong> {product.description}</p>
                        </div>
                        <div className="product-actions">
                            <button onClick={() => setEditingProduct({ ...product })}>Edit</button>
                            <button onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Product Form */}
            {editingProduct && (
                <div className="product-form">
                    <h2>Edit Product</h2>
                    <input
                        type="text"
                        placeholder="Name"
                        value={editingProduct.name || ""}
                        onChange={(e) =>
                            setEditingProduct({ ...editingProduct, name: e.target.value })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Price"
                        value={editingProduct.price || ""}
                        onChange={(e) =>
                            setEditingProduct({ ...editingProduct, price: e.target.value })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Original Price"
                        value={editingProduct.original_price || ""}
                        onChange={(e) =>
                            setEditingProduct({ ...editingProduct, original_price: e.target.value })
                        }
                    />
                    <input
                        type="number"
                        placeholder="Discount Percentage"
                        value={editingProduct.discount || ""}
                        onChange={(e) =>
                            setEditingProduct({ ...editingProduct, discount: e.target.value })
                        }
                    />
                    <textarea
                        placeholder="Description"
                        value={editingProduct.description || ""}
                        onChange={(e) =>
                            setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                    />
                    <input type="file" onChange={(e) => setImage(e.target.files[0])} />
                    <button onClick={handleUpdateProduct}>Update</button>
                    <button onClick={() => setEditingProduct(null)}>Cancel</button>
                </div>
            )}

            {/* Tabs for Orders */}
            <div className="tab-container">
                <div
                    className={`tab ${selectedTab === "pending" ? "selected" : ""}`}
                    onClick={() => setSelectedTab("pending")}
                >
                    Pending Orders
                </div>
                <div
                    className={`tab ${selectedTab === "completed" ? "selected" : ""}`}
                    onClick={() => setSelectedTab("completed")}
                >
                    Completed Orders
                </div>
            </div>

            {/* Order List */}
            <div className="orders-container">{renderOrders()}</div>
        </div>
    );
};

export default DashboardPage;
