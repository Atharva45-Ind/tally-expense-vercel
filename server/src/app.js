const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { clientOrigins, nodeEnv } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Behind Vercel's proxy: needed so rate limiting sees the real client IP.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: clientOrigins }));
app.use(express.json({ limit: '100kb' }));
if (nodeEnv !== 'test') app.use(morgan('dev'));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
