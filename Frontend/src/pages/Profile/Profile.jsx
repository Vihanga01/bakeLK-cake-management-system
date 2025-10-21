import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../../context/StoreContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import './Profile.css';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [pointsHistory, setPointsHistory] = useState([]);
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
      fetchUserProfile();
      fetchPointsHistory();
    }
  }, [isAuthenticated, token]);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/loyalty/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(res.data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/loyalty/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPointsHistory(res.data.orders);
    } catch (error) {
      console.error('Failed to fetch points history:', error);
    }
  };


  const getLevelColor = (level) => {
    switch (level) {
      case 'Silver': return '#94a3b8';
      case 'Gold': return '#fbbf24';
      case 'Platinum': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'Silver': return '🥈';
      case 'Gold': return '🥇';
      case 'Platinum': return '💎';
      default: return '⭐';
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading">Loading your profile...</div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">Manage your loyalty points and view your status</p>
        </div>

        <div className="profile-content">
          {/* User Info Card */}
          <div className="profile-card">
            <div className="user-info">
              <div className="user-avatar">
                <span className="avatar-text">{userProfile.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              </div>
              <div className="user-details">
                <h2 className="user-name">{userProfile.name}</h2>
                <p className="user-email">{userProfile.email}</p>
              </div>
            </div>
          </div>

          {/* Loyalty Status Card */}
          <div className="loyalty-card">
            <div className="loyalty-header">
              <h3 className="loyalty-title">Loyalty Status</h3>
              <div className="loyalty-level-badge" style={{ backgroundColor: getLevelColor(userProfile.level) }}>
                {getLevelIcon(userProfile.level)} {userProfile.level} Member
              </div>
            </div>

            <div className="loyalty-stats">
              <div className="stat-item">
                <span className="stat-label">Star Points</span>
                <span className="stat-value">{userProfile.points}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Discount</span>
                <span className="stat-value">{userProfile.discountPercentage}%</span>
              </div>
            </div>

            {userProfile.pointsToNextLevel > 0 && (
              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-text">
                    {userProfile.pointsToNextLevel} points to {userProfile.nextLevel}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(100, ((userProfile.points / (userProfile.points + userProfile.pointsToNextLevel)) * 100))}%`,
                      backgroundColor: getLevelColor(userProfile.nextLevel)
                    }}
                  ></div>
                </div>
              </div>
            )}

          </div>

          {/* Points History */}
          <div className="history-card">
            <h3 className="history-title">Points History</h3>
            {pointsHistory.length === 0 ? (
              <div className="no-history">
                <p>No points earned yet. Start shopping to earn Star Points!</p>
              </div>
            ) : (
              <div className="history-list">
                {pointsHistory.map((order, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <div className="history-date">
                        {new Date(order.date).toLocaleDateString()}
                      </div>
                      <div className="history-amount">
                        Order: Rs. {order.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div className="history-points">
                      +{order.pointsEarned} points
                    </div>
                    <div className="history-status">
                      <span className={`status-badge ${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
