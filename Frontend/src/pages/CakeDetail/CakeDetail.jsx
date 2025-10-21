import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CakeDetail.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { assets } from '../../assets/frontend_assets/assets';
import { useStore } from '../../context/StoreContext';
import CakeComments from '../../components/CakeComments';

const CakeDetail = ({ setShowLogin}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cake, setCake] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const { cartItems: cart, addToCart, updateQuantity, removeFromCart, isAuthenticated } = useStore();

  useEffect(() => {
    fetchCakeDetails();
  }, [id]);

  const fetchCakeDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/cakes/${id}`);
      if (response.data && response.data.success) {
        setCake(response.data.data);
        setError(null);
      } else {
        setError('Cake not found');
      }
    } catch (err) {
      setError('Failed to fetch cake details');
      console.error('Error fetching cake details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToppingChange = (topping, isSelected) => {
    if (isSelected) {
      setSelectedToppings(prev => [...prev, topping]);
    } else {
      setSelectedToppings(prev => prev.filter(t => t._id !== topping._id));
    }
  };

  const calculateTotalPrice = () => {
    if (!cake) return 0;
    const toppingsPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    return (cake.price + toppingsPrice) * selectedQuantity;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      setShowLogin(true);
      return;
    }

    try {
      const cartItem = {
        cakeId: cake._id,
        quantity: selectedQuantity,
        toppings: selectedToppings,
        totalPrice: calculateTotalPrice()
      };
      
      await addToCart(cake._id, selectedQuantity, selectedToppings);
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  const isInCart = cart.find(item => (item.cake || item._id) === cake?._id);
  const cartQuantity = isInCart?.quantity || 0;

  if (loading) {
    return (
      <div className="cake-detail-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading cake details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !cake) {
    return (
      <div className="cake-detail-page">
        <Navbar />
        <div className="error-container">
          <h2>Cake Not Found</h2>
          <p>{error || 'The cake you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/products')} className="back-btn">
            Back to Products
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cake-detail-page">
      <Navbar />
      
      <div className="cake-detail-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate('/products')} className="breadcrumb-link">
            Products
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{cake.productName}</span>
        </div>

        <div className="cake-detail-content">
          {/* Product Image */}
          <div className="cake-image-section">
            <div className="main-image-container">
              <img
                src={cake.image ? `http://localhost:5000/uploads/${cake.image}` : assets.menu_1}
                alt={cake.productName}
                className="main-image"
              />
              {cake.qty === 0 && (
                <div className="out-of-stock-overlay">
                  <span>Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="cake-info-section">
            <div className="cake-header">
              <h1 className="cake-title">{cake.productName}</h1>
              <div className="cake-category">{cake.category}</div>
            </div>

            <div className="cake-description">
              <h3>Description</h3>
              <p>{cake.description || 'No description available.'}</p>
            </div>

            <div className="cake-price-section">
              <div className="price-display">
                <span className="current-price">Rs. {cake.price}</span>
                {selectedToppings.length > 0 && (
                  <div className="toppings-price">
                    + Rs. {selectedToppings.reduce((sum, topping) => sum + topping.price, 0)} (toppings)
                  </div>
                )}
                {selectedQuantity > 1 && (
                  <div className="quantity-price">
                    × {selectedQuantity} = Rs. {calculateTotalPrice()}
                  </div>
                )}
              </div>
            </div>

            {/* Stock Information */}
            <div className="stock-info">
              <span className={`stock-status ${cake.qty > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {cake.qty > 0 ? `In Stock (${cake.qty} available)` : 'Out of Stock'}
              </span>
            </div>

            {/* Toppings Selection */}
            {cake.toppings && cake.toppings.length > 0 && (
              <div className="toppings-section">
                <h3>Available Toppings</h3>
                <div className="toppings-grid">
                  {cake.toppings.map(topping => (
                    <label key={topping._id || topping.name} className="topping-option">
                      <input
                        type="checkbox"
                        checked={selectedToppings.some(t => t._id === topping._id || t.name === topping.name)}
                        onChange={(e) => handleToppingChange(topping, e.target.checked)}
                        className="topping-checkbox"
                      />
                      <div className="topping-info">
                        <span className="topping-name">{topping.name}</span>
                        <span className="topping-price">+Rs. {topping.price}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="quantity-section">
              <h3>Quantity</h3>
              <div className="quantity-controls">
                <button
                  onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  className="quantity-btn"
                  disabled={selectedQuantity <= 1}
                >
                  -
                </button>
                <span className="quantity-display">{selectedQuantity}</span>
                <button
                  onClick={() => setSelectedQuantity(Math.min(cake.qty, selectedQuantity + 1))}
                  className="quantity-btn"
                  disabled={selectedQuantity >= cake.qty}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Section */}
            <div className="add-to-cart-section">
              {isInCart ? (
                <div className="cart-controls">
                  <div className="cart-info">
                    <span>In Cart: {cartQuantity} item(s)</span>
                  </div>
                  <div className="cart-buttons">
                    <button
                      onClick={() => updateQuantity(cake._id, cartQuantity - 1)}
                      className="cart-btn"
                    >
                      -
                    </button>
                    <span className="cart-quantity">{cartQuantity}</span>
                    <button
                      onClick={() => updateQuantity(cake._id, cartQuantity + 1)}
                      className="cart-btn"
                      disabled={cartQuantity >= cake.qty}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(cake._id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="add-to-cart-btn"
                  disabled={cake.qty === 0}
                >
                  <img src={assets.add_icon_green} alt="Add to Cart" />
                  Add to Cart - Rs. {calculateTotalPrice()}
                </button>
              )}
            </div>

            {/* Product Details */}
            <div className="product-details">
              <h3>Product Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{cake.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">Rs. {cake.price}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Stock:</span>
                  <span className="detail-value">{cake.qty} available</span>
                </div>
                {cake.toppings && cake.toppings.length > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Toppings:</span>
                    <span className="detail-value">{cake.toppings.length} options available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {cake && <div className="cake-detail-container"><CakeComments cakeId={cake._id} cakeImage={cake.image} cakeName={cake.productName} /></div>}

      <Footer />
    </div>
  );
};

export default CakeDetail;
