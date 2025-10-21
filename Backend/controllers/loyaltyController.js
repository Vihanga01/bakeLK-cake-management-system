const User = require('../models/User');
const Order = require('../models/Order');

// Calculate points based on order amount
const calculatePoints = (totalAmount) => {
  if (totalAmount >= 6000) return 50;
  if (totalAmount >= 3000) return 25;
  if (totalAmount >= 1000) return 10;
  return 0;
};

// Calculate discount percentage based on user level
const getDiscountPercentage = (level) => {
  switch (level) {
    case 'Gold': return 5;
    case 'Platinum': return 10;
    default: return 0;
  }
};

// Update user level based on total points
const updateUserLevel = (points) => {
  if (points >= 300) return 'Platinum';
  if (points >= 100) return 'Gold';
  return 'Silver';
};

// Get user profile with points and level
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-passwordHash');
    
    console.log('Fetching profile for user:', userId);
    console.log('User data:', { name: user?.name, points: user?.points, level: user?.level });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate points needed for next level
    let pointsToNextLevel = 0;
    let nextLevel = '';
    
    if (user.level === 'Silver') {
      pointsToNextLevel = 100 - user.points;
      nextLevel = 'Gold';
    } else if (user.level === 'Gold') {
      pointsToNextLevel = 300 - user.points;
      nextLevel = 'Platinum';
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        points: user.points,
        level: user.level,
        pointsToNextLevel: pointsToNextLevel,
        nextLevel: nextLevel,
        discountPercentage: getDiscountPercentage(user.level)
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Get points history
const getPointsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const orders = await Order.find({ 
      user: userId,
      orderStatus: { $in: ['Pending', 'Confirmed', 'Shipped', 'Delivered'] }
    })
    .select('totalAmount pointsEarned createdAt orderStatus')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders: orders.map(order => ({
        id: order._id,
        totalAmount: order.totalAmount,
        pointsEarned: order.pointsEarned,
        date: order.createdAt,
        status: order.orderStatus
      }))
    });
  } catch (error) {
    console.error('Get points history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Calculate discount for checkout
const calculateDiscount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { totalAmount } = req.body;

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid total amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const discountPercentage = getDiscountPercentage(user.level);
    const discountAmount = (totalAmount * discountPercentage) / 100;
    const finalAmount = totalAmount - discountAmount;

    res.json({
      success: true,
      originalAmount: totalAmount,
      discountPercentage: discountPercentage,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      userLevel: user.level,
      points: user.points
    });
  } catch (error) {
    console.error('Calculate discount error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add points after successful order
const addPointsAfterOrder = async (userId, totalAmount) => {
  try {
    const pointsEarned = calculatePoints(totalAmount);
    console.log(`Calculated ${pointsEarned} points for amount ${totalAmount}`);
    
    if (pointsEarned > 0) {
      const user = await User.findById(userId);
      if (user) {
        const oldPoints = user.points || 0;
        const oldLevel = user.level || 'Silver';
        user.points = (user.points || 0) + pointsEarned;
        user.level = updateUserLevel(user.points);
        await user.save();
        console.log(`User ${userId}: ${oldPoints} → ${user.points} points, ${oldLevel} → ${user.level} level`);
      } else {
        console.error(`User ${userId} not found`);
      }
    }
    
    return pointsEarned;
  } catch (error) {
    console.error('Add points after order error:', error);
    return 0;
  }
};

module.exports = {
  getUserProfile,
  getPointsHistory,
  calculateDiscount,
  addPointsAfterOrder,
  calculatePoints,
  getDiscountPercentage,
  updateUserLevel
};
