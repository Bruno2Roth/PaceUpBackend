NO BORRAR POR NADA: Constancia de que arranque 3/6/2026

# 🏃 Pace Up - Backend

Premium running application backend inspired by Strava, Garmin Connect, and Runna. A professional, scalable Node.js architecture for GPS tracking, social networking, rankings, clubs, challenges, and AI-powered training.

## 🎯 Project Overview

Pace Up is a complete backend solution for building a world-class running platform with:

- **GPS Tracking**: Real-time and post-activity GPS data tracking
- **Social Network**: Users, followers, comments, likes
- **Rankings & Leaderboards**: Global and segment rankings
- **Clubs**: Community management and group activities
- **Challenges**: Goals, competitions, and achievements
- **Training Plans**: Structured training programs
- **AI Coach**: AI-powered training recommendations (future)
- **Smartwatch Integration**: Garmin, COROS, Polar, Suunto, Apple, Wear OS
- **Statistics & Analytics**: Comprehensive performance metrics
- **Gamification**: Levels, badges, achievements

## 🏗️ Architecture

```
PACEUP-BACKEND/
├── src/
│   ├── api/
│   │   ├── controllers/     # Request handlers
│   │   └── middlewares/     # Express middlewares
│   ├── app/
│   │   └── app.js          # Express app initialization
│   ├── application/
│   │   ├── entities/       # Domain models
│   │   └── services/       # Business logic
│   ├── configs/            # Configuration files
│   ├── data/
│   │   ├── repositories/   # Data access layer
│   │   └── database/       # DB connection & migrations
│   ├── helpers/            # Utility functions
│   ├── routes/             # API routes
│   ├── validations/        # Input validation
│   ├── jobs/               # Background jobs
│   ├── integrations/       # Third-party integrations
│   │   ├── garmin/
│   │   ├── coros/
│   │   ├── polar/
│   │   ├── suunto/
│   │   ├── apple/
│   │   └── wearos/
│   ├── sockets/            # WebSocket handlers (Socket.io)
│   ├── constants/          # Global constants
│   └── tests/              # Unit & integration tests
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
├── index.js               # Application entry point
└── README.md
```

## 🛠️ Tech Stack

### Core
- **Node.js**: Runtime environment (v18+)
- **Express.js**: Web framework
- **TypeScript** (Optional): For future type safety

### Database
- **PostgreSQL**: Primary relational database
- **Redis**: Caching & real-time features (prepared)

### Security & Authentication
- **JWT**: JSON Web Tokens for stateless authentication
- **Bcryptjs**: Password hashing
- **Helmet**: HTTP headers security
- **CORS**: Cross-origin resource sharing
- **Express Rate Limit**: DDoS protection

### File & Media
- **Multer**: File upload handling
- **Cloudinary**: Cloud media storage

### Location & Maps
- **Mapbox**: GPS mapping and visualization

### Real-time
- **Socket.io**: WebSocket communication (prepared)

### Monitoring & Logging
- **Winston**: Structured logging
- **Morgan**: HTTP request logging

### Development
- **Nodemon**: Auto-reload during development
- **Jest**: Testing framework
- **ESLint**: Code linting

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 12
- **Redis** >= 6.0 (optional, for future features)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd paceup-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=paceup_dev
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

### 4. Setup Database

Create PostgreSQL database:

```sql
CREATE DATABASE paceup_dev;
```

Run migrations:

```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Server will run at `http://localhost:3000`

## 📦 NPM Scripts

```bash
# Development
npm run dev           # Start with auto-reload (Nodemon)

# Production
npm start            # Start server

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Database
npm run migrate      # Run migrations
npm run migrate:rollback # Rollback migrations

# Code Quality
npm run lint         # Fix linting issues
```

## 🔐 API Authentication

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

### Access Protected Routes

```bash
GET /api/users/profile
Authorization: Bearer jwt_token_here
```

## 🗂️ API Endpoints (Base URL: `/api/v1`)

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Users
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /users/:id` - Get user by ID
- `GET /users/:id/activities` - Get user activities
- `GET /users/:id/stats` - Get user statistics

### Activities
- `POST /activities` - Create activity
- `GET /activities` - List activities (paginated)
- `GET /activities/:id` - Get activity details
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity

### Clubs
- `POST /clubs` - Create club
- `GET /clubs` - List clubs
- `GET /clubs/:id` - Get club details
- `PUT /clubs/:id` - Update club
- `POST /clubs/:id/members` - Join club
- `DELETE /clubs/:id/members/:userId` - Leave club

### Challenges
- `POST /challenges` - Create challenge
- `GET /challenges` - List challenges
- `GET /challenges/:id` - Get challenge details
- `POST /challenges/:id/join` - Join challenge

### Routes
- `POST /routes` - Create route
- `GET /routes` - List routes
- `GET /routes/:id` - Get route details

## 🏢 Project Structure Explanation

### `/api/controllers`
Request handlers that process incoming data, call services, and return responses.

### `/application/entities`
Domain models representing core business objects (User, Activity, Club, etc.)

### `/application/services`
Business logic layer implementing use cases and workflows.

### `/data/repositories`
Data access layer providing abstraction for database operations.

### `/data/database`
Database connection pool, migrations, and schema initialization.

### `/api/middlewares`
Express middlewares for authentication, validation, error handling, rate limiting.

### `/routes`
API route definitions and endpoint mappings.

### `/validations`
Input validation rules using express-validator.

### `/helpers`
Utility functions (distance calculation, pace calculation, date formatting, etc.)

### `/configs`
Configuration modules for database, environment, logger, Redis, Cloudinary, Mapbox.

### `/integrations`
Third-party service integrations (Garmin, COROS, Polar, Suunto, Apple, Wear OS).

### `/jobs`
Background job workers (weekly reports, ranking calculations, achievements).

### `/sockets`
WebSocket event handlers for real-time features.

### `/constants`
Global constants (roles, activity types, achievement types, levels).

## 🔒 Security Features

- **Helmet**: Sets secure HTTP headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Protects against brute force and DDoS
- **JWT**: Stateless authentication with expiration
- **Bcryptjs**: Secure password hashing with salt rounds
- **Input Validation**: Express validator on all endpoints
- **Error Handling**: Safe error responses without leaking stack traces

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `activities` - Running activities with GPS data
- `routes` - Saved running routes
- `segments` - Route segments for leaderboards
- `clubs` - Running clubs
- `challenges` - Running challenges
- `followers` - User relationships
- `comments` - Activity comments
- `likes` - Activity likes
- `achievements` - User achievements
- `levels` - User levels and progression
- `notifications` - User notifications

## 🔄 Integration Points

### Garmin
OAuth 2.0 integration for automatic activity sync.

### COROS
API integration for device synchronization.

### Polar
OAuth integration for training data.

### Suunto
Sport watch data synchronization.

### Apple Health
HealthKit framework integration.

### Wear OS
Android fitness integration.

## ⚙️ Configuration Management

All configuration is environment-based:

```javascript
// configs/environment.js
export const config = {
  node_env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiration: process.env.JWT_EXPIRATION,
  },
  // ... more config
};
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Environment Setup

Update `.env` for production:

```env
NODE_ENV=production
PORT=8080
DB_HOST=prod_db_host
DB_USER=prod_db_user
DB_PASSWORD=prod_db_password
JWT_SECRET=strong_random_secret
```

### Using pm2

```bash
npm install -g pm2
pm2 start index.js --name "paceup-api"
pm2 save
pm2 startup
```

### Using Docker (optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY index.js .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add new feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📝 Code Standards

- **ES Modules**: Uses `import/export` syntax
- **Async/Await**: All async operations use async/await
- **Clean Code**: SOLID principles and clean architecture
- **Naming**: Descriptive names for variables and functions
- **Error Handling**: Centralized error handling with specific error types
- **Logging**: Structured logging with Winston

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Solution: Ensure PostgreSQL is running and credentials are correct in `.env`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Change PORT in `.env` or kill process using port 3000

### JWT Token Expired
Token expires after duration specified in `JWT_EXPIRATION`. Use refresh token endpoint to get new token.

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JWT.io](https://jwt.io)
- [Mapbox API](https://docs.mapbox.com)
- [Socket.io Guide](https://socket.io/docs)

## 📄 License

MIT License - See LICENSE file for details

## 👥 Team

Pace Up Development Team

---

**Built with ❤️ for the running community**
