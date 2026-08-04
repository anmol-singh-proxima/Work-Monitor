const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');

const dataFilePath = env.worklogDataFile;

async function ensureDataFile() {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch (error) {
    await fs.writeFile(dataFilePath, '{}\n', 'utf8');
  }
}

async function readAll() {
  await ensureDataFile();

  try {
    const rawData = await fs.readFile(dataFilePath, 'utf8');
    return rawData.trim() ? JSON.parse(rawData) : {};
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createStorageError('The worklog data file contains invalid JSON.');
    }

    throw createStorageError('Unable to read the worklog data file.');
  }
}

async function writeAll(worklogs) {
  await ensureDataFile();

  try {
    const tmpFilePath = `${dataFilePath}.tmp`;
    await fs.writeFile(tmpFilePath, `${JSON.stringify(worklogs, null, 2)}\n`, 'utf8');
    await fs.rename(tmpFilePath, dataFilePath);
  } catch (error) {
    throw createStorageError('Unable to save the worklog data file.');
  }
}

function createStorageError(message) {
  const error = new Error(message);
  error.statusCode = 500;
  return error;
}

module.exports = {
  readAll,
  writeAll
};
