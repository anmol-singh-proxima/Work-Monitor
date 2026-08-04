export function calculateDuration(startTime, endTime) {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return endMinutes - startMinutes;
}

export function validateSession(session) {
  if (!session.startTime) {
    return 'Start time is required.';
  }

  if (!session.endTime) {
    return 'End time is required.';
  }

  if (parseTimeToMinutes(session.startTime) === null) {
    return 'Start time must use 24-hour HH:MM format, for example 09:00 or 14:30.';
  }

  if (parseTimeToMinutes(session.endTime) === null) {
    return 'End time must use 24-hour HH:MM format, for example 09:00 or 14:30.';
  }

  if (calculateDuration(session.startTime, session.endTime) === null) {
    return 'End time must be after start time.';
  }

  return '';
}

export function formatMinutes(minutes) {
  if (!minutes) {
    return '0 Minutes';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'Hour' : 'Hours'}`);
  }

  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes} ${remainingMinutes === 1 ? 'Minute' : 'Minutes'}`);
  }

  return parts.join(' ');
}

function parseTimeToMinutes(time) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}
