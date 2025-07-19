# Marvel Movies API

A REST API server that provides information about Marvel movies and actors using The Movie Database (TMDB) API. This service answers questions about Marvel movies, actors, and their relationships.

## Features

- **Movies per Actor**: Find which Marvel movies each actor has appeared in
- **Actors with Multiple Characters**: Identify actors who have played more than one Marvel character
- **Characters with Multiple Actors**: Find roles that have been played by different actors
- **Redis Caching**: Improved performance with Redis caching
- **Swagger Documentation**: Interactive API documentation
- **Comprehensive Logging**: Structured logging with Winston
- **Unit & Integration Tests**: Test coverage for reliability

## Prerequisites

- Node.js (v18 or higher)
- Redis server (for caching)
- TMDB API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend_assignment_skeleton
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   The `.env` file is already configured with the required TMDB API key. You can modify it if needed:
   
   ```bash
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # TMDB API Configuration
   TMDB_API_KEY=ac505a02032a33d65dd28b41f72182e1
   TMDB_BASE_URL=https://api.themoviedb.org/3
   
   # Redis Configuration (update with your Redis instance)
   REDIS_URL=redis://localhost:6379
   
   # Cache Configuration
   CACHE_TTL_SECONDS=3600
   CACHE_ENABLED=true
   
   # Logging Configuration
   LOG_LEVEL=debug
   ```

4. **Start Redis server**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine
   
   # Or using local Redis installation
   redis-server
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Available Endpoints

#### 1. Movies Per Actor
```http
GET /api/moviesPerActor
```
Returns a list of Marvel movies each actor has appeared in.

**Response:**
```json
{
  "Robert Downey Jr.": ["Iron Man", "Iron Man 2", "The Avengers"],
  "Chris Evans": ["Captain America: The First Avenger", "The Avengers"]
}
```

#### 2. Actors with Multiple Characters
```http
GET /api/actorsWithMultipleCharacters
```
Returns actors who have played more than one Marvel character.

**Response:**
```json
{
  "Chris Evans": [
    {"movieName": "Fantastic Four (2005)", "characterName": "Johnny Storm"},
    {"movieName": "Captain America: The First Avenger", "characterName": "Steve Rogers"}
  ]
}
```

#### 3. Characters with Multiple Actors
```http
GET /api/charactersWithMultipleActors
```
Returns characters that have been played by more than one actor.

**Response:**
```json
{
  "Bruce Banner": [
    {"movieName": "The Incredible Hulk", "actorName": "Edward Norton"},
    {"movieName": "The Avengers", "actorName": "Mark Ruffalo"}
  ]
}
```

#### 4. Clear Cache
```http
POST /api/cache/clear
```
Clears all cached data.

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

#### 5. Health Check
```http
GET /health
```
Returns API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## API Documentation

Interactive Swagger documentation is available at:
```
http://localhost:3000/api-docs
```

## Testing

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

## Project Structure

```
├── src/
│   ├── index.js              # Main server file
│   ├── routes/
│   │   └── marvelRoutes.js   # API routes
│   ├── services/
│   │   ├── marvelService.js  # Business logic
│   │   └── tmdbService.js    # TMDB API client
│   └── utils/
│       ├── config.js         # Configuration management
│       ├── logger.js         # Logging utility
│       ├── redisCache.js     # Redis caching utility
│       └── swagger.js        # Swagger documentation setup
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── dataForQuestions.js       # Marvel movies and actors data
├── .env                      # Environment variables
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Technologies Used

- **Express.js**: Web framework
- **Lodash**: Utility library for data manipulation
- **Redis**: In-memory caching
- **Swagger**: API documentation
- **Winston**: Logging
- **Jest**: Testing framework
- **Axios**: HTTP client for TMDB API

## Architecture Features

### Caching Strategy
- **Generic Redis cache** - Reusable for any application
- **Namespaced caching** - Organized by `namespace:id` pattern
- **Bulk operations** - Efficient batch get/set operations
- **Pattern-based cleanup** - Selective cache invalidation
- **Configurable TTL** - Time To Live for all cached data
- **Graceful fallback** - Continues without Redis when unavailable

### Error Handling
- Comprehensive error logging
- Graceful degradation when services are unavailable
- Proper HTTP status codes
- Structured error responses

### Performance Optimization
- Parallel API calls to TMDB
- Efficient data processing with Lodash
- Memory-efficient data structures
- Request-level caching

### Scalability
- Modular service architecture with clean separation of concerns
- Configurable timeouts and retry logic
- Environment-based configuration
- Stateless design for horizontal scaling
- Singleton Redis connection for resource efficiency

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `TMDB_API_KEY` | TMDB API key | Required |
| `TMDB_BASE_URL` | TMDB API base URL | `https://api.themoviedb.org/3` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CACHE_TTL_SECONDS` | Cache TTL in seconds | `3600` |
| `CACHE_ENABLED` | Enable/disable caching | `true` |
| `LOG_LEVEL` | Logging level | `info` |

## Development

### Code Style
- ES6+ modules
- Async/await for asynchronous operations
- Comprehensive error handling
- Structured logging
- Clean service architecture with dependency injection

### Testing
- Unit tests for individual components
- Integration tests for API endpoints
- Data validation tests
- Mocking for external dependencies

## Production Considerations

1. **Redis Setup**: Use a production Redis instance with persistence
2. **Environment Variables**: Set appropriate values for production
3. **Logging**: Configure file logging for production
4. **Monitoring**: Add health checks and monitoring
5. **Rate Limiting**: Consider API rate limiting for production use
6. **HTTPS**: Use HTTPS in production
7. **Process Management**: Use PM2 or similar for process management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please contact the development team or create an issue in the repository.