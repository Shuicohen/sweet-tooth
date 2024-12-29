import React, { useState } from "react";
import axios from "axios";

const AdminPage = () => {
    const [product, setProduct] = useState({
        name: "",
        price: "",
        description: "",
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const token = localStorage.getItem("token");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProduct({ ...product, [name]: value });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("price", product.price);
        formData.append("description", product.description);
        formData.append("image", selectedFile);

        try {
            const response = await axios.post("http://localhost:5000/products", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("Product added:", response.data);
            // Optionally, reset the form
            setProduct({ name: "", price: "", description: "" });
            setSelectedFile(null);
        } catch (error) {
            console.error("Error adding product:", error);
        }
    };

    return (
        <div>
            <h2>Add Product</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={product.name}
                    onChange={handleInputChange}
                />
                <input
                    type="number"
                    name="price"
                    placeholder="Product Price"
                    value={product.price}
                    onChange={handleInputChange}
                />
                <textarea
                    name="description"
                    placeholder="Product Description"
                    value={product.description}
                    onChange={handleInputChange}
                ></textarea>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Add Product</button>
            </form>
        </div>
    );
};

export default AdminPage;
