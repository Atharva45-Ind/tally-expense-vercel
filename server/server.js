const { port } = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');

(async () => {
  await connectDB();
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
})().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
