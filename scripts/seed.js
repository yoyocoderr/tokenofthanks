const mongoose = require('mongoose');
const Reward = require('../models/Reward');
require('dotenv').config();

const sampleRewards = [
  {
    name: 'Coffee Voucher',
    description: 'Enjoy a delicious coffee at your favorite café. Perfect for a morning pick-me-up or afternoon break.',
    tokenCost: 5,
    category: 'FOOD',
    stock: 50,
    terms: 'Valid for 30 days. Cannot be combined with other offers.'
  },
  {
    name: 'Movie Ticket',
    description: 'Watch the latest blockbuster at any major cinema. Perfect for a date night or family outing.',
    tokenCost: 15,
    category: 'ENTERTAINMENT',
    stock: 25,
    terms: 'Valid for 60 days. Subject to availability.'
  },
  {
    name: 'Book Store Gift Card',
    description: 'Get lost in a good book with this gift card to your local bookstore.',
    tokenCost: 10,
    category: 'SHOPPING',
    stock: 30,
    terms: 'Valid for 90 days. Can be used online or in-store.'
  },
  {
    name: 'Spa Day Experience',
    description: 'Treat yourself to a relaxing spa day with massage and facial treatment.',
    tokenCost: 50,
    category: 'EXPERIENCE',
    stock: 10,
    terms: 'Valid for 6 months. Advance booking required.'
  },
  {
    name: 'Restaurant Dinner',
    description: 'Enjoy a fine dining experience at a premium restaurant.',
    tokenCost: 25,
    category: 'FOOD',
    stock: 20,
    terms: 'Valid for 45 days. Reservation required.'
  },
  {
    name: 'Concert Tickets',
    description: 'Experience live music with tickets to upcoming concerts.',
    tokenCost: 30,
    category: 'ENTERTAINMENT',
    stock: 15,
    terms: 'Valid for 90 days. Subject to availability.'
  },
  {
    name: 'Online Shopping Credit',
    description: 'Shop online with credit at major retailers.',
    tokenCost: 20,
    category: 'SHOPPING',
    stock: 40,
    terms: 'Valid for 120 days. Can be used at participating stores.'
  },
  {
    name: 'Adventure Activity',
    description: 'Try something new with an adventure activity like rock climbing or zip lining.',
    tokenCost: 35,
    category: 'EXPERIENCE',
    stock: 12,
    terms: 'Valid for 3 months. Safety equipment provided.'
  },
  {
    name: 'Dessert Treat',
    description: 'Indulge in a sweet treat at a local bakery or dessert shop.',
    tokenCost: 8,
    category: 'FOOD',
    stock: 60,
    terms: 'Valid for 30 days. Cannot be combined with other offers.'
  },
  {
    name: 'Streaming Service Credit',
    description: 'Enjoy your favorite shows and movies with streaming service credit.',
    tokenCost: 12,
    category: 'ENTERTAINMENT',
    stock: 35,
    terms: 'Valid for 60 days. Can be used for monthly subscriptions.'
  },
  {
    name: 'Fitness Class Pass',
    description: 'Stay healthy with a pass to fitness classes like yoga, pilates, or spinning.',
    tokenCost: 18,
    category: 'EXPERIENCE',
    stock: 25,
    terms: 'Valid for 45 days. Class schedule available online.'
  },
  {
    name: 'Art Supplies Kit',
    description: 'Unleash your creativity with a complete art supplies kit.',
    tokenCost: 22,
    category: 'SHOPPING',
    stock: 18,
    terms: 'Valid for 90 days. Kit includes various art materials.'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain a minimum of 2 socket connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
    });
    console.log('Connected to MongoDB');

    // Clear existing rewards
    await Reward.deleteMany({});
    console.log('Cleared existing rewards');

    // Insert sample rewards
    const insertedRewards = await Reward.insertMany(sampleRewards);
    console.log(`Successfully inserted ${insertedRewards.length} rewards`);

    // Display inserted rewards
    console.log('\nInserted rewards:');
    insertedRewards.forEach(reward => {
      console.log(`- ${reward.name} (${reward.tokenCost} tokens)`);
    });

    console.log('\nDatabase seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 