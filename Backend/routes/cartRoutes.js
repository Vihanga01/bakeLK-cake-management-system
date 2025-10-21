const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyJWT } = require('../middleware/authJwt');

// All routes require user to be authenticated

router.get('/', verifyJWT, cartController.getCart); // Get user's cart
router.post('/add', verifyJWT, cartController.addToCart); // Add item to cart
router.put('/update', verifyJWT, cartController.updateCartItem); // Update item quantity
router.delete('/remove', verifyJWT, cartController.removeCartItem); // Remove item from cart

module.exports = router;
