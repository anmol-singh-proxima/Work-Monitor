const repository = require('./fileWorklogRepository');

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError('Date must use YYYY-MM-DD format.');
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw createError('Date is invalid.');
  }
}

function parseDateValue(date) {
  validateDate(date);
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateValue(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, dayOffset) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset);
  return nextDate;
}

function getMondayForDate(date) {
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return addDays(date, -daysSinceMonday);
}

function getWeekDateValues(date) {
  const weekStartDate = getMondayForDate(parseDateValue(date));

  return Array.from({ length: 7 }, (_, index) => (
    formatDateValue(addDays(weekStartDate, index))
  ));
}

function validateYear(year) {
  if (!/^\d{4}$/.test(String(year))) {
    throw createError('Year must be a 4-digit number.');
  }
}

function getMonthDateValues(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) => (
    formatDateValue(new Date(Date.UTC(year, month - 1, index + 1)))
  ));
}

function summarizeDays(days) {
  const totalMinutes = days.reduce((total, day) => total + day.totalMinutes, 0);
  const activeDays = days.filter((day) => day.sessionsCount > 0).length;
  const averageMinutes = activeDays ? Math.round(totalMinutes / activeDays) : 0;

  return { totalMinutes, activeDays, averageMinutes };
}

function parseTimeToMinutes(time, fieldName) {
  if (!time) {
    throw createError(`${fieldName} is required.`);
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) {
    throw createError(`${fieldName} must use 24-hour HH:MM format, for example 09:00 or 14:30.`);
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function calculateDuration(startTime, endTime) {
  const startMinutes = parseTimeToMinutes(startTime, 'Start time');
  const endMinutes = parseTimeToMinutes(endTime, 'End time');

  if (endMinutes <= startMinutes) {
    throw createError('End time must be after start time.');
  }

  return endMinutes - startMinutes;
}

function normalizeSessionInput(input) {
  const startTime = typeof input.startTime === 'string' ? input.startTime.trim() : '';
  const endTime = typeof input.endTime === 'string' ? input.endTime.trim() : '';
  const duration = calculateDuration(startTime, endTime);

  return {
    startTime,
    endTime,
    duration
  };
}

function recalculateDay(day = { sessions: [] }) {
  const sessions = Array.isArray(day.sessions) ? day.sessions : [];
  const normalizedSessions = sessions.map((session) => ({
    id: Number(session.id),
    startTime: session.startTime,
    endTime: session.endTime,
    duration: calculateDuration(session.startTime, session.endTime)
  }));

  return {
    sessions: normalizedSessions,
    totalMinutes: normalizedSessions.reduce((total, session) => total + session.duration, 0)
  };
}

function buildResponse(date, day) {
  return {
    date,
    ...recalculateDay(day)
  };
}

function getNextSessionId(sessions) {
  return sessions.reduce((maxId, session) => Math.max(maxId, Number(session.id) || 0), 0) + 1;
}

async function getDailyWorklog(date) {
  validateDate(date);
  const worklogs = await repository.readAll();
  return buildResponse(date, worklogs[date]);
}

async function getWeeklyWorklog(date) {
  validateDate(date);
  const worklogs = await repository.readAll();
  const weekDates = getWeekDateValues(date);
  const days = weekDates.map((weekDate) => {
    const day = recalculateDay(worklogs[weekDate]);

    return {
      date: weekDate,
      sessionsCount: day.sessions.length,
      totalMinutes: day.totalMinutes
    };
  });

  return {
    weekStartDate: weekDates[0],
    weekEndDate: weekDates[6],
    days,
    ...summarizeDays(days)
  };
}

async function getMonthlyWorklog(date) {
  validateDate(date);
  const [year, month] = date.split('-').map(Number);
  const worklogs = await repository.readAll();
  const monthDates = getMonthDateValues(year, month);
  const monthDateSet = new Set(monthDates);

  const weekStartDates = [];
  monthDates.forEach((monthDate) => {
    const weekStart = formatDateValue(getMondayForDate(parseDateValue(monthDate)));
    if (!weekStartDates.includes(weekStart)) {
      weekStartDates.push(weekStart);
    }
  });

  const weeks = weekStartDates.map((weekStart) => {
    const weekDates = getWeekDateValues(weekStart);
    const days = weekDates.map((weekDate) => {
      const day = recalculateDay(worklogs[weekDate]);

      return {
        date: weekDate,
        sessionsCount: day.sessions.length,
        totalMinutes: day.totalMinutes,
        inMonth: monthDateSet.has(weekDate)
      };
    });

    return {
      weekStartDate: weekDates[0],
      weekEndDate: weekDates[6],
      days,
      ...summarizeDays(days.filter((day) => day.inMonth))
    };
  });

  return {
    year,
    month,
    monthStartDate: monthDates[0],
    monthEndDate: monthDates[monthDates.length - 1],
    daysInMonth: monthDates.length,
    weeks,
    ...summarizeDays(weeks.flatMap((week) => week.days.filter((day) => day.inMonth)))
  };
}

async function getYearlyWorklog(yearInput) {
  validateYear(yearInput);
  const year = Number(yearInput);
  const worklogs = await repository.readAll();

  const monthsWithDays = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const monthDates = getMonthDateValues(year, month);
    const days = monthDates.map((monthDate) => {
      const day = recalculateDay(worklogs[monthDate]);

      return {
        date: monthDate,
        sessionsCount: day.sessions.length,
        totalMinutes: day.totalMinutes
      };
    });

    return {
      month,
      monthStartDate: monthDates[0],
      daysInMonth: monthDates.length,
      days,
      ...summarizeDays(days)
    };
  });

  const months = monthsWithDays.map(({ days, ...month }) => month);

  return {
    year,
    months,
    ...summarizeDays(monthsWithDays.flatMap((month) => month.days))
  };
}

async function createSession(date, input) {
  validateDate(date);
  const sessionInput = normalizeSessionInput(input);
  const worklogs = await repository.readAll();
  const currentDay = recalculateDay(worklogs[date]);
  const newSession = {
    id: getNextSessionId(currentDay.sessions),
    ...sessionInput
  };

  worklogs[date] = recalculateDay({
    sessions: [...currentDay.sessions, newSession]
  });

  await repository.writeAll(worklogs);
  return buildResponse(date, worklogs[date]);
}

async function updateSession(date, id, input) {
  validateDate(date);
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createError('Session id must be a positive number.');
  }

  const sessionInput = normalizeSessionInput(input);
  const worklogs = await repository.readAll();
  const currentDay = recalculateDay(worklogs[date]);
  const sessionExists = currentDay.sessions.some((session) => session.id === numericId);

  if (!sessionExists) {
    throw createError('Session was not found.', 404);
  }

  worklogs[date] = recalculateDay({
    sessions: currentDay.sessions.map((session) => (
      session.id === numericId
        ? { id: numericId, ...sessionInput }
        : session
    ))
  });

  await repository.writeAll(worklogs);
  return buildResponse(date, worklogs[date]);
}

async function deleteSession(date, id) {
  validateDate(date);
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createError('Session id must be a positive number.');
  }

  const worklogs = await repository.readAll();
  const currentDay = recalculateDay(worklogs[date]);
  const remainingSessions = currentDay.sessions.filter((session) => session.id !== numericId);

  if (remainingSessions.length === currentDay.sessions.length) {
    throw createError('Session was not found.', 404);
  }

  worklogs[date] = recalculateDay({ sessions: remainingSessions });
  await repository.writeAll(worklogs);
  return buildResponse(date, worklogs[date]);
}

module.exports = {
  getDailyWorklog,
  getWeeklyWorklog,
  getMonthlyWorklog,
  getYearlyWorklog,
  createSession,
  updateSession,
  deleteSession,
  calculateDuration
};
