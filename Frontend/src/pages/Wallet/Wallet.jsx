import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Wallet.css';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { assets } from '../../assets/frontend_assets/assets';

const initialState = {
  customerName: '',
  address: '',
  city: '',
  postalCode: '',
  contactNumber: '',
  email: ''
};

const Wallet = () => {
  const { isAuthenticated, token } = useStore();
  const navigate = useNavigate();
  const [formInfo, setFormInfo] = useState(initialState);
  const [savedList, setSavedList] = useState([]);
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
        const res = await api.get('/api/wallet/delivery-info', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setSavedList(Array.isArray(res.data?.data) ? res.data.data : []);
        setFormInfo(initialState);
        setError('');
      } catch (e) {
        setError('Failed to load delivery info');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormInfo((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!formInfo.customerName || !formInfo.address || !formInfo.city || !formInfo.postalCode || !formInfo.contactNumber || !formInfo.email) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/api/wallet/delivery-info', formInfo, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        const data = res.data?.data;
        setSavedList((prev) => [data, ...prev]);
        setFormInfo(initialState);
        setError('');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    try {
      setSaving(true);
      const res = await api.delete(`/api/wallet/delivery-info/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        setSavedList((prev) => prev.filter((x) => x._id !== id));
        if (formInfo._id === id) setFormInfo(initialState);
        setError('');
      }
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const onEditClick = (id) => {
    navigate(`/wallet/edit/${id}`);
  };

  return (
    <>
      <Navbar />
      <div className="add-cake-container">
        <div className="add-cake-header">
          <h1 className="add-cake-title">Wallet</h1>
          <p className="add-cake-subtitle">Save your delivery information for faster checkout</p>
        </div>

        <div className="add-cake-form">
          {loading ? (
            <p>Loading...</p>
          ) : !isAuthenticated ? (
            <p>Please sign in to manage your delivery information.</p>
          ) : (
            <form onSubmit={onSave}>
              <div className="form-grid">
                <div className="form-fields-section" style={{ gridColumn: '1 / -1' }}>
                  <h3 className="section-title">Delivery Information</h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label"><span className="label-text">Full Name</span> <span className="required">*</span></label>
                      <input className="form-input" name="customerName" value={formInfo.customerName} onChange={onChange} placeholder="Full Name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><span className="label-text">Email</span> <span className="required">*</span></label>
                      <input className="form-input" name="email" type="email" value={formInfo.email} onChange={onChange} placeholder="Email" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><span className="label-text">Contact Number</span> <span className="required">*</span></label>
                      <input className="form-input" name="contactNumber" value={formInfo.contactNumber} onChange={onChange} placeholder="Contact Number" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label"><span className="label-text">Address</span> <span className="required">*</span></label>
                      <input className="form-input" name="address" value={formInfo.address} onChange={onChange} placeholder="Address" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><span className="label-text">Postal Code</span> <span className="required">*</span></label>
                      <input className="form-input" name="postalCode" value={formInfo.postalCode} onChange={onChange} placeholder="Postal Code" />
                    </div>
                    <div className="form-group">
                      <label className="form-label"><span className="label-text">City</span> <span className="required">*</span></label>
                      <input className="form-input" name="city" value={formInfo.city} onChange={onChange} placeholder="City" />
                    </div>
                    <div className="form-group"></div>
                  </div>

                {error && (
                  <div style={{ color: '#ef4444', fontWeight: 600 }}>{error}</div>
                )}

                  <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={saving}>{saving ? 'Saving...' : 'Submit'}</button>
                  </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="add-cake-form" style={{ marginTop: 24 }}>
          <h3 className="section-title">Saved Addresses</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Full Name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Address</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Email</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Contact</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Postal Code</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>City</th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: '8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedList.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>No saved addresses yet.</td>
                  </tr>
                ) : (
                  savedList.map((item) => (
                    <tr key={item._id}>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{item.customerName || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{item.address || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{item.email || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{item.contactNumber || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{item.postalCode || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{item.city || '-'}</td>
                      <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                        <button type="button" className="submit-btn" onClick={() => onEditClick(item._id)} style={{ marginRight: 8 }}>Edit</button>
                        <button type="button" className="submit-btn" onClick={() => onDelete(item._id)} style={{ background: '#ef4444' }} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Wallet;
