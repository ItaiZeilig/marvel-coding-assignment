# Movies API

A Node.js REST API that provides movie and actor information using The Movie Database (TMDB) API. The API analyzes relationships between actors, characters, and movies with Redis caching for optimal performance.

## 🎬 What This API Does

This Movies API provides three main analytical endpoints:

1. **Movies Per Actor** - Shows all movies each actor has appeared in
2. **Actors with Multiple Characters** - Finds actors who have played more than one character
3. **Characters with Multiple Actors** - Identifies characters that have been portrayed by different actors

The API uses TMDB (The Movie Database) as its data source and implements Redis caching for fast response times.

## 🛠 Tech Stack

- **Node.js** (ES Modules)
- **Express.js** - Web framework
- **Redis** - Caching layer
- **Axios** - HTTP client for TMDB API
- **Lodash** - Utility functions
- **Winston** - Logging
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework
- **SuperTest** - HTTP testing

## 📋 Prerequisites

- Node.js (v16 or higher)
- Redis server
- TMDB API key

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd backend_assignment_skeleton
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required
TMDB_API_KEY=your_tmdb_api_key_here
REDIS_URL=redis://localhost:6379

# Optional (with defaults)
PORT=3000
NODE_ENV=development
CACHE_TTL_SECONDS=3600
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_TIMEOUT_MS=500
```

### 3. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using local Redis installation
redis-server
```

### 4. Run the Application

```bash
# Development mode (with file watching)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Interactive Documentation
Visit `http://localhost:3000/docs` for Swagger UI documentation.

### Base URL
```
http://localhost:3000
```

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "services": {
    "redis": "connected",
    "cache": "enabled"
  }
}
```

#### Root Information
```http
GET /
```

**Response:**
```json
{
  "message": "Movies API",
  "documentation": "/docs",
  "endpoints": {
    "moviesPerActor": "/moviesPerActor",
    "actorsWithMultipleCharacters": "/actorsWithMultipleCharacters",
    "charactersWithMultipleActors": "/charactersWithMultipleActors"
  }
}
```

#### Movies Per Actor
```http
GET /moviesPerActor
```

Returns all movies each actor has appeared in.

**Response:**
```json
{
  "Robert Downey Jr.": [
    "Iron Man",
    "Iron Man 2", 
    "The Avengers",
    "Iron Man 3"
  ],
  "Chris Evans": [
    "Captain America: The First Avenger",
    "The Avengers",
    "Captain America: The Winter Soldier"
  ]
}
```

#### Actors with Multiple Characters
```http
GET /actorsWithMultipleCharacters
```

Returns actors who have played more than one character.

**Response:**
```json
{
  "Actor Name": [
    "Character 1",
    "Character 2"
  ]
}
```

#### Characters with Multiple Actors
```http
GET /charactersWithMultipleActors
```

Returns characters that have been played by different actors.

**Response:**
```json
{
  "Character Name": [
    "Actor 1",
    "Actor 2"
  ]
}
```

#### Clear Cache (Development)
```http
POST /clearCache
```

Clears the Redis cache.

**Response:**
```json
{
  "message": "Cache cleared successfully",
  "deletedKeys": 42
}
```

## 📚 API Documentation

Interactive Swagger documentation is available at:
```
http://localhost:3000/docs
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Test Structure
```
tests/
├── unit/                 # Unit tests
│   ├── movies.test.js
│   ├── moviesService.test.js
│   ├── redisCache.test.js
│   └── tmdbService.test.js
└── integration/          # Integration tests
    └── app.integration.test.js
```

## 🏗 Project Structure

```
src/
├── index.js              # Application entry point
├── routes/
│   └── appRoutes.js      # API route definitions
├── services/
│   └── moviesService.js  # Business logic
├── clients/
│   └── tmdbService.js    # TMDB API client
├── infrastructure/
│   └── redis.js          # Redis cache implementation
└── utils/
    ├── config.js         # Configuration management
    ├── logger.js         # Winston logger setup
    ├── swagger.js        # Swagger documentation
    ├── constants.js      # Application constants
    └── movies.js         # Movie utility functions
```

## ⚙️ Configuration

The application uses environment variables for configuration. All settings are centralized in `src/utils/config.js`.

### Required Environment Variables
- `TMDB_API_KEY` - Your TMDB API key
- `REDIS_URL` - Redis connection URL

### Optional Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (default: development)
- `CACHE_TTL_SECONDS` - Cache expiration time (default: 3600)
- `LOG_LEVEL` - Logging level (default: info)

## 🔧 Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with file watching
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Logging
The application uses Winston for structured logging. Logs include:
- Request/response information
- Error details with stack traces
- Performance metrics
- Cache hit/miss statistics

### Caching Strategy
- Redis is used for caching TMDB API responses
- Cache TTL is configurable via environment variables
- Cache keys are namespaced for easy management
- Automatic cache invalidation for testing

## 🚨 Error Handling

The API implements comprehensive error handling:
- Validation of required environment variables
- TMDB API error handling with retries
- Redis connection error handling
- Structured error responses with appropriate HTTP status codes

## 📝 API Usage Examples

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get movies per actor
curl http://localhost:3000/moviesPerActor

# Get actors with multiple characters
curl http://localhost:3000/actorsWithMultipleCharacters

# Get characters with multiple actors
curl http://localhost:3000/charactersWithMultipleActors

# Clear cache
curl -X POST http://localhost:3000/clearCache
```

### Using JavaScript/Fetch

```javascript
// Get movies per actor
const response = await fetch('http://localhost:3000/moviesPerActor');
const moviesPerActor = await response.json();
console.log(moviesPerActor);

// Clear cache
const clearResponse = await fetch('http://localhost:3000/clearCache', {
  method: 'POST'
});
const result = await clearResponse.json();
console.log(result);
```

## 🔐 Security Features

- CORS enabled
- Security headers implemented
- Input validation
- Environment variable validation
- No sensitive data in logs

## 📊 Performance

- Redis caching for fast response times
- TMDB API rate limiting compliance
- Batch processing for multiple API calls
- Connection pooling for Redis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

ISC License