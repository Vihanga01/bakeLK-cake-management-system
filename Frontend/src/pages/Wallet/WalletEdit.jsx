import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useStore } from '../../context/StoreContext';
import './Wallet.css';

const initialState = {
  customerName: '',
  address: '',
  city: '',
  postalCode: '',
  contactNumber: '',
  email: ''
};

const WalletEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, token } = useStore();
  const [info, setInfo] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const api = axios.create({ baseURL: 'http://localhost:5000' });

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/wallet/delivery-info/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data?.data) {
          setInfo({
            customerName: res.data.data.customerName || '',
            address: res.data.data.address || '',
            city: res.data.data.city || '',
            postalCode: res.data.data.postalCode || '',
            contactNumber: res.data.data.contactNumber || '',
            email: res.data.data.email || ''
          });
        }
        setError('');
      } catch (e) {
        setError('Failed to load delivery info');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setInfo((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!info.customerName || !info.address || !info.city || !info.postalCode || !info.contactNumber || !info.email) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      const res = await api.put(`/api/wallet/delivery-info/${id}`, info, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        setError('');
        navigate('/wallet');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="add-cake-container">
        <div className="add-cake-header">
          <h1 className="add-cake-title">Edit Delivery Info</h1>
        </div>
        <div className="add-cake-form"><p>Please sign in to edit your delivery information.</p></div>
      </div>
    );
  }

  return (
    <div className="add-cake-container">
      <div className="add-cake-header">
        <h1 className="add-cake-title">Edit Delivery Info</h1>
        <p className="add-cake-subtitle">Update your saved delivery information</p>
      </div>

      <div className="add-cake-form">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={onSave}>
            <div className="form-grid">
              <div className="form-fields-section" style={{ gridColumn: '1 / -1' }}>
                <h3 className="section-title">Delivery Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="label-text">Full Name</span> <span className="required">*</span></label>
                    <input className="form-input" name="customerName" value={info.customerName} onChange={onChange} placeholder="Full Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="label-text">Email</span> <span className="required">*</span></label>
                    <input className="form-input" name="email" type="email" value={info.email} onChange={onChange} placeholder="Email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="label-text">Contact Number</span> <span className="required">*</span></label>
                    <input className="form-input" name="contactNumber" value={info.contactNumber} onChange={onChange} placeholder="Contact Number" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="label-text">Address</span> <span className="required">*</span></label>
                    <input className="form-input" name="address" value={info.address} onChange={onChange} placeholder="Address" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="label-text">Postal Code</span> <span className="required">*</span></label>
                    <input className="form-input" name="postalCode" value={info.postalCode} onChange={onChange} placeholder="Postal Code" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="label-text">City</span> <span className="required">*</span></label>
                    <input className="form-input" name="city" value={info.city} onChange={onChange} placeholder="City" />
                  </div>
                  <div className="form-group"></div>
                </div>

                {error && (
                  <div style={{ color: '#ef4444', fontWeight: 600 }}>{error}</div>
                )}

                <div className="form-actions">
                  <button type="button" className="submit-btn" onClick={() => navigate('/wallet')} style={{ background: '#6b7280' }}>Cancel</button>
                  <button type="submit" className="submit-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WalletEdit;


