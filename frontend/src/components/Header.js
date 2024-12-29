import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useUser } from "../UserContext";
import "./Header.css";

const Header = ({ cartItems, removeFromCart }) => {
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useUser(); // Use UserContext
  const cartRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const toggleCart = () => setCartOpen((prev) => !prev);
  const toggleProfile = () => setProfileOpen((prev) => !prev);

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
    } else {
      navigate("/checkout");
    }
  };

  const calculateTotal = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        cartRef.current &&
        !cartRef.current.contains(event.target) &&
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setCartOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="logo">Sweet Tooth</div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
      </nav>
      <div className="header-icons">
        <div className="cart-container" ref={cartRef}>
          <ShoppingCartIcon className="cart-icon" onClick={toggleCart} />
          {cartItems.length > 0 && (
            <div className="cart-badge">{cartItems.length}</div>
          )}
          {cartOpen && (
            <div className="cart-dropdown">
              <h4>Cart</h4>
              {cartItems.length === 0 ? (
                <p>Your cart is empty.</p>
              ) : (
                <>
                  {cartItems.map((item, index) => (
                    <div key={index} className="cart-item">
                      <img
                        className="cart-item-image"
                        src={item.images[0]}
                        alt={item.name}
                      />
                      <div>
                        <p>{item.name}</p>
                        <p>
                          R{item.price} x {item.quantity} = <b>R{item.price * item.quantity}</b>
                        </p>
                      </div>
                      <button className="remove-item" onClick={() => removeFromCart(index)}>
                        🗑
                      </button>
                    </div>
                  ))}
                  <p className="total-price">Total: R{calculateTotal()}</p>
                  <button className="checkout-btn" onClick={handleCheckout}>
                    Checkout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="profile-container" ref={profileRef}>
          <AccountCircleIcon className="profile-icon" onClick={toggleProfile} />
          {profileOpen && (
            <div className="profile-dropdown">
              {user ? (
                <>
                  <p>Welcome, {user.username}!</p>
                  {user.email === process.env.REACT_APP_ADMIN_EMAIL && (
                    <Link to="/dashboard">Dashboard</Link>
                  )}
                  <Link to="/my-orders">My Orders</Link>
                  <button onClick={() => {
                    logout();
                    navigate("/");
                  }}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Register</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
