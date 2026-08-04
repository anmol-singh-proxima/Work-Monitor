const express = require('express');
const path = require('path');
const env = require('./config/env');
const worklogRoutes = require('./routes/worklogRoutes');

const app = express();
const port = env.port;
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/worklog', worklogRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use(express.static(clientBuildPath));

app.get('*', (req, res, next) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'), (error) => {
    if (error) {
      next(error);
    }
  });
});

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = status === 500
    ? 'Something went wrong while processing your request.'
    : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Work Monitor is running at http://localhost:${port}`);
});
