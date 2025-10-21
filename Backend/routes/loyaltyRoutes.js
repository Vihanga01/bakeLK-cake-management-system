const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../middleware/authJwt');
const {
  getUserProfile,
  getPointsHistory,
  calculateDiscount
} = require('../controllers/loyaltyController');

// Get user profile with points and level
router.get('/profile', verifyJWT, getUserProfile);

// Get points history
router.get('/history', verifyJWT, getPointsHistory);

// Calculate discount for checkout
router.post('/calculate-discount', verifyJWT, calculateDiscount);

module.exports = router;
