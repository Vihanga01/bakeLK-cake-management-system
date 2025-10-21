const Cake = require('../models/cake');
const Order = require('../models/Order');
const Comment = require('../models/Comment');

/**
 * Popularity Calculation Algorithm
 * Formula: popularity = (orders * 0.5) + (averageRating * 2) + (commentsCount * 0.3)
 * 
 * This formula balances:
 * - Order volume (0.5 weight) - indicates demand
 * - Rating quality (2.0 weight) - indicates satisfaction
 * - Engagement (0.3 weight) - indicates community interest
 */

// In-memory cache for popular cakes (in production, use Redis)
let popularCakesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate popularity score for a cake
 * @param {Object} cakeData - Cake data with aggregated metrics
 * @returns {number} Popularity score
 */
const calculatePopularityScore = (cakeData) => {
  const ordersCount = cakeData.ordersCount || 0;
  const averageRating = cakeData.averageRating || 0;
  const commentsCount = cakeData.commentsCount || 0;
  
  // Apply the popularity formula
  const popularityScore = (ordersCount * 0.5) + (averageRating * 2) + (commentsCount * 0.3);
  
  return Math.round(popularityScore * 100) / 100; // Round to 2 decimal places
};

/**
 * Get popular cakes using MongoDB aggregation pipeline
 * @param {number} limit - Number of cakes to return (default: 8)
 * @returns {Array} Array of popular cakes with popularity scores
 */
const getPopularCakes = async (limit = 8) => {
  try {
    // Check cache first
    if (popularCakesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log('Returning cached popular cakes');
      return popularCakesCache.slice(0, limit);
    }

    console.log('Calculating popular cakes...');
    
    // Simplified approach: Get all cakes and calculate popularity manually
    const cakes = await Cake.find({}).lean();
    const popularCakes = [];
    
    for (const cake of cakes) {
      // Count orders for this cake
      const orders = await Order.find({
        'orderedItems.cake': cake._id
      }).lean();
      
      let ordersCount = 0;
      orders.forEach(order => {
        order.orderedItems.forEach(item => {
          if (item.cake.toString() === cake._id.toString()) {
            ordersCount += item.quantity;
          }
        });
      });
      
      // Count comments for this cake
      const commentsCount = await Comment.countDocuments({ cakeId: cake._id });
      
      // Use existing averageRating or calculate from comments
      let averageRating = cake.averageRating || 0;
      if (commentsCount > 0 && (!cake.averageRating || cake.averageRating === 0)) {
        const comments = await Comment.find({ cakeId: cake._id, rating: { $exists: true, $ne: null } }).lean();
        if (comments.length > 0) {
          averageRating = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0) / comments.length;
        }
      }
      
      // Calculate popularity score using the formula
      const popularityScore = (ordersCount * 0.5) + (averageRating * 2) + (commentsCount * 0.3);
      
      popularCakes.push({
        _id: cake._id,
        productName: cake.productName,
        description: cake.description,
        price: cake.price,
        image: cake.image,
        category: cake.category,
        qty: cake.qty,
        averageRating: Math.round(averageRating * 100) / 100,
        ordersCount,
        commentsCount,
        popularityScore: Math.round(popularityScore * 100) / 100,
        createdAt: cake.createdAt
      });
    }
    
    // Sort by popularity score and limit results
    const sortedCakes = popularCakes
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
    
    // Update cache
    popularCakesCache = sortedCakes;
    cacheTimestamp = Date.now();
    
    console.log(`Found ${sortedCakes.length} popular cakes`);
    return sortedCakes;
    
  } catch (error) {
    console.error('Error calculating popular cakes:', error);
    throw error;
  }
};

/**
 * Clear the popular cakes cache
 * Call this when new orders, ratings, or comments are added
 */
const clearPopularCakesCache = () => {
  popularCakesCache = null;
  cacheTimestamp = null;
  console.log('Popular cakes cache cleared');
};

/**
 * Get popular cakes API endpoint handler
 */
const getPopularCakesHandler = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Validate limit
    if (limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 20'
      });
    }
    
    const popularCakes = await getPopularCakes(limit);
    
    res.json({
      success: true,
      data: popularCakes,
      count: popularCakes.length,
      cached: popularCakesCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION
    });
    
  } catch (error) {
    console.error('Popular cakes API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular cakes'
    });
  }
};

module.exports = {
  getPopularCakes,
  getPopularCakesHandler,
  clearPopularCakesCache,
  calculatePopularityScore
};
