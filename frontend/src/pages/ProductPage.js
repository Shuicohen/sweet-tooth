import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductGallery from "../components/ProductGallery";
import ProductDetails from "../components/ProductDetails";
import "./ProductPage.css";

const ProductPage = ({ addToCart }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("https://sweet-tooth-lqt1.onrender.com/products");
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (products.length === 0) return <div>No products available.</div>;

  return (
    <div className="product-page">
      <h1 className="products-title">Products Page</h1>
      <div className="products-container">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <ProductGallery images={Array.isArray(product.images) ? product.images[0] : product.images} />
            <ProductDetails product={product} addToCart={addToCart} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPage;
