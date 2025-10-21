import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useStore } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, isAuthenticated } = useStore();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrders();
    }
  }, [isAuthenticated, token]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const generateOrderHistoryPdf = () => {
    try {
      if (!orders || orders.length === 0) {
        toast.info('No orders to export');
        return;
      }

      const doc = new jsPDF();
      const left = 14;
      const right = 196;
      const lineHeight = 7;
      let y = 18;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Order History Report', left, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, left, y);
      y += 6;
      doc.text(`Orders: ${orders.length}`, left, y);
      y += 8;
      doc.setDrawColor(180);
      doc.line(left, y, right, y);
      y += 8;

      // Highest value order summary
      const getNetTotal = (o) => (o.totalAmount || 0) - (o.discountApplied || 0);
      const highestOrder = orders.reduce((acc, cur) => {
        return getNetTotal(cur) > getNetTotal(acc) ? cur : acc;
      }, orders[0]);

      if (highestOrder) {
        const orderIdTop = `#${highestOrder._id?.slice(-8)?.toUpperCase() || ''}`;
        const createdAtTop = highestOrder.createdAt ? new Date(highestOrder.createdAt).toLocaleString() : '-';
        const itemsCountTop = (highestOrder.orderedItems || []).length;
        const subtotalTop = highestOrder.totalAmount || 0;
        const discountTop = highestOrder.discountApplied || 0;
        const totalTop = getNetTotal(highestOrder);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Highest Value Order', left, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Order ${orderIdTop}`, left, y);
        doc.text(`Date: ${createdAtTop}`, left + 70, y);
        doc.text(`Items: ${itemsCountTop}`, left + 150, y);
        y += lineHeight;
        doc.text(`Subtotal: ${subtotalTop.toLocaleString()}`, left, y);
        doc.text(`Discount: ${discountTop.toLocaleString()}`, left + 70, y);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${totalTop.toLocaleString()}`, left + 140, y);
        doc.setFont('helvetica', 'normal');
        y += 8;
        doc.setDrawColor(200);
        doc.line(left, y, right, y);
        y += 10; // extra spacing before list
      }

      const ensureSpace = (needed = 20) => {
        if (y + needed > 280) {
          doc.addPage();
          y = 20;
        }
      };

      orders.forEach((order, idx) => {
        ensureSpace(34);
        // Order header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        const orderId = `#${order._id?.slice(-8)?.toUpperCase() || ''}`;
        doc.text(`Order ${orderId}`, left, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '-';
        doc.text(`Date: ${createdAt}`, left + 70, y);
        const status = order.orderStatus || 'N/A';
        doc.text(`Status: ${status}`, left + 150, y);
        y += lineHeight;

        // Items header
        doc.setFont('helvetica', 'bold');
        doc.text('Item', left, y);
        doc.text('Qty', left + 110, y);
        doc.text('Price (Rs.)', left + 140, y);
        y += 4;
        doc.setDrawColor(220);
        doc.line(left, y, right, y);
        y += 5;

        // Items
        doc.setFont('helvetica', 'normal');
        (order.orderedItems || []).forEach((item) => {
          ensureSpace(10);
          const itemName = item.name || item.productName || 'Item';
          const qty = String(item.quantity || 0);
          const price = ((item.price || 0) * (item.quantity || 0)).toLocaleString();
          doc.text(itemName, left, y);
          doc.text(qty, left + 110, y);
          doc.text(price, left + 140, y, { align: 'left' });
          y += lineHeight;
        });

        // Summary
        ensureSpace(22);
        y += 2;
        doc.setDrawColor(220);
        doc.line(left, y, right, y);
        y += 6;
        const subtotal = order.totalAmount || 0;
        const discount = order.discountApplied || 0;
        const total = subtotal - discount;
        doc.setFont('helvetica', 'normal');
        doc.text('Subtotal:', left + 120, y);
        doc.text(String(subtotal.toLocaleString()), left + 170, y, { align: 'left' });
        y += lineHeight;
        if (discount > 0) {
          doc.text('Loyalty Discount:', left + 120, y);
          doc.text(`- ${discount.toLocaleString()}`, left + 170, y, { align: 'left' });
          y += lineHeight;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', left + 120, y);
        doc.text(String(total.toLocaleString()), left + 170, y, { align: 'left' });
        y += lineHeight;

        // Footer for order
        ensureSpace(12);
        const address = [order.address, order.city].filter(Boolean).join(', ');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Payment: ${order.paymentMethod || '-'}`, left, y);
        doc.text(`Delivery: ${address || '-'}`, left + 70, y);
        y += 12; // increased spacing after meta

        // Divider between orders
        doc.setDrawColor(200);
        doc.line(left, y, right, y);
        y += 14; // increased spacing between orders
      });

      doc.save('order-history.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      toast.error('Failed to generate PDF');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f59e0b';
      case 'Confirmed': return '#10b981';
      case 'Shipped': return '#3b82f6';
      case 'Delivered': return '#059669';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'Confirmed': return '✅';
      case 'Shipped': return '🚚';
      case 'Delivered': return '📦';
      case 'Cancelled': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="order-history-container">
          <div className="loading">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <Navbar />
      <div className="order-history-container">
        <div className="order-history-header">
          <h1 className="order-history-title">Order History</h1>
          <p className="order-history-subtitle">Track your orders and view points earned</p>
          <button className="download-pdf-btn" onClick={generateOrderHistoryPdf}>
            Download PDF
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <div className="no-orders-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3 className="order-id">Order #{order._id.slice(-8).toUpperCase()}</h3>
                    <p className="order-date">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="order-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                    >
                      {getStatusIcon(order.orderStatus)} {order.orderStatus}
                    </span>
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-items">
                    <h4>Items ({order.orderedItems.length})</h4>
                    <div className="items-list">
                      {order.orderedItems.map((item, index) => (
                        <div key={index} className="order-item">
                          <div className="item-info">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">Qty: {item.quantity}</span>
                          </div>
                          <span className="item-price">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-summary">
                    <div className="summary-row">
                      <span>Subtotal:</span>
                      <span>Rs. {order.totalAmount.toLocaleString()}</span>
                    </div>
                    {order.discountApplied > 0 && (
                      <div className="summary-row discount">
                        <span>Loyalty Discount:</span>
                        <span>-Rs. {order.discountApplied.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>Rs. {(order.totalAmount - order.discountApplied).toLocaleString()}</span>
                    </div>
                  </div>

                  {order.pointsEarned > 0 && (
                    <div className="points-earned">
                      <div className="points-info">
                        <span className="points-icon">⭐</span>
                        <span className="points-text">Earned {order.pointsEarned} Star Points</span>
                      </div>
                    </div>
                  )}

                  <div className="order-meta">
                    <div className="meta-item">
                      <span className="meta-label">Payment:</span>
                      <span className="meta-value">{order.paymentMethod}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Delivery:</span>
                      <span className="meta-value">{order.address}, {order.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OrderHistory;
