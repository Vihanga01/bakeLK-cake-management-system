import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { assets } from '../../assets/frontend_assets/assets';
import { useStore } from '../../context/StoreContext';

const Cart = ({ setShowLogin }) => {
  const { cartItems: cart, fetchCart, updateQuantity, removeFromCart, isAuthenticated } = useStore();
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart().catch(() => {});
    }
  }, [isAuthenticated, fetchCart]);

  // Debug cart items
  useEffect(() => {
    console.log('Cart items in Cart page:', cart);
  }, [cart]);

  // Handlers wrap context API
  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) return handleRemove(productId);
    return updateQuantity(productId, newQuantity);
  };

  const handleRemove = (productId) => removeFromCart(productId);

  // Clear entire cart
  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      saveCartToStorage([]);
    }
  };

  // Calculate totals
  const subtotal = cart.reduce((total, item) => total + (item.totalPrice || (item.price * item.quantity)), 0);
  const deliveryFee = subtotal >= 3500 ? 0 : 350; // Free delivery over Rs. 3500, otherwise Rs. 350
  const total = subtotal + deliveryFee;

  // Proceed to checkout
  const proceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <Navbar setShowLogin={setShowLogin} />
        <div className="cart-container">
          <div className="cart-header">
            <h1>Shopping Cart</h1>
          </div>
          
          <div className="empty-cart">
            <img src={assets.basket_icon} alt="Empty Cart" className="empty-cart-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any items to your cart yet.</p>
            <button 
              onClick={() => navigate('/products')} 
              className="continue-shopping-btn"
            >
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Navbar setShowLogin={setShowLogin} />
      
      <div className="cart-container">
        <div className="cart-header">
          <h1>Shopping Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h1>
          <button onClick={clearCart} className="clear-cart-btn">
            Clear Cart
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-image">
                  <img
                    src={item.image ? `http://localhost:5000/uploads/${item.image}` : (item.product?.image ? `http://localhost:5000/uploads/${item.product.image}` : assets.menu_1)}
                    alt={item.productName || item.product?.name || 'Cake'}
                    onError={(e) => {
                      e.target.src = assets.menu_1;
                    }}
                  />
                </div>
                
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.productName}</h3>
                  <p className="cart-item-price">Rs. {item.price}</p>
                  {item.toppings && item.toppings.length > 0 && (
                    <div className="cart-item-toppings">
                      <span className="toppings-label">Toppings: </span>
                      {item.toppings.map((topping, index) => (
                        <span key={index} className="topping-tag">
                          {topping.name} (+Rs. {topping.price})
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="cart-item-stock">Stock: {item.qty}</div>
                </div>
                
                <div className="cart-item-quantity">
                  <button
                    onClick={() => handleUpdateQuantity(item.cake || item._id, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span className="quantity-display">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.cake || item._id, item.quantity + 1)}
                    className="quantity-btn"
                    disabled={item.quantity >= item.qty}
                  >
                    +
                  </button>
                </div>
                
                <div className="cart-item-total">
                  Rs. {(item.totalPrice || (item.price * item.quantity)).toFixed(2)}
                </div>
                
                <button
                  onClick={() => {
                    if (window.confirm(`Remove "${item.productName || item.product?.name || 'this item'}" from cart?`)) {
                      handleRemove(item.cake || item._id);
                    }
                  }}
                  className="remove-item-btn"
                  title="Remove from cart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'Free' : `Rs. ${deliveryFee.toFixed(2)}`}</span>
              </div>
              
              <hr className="summary-divider" />
              
              <div className="summary-row total-row">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
              
              {deliveryFee > 0 && (
                <div className="free-shipping-note">
                  Add Rs. {(3500 - subtotal).toFixed(2)} more for free delivery!
                </div>
              )}
              
              <button
                onClick={proceedToCheckout}
                className="checkout-btn"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <button
                onClick={() => navigate('/products')}
                className="continue-shopping-btn"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
