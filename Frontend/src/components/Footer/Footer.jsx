// eslint-disable-next-line no-unused-vars
import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';
import { assets } from '../../assets/frontend_assets/assets';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo(0, 0); // Scrolls to the top of the page
  };

  return (
    <footer className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logo} alt="Fresh Bake Logo" />
          <div className='box-paragraph'>
            Indulge in Bake.Lk’s delicious, home-baked cakes made with the finest ingredients and complete cleanliness, delivered fresh to your door for every special occasion!
          </div>
          <br />
          <div className="footer-social-icons">
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
              <img src={assets.linkedin_icon} alt="LinkedIn" />
            </a>
            <a href="https://www.facebook.com/share/1FHwYuVJsZ/" target="_blank" rel="noopener noreferrer">
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
              <img src={assets.instagram_icon} alt="Instagram" />
            </a>
          </div>
        </div>
        <nav className="footer-content-center">
          <h2>Company</h2>
          <ul>
            <li>
              <Link to="/" onClick={scrollToTop}>Home</Link>
            </li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/myorders">Delivery</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </nav>
        <div className="footer-content-right">
          <h2>Get in Touch</h2>
          <ul>
            <li><a href="tel:+94762636188">+94 762636188</a></li>
            <li><a href="bake.lk@gmail.com">contact@bakeLk.com</a></li>

          </ul>
        </div>
      </div>
      <hr />
      <p className='footer-copyright'>Copyright 2025 &copy; BakeLk.com - All Rights Reserved.</p>
    </footer>
  );
}

export default Footer;
