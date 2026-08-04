const path = require('path');
const dotenv = require('dotenv');

const projectRoot = path.join(__dirname, '..', '..');

dotenv.config({
  path: path.join(projectRoot, '.env'),
  quiet: true
});

function parsePort(value) {
  const port = Number(value || 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a number between 1 and 65535.');
  }

  return port;
}

function resolveProjectPath(value, fallback) {
  return path.resolve(projectRoot, value || fallback);
}

module.exports = {
  port: parsePort(process.env.PORT),
  worklogDataFile: resolveProjectPath(
    process.env.WORKLOG_DATA_FILE,
    'server/data/worklog.json'
  )
};
