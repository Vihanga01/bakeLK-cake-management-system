const bcrypt = require('bcrypt');
const User = require('../models/User');
const { 
  signAccessToken, 
  signRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken,
  blacklistToken,
  blacklistRefreshToken 
} = require('../utils/token');

// Register
const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: { id: user._id, email: user.email, name: user.name } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    req.session.userId = user._id;

    res.cookie('accessToken', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.json({ 
      success: true,
      message: 'Login successful',
      user: { id: user._id, email: user.email, name: user.name, role: user.role }, 
      accessToken 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user._id });

    // Blacklist old refresh token
    blacklistRefreshToken(refreshToken);

    // Set new cookies
    res.cookie('accessToken', newAccessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 
    });
    res.cookie('refreshToken', newRefreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    res.json({ 
      message: 'Token refreshed successfully',
      accessToken: newAccessToken 
    });
  } catch (err) {
    console.error('Token refresh error:', err);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies?.refreshToken;

    // Blacklist tokens
    if (accessToken) {
      blacklistToken(accessToken);
    }
    if (refreshToken) {
      blacklistRefreshToken(refreshToken);
    }

    // Destroy session
    req.session.destroy(err => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    // Clear cookies
    res.clearCookie('connect.sid');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Internal server error. Failed to get user data' });
  }
};

module.exports = { register, login, logout, refreshToken, getCurrentUser };
