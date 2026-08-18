export function getTodayInputValue() {
  const today = new Date();
  return formatDateInput(today);
}

export function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDate(dateValue, dayOffset) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayOffset);
  return formatDateInput(date);
}

export function formatReadableDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatCompactDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatShortDate(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function shiftMonth(dateValue, monthOffset) {
  const [year, month] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1 + monthOffset, 1);
  return formatDateInput(date);
}

export function shiftYear(dateValue, yearOffset) {
  const [year, month] = dateValue.split('-').map(Number);
  const date = new Date(year + yearOffset, month - 1, 1);
  return formatDateInput(date);
}

export function formatMonthLabel(dateValue) {
  const [year, month] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatMonthName(year, month) {
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short'
  }).format(date);
}

export function getYearValue(dateValue) {
  return dateValue.split('-')[0];
}

export function getMonthStartValue(dateValue) {
  const [year, month] = dateValue.split('-');
  return `${year}-${month}-01`;
}

export function formatClockTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
