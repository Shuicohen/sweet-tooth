import React, { useState } from "react";
import "./ProductDetails.css";

const ProductDetails = ({ product, addToCart }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    // Pass the correct quantity to the addToCart function
    const itemWithQuantity = { ...product, quantity };
    addToCart(itemWithQuantity);
    alert(`${quantity} ${product.name} added to cart.`);
  };

  const increaseQuantity = () => setQuantity(quantity + 1);
  const decreaseQuantity = () => quantity > 1 && setQuantity(quantity - 1);

  return (
    <div className="product-details">
      <h2>{product.name}</h2>
      <p>{product.description}</p>
      <div className="pricing">
        <span className="current-price">R{product.price}</span>
        {product.original_price && (
          <span className="original-price">R{product.original_price}</span>
        )}
        {product.discount && (
          <span className="discount">{product.discount}% off</span>
        )}
      </div>
      <div className="quantity-selector">
        <button onClick={decreaseQuantity}>-</button>
        <span>{quantity}</span>
        <button onClick={increaseQuantity}>+</button>
      </div>
      <button className="add-to-cart" onClick={handleAddToCart}>
        Add to cart
      </button>
    </div>
  );
};

export default ProductDetails;
