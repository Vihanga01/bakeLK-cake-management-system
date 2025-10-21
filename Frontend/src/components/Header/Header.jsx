import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";
import { assets } from "../../assets/frontend_assets/assets";
import { useStore } from "../../context/StoreContext";

const Header = ({ setShowLogin }) => {
  const navigate = useNavigate();
  const { cartItems, isAuthenticated, logout, user } = useStore();
  const cartCount = useMemo(() => cartItems.reduce((sum, i) => sum + i.quantity, 0), [cartItems]);

  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <div className="header">
      <div className="header-contents">
        <div className="header-logo">
          <Link to="/products" onClick={scrollToTop}>
            <img src={assets.logo} alt="Fresh Bake Logo" className="header-logo-img" />
          </Link>
        </div>
        
        <div className="header-nav">
          <Link to="/products" onClick={scrollToTop} className="nav-link">
            Products
          </Link>
          <Link to="/cart" onClick={scrollToTop} className="nav-link cart-link">
            <img src={assets.basket_icon} alt="Cart" className="cart-icon" />
            Cart
            {cartCount > 0 && (
              <span className="cart-count">{cartCount}</span>
            )}
          </Link>
          {!isAuthenticated ? (
            <>
              <button className="auth-btn" onClick={() => setShowLogin(true)}>Login</button>
              <button className="auth-btn primary" onClick={() => setShowLogin(true)}>Register</button>
            </>
          ) : (
            <>
              {user && (
                <span className="user-name-attractive">
                  <img src={assets.profile_icon} alt="User" className="user-avatar" />
                  <span className="greeting-text">Hello, <b>{user.name || user.username || user.email}</b>!</span>
                </span>
              )}
              <Link to="/profile" onClick={scrollToTop} className="nav-link">Profile</Link>
              <button className="auth-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
