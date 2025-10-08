const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const router = express.Router();


// @route   POST /api/tokens/send
// @desc    Send tokens to another user
// @access  Private
router.post('/send', [
  auth,
  body('recipientEmail').isEmail().normalizeEmail().withMessage('Please enter a valid recipient email'),
  body('amount').isInt({ min: 1 }).toInt().withMessage('Amount must be at least 1'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipientEmail, message } = req.body;
    const amount = Number(req.body.amount);
    const senderId = req.user.userId;

    // Check if sender has enough tokens
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    if (sender.tokenBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient token balance'
      });
    }

    // Find recipient
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Prevent sending to self
    if (senderId === recipient._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send tokens to yourself'
      });
    }

    // Update token balances
    await sender.updateTokenBalance(-amount);
    await recipient.updateTokenBalance(amount);

    // Create transaction record
    const transaction = new TokenTransaction({
      sender: senderId,
      recipient: recipient._id,
      amount: amount,
      message: message,
      transactionType: 'SEND'
    });

    await transaction.save();

    // Send email notification to recipient
    try {
      await sendEmail({
        to: recipient.email,
        subject: 'You received tokens of gratitude! 🎉',
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #6C63FF 0%, #9D8CFF 100%); padding: 20px; border-radius: 15px; color: white;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 You received ${amount} tokens!</h1>
            </div>
            
            <div style="background: rgba(255, 255, 255, 0.1); padding: 25px; border-radius: 10px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>From:</strong> ${sender.fullName}</p>
              <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>Message:</strong> "${message}"</p>
              <p style="margin: 0; font-size: 16px;"><strong>Your new balance:</strong> ${recipient.tokenBalance} tokens</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Thank you for spreading kindness! 💜</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.7;">Token of Thanks - Gratitude, Made Effortless</p>
            </div>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the transaction if email fails
    }

    res.json({
      success: true,
      message: `Successfully sent ${amount} tokens to ${recipient.fullName}`,
      newBalance: sender.tokenBalance,
      transaction: transaction
    });

  } catch (error) {
    console.error('Send tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending tokens'
    });
  }
});

// @route   GET /api/tokens/history
// @desc    Get user's transaction history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await TokenTransaction.getUserHistory(userId, limit, skip);
    const total = await TokenTransaction.countDocuments({
      $or: [{ sender: userId }, { recipient: userId }]
    });

    res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction history'
    });
  }
});

// @route   GET /api/tokens/balance
// @desc    Get user's current token balance
// @access  Private
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('tokenBalance');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      balance: user.tokenBalance
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching balance'
    });
  }
});

module.exports = router; 