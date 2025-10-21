import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaShoppingCart } from 'react-icons/fa';
import { useStore } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import './PopularCakes.css';

const PopularCakes = () => {
  const [popularCakes, setPopularCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart, isAuthenticated } = useStore();

  useEffect(() => {
    fetchPopularCakes();
  }, []);

  const fetchPopularCakes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:5000/api/cakes/popular?limit=8');
      
      if (response.data.success) {
        setPopularCakes(response.data.data);
        console.log('Popular cakes loaded:', response.data.data.length);
      } else {
        setError('Failed to load popular cakes');
      }
    } catch (err) {
      console.error('Error fetching popular cakes:', err);
      setError('Failed to load popular cakes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (cake) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (cake.qty === 0) {
      toast.error('This item is out of stock');
      return;
    }

    try {
      await addToCart(cake._id, 1);
      toast.success(`${cake.productName} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="star filled" style={{color: '#FFD700', fontSize: '1.1rem', marginRight: '2px'}} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStar key="half" className="star half" style={{color: '#FFD700', fontSize: '1.1rem', marginRight: '2px'}} />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className="star empty" style={{color: '#BDC3C7', fontSize: '1.1rem', marginRight: '2px'}} />);
    }

    return stars;
  };

  const getStockStatus = (qty) => {
    if (qty === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (qty <= 5) return { text: `Only ${qty} left`, class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const generatePopularCakesPdf = () => {
    try {
      if (!popularCakes || popularCakes.length === 0) {
        toast.info('No popular cakes to export');
        return;
      }

      const top5 = [...popularCakes]
        .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
        .slice(0, 5);

      const doc = new jsPDF();
      const left = 14;
      const right = 196;
      let y = 18;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Most Loved Cakes - Top 5 Report', left, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, left, y);
      y += 8;
      doc.setDrawColor(180);
      doc.line(left, y, right, y);
      y += 8;

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.text('Cake', left, y);
      doc.text('Category', left + 70, y);
      doc.text('Rating', left + 110, y);
      doc.text('Orders', left + 135, y);
      doc.text('Price (Rs.)', left + 160, y);
      y += 4;
      doc.setDrawColor(220);
      doc.line(left, y, right, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      top5.forEach((cake) => {
        const name = cake.productName || 'Cake';
        const category = cake.category || '-';
        const rating = (cake.averageRating ? cake.averageRating.toFixed(1) : 'N/A') +
          (cake.commentsCount ? ` (${cake.commentsCount})` : '');
        const orders = String(cake.ordersCount || 0);
        const price = (cake.price || 0).toLocaleString();

        doc.text(name, left, y);
        doc.text(category, left + 70, y);
        doc.text(rating, left + 110, y);
        doc.text(orders, left + 135, y);
        doc.text(price, left + 160, y);
        y += 8;
      });

      // Footer note
      y += 2;
      doc.setDrawColor(220);
      doc.line(left, y, right, y);
      y += 8;
      doc.setFontSize(10);
      doc.text('Includes top 5 cakes by popularity score.', left, y);

      doc.save('most-loved-cakes-top5.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <section className="popular-cakes-section">
        <div className="container">
          <div className="section-header">
            <div className="header-icon">
              <span className="house-icon">🏠</span>
            </div>
            <h2 className="popular-section-title">Our Most Loved Cakes</h2>
            <p className="section-subtitle">Discover the cakes our customers can't get enough of!</p>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading our most popular cakes...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="popular-cakes-section">
        <div className="container">
          <div className="section-header">
            <div className="header-icon">
              <span className="house-icon">🏠</span>
            </div>
            <h2 className="popular-section-title">Our Most Loved Cakes</h2>
            <p className="section-subtitle">Discover the cakes our customers can't get enough of!</p>
          </div>
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchPopularCakes} className="retry-btn">Try Again</button>
          </div>
        </div>
      </section>
    );
  }

  if (popularCakes.length === 0) {
    return (
      <section className="popular-cakes-section">
        <div className="container">
          <div className="section-header">
            <div className="header-icon">
              <span className="house-icon">🏠</span>
            </div>
            <h2 className="popular-section-title">Our Most Loved Cakes</h2>
            <p className="section-subtitle">Discover the cakes our customers can't get enough of!</p>
          </div>
          <div className="no-cakes">
            <p>No popular cakes found. Check back later!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="popular-cakes-section">
      <div className="container">
        <div className="section-header">
          <div
            className="header-icon"
            role="button"
            title="Download Top 5 PDF"
            tabIndex={0}
            onClick={generatePopularCakesPdf}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); generatePopularCakesPdf(); } }}
          >
            <span className="house-icon">🏠</span>
          </div>
          <h2 className="popular-section-title">Our Most Loved Cakes</h2>
          <p className="section-subtitle">Discover the cakes our customers can't get enough of!</p>
        </div>

        <div className="popular-cakes-grid">
          {popularCakes.map((cake) => {
            const stockStatus = getStockStatus(cake.qty);
            
            return (
              <div key={cake._id} className="popular-cake-card">
                <Link to={`/cake/${cake._id}`} className="cake-link">
                  <div className="cake-image-container">
                    <img
                      src={cake.image ? `http://localhost:5000/uploads/${cake.image}` : '/placeholder-cake.jpg'}
                      alt={cake.productName}
                      className="cake-image"
                    />
                    {cake.qty === 0 && (
                      <div className="out-of-stock-overlay">
                        <span>Out of Stock</span>
                      </div>
                    )}
                    
                    {/* Popularity Badge */}
                    <div className="popularity-badge">
                      <span className="popularity-score">{cake.popularityScore?.toFixed(1) || '0.0'}</span>
                      <span className="popularity-label">Popular</span>
                    </div>
                  </div>
                </Link>

                <div className="cake-info">
                  <div className="cake-header">
                    <h3 className="cake-name">{cake.productName}</h3>
                    <div className="cake-category">{cake.category}</div>
                  </div>

                  <div className="cake-rating">
                    <div className="stars">
                      {renderStars(cake.averageRating || 0)}
                    </div>
                    <span className="rating-text">
                      {cake.averageRating ? cake.averageRating.toFixed(1) : 'No rating'} 
                      ({cake.commentsCount || 0} reviews)
                    </span>
                  </div>

                  <div className="cake-stats">
                    <div className="stat">
                      <span className="stat-number">{cake.ordersCount || 0}</span>
                      <span className="stat-label">Orders</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{cake.commentsCount || 0}</span>
                      <span className="stat-label">Reviews</span>
                    </div>
                  </div>

                  <div className="cake-price-stock">
                    <div className="price">Rs. {cake.price?.toLocaleString()}</div>
                    <div className={`stock-status ${stockStatus.class}`}>
                      {stockStatus.text}
                    </div>
                  </div>

                  <div className="cake-actions">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(cake);
                      }}
                      className={`add-to-cart-btn ${cake.qty === 0 ? 'disabled' : ''}`}
                      disabled={cake.qty === 0}
                    >
                      <FaShoppingCart />
                      {cake.qty === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-footer">
          <Link to="/products" className="view-all-btn">
            View All Cakes
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PopularCakes;


