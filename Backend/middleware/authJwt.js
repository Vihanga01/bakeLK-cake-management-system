const { verifyAccessToken, verifyRefreshToken } = require('../utils/token');

const verifyJWT = (req, res, next) => {
  try {
    // Read token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.cookies?.accessToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token using the new function that checks blacklist
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    
    if (err.message === 'Token has been blacklisted') {
      return res.status(401).json({ message: 'Token has been invalidated' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    return res.status(500).json({ message: 'Token verification failed' });
  }
};

const verifyRefreshJWT = (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Refresh JWT verification error:', err.message);
    
    if (err.message === 'Token has been blacklisted') {
      return res.status(401).json({ message: 'Refresh token has been invalidated' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }
    
    return res.status(500).json({ message: 'Refresh token verification failed' });
  }
};

// Role-based middleware
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ message: `Access denied. ${role} role required.` });
    }
    
    next();
  };
};

// Admin role middleware
const requireAdmin = requireRole('admin');

module.exports = { verifyJWT, verifyRefreshJWT, requireRole, requireAdmin };
