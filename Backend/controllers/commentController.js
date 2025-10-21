const Comment = require('../models/Comment');
const Cake = require('../models/cake');
const User = require('../models/User');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { clearPopularCakesCache } = require('./popularCakesController');

// Helper to recalc and update cake average rating
async function updateCakeRating(cakeId) {
  try {
    const id = typeof cakeId === 'string' ? new mongoose.Types.ObjectId(cakeId) : cakeId;
    const stats = await Comment.aggregate([
      { $match: { cakeId: id, rating: { $gte: 1 } } },
      { $group: { _id: '$cakeId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const avg = stats[0]?.avg || 0;
    const count = stats[0]?.count || 0;
    await Cake.findByIdAndUpdate(cakeId, { averageRating: avg, ratingsCount: count });
  } catch (e) {
    console.error('updateCakeRating error:', e);
  }
}

// POST /api/comments
const addComment = async (req, res) => {
  try {
    const { cakeId, commentText, rating } = req.body;
    if (!cakeId || !commentText) {
      return res.status(400).json({ message: 'cakeId and commentText are required' });
    }
    
    let userName = req.user.name || req.user.email;
    if (!userName) {
      const userDoc = await User.findById(req.user.id).select('name email');
      userName = userDoc?.name || userDoc?.email || 'User';
    }
    
    // Handle image upload
    let imagePath = null;
    if (req.file) {
      imagePath = path.join('uploads', 'comment-images', req.file.filename);
    }
    
    const comment = await Comment.create({
      cakeId,
      userId: req.user.id,
      userName,
      commentText,
      rating,
      image: imagePath
    });
    
    if (rating) await updateCakeRating(cakeId);
    
    // Clear popular cakes cache since comment data has changed
    clearPopularCakesCache();
    
    return res.status(201).json(comment);
  } catch (err) {
    console.error('addComment error:', err?.message, err?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/comments/:cakeId
const getCommentsByCake = async (req, res) => {
  try {
    const comments = await Comment.find({ cakeId: req.params.cakeId }).sort({ createdAt: -1 });
    return res.json(comments);
  } catch (err) {
    console.error('getCommentsByCake error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/comments/:id
const updateComment = async (req, res) => {
  try {
    const { commentText, rating } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.userId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (commentText !== undefined) comment.commentText = commentText;
    if (rating !== undefined) comment.rating = rating;
    await comment.save();
    if (rating !== undefined) await updateCakeRating(comment.cakeId);
    return res.json(comment);
  } catch (err) {
    console.error('updateComment error:', err?.message, err?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/comments/:id
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (String(comment.userId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Delete associated image file if it exists
    if (comment.image) {
      const imagePath = path.join(__dirname, '..', comment.image);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('Deleted comment image:', imagePath);
        }
      } catch (fileErr) {
        console.error('Error deleting comment image:', fileErr);
      }
    }
    
    await Comment.deleteOne({ _id: comment._id });
    await updateCakeRating(comment.cakeId);
    
    // Clear popular cakes cache since comment data has changed
    clearPopularCakesCache();
    
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteComment error:', err?.message, err?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/comments/like/:id
const toggleLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    const userId = req.user.id;
    const idx = comment.likes.findIndex((u) => String(u) === userId);
    if (idx >= 0) {
      comment.likes.splice(idx, 1);
    } else {
      comment.likes.push(userId);
    }
    await comment.save();
    return res.json(comment);
  } catch (err) {
    console.error('toggleLike error:', err?.message, err?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/comments/reply/:id
const addReply = async (req, res) => {
  try {
    const { replyText } = req.body;
    if (!replyText) return res.status(400).json({ message: 'replyText is required' });
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    let userName = req.user.name || req.user.email;
    if (!userName) {
      const userDoc = await User.findById(req.user.id).select('name email');
      userName = userDoc?.name || userDoc?.email || 'User';
    }
    comment.replies.push({
      userId: req.user.id,
      userName,
      replyText
    });
    await comment.save();
    return res.status(201).json(comment);
  } catch (err) {
    console.error('addReply error:', err?.message, err?.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addComment, getCommentsByCake, updateComment, deleteComment, toggleLike, addReply };


