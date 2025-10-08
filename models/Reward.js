const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Reward name is required'],
    trim: true,
    maxlength: [100, 'Reward name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Reward description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tokenCost: {
    type: Number,
    required: [true, 'Token cost is required'],
    min: [1, 'Token cost must be at least 1']
  },
  category: {
    type: String,
    enum: ['FOOD', 'ENTERTAINMENT', 'SHOPPING', 'EXPERIENCE', 'OTHER'],
    default: 'OTHER'
  },
  imageUrl: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: -1, // -1 means unlimited
    min: [-1, 'Stock cannot be less than -1']
  },
  redemptionCode: {
    type: String,
    default: null
  },
  terms: {
    type: String,
    maxlength: [1000, 'Terms cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
rewardSchema.index({ category: 1, isActive: 1 });
rewardSchema.index({ tokenCost: 1 });

// Virtual for availability status
rewardSchema.virtual('isAvailable').get(function() {
  return this.isActive && (this.stock === -1 || this.stock > 0);
});

// Method to check if user can afford this reward
rewardSchema.methods.canAfford = function(userTokenBalance) {
  return userTokenBalance >= this.tokenCost;
};

// Method to redeem reward (decrease stock if applicable)
rewardSchema.methods.redeem = async function() {
  if (this.stock > 0) {
    this.stock -= 1;
    await this.save();
  }
  return this;
};

module.exports = mongoose.model('Reward', rewardSchema); 