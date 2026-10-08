require('dotenv').config();

for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    // Throw instead of process.exit so serverless platforms show a readable error.
    throw new Error(`Missing required environment variable: ${key} (see .env.example)`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
