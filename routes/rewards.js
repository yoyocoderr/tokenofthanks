const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Reward = require('../models/Reward');
const TokenTransaction = require('../models/TokenTransaction');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rewards
// @desc    Get all available rewards
// @access  Public
router.get('/', async (req, res) => {
  try {
    const rewards = await Reward.find({ isActive: true }).sort({ tokenCost: 1 });
    
    res.json({
      success: true,
      rewards
    });

  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rewards'
    });
  }
});

// @route   GET /api/rewards/:id
// @desc    Get specific reward by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    res.json({
      success: true,
      reward
    });

  } catch (error) {
    console.error('Get reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reward'
    });
  }
});

// @route   POST /api/rewards/:id/redeem
// @desc    Redeem a reward
// @access  Private
router.post('/:id/redeem', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const rewardId = req.params.id;

    // Find the reward
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    if (!reward.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This reward is no longer available'
      });
    }

    // Check if reward is in stock
    if (reward.stock === 0) {
      return res.status(400).json({
        success: false,
        message: 'This reward is out of stock'
      });
    }

    // Find user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!reward.canAfford(user.tokenBalance)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient token balance',
        required: reward.tokenCost,
        current: user.tokenBalance
      });
    }

    // Update user's token balance
    await user.updateTokenBalance(-reward.tokenCost);

    // Update reward stock if applicable
    await reward.redeem();

    // Create transaction record
    const transaction = new TokenTransaction({
      sender: userId,
      recipient: userId, // Self-transaction for redemption
      amount: -reward.tokenCost,
      message: `Redeemed: ${reward.name}`,
      transactionType: 'REDEEM',
      metadata: {
        rewardId: reward._id,
        rewardName: reward.name,
        redemptionCode: reward.redemptionCode
      }
    });

    await transaction.save();

    res.json({
      success: true,
      message: `Successfully redeemed ${reward.name}`,
      newBalance: user.tokenBalance,
      redemptionCode: reward.redemptionCode,
      transaction: transaction
    });

  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while redeeming reward'
    });
  }
});

// @route   GET /api/rewards/categories/:category
// @desc    Get rewards by category
// @access  Public
router.get('/categories/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['FOOD', 'ENTERTAINMENT', 'SHOPPING', 'EXPERIENCE', 'OTHER'];
    
    if (!validCategories.includes(category.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const rewards = await Reward.find({
      category: category.toUpperCase(),
      isActive: true
    }).sort({ tokenCost: 1 });

    res.json({
      success: true,
      category: category.toUpperCase(),
      rewards
    });

  } catch (error) {
    console.error('Get rewards by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching rewards by category'
    });
  }
});

module.exports = router; 