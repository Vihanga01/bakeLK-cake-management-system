const express = require('express');
const { register, login, logout, refreshToken, getCurrentUser } = require('../controllers/authController');
const { verifyJWT } = require('../middleware/authJwt');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', verifyJWT, getCurrentUser);

module.exports = router;
