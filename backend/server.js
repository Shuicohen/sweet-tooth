const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const crypto = require("crypto");

dotenv.config();

const app = express();
app.use(cors({
    origin: "https://sweettooth-zhjg.onrender.com", 
}));
app.use(bodyParser.json());



const generateOrderId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `ORD${date}${randomPart}`;
};

// Database connection
const { Pool } = require("pg");
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false },
});

const SECRET_KEY = process.env.SECRET_KEY;

// ➜ 2) Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ➜ 3) Configure Cloudinary Storage for Multer
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "products", // The folder name in your Cloudinary dashboard
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

// ➜ 4) Create Multer instance with Cloudinary storage
const upload = multer({ storage });

// Middleware for authenticating users
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(403).json({ message: "No token provided. Access denied." });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token." });
        }
        req.user = user;
        next();
    });
};

// User Registration
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
            [username, email, hashedPassword]
        );
        res.json({ message: "User registered successfully." });
    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ message: "Failed to register user." });
    }
});

// User Login
app.post("/login", async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: "Username/Email and password are required." });
    }

    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1 OR username = $1 LIMIT 1",
            [identifier]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid username/email or password." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid username/email or password." });
        }

        // Include username in the token payload so it is available when verifying
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            SECRET_KEY,
            { expiresIn: "1h" }
        );
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ➜ 5) Add Product (Admin Only), using Cloudinary
app.post("/products", authenticateToken, upload.single("image"), async (req, res) => {
    const { name, price, original_price, discount, description } = req.body;

    if (!name || !price || !description) {
        return res.status(400).json({ message: "Missing required fields: name, price, or description." });
    }

    // Check if user is admin
    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Forbidden. Only admins can add products." });
    }

    // The CloudinaryStorage automatically sets req.file.path to the Cloudinary URL
    const imageUrl = req.file ? req.file.path : null;

    try {
        const result = await pool.query(
            "INSERT INTO products (name, price, original_price, discount, description, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [
                name,
                parseFloat(price),
                original_price ? parseFloat(original_price) : null,
                discount ? parseFloat(discount) : null,
                description,
                imageUrl,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error adding product:", err);
        res.status(500).json({ message: "Failed to add product." });
    }
});

// Fetch Products
app.get("/products", async (req, res) => {
    try {
        const products = await pool.query("SELECT * FROM products");
        // images column now stores Cloudinary URLs directly.
        res.json(products.rows);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});

// Fetch a single product by ID
app.get("/products/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).json({ message: "Failed to fetch product" });
    }
});


// Add Order
app.post("/orders", authenticateToken, async (req, res) => {
    const { userId, cartItems } = req.body;

    if (!userId || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Invalid order data." });
    }

    try {
        for (const item of cartItems) {
            await pool.query(
                "INSERT INTO orders (user_id, product_name, product_price, quantity, total_price) VALUES ($1, $2, $3, $4, $5)",
                [userId, item.name, item.price, item.quantity, item.price * item.quantity]
            );
        }
        res.json({ message: "Order placed successfully." });
    } catch (err) {
        console.error("Error placing order:", err);
        res.status(500).json({ message: "Failed to place order." });
    }
});

// Fetch orders by user ID
app.get("/orders/:userId", authenticateToken, async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await pool.query("SELECT * FROM orders WHERE user_id = $1", [userId]);

        // Ensure `total_price` is a number before sending it to the frontend
        const orders = result.rows.map(order => ({
            ...order,
            total_price: parseFloat(order.total_price), // Ensure `total_price` is numeric
        }));

        if (orders.length === 0) {
            return res.status(404).json({ message: "No orders found." });
        }

        res.json(orders);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Failed to fetch orders." });
    }
});

app.post("/orders/mark-completed", authenticateToken, async (req, res) => {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: "No orders selected for completion." });
    }

    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Forbidden. Only admins can update orders." });
    }

    try {
        const completedAt = new Date();
        const result = await pool.query(
            `UPDATE orders
             SET status = 'completed', completed_at = $1
             WHERE id = ANY ($2::int[])
             RETURNING *`,
            [completedAt, orderIds]
        );

        res.json({ message: "Orders marked as completed.", updatedOrders: result.rows });
    } catch (err) {
        console.error("Error updating orders:", err);
        res.status(500).json({ message: "Failed to update orders." });
    }
});


// Checkout and Send Email
app.post("/checkout", authenticateToken, async (req, res) => {
    const { userId, cartItems } = req.body;

    // Validate input
    if (!userId || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Invalid checkout data." });
    }

    try {
        // Fetch user details
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        console.log("User found:", user);

        // Generate a unique order ID
        const orderId = generateOrderId();

        // Insert each cart item into the orders table with the order ID
        for (const item of cartItems) {
            await pool.query(
                `INSERT INTO orders (order_id, user_id, product_name, product_price, quantity, total_price) 
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    orderId,
                    userId,
                    item.name,
                    Number(item.price),
                    item.quantity,
                    Number(item.price) * item.quantity,
                ]
            );
        }

        console.log("Order saved to database.");

        // Generate order summary
        const orderSummary = cartItems
            .map(
                (item) =>
                    `- ${item.name} (Quantity: ${item.quantity}, Price: R${Number(item.price).toFixed(
                        2
                    )})`
            )
            .join("\n");

        const totalPrice = cartItems
            .reduce((total, item) => total + Number(item.price) * item.quantity, 0)
            .toFixed(2);

        // Prepare the email content
        const emailContent = `
Dear ${user.username || "Valued Customer"},

Thank you for shopping with Sweet Tooth! Your order has been successfully received and is being processed.

Here are your order details:
------------------------------------------------------------
Order ID: ${orderId}
Items:
${orderSummary}
------------------------------------------------------------
Total Amount: R${totalPrice}

An invoice for your order will be sent to this email address shortly. Please review it for payment instructions.

Should you have any questions, feel free to contact our team by responding to this email.

Best regards,  
The Sweet Tooth Team
        `;

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: `${user.email}, ${process.env.ADMIN_EMAIL}`,
            subject: "Your Sweet Tooth Order Confirmation",
            text: emailContent,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log("Order email sent to:", user.email);

        res.json({
            message: "Order confirmed and email sent!",
            orderId,
        });
    } catch (err) {
        console.error("Checkout error:", err);
        res.status(500).json({ message: "Checkout failed.", error: err.message });
    }
});

// Add Product (Admin Only)
// app.post("/products", authenticateToken, upload.single("image"), async (req, res) => {
//     const { name, price, original_price, discount, description } = req.body;
//     const images = req.file ? `uploads/${req.file.filename}` : null;

//     if (!name || !price || !description) {
//         return res.status(400).json({ message: "Missing required fields: name, price, or description." });
//     }

//     // Check if user is admin
//     if (req.user.email !== process.env.ADMIN_EMAIL) {
//         return res.status(403).json({ message: "Forbidden. Only admins can add products." });
//     }

//     try {
//         const result = await pool.query(
//             "INSERT INTO products (name, price, original_price, discount, description, images) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
//             [name, parseFloat(price), original_price ? parseFloat(original_price) : null, discount ? parseFloat(discount) : null, description, images]
//         );
//         res.json(result.rows[0]);
//     } catch (err) {
//         console.error("Error adding product:", err);
//         res.status(500).json({ message: "Failed to add product." });
//     }
// });


// Update Product (Admin Only) with Cloudinary
app.put("/products/:id", authenticateToken, upload.single("image"), async (req, res) => {
    const { id } = req.params;
    const { name, price, original_price, discount, description } = req.body;

    if (!name || !price || !description) {
        return res.status(400).json({ message: "Missing required fields: name, price, or description." });
    }

    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Forbidden. Only admins can update products." });
    }

    try {
        const fieldsToUpdate = ["name", "price", "description"];
        const values = [name, parseFloat(price), description];

        if (original_price) {
            fieldsToUpdate.push("original_price");
            values.push(parseFloat(original_price));
        }

        if (discount) {
            fieldsToUpdate.push("discount");
            values.push(parseFloat(discount));
        }

        // If a new image is uploaded, use Cloudinary URL
        if (req.file && req.file.path) {
            fieldsToUpdate.push("images");
            values.push(req.file.path);
        }

        values.push(id);

        const query = `
            UPDATE products
            SET ${fieldsToUpdate.map((field, index) => `${field} = $${index + 1}`).join(", ")}
            WHERE id = $${fieldsToUpdate.length + 1}
            RETURNING *;
        `;

        const updatedProduct = await pool.query(query, values);

        if (updatedProduct.rowCount === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.json(updatedProduct.rows[0]);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});



// Delete Product (Admin Only)
app.delete("/products/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Forbidden. Only admins can delete products." });
    }

    try {
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).json({ error: "Failed to delete product" });
    }
});

app.get("/orders", authenticateToken, async (req, res) => {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Forbidden. Only admins can view all orders." });
    }
    try {
        const result = await pool.query(
            `SELECT 
                o.*, 
                u.username, 
                u.email AS user_email 
             FROM orders o
             JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

app.put("/orders/:id", authenticateToken, async (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;

    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: "Forbidden. Only admins can update orders." });
    }

    if (!["pending", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const completedAt = status === "completed" ? new Date() : null;

        const result = await pool.query(
            `UPDATE orders
             SET status = $1, completed_at = $2
             WHERE id = $3
             RETURNING *`,
            [status, completedAt, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: "Failed to update order status" });
    }
});

// Verify Token Endpoint
app.get("/verify-token", authenticateToken, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username, email: req.user.email });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
