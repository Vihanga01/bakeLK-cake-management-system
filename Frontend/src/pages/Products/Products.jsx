import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Products.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { assets } from '../../assets/frontend_assets/assets';
import { useStore } from '../../context/StoreContext';

const Products = ({ setShowLogin }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const { cartItems: cart, addToCart, updateQuantity, removeFromCart, isAuthenticated } = useStore();
  const navigate = useNavigate();

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/cakes');
      // Expect backend response: { success: true, data: [...] }
      if (response.data && response.data.success) {
        setProducts(Array.isArray(response.data.data) ? response.data.data : []);
        setError(null);
      } else {
        setProducts([]);
        setError('Failed to fetch products');
      }
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const onAddToCart = async (product) => {
    if (!isAuthenticated) {
      alert('Please login to add items to cart');
      setShowLogin(true);
      return;
    }

    if (product.qty === 0) {
      toast.error('This item is out of stock');
      return;
    }

    const cartItem = cart.find(item => (item.cake || item._id) === product._id);
    if (cartItem && cartItem.quantity >= product.qty) {
      toast.error('Cannot add more items - insufficient stock');
      return;
    }

    try {
      await addToCart(product._id, 1);
      toast.success('Added to cart');
    } catch (err) {
      toast.error('Failed to add to cart');
    }
  };

  // Get unique categories
  const categories = ['All', ...new Set((Array.isArray(products) ? products : []).map(product => product.category))];

  // Filter and sort products
  const filteredProducts = (Array.isArray(products) ? products : [])
    .filter(product => {
      const matchesSearch = product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.productName.localeCompare(b.productName);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="products-page">
        <Navbar setShowLogin={setShowLogin} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <Navbar setShowLogin={setShowLogin} />
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchProducts} className="retry-btn">Retry</button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="products-page">
      <Navbar setShowLogin={setShowLogin} />
      
      <div className="products-container">
        <div className="products-header">
          <h1>Our Delicious Cakes</h1>
          <p>Fresh baked cakes made with love and finest ingredients</p>
        </div>

        {/* Filters and Search */}
        <div className="products-filters">
          <div className="search-container">
            <img src={assets.search_icon} alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search cakes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-filter"
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found matching your criteria.</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product._id} className="product-card" onClick={() => navigate(`/cake/${product._id}`)}>
                <div className="product-image-container">
                  <img
                    src={product.image ? `http://localhost:5000/uploads/${product.image}` : assets.menu_1}
                    alt={product.productName}
                    className="product-image"
                  />
                  {product.qty === 0 && (
                    <div className="out-of-stock-overlay">
                      <span>Out of Stock</span>
                    </div>
                  )}
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{product.productName}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-details">
                    <span className="product-category">{product.category}</span>
                    <span className={`product-stock ${product.qty === 0 ? 'out-of-stock' : product.qty <= 5 ? 'low-stock' : 'in-stock'}`}>
                      {product.qty === 0 ? 'Out of Stock' : product.qty <= 5 ? `Only ${product.qty} left` : `${product.qty} in stock`}
                    </span>
                  </div>
                  <div className="product-price">Rs.{product.price}</div>
                  
                  <div className="product-actions" onClick={(e) => e.stopPropagation()}>
                    {cart.find(item => item._id === product._id) ? (
                      <div className="cart-controls">
                        <button
                          onClick={() => updateQuantity(product._id, cart.find(item => (item.cake || item._id) === product._id)?.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity-display">
                          {cart.find(item => (item.cake || item._id) === product._id)?.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product._id, cart.find(item => (item.cake || item._id) === product._id)?.quantity + 1)}
                          className="quantity-btn"
                          disabled={cart.find(item => (item.cake || item._id) === product._id)?.quantity >= product.qty}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(product._id)}
                          className="remove-btn"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(product)}
                        className="add-to-cart-btn"
                        disabled={product.qty === 0}
                      >
                        <img src={assets.add_icon_green} alt="Add to Cart" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Products;
