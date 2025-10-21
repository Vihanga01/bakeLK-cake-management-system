// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPopup.css';
import { assets } from '../../assets/frontend_assets/assets';
import { useStore } from '../../context/StoreContext';
import axios from 'axios';

// eslint-disable-next-line react/prop-types
const LoginPopup = ({ setShowLogin }) => {
  const { login } = useStore();
  const navigate = useNavigate();

  const [currState, setCurrState] = useState('login');
  const [data, setData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newurl = 'http://localhost:5000';
    if (currState === 'login') {
      newurl += '/api/auth/login';
    } else {
      newurl += '/api/auth/register';
    }

    try {
      const response = await axios.post(newurl, data);

      if (response.data.success) {
        if (currState === 'login') {
          login(response.data.user, response.data.accessToken);
          // Role-based redirection
          if (response.data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          // Auto-login after register
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: data.email,
            password: data.password
          });
          if (loginResponse.data.success) {
            login(loginResponse.data.user, loginResponse.data.accessToken);
            // Role-based redirection for registered users
            if (loginResponse.data.user.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/');
            }
          }
        }
        setShowLogin(false);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Login/Register failed:', error);
      alert(error.response?.data?.message || 'An error occurred during the login/register process. Please try again.');
    }
  };

  return (
    <div className='login-popup'>
      <form onSubmit={onLogin} className='login-popup-container'>
        <div className='login-popup-title'>
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt='' />
        </div>
        <div className='login-popup-input'>
          {currState === 'sign up' && (
            <input
              name='name'
              onChange={onChangeHandler}
              value={data.name}
              type='text'
              placeholder='Your name'
              required
            />
          )}
          <input
            name='email'
            onChange={onChangeHandler}
            value={data.email}
            type='email'
            placeholder='Your email'
            required
          />
          <input
            name='password'
            onChange={onChangeHandler}
            value={data.password}
            type='password'
            placeholder='Password'
            required
          />
        </div>
        <button type='submit' className='login-btn'>
          {currState === 'sign up' ? 'Create Account' : 'Login'}
        </button>
        <div className='login-popup-condition'>
          <input type='checkbox' required />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
        {currState === 'login' ? (
          <p>
            Create a new account <span onClick={() => setCurrState('sign up')}>Click here</span>
          </p>
        ) : (
          <p>
            Already have an account? <span onClick={() => setCurrState('login')}>Login here</span>
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPopup;
