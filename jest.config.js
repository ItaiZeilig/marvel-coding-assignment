export default {
  // Test environment
  testEnvironment: "node",

  // Enable ES modules support
  preset: null,
  globals: {
    NODE_OPTIONS: "--experimental-vm-modules",
  },

  // Transform configuration for ES modules
  transform: {},

  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.js",
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js",
  ],

  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js", // Exclude main entry point
    "!**/node_modules/**",
    "!**/tests/**",
  ],

  // Setup files
  setupFilesAfterEnv: [],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance
  maxWorkers: "50%",
};
