import "dotenv/config";
import express from "express";
import swaggerUI from "swagger-ui-express";
import cors from "cors";
import appRoutes from "./routes/appRoutes.js";
import logger from "./utils/logger.js";
import { RedisCache } from "./infrastructure/redis.js";
import { specs } from "./utils/swagger.js";
import { MoviesService } from "./services/moviesService.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Enhanced security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  next();
});

app.use("/", appRoutes);
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

const startApplicationServer = async () => {
  try {
    const redisClient = RedisCache.getInstance();
    await redisClient.connect();
    logger.info("Database connection initialized");

    const moviesService = MoviesService.getInstance();
    await moviesService.initializeCache();

    const serverPort = process.env.PORT || 3000;
    app.listen(serverPort, () => {
      logger.info(`Application listening on port ${serverPort}`);
      logger.info(`Swagger documentation endpoint: /docs`);
    });
  } catch (error) {
    logger.error("Failed to initialize server:", error);
    process.exit(1);
  }
};

startApplicationServer();
