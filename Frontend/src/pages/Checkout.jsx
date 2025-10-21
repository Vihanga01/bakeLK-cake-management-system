import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { toast } from 'react-toastify';
import './Checkout.css';

const initialForm = {
	customerName: '',
	address: '',
	city: '',
	postalCode: '',
	contactNumber: '',
	email: '',
	paymentMethod: 'COD',
	referenceNumber: '',
	receiptImage: null,
};

const Checkout = ({ setShowLogin }) => {
	const [form, setForm] = useState(initialForm);
	const [savedDeliveryInfos, setSavedDeliveryInfos] = useState([]);
	const [selectedDeliverySource, setSelectedDeliverySource] = useState('new'); // 'new' | 'saved'
	const [selectedSavedId, setSelectedSavedId] = useState('');
	const [loadingSavedInfo, setLoadingSavedInfo] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errorText, setErrorText] = useState('');
	const [userProfile, setUserProfile] = useState(null);
	const [applyDiscount, setApplyDiscount] = useState(false);
	const [discountInfo, setDiscountInfo] = useState(null);
	const { token, isAuthenticated, cartItems, fetchCart } = useStore();
    const navigate = useNavigate();

	// Fetch cart items on component mount
	useEffect(() => {
		if (isAuthenticated) {
			fetchCart();
		}
	}, [isAuthenticated, fetchCart]);

	// Fetch saved delivery information from Wallet when authenticated
	useEffect(() => {
		const fetchSavedInfo = async () => {
			if (!isAuthenticated || !token) return;
			setLoadingSavedInfo(true);
			try {
				const res = await axios.get('http://localhost:5000/api/wallet/delivery-info', {
					headers: { Authorization: `Bearer ${token}` },
				});
				const infos = Array.isArray(res?.data?.data) ? res.data.data : [];
				setSavedDeliveryInfos(infos);
			} catch (e) {
				// Silently ignore; not critical for checkout
			} finally {
				setLoadingSavedInfo(false);
			}
		};
		fetchSavedInfo();
	}, [isAuthenticated, token]);

	// Fetch user profile for loyalty system
	useEffect(() => {
		const fetchUserProfile = async () => {
			if (!isAuthenticated || !token) return;
			try {
				const res = await axios.get('http://localhost:5000/api/loyalty/profile', {
					headers: { Authorization: `Bearer ${token}` },
				});
				setUserProfile(res.data.user);
			} catch (e) {
				console.error('Failed to fetch user profile:', e);
			}
		};
		fetchUserProfile();
	}, [isAuthenticated, token]);

	// Calculate discount when applyDiscount changes
	useEffect(() => {
		const calculateDiscount = async () => {
			if (!applyDiscount || !isAuthenticated || !token || cartItems.length === 0) {
				setDiscountInfo(null);
				return;
			}

			try {
				const orderSummary = calculateOrderSummary();
				const res = await axios.post('http://localhost:5000/api/loyalty/calculate-discount', 
					{ totalAmount: orderSummary.total },
					{ headers: { Authorization: `Bearer ${token}` } }
				);
				setDiscountInfo(res.data);
			} catch (e) {
				console.error('Failed to calculate discount:', e);
				setDiscountInfo(null);
			}
		};
		calculateDiscount();
	}, [applyDiscount, isAuthenticated, token, cartItems]);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleFile = (e) => {
		setForm((prev) => ({ ...prev, receiptImage: e.target.files?.[0] || null }));
	};

		// Calculate order summary
		const calculateOrderSummary = () => {
			// Calculate subtotal from cart items (now includes toppings)
			const subtotal = cartItems.reduce((total, item) => total + (item.totalPrice || (item.price * item.quantity)), 0);
			
			// Calculate base price (without toppings)
			const baseSubtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
			
			// Calculate toppings total
			const toppingsTotal = cartItems.reduce((total, item) => total + ((item.toppingsPrice || 0) * item.quantity), 0);
			
			const deliveryFee = subtotal >= 3500 ? 0 : 350; // Free delivery over Rs. 3500, otherwise Rs. 350
			const preDiscountTotal = subtotal + deliveryFee;
			
			// Apply discount if applicable
			const discountAmount = discountInfo ? discountInfo.discountAmount : 0;
			const total = preDiscountTotal - discountAmount;
			
			return {
				subtotal,
				baseSubtotal,
				toppingsTotal,
				deliveryFee,
				preDiscountTotal,
				discountAmount,
				total,
				itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
			};
		};
	
		const orderSummary = calculateOrderSummary();
	
		const applySavedInfoToForm = (info) => {
			if (!info) return;
			setForm((prev) => ({
				...prev,
				customerName: info.customerName || '',
				address: info.address || '',
				city: info.city || '',
				postalCode: info.postalCode || '',
				contactNumber: info.contactNumber || '',
				email: info.email || '',
			}));
		};

		const validate = () => {
			if (!form.customerName || !form.address || !form.city || !form.postalCode || !form.contactNumber || !form.email) {
				toast.error('Please fill in all required fields');
				return false;
			}
			if (form.paymentMethod === 'BankTransfer') {
				if (!form.referenceNumber) {
					toast.error('Reference number is required for bank transfer');
					return false;
				}
				if (!form.receiptImage) {
					toast.error('Receipt image is required for bank transfer');
					return false;
				}
			}
			return true;
		};
	
		const handleSubmit = async (e) => {
			e.preventDefault();
			if (!validate()) return;
			setSubmitting(true);
			setErrorText('');
			try {
				// Prepare cart items with toppings data
				const cartItemsData = cartItems.map(item => ({
					cakeId: item.cake || item._id,
					quantity: item.quantity,
					price: item.price,
					toppings: item.toppings || [],
					toppingsPrice: item.toppingsPrice || 0,
					totalPrice: item.totalPrice || (item.price * item.quantity)
				}));
				
				let payload;
				let headers = {};
				if (form.paymentMethod === 'BankTransfer') {
					payload = new FormData();
					Object.entries(form).forEach(([key, value]) => {
						if (value !== null && value !== undefined && value !== '') {
							if (key === 'receiptImage' && value) payload.append('receiptImage', value);
							else payload.append(key, value);
						}
					});
					// Add cart items data
					payload.append('cartItems', JSON.stringify(cartItemsData));
					// Let axios set the multipart boundary automatically
				} else {
					payload = {
						customerName: form.customerName,
						address: form.address,
						city: form.city,
						postalCode: form.postalCode,
						contactNumber: form.contactNumber,
						email: form.email,
						paymentMethod: 'COD',
						cartItems: cartItemsData,
					};
				}
	
				const url = 'http://localhost:5000/api/orders';
				if (token) headers.Authorization = `Bearer ${token}`;
				const res = await axios.post(url, payload, { headers });
				toast.success(res.data?.message || 'Order placed');
				const orderId = res.data?.orderId;
				setForm(initialForm);
				navigate(orderId ? `/thank-you?orderId=${orderId}` : '/thank-you');
			} catch (err) {
				const msg = err?.response?.data?.message || 'Failed to place order';
				setErrorText(msg);
				toast.error(msg);
			} finally {
				setSubmitting(false);
			}
		};
	
		return (
			<div className="checkout-page">
				<div className="checkout-container">
					<div className="checkout-header">
						<h1 className="checkout-title">Secure Checkout</h1>
						<p className="checkout-subtitle">Complete your details to place your Bake.lk order</p>
					</div>
					
					<div className="checkout-layout">
						{/* Checkout Form */}
						<div className="checkout-form-section">
							<div className="checkout-card">
								<form onSubmit={handleSubmit}>
									{!isAuthenticated && (
										<p className="auth-warning">Please log in to place an order.</p>
									)}
									{errorText && (
										<div className="error">{errorText}</div>
									)}
	
									<div className="form-section">
										<h3 className="form-section-title">Delivery Information</h3>
						<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
						<label style={{ fontSize: 14, color: '#666' }}>Source:</label>
							<select
								className="input"
								value={selectedDeliverySource}
								onChange={(e) => {
									const value = e.target.value;
									setSelectedDeliverySource(value);
								if (value !== 'saved') {
									setSelectedSavedId('');
								}
								}}
								disabled={loadingSavedInfo}
							>
								<option value="new">Enter new details</option>
							{savedDeliveryInfos.length > 0 && (
								<option value="saved">Use saved delivery info</option>
							)}
							</select>
						</div>
					{selectedDeliverySource === 'saved' && savedDeliveryInfos.length > 0 && (
						<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
							<label style={{ fontSize: 14, color: '#666' }}>Address:</label>
							<select
								className="input"
								value={selectedSavedId}
								onChange={(e) => {
									const id = e.target.value;
									setSelectedSavedId(id);
									const match = savedDeliveryInfos.find((x) => x._id === id);
									if (match) applySavedInfoToForm(match);
								}}
							>
								<option value="">Select saved address</option>
								{savedDeliveryInfos.map((info) => (
									<option key={info._id} value={info._id}>
										{info.customerName} — {info.address}, {info.city} {info.postalCode}
									</option>
								))}
							</select>
						</div>
					)}
										<div className="form-grid">
											<input className="input" name="customerName" value={form.customerName} onChange={handleChange} placeholder="Full Name" required />
											<input className="input" name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
											<input className="input" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" required />
											<input className="input" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="Postal Code" required />
											<input className="input" name="city" value={form.city} onChange={handleChange} placeholder="City" required />
											<input className="input" name="address" value={form.address} onChange={handleChange} placeholder="Address" required />
										</div>
									</div>
	
									<div className="form-section">
										<h3 className="form-section-title">Payment Method</h3>
										<div className="radio-group">
											<label className={`radio-pill ${form.paymentMethod === 'COD' ? 'active' : ''}`}>
												<input type="radio" name="paymentMethod" value="COD" checked={form.paymentMethod === 'COD'} onChange={handleChange} />
												<span>Cash on Delivery (COD)</span>
											</label>
											<label className={`radio-pill ${form.paymentMethod === 'BankTransfer' ? 'active' : ''}`}>
												<input type="radio" name="paymentMethod" value="BankTransfer" checked={form.paymentMethod === 'BankTransfer'} onChange={handleChange} />
												<span>Bank Transfer</span>
											</label>
										</div>
										{form.paymentMethod === 'COD' ? (
											<p className="hint">Pay with cash when your order arrives.</p>
										) : (
											<div className="bank-transfer-fields">
												<input className="input" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} placeholder="Bank transfer reference number" />
												<div className="upload-area">
													<input type="file" accept="image/*" onChange={handleFile} />
													<p className="hint" style={{ marginTop: 6 }}>Upload a clear photo/screenshot of your bank transfer receipt.</p>
												</div>
											</div>
										)}
									</div>

									{/* Loyalty System Section */}
									{userProfile && (userProfile.level === 'Gold' || userProfile.level === 'Platinum') && (
										<div className="form-section">
											<h3 className="form-section-title">Loyalty Discount</h3>
											<div className="loyalty-info">
												<div className="loyalty-status">
													<span className="loyalty-level">{userProfile.level} Member</span>
													<span className="loyalty-points">{userProfile.points} Star Points</span>
												</div>
												<label className="discount-checkbox">
													<input 
														type="checkbox" 
														checked={applyDiscount} 
														onChange={(e) => setApplyDiscount(e.target.checked)}
													/>
													<span>Apply {userProfile.discountPercentage}% {userProfile.level} Member Discount</span>
												</label>
												{discountInfo && applyDiscount && (
													<div className="discount-preview">
														<p>You'll save Rs. {discountInfo.discountAmount.toLocaleString()}!</p>
													</div>
												)}
											</div>
										</div>
									)}
	
									<button type="submit" disabled={submitting || cartItems.length === 0} className="primary-btn">
										{submitting ? 'Placing Order...' : `Place Order - Rs. ${orderSummary.total.toLocaleString()}`}
									</button>
								</form>
							</div>
						</div>
	
						{/* Order Summary */}
						<div className="order-summary-section">
							<div className="order-summary-card">
								<h3 className="order-summary-title">Order Summary</h3>
								
								{cartItems.length === 0 ? (
									<div className="empty-cart">
										<p>Your cart is empty</p>
										<button onClick={() => navigate('/products')} className="browse-btn">
											Browse Products
										</button>
									</div>
								) : (
									<>
										<div className="order-items">
											{cartItems.map((item, index) => {
												return (
													<div key={index} className="order-item">
														<div className="item-image">
															{item.product?.image ? (
																<img 
																	src={`http://localhost:5000/uploads/${item.product.image}`} 
																	alt={item.product.name} 
																	onError={(e) => {
																		e.target.style.display = 'none';
																		e.target.nextSibling.style.display = 'block';
																	}}
																/>
															) : null}
															<div className="placeholder-image" style={{ display: item.product?.image ? 'none' : 'block' }}>🍰</div>
														</div>
														<div className="item-details">
															<h4 className="item-name">{item.product?.name || item.productName || 'Cake'}</h4>
															<p className="item-quantity">Qty: {item.quantity}</p>
															{item.toppings && item.toppings.length > 0 && (
																<div className="item-toppings">
																	<p className="toppings-label">Toppings:</p>
																	<div className="toppings-list">
																		{item.toppings.map((topping, idx) => (
																			<span key={idx} className="topping-tag">
																				{topping.name} (+Rs. {topping.price})
																			</span>
																		))}
																	</div>
																</div>
															)}
															<p className="item-price">
																Rs. {(item.totalPrice || (item.price * item.quantity)).toLocaleString()}
															</p>
														</div>
													</div>
												);
											})}
										</div>
	
										<div className="order-totals">
											<div className="total-row">
												<span>Base Price ({orderSummary.itemCount} items)</span>
												<span>Rs. {orderSummary.baseSubtotal.toLocaleString()}</span>
											</div>
											{orderSummary.toppingsTotal > 0 && (
												<div className="total-row">
													<span>Toppings</span>
													<span>Rs. {orderSummary.toppingsTotal.toLocaleString()}</span>
												</div>
											)}
											<div className="total-row">
												<span>Subtotal</span>
												<span>Rs. {orderSummary.subtotal.toLocaleString()}</span>
											</div>
											<div className="total-row">
												<span>Delivery Fee</span>
												<span>
													{orderSummary.deliveryFee === 0 ? (
														<span className="free-delivery">FREE</span>
													) : (
														`Rs. ${orderSummary.deliveryFee.toLocaleString()}`
													)}
												</span>
											</div>
											{orderSummary.deliveryFee > 0 && orderSummary.subtotal < 3500 && (
												<div className="delivery-hint">
													Add Rs. {(3500 - orderSummary.subtotal).toLocaleString()} more for free delivery
												</div>
											)}
											{orderSummary.discountAmount > 0 && (
												<div className="total-row discount-row">
													<span>Loyalty Discount ({userProfile?.level} Member)</span>
													<span className="discount-amount">-Rs. {orderSummary.discountAmount.toLocaleString()}</span>
												</div>
											)}
											<div className="total-row total-final">
												<span>Total</span>
												<span>Rs. {orderSummary.total.toLocaleString()}</span>
											</div>
										</div>
	
										<div className="order-info">
											<div className="info-item">
												<span className="info-label">Estimated Delivery:</span>
												<span className="info-value">2-3 business days</span>
											</div>
											<div className="info-item">
												<span className="info-label">Payment Method:</span>
												<span className="info-value">{form.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Bank Transfer'}</span>
											</div>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};
	
	export default Checkout;


