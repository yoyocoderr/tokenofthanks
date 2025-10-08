# Token of Thanks - Backend API

Node.js Express backend for the Token of Thanks digital gratitude platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Gmail account (for email notifications)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT tokens
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Tokens
- `POST /api/tokens/buy` - Buy tokens (simulated)
- `POST /api/tokens/send` - Send tokens to another user
- `GET /api/tokens/history` - Get transaction history
- `GET /api/tokens/balance` - Get current token balance

### Rewards
- `GET /api/rewards` - Get all available rewards
- `GET /api/rewards/:id` - Get specific reward
- `POST /api/rewards/:id/redeem` - Redeem a reward
- `GET /api/rewards/categories/:category` - Get rewards by category

### Users
- `GET /api/users/profile` - Get user profile with stats
- `GET /api/users/search` - Search users by email
- `GET /api/users/leaderboard` - Get top users

## 🗄️ Database Models

### User
- Email, password, first/last name
- Token balance
- Profile information

### TokenTransaction
- Sender and recipient
- Amount and message
- Transaction type (SEND, RECEIVE, PURCHASE, REDEEM)
- Timestamps and metadata

### Reward
- Name, description, token cost
- Category and availability
- Stock management

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRE`: JWT expiration time
- `EMAIL_HOST`: SMTP host (default: smtp.gmail.com)
- `EMAIL_PORT`: SMTP port (default: 587)
- `EMAIL_USER`: Gmail address
- `EMAIL_PASS`: Gmail app password
- `FRONTEND_URL`: Frontend URL for CORS

## 📧 Email Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

## 🚀 Deployment

### Render/Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Environment Variables for Production
```bash
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secure_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
FRONTEND_URL=https://your-frontend-domain.com
```

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Input validation
- Helmet security headers

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (placeholder)

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB connection failed**: Check your connection string and network access
2. **Email not sending**: Verify Gmail app password and 2FA settings
3. **JWT errors**: Ensure JWT_SECRET is set and consistent

### Logs
Check console output for detailed error messages and debugging information. 