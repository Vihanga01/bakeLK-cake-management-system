const express = require('express');
const { verifyJWT } = require('../middleware/authJwt');
const {
  listMyDeliveryInfos,
  getMyDeliveryInfoById,
  createMyDeliveryInfo,
  updateMyDeliveryInfo,
  deleteMyDeliveryInfo,
} = require('../controllers/walletController');

const router = express.Router();

// List my delivery infos
router.get('/delivery-info', verifyJWT, listMyDeliveryInfos);
// Get one by id
router.get('/delivery-info/:id', verifyJWT, getMyDeliveryInfoById);
// Create
router.post('/delivery-info', verifyJWT, createMyDeliveryInfo);
// Update
router.put('/delivery-info/:id', verifyJWT, updateMyDeliveryInfo);
// Delete
router.delete('/delivery-info/:id', verifyJWT, deleteMyDeliveryInfo);

module.exports = router;