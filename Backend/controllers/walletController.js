const DeliveryInfo = require('../models/DeliveryInfo');

// List all delivery infos for current user
const listMyDeliveryInfos = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const infos = await DeliveryInfo.find({ user: userId }).sort({ updatedAt: -1, createdAt: -1 });
    return res.json({ success: true, data: infos });
  } catch (err) {
    console.error('listMyDeliveryInfos error:', err);
    return res.status(500).json({ message: 'Failed to fetch delivery infos' });
  }
};

// Get one delivery info by id for current user
const getMyDeliveryInfoById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const info = await DeliveryInfo.findOne({ _id: id, user: userId });
    if (!info) return res.status(404).json({ message: 'Delivery info not found' });
    return res.json({ success: true, data: info });
  } catch (err) {
    console.error('getMyDeliveryInfoById error:', err);
    return res.status(500).json({ message: 'Failed to fetch delivery info' });
  }
};

// Create new delivery info for current user (allow multiple per user)
const createMyDeliveryInfo = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { customerName, address, city, postalCode, contactNumber, email } = req.body;
    if (!customerName || !address || !city || !postalCode || !contactNumber || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const created = await DeliveryInfo.create({
      user: userId,
      customerName,
      address,
      city,
      postalCode,
      contactNumber,
      email,
    });
    return res.json({ success: true, data: created, message: 'Delivery info created' });
  } catch (err) {
    console.error('createMyDeliveryInfo error:', err);
    // If you see duplicate key errors on index user_1, drop the unique index in DB
    return res.status(500).json({ message: 'Failed to create delivery info' });
  }
};

// Update existing delivery info by id for current user
const updateMyDeliveryInfo = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;
    const { customerName, address, city, postalCode, contactNumber, email } = req.body;
    if (!customerName || !address || !city || !postalCode || !contactNumber || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const updated = await DeliveryInfo.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { customerName, address, city, postalCode, contactNumber, email } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Delivery info not found' });
    return res.json({ success: true, data: updated, message: 'Delivery info updated' });
  } catch (err) {
    console.error('updateMyDeliveryInfo error:', err);
    return res.status(500).json({ message: 'Failed to update delivery info' });
  }
};

// Delete delivery info by id for current user
const deleteMyDeliveryInfo = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { id } = req.params;

    const deleted = await DeliveryInfo.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) return res.status(404).json({ message: 'Delivery info not found' });
    return res.json({ success: true, message: 'Delivery info deleted' });
  } catch (err) {
    console.error('deleteMyDeliveryInfo error:', err);
    return res.status(500).json({ message: 'Failed to delete delivery info' });
  }
};

module.exports = {
  listMyDeliveryInfos,
  getMyDeliveryInfoById,
  createMyDeliveryInfo,
  updateMyDeliveryInfo,
  deleteMyDeliveryInfo,
};