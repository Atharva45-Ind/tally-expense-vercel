// Vercel serverless entry point: wraps the Express app and reuses one MongoDB
// connection across warm invocations (a new connection per request would
// exhaust Atlas connection limits).
const mongoose = require('mongoose');
const app = require('../server/src/app');
const { mongoUri } = require('../server/src/config/env');

mongoose.set('strictQuery', true);

const cache = global.__mongoose || (global.__mongoose = { promise: null });

function connect() {
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 })
      .catch((err) => {
        cache.promise = null; // allow retry on the next request
        throw err;
      });
  }
  return cache.promise;
}

module.exports = async (req, res) => {
  try {
    await connect();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Database unavailable' }));
  }
  return app(req, res);
};
