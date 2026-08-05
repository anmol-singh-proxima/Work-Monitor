const worklogService = require('../services/worklogService');

async function getDailyWorklog(req, res, next) {
  try {
    const day = await worklogService.getDailyWorklog(req.params.date);
    res.json(day);
  } catch (error) {
    next(error);
  }
}

async function getWeeklyWorklog(req, res, next) {
  try {
    const week = await worklogService.getWeeklyWorklog(req.params.date);
    res.json(week);
  } catch (error) {
    next(error);
  }
}

async function createSession(req, res, next) {
  try {
    const day = await worklogService.createSession(req.params.date, req.body);
    res.status(201).json(day);
  } catch (error) {
    next(error);
  }
}

async function updateSession(req, res, next) {
  try {
    const day = await worklogService.updateSession(req.params.date, req.params.id, req.body);
    res.json(day);
  } catch (error) {
    next(error);
  }
}

async function deleteSession(req, res, next) {
  try {
    const day = await worklogService.deleteSession(req.params.date, req.params.id);
    res.json(day);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDailyWorklog,
  getWeeklyWorklog,
  createSession,
  updateSession,
  deleteSession
};
