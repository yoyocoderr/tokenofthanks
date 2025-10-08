const express = require('express');
const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile with statistics
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const sentTokens = await TokenTransaction.aggregate([
      { $match: { sender: user._id, transactionType: 'SEND' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const receivedTokens = await TokenTransaction.aggregate([
      { $match: { recipient: user._id, transactionType: 'SEND' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalTransactions = await TokenTransaction.countDocuments({
      $or: [{ sender: user._id }, { recipient: user._id }]
    });

    const stats = {
      totalSent: sentTokens[0]?.total || 0,
      totalReceived: receivedTokens[0]?.total || 0,
      totalTransactions,
      currentBalance: user.tokenBalance
    };

    res.json({
      success: true,
      user: user.getProfile(),
      stats
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by email (for sending tokens)
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    const currentUserId = req.user.userId;

    if (!email || email.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Email search requires at least 3 characters'
      });
    }

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: currentUserId } // Exclude current user
    })
    .select('firstName lastName email')
    .limit(10);

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching users'
    });
  }
});

// @route   GET /api/users/leaderboard
// @desc    Get top users by tokens sent/received
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'sent', limit = 10 } = req.query;
    
    let pipeline = [];
    
    if (type === 'sent') {
      pipeline = [
        { $match: { transactionType: 'SEND' } },
        { $group: { _id: '$sender', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $project: { 'user.password': 0 } }
      ];
    } else if (type === 'received') {
      pipeline = [
        { $match: { transactionType: 'SEND' } },
        { $group: { _id: '$recipient', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $project: { 'user.password': 0 } }
      ];
    }

    const leaderboard = await TokenTransaction.aggregate(pipeline);

    res.json({
      success: true,
      type,
      leaderboard
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard'
    });
  }
});

module.exports = router; 