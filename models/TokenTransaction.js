const mongoose = require('mongoose');

const tokenTransactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Token amount is required'],
    validate: {
      validator: function(value) {
        // For SEND/RECEIVE/PURCHASE, amount should be positive
        // For REDEEM, amount can be negative (debit)
        if (this.transactionType === 'REDEEM') {
          return value < 0;
        }
        return value > 0;
      },
      message: 'Invalid amount for transaction type'
    }
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters'],
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['SEND', 'RECEIVE', 'PURCHASE', 'REDEEM'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
tokenTransactionSchema.index({ sender: 1, createdAt: -1 });
tokenTransactionSchema.index({ recipient: 1, createdAt: -1 });
tokenTransactionSchema.index({ transactionType: 1, createdAt: -1 });

// Virtual for formatted date
tokenTransactionSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to get user transaction history
tokenTransactionSchema.statics.getUserHistory = async function(userId, limit = 20, skip = 0) {
  return await this.find({
    $or: [{ sender: userId }, { recipient: userId }]
  })
  .populate('sender', 'firstName lastName email')
  .populate('recipient', 'firstName lastName email')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get recent transactions
tokenTransactionSchema.statics.getRecentTransactions = async function(limit = 10) {
  return await this.find({ status: 'COMPLETED' })
  .populate('sender', 'firstName lastName')
  .populate('recipient', 'firstName lastName')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('TokenTransaction', tokenTransactionSchema); 