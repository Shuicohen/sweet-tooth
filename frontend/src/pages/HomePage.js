import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get("https://sweet-tooth-lqt1.onrender.com/products");
        setProducts(response.data); // Dynamically fetch products
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

  return (
    <div className="homepage">
      <section className="welcome-section">
        <h1>Welcome to Sweet Tooth</h1>
        <p>
          At Sweet Tooth, we specialize in providing high-quality kosher and
          pareve products. From delicious dried fruits and sprinkles to premium
          canned goods, our selection is perfect for all your baking and
          cooking needs.
        </p>
        <p>
          Whether you're looking for bulk purchases or repackaged options,
          Sweet Tooth is your trusted source for quality and taste.
        </p>
      </section>

      <section className="featured-products">
        <h2>Our Featured Products</h2>
        <div className="products-container">
          <div className="products-grid">
            {products.slice(0, 4).map((product) => (
              <div key={product.id} className="product-card">
                <img
                  src={product.images}
                  alt={product.name}
                  className="product-image"
                />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p className="price">R{product.price}</p>
                {/* <Link to={"/products"} className="details-btn">
                  View Details
                </Link> */}
              </div>
            ))}
          </div>
          
          
        </div>
        <div className="view-all-btn-container">
            <Link to="/products" className="view-all-btn">
              View All Products
            </Link>
          </div>
      </section>
    </div>
  );
};

export default HomePage;
