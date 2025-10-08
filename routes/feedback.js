const express = require('express');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit user suggestions/feedback
// @access  Public
router.post('/', [
  body('message')
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('name')
    .optional({ checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, message } = req.body;

    const feedbackTo = process.env.FEEDBACK_TO || process.env.EMAIL_USER;
    if (!feedbackTo) {
      return res.status(500).json({
        success: false,
        message: 'Feedback recipient email is not configured'
      });
    }

    const safeName = (name || 'Anonymous').toString().slice(0, 100);
    const safeEmail = (email || 'not provided').toString();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2>New Feedback Submitted</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <div style="white-space: pre-wrap; line-height: 1.5; border: 1px solid #eee; padding: 12px; border-radius: 8px;">${message}</div>
      </div>
    `;

    await sendEmail({
      to: feedbackTo,
      subject: 'Token of Thanks - New User Feedback',
      html
    });

    return res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting feedback'
    });
  }
});

module.exports = router;


