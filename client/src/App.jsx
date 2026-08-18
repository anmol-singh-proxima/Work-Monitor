import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addSession,
  deleteSession,
  getMonthlyWorklog,
  getWeeklyWorklog,
  getWorklog,
  getYearlyWorklog,
  updateSession
} from './api';
import Logo from './components/Logo';
import MonthView from './components/MonthView';
import { SkeletonRows } from './components/Skeleton';
import ThemeToggle from './components/ThemeToggle';
import ToastStack from './components/ToastStack';
import YearView from './components/YearView';
import {
  formatClockTime,
  formatCompactDate,
  formatMonthLabel,
  formatReadableDate,
  getMonthStartValue,
  getTodayInputValue,
  getYearValue,
  shiftDate,
  shiftMonth
} from './dateUtils';
import { useClock } from './hooks/useClock';
import { useToasts } from './hooks/useToasts';
import { calculateDuration, formatMinutes, validateSession } from './timeUtils';

const emptySession = {
  startTime: '',
  endTime: ''
};

const tabs = [
  { key: 'day', label: 'Day' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' }
];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [day, setDay] = useState({ date: selectedDate, sessions: [], totalMinutes: 0 });
  const [draft, setDraft] = useState(emptySession);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [week, setWeek] = useState(null);
  const [isWeekLoading, setIsWeekLoading] = useState(true);
  const [weekMessage, setWeekMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [view, setView] = useState('day');
  const [monthDate, setMonthDate] = useState(() => getMonthStartValue(getTodayInputValue()));
  const [month, setMonth] = useState(null);
  const [isMonthLoading, setIsMonthLoading] = useState(true);
  const [monthMessage, setMonthMessage] = useState('');
  const [yearValue, setYearValue] = useState(() => getYearValue(getTodayInputValue()));
  const [year, setYear] = useState(null);
  const [isYearLoading, setIsYearLoading] = useState(true);
  const [yearMessage, setYearMessage] = useState('');

  const { toasts, pushToast, removeToast } = useToasts();
  const tabRefs = useRef([]);
  const now = useClock();

  const activeFormKey = isAdding ? 'add' : editingId;
  const readableDate = useMemo(() => formatReadableDate(selectedDate), [selectedDate]);
  const monthLabel = useMemo(() => formatMonthLabel(monthDate), [monthDate]);

  useEffect(() => {
    let ignore = false;

    async function loadDay() {
      setIsLoading(true);
      setIsWeekLoading(true);
      setMessage('');
      setWeekMessage('');

      try {
        const [nextDay, nextWeek] = await Promise.all([
          getWorklog(selectedDate),
          getWeeklyWorklog(selectedDate)
        ]);
        if (!ignore) {
          setDay(nextDay);
          setWeek(nextWeek);
          resetForm();
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message);
          setWeekMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsWeekLoading(false);
        }
      }
    }

    loadDay();

    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  useEffect(() => {
    let ignore = false;

    async function loadMonth() {
      setIsMonthLoading(true);
      setMonthMessage('');

      try {
        const nextMonth = await getMonthlyWorklog(monthDate);
        if (!ignore) {
          setMonth(nextMonth);
        }
      } catch (error) {
        if (!ignore) {
          setMonthMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsMonthLoading(false);
        }
      }
    }

    loadMonth();

    return () => {
      ignore = true;
    };
  }, [monthDate]);

  useEffect(() => {
    let ignore = false;

    async function loadYear() {
      setIsYearLoading(true);
      setYearMessage('');

      try {
        const nextYear = await getYearlyWorklog(yearValue);
        if (!ignore) {
          setYear(nextYear);
        }
      } catch (error) {
        if (!ignore) {
          setYearMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsYearLoading(false);
        }
      }
    }

    loadYear();

    return () => {
      ignore = true;
    };
  }, [yearValue]);

  function resetForm() {
    setDraft(emptySession);
    setEditingId(null);
    setIsAdding(false);
  }

  function handleDateChange(nextDate) {
    if (nextDate) {
      setSelectedDate(nextDate);
    }
  }

  function startAdding() {
    setDraft(emptySession);
    setEditingId(null);
    setIsAdding(true);
    setMessage('');
  }

  function startEditing(session) {
    setDraft({
      startTime: session.startTime,
      endTime: session.endTime
    });
    setEditingId(session.id);
    setIsAdding(false);
    setMessage('');
  }

  function updateDraft(field, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value
    }));
  }

  async function refreshWeek() {
    setIsWeekLoading(true);
    setWeekMessage('');

    try {
      const nextWeek = await getWeeklyWorklog(selectedDate);
      setWeek(nextWeek);
    } catch (error) {
      setWeekMessage(error.message);
    } finally {
      setIsWeekLoading(false);
    }
  }

  async function refreshMonth() {
    try {
      const nextMonth = await getMonthlyWorklog(monthDate);
      setMonth(nextMonth);
    } catch (error) {
      setMonthMessage(error.message);
    }
  }

  async function refreshYear() {
    try {
      const nextYear = await getYearlyWorklog(yearValue);
      setYear(nextYear);
    } catch (error) {
      setYearMessage(error.message);
    }
  }

  async function refreshSummaries() {
    await Promise.all([refreshWeek(), refreshMonth(), refreshYear()]);
  }

  function goToWeek(weekStartDate) {
    setSelectedDate(weekStartDate);
    setView('day');
  }

  function goToMonth(monthStartDate) {
    setMonthDate(monthStartDate);
    setView('month');
  }

  function handleTabKeyDown(event, index) {
    let nextIndex = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      setView(tabs[nextIndex].key);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  async function saveDraft() {
    const validationMessage = validateSession(draft);
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const nextDay = isAdding
        ? await addSession(selectedDate, draft)
        : await updateSession(selectedDate, editingId, draft);
      setDay(nextDay);
      await refreshSummaries();
      pushToast(isAdding ? 'Session added.' : 'Session updated.');
      resetForm();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function removeSession(session) {
    const confirmed = window.confirm('Delete this work session?');

    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const nextDay = await deleteSession(selectedDate, session.id);
      setDay(nextDay);
      await refreshSummaries();
      pushToast('Session deleted.');
      if (editingId === session.id) {
        resetForm();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="app-header">
          <div className="app-brand">
            <Logo size={34} />
            <div>
              <h1 className="app-name">Work Monitor</h1>
              <p className="app-tagline">Every session counted, one day at a time.</p>
            </div>
          </div>

          <div className="app-header-actions">
            <div className="live-clock" title="Current local time">
              <span className="live-clock-dot" aria-hidden="true" />
              <span>{formatClockTime(now)}</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div className="top-bar">
          <div className="view-tabs" role="tablist" aria-label="Worklog views">
            {tabs.map((tab, index) => (
              <button
                key={tab.key}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={view === tab.key}
                aria-controls={`panel-${tab.key}`}
                tabIndex={view === tab.key ? 0 : -1}
                className={`view-tab${view === tab.key ? ' is-active' : ''}`}
                onClick={() => setView(tab.key)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {view === 'day' && (
          <div id="panel-day" role="tabpanel" aria-labelledby="tab-day" className="view-panel">
            <header className="page-header">
              <div>
                <p className="eyebrow">Current Date</p>
                <h2 id="page-title" className="page-title">{readableDate}</h2>
              </div>

              <div className="date-controls" aria-label="Date navigation">
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Previous day"
                  onClick={() => handleDateChange(shiftDate(selectedDate, -1))}
                >
                  &lt;
                </button>
                <input
                  aria-label="Choose date"
                  type="date"
                  value={selectedDate}
                  onChange={(event) => handleDateChange(event.target.value)}
                />
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Next day"
                  onClick={() => handleDateChange(shiftDate(selectedDate, 1))}
                >
                  &gt;
                </button>
              </div>
            </header>

            <section className="worklog-panel" aria-label="Daily work sessions">
              <div className="panel-note" id="time-format-note">
                Times are entered in 24-hour format: HH:MM.
              </div>

              {message && (
                <p className="message" role="alert">
                  {message}
                </p>
              )}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Start Time (24h)</th>
                      <th>End Time (24h)</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr>
                        <td colSpan="4" className="empty-cell">
                          <SkeletonRows count={2} className="skeleton-rows--lines" />
                        </td>
                      </tr>
                    )}

                    {!isLoading && day.sessions.length === 0 && !isAdding && (
                      <tr>
                        <td colSpan="4" className="empty-cell">
                          No sessions recorded.
                        </td>
                      </tr>
                    )}

                    {!isLoading && day.sessions.map((session) => (
                      editingId === session.id ? (
                        <SessionFormRow
                          key={session.id}
                          draft={draft}
                          isSaving={isSaving}
                          onChange={updateDraft}
                          onCancel={resetForm}
                          onSave={saveDraft}
                        />
                      ) : (
                        <tr key={session.id}>
                          <td data-label="Start Time (24h)">{session.startTime}</td>
                          <td data-label="End Time (24h)">{session.endTime}</td>
                          <td data-label="Duration">{formatMinutes(session.duration)}</td>
                          <td data-label="Actions">
                            <div className="row-actions">
                              <button
                                className="secondary-button"
                                type="button"
                                disabled={Boolean(activeFormKey) || isSaving}
                                onClick={() => startEditing(session)}
                              >
                                Edit
                              </button>
                              <button
                                className="danger-button"
                                type="button"
                                disabled={isSaving}
                                onClick={() => removeSession(session)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}

                    {!isLoading && isAdding && (
                      <SessionFormRow
                        draft={draft}
                        isSaving={isSaving}
                        onChange={updateDraft}
                        onCancel={resetForm}
                        onSave={saveDraft}
                      />
                    )}
                  </tbody>
                </table>
              </div>

              <div className="panel-footer">
                <button
                  className="primary-button"
                  type="button"
                  disabled={isLoading || isSaving || Boolean(activeFormKey)}
                  onClick={startAdding}
                >
                  + Add Session
                </button>

                <div className="total-block">
                  <span>Total Time Worked</span>
                  <strong>{formatMinutes(day.totalMinutes)}</strong>
                </div>
              </div>
            </section>

            <WeekSummary
              week={week}
              isLoading={isWeekLoading}
              message={weekMessage}
              onPrevWeek={() => handleDateChange(shiftDate(selectedDate, -7))}
              onNextWeek={() => handleDateChange(shiftDate(selectedDate, 7))}
            />
          </div>
        )}

        {view === 'month' && (
          <div id="panel-month" role="tabpanel" aria-labelledby="tab-month" className="view-panel">
            <MonthView
              month={month}
              monthLabel={monthLabel}
              isLoading={isMonthLoading}
              message={monthMessage}
              onPrevMonth={() => setMonthDate((current) => shiftMonth(current, -1))}
              onNextMonth={() => setMonthDate((current) => shiftMonth(current, 1))}
              onSelectWeek={goToWeek}
            />
          </div>
        )}

        {view === 'year' && (
          <div id="panel-year" role="tabpanel" aria-labelledby="tab-year" className="view-panel">
            <YearView
              year={year}
              yearLabel={yearValue}
              isLoading={isYearLoading}
              message={yearMessage}
              onPrevYear={() => setYearValue((current) => String(Number(current) - 1))}
              onNextYear={() => setYearValue((current) => String(Number(current) + 1))}
              onSelectMonth={goToMonth}
            />
          </div>
        )}

        <footer className="app-footer">
          <div className="app-footer-brand">
            <Logo size={20} />
            <span>Work Monitor</span>
          </div>
          <p className="app-footer-tagline">Simple, focused time tracking.</p>
        </footer>
      </section>

      <ToastStack toasts={toasts} onDismiss={removeToast} />
    </main>
  );
}

function WeekSummary({ week, isLoading, message, onPrevWeek, onNextWeek }) {
  return (
    <section className="week-panel" aria-labelledby="week-title">
      <div className="week-header">
        <div>
          <div className="week-nav" aria-label="Week navigation">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous week"
              onClick={onPrevWeek}
            >
              &lt;
            </button>

            <div>
              <p className="eyebrow">Week Summary</p>
              <h2 id="week-title">
                {week
                  ? `${formatCompactDate(week.weekStartDate)} - ${formatCompactDate(week.weekEndDate)}`
                  : 'Monday - Sunday'}
              </h2>
            </div>

            <button
              className="icon-button"
              type="button"
              aria-label="Next week"
              onClick={onNextWeek}
            >
              &gt;
            </button>
          </div>
          <p className="week-range">
            Weeks always start on Monday.
          </p>
        </div>

        <div className="week-stats">
          <div className="week-total">
            <span>Week Total</span>
            <strong>{formatMinutes(week?.totalMinutes || 0)}</strong>
          </div>
          <div className="week-total week-average">
            <span>Daily Average</span>
            <strong>{formatMinutes(week?.averageMinutes || 0)}</strong>
          </div>
        </div>
      </div>

      {message && (
        <p className="message week-message" role="alert">
          {message}
        </p>
      )}

      <div className="week-days" aria-label="Weekly daily totals">
        {isLoading && <SkeletonRows count={7} className="skeleton-rows--week" />}

        {!isLoading && week?.days.map((day) => (
          <div className="week-day" key={day.date}>
            <span className="week-day-date">{formatCompactDate(day.date)}</span>
            <span className="week-day-sessions">
              {day.sessionsCount} {day.sessionsCount === 1 ? 'session' : 'sessions'}
            </span>
            <strong>{formatMinutes(day.totalMinutes)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SessionFormRow({ draft, isSaving, onChange, onCancel, onSave }) {
  const previewDuration = calculateDuration(draft.startTime, draft.endTime);

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSave();
    }
  }

  return (
    <tr className="form-row">
      <td data-label="Start Time (24h)">
        <label className="sr-only" htmlFor="start-time">Start time</label>
        <input
          id="start-time"
          type="text"
          inputMode="text"
          maxLength="5"
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          placeholder="09:00"
          aria-describedby="time-format-note"
          value={draft.startTime}
          onChange={(event) => onChange('startTime', event.target.value)}
          onKeyDown={handleKeyDown}
          title="Use 24-hour time in HH:MM format, for example 09:00 or 14:30."
          required
        />
      </td>
      <td data-label="End Time (24h)">
        <label className="sr-only" htmlFor="end-time">End time</label>
        <input
          id="end-time"
          type="text"
          inputMode="text"
          maxLength="5"
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          placeholder="17:30"
          aria-describedby="time-format-note"
          value={draft.endTime}
          onChange={(event) => onChange('endTime', event.target.value)}
          onKeyDown={handleKeyDown}
          title="Use 24-hour time in HH:MM format, for example 09:00 or 14:30."
          required
        />
      </td>
      <td data-label="Duration">
        {previewDuration ? formatMinutes(previewDuration) : 'Pending'}
      </td>
      <td data-label="Actions">
        <div className="row-actions">
          <button
            className="primary-button compact"
            type="button"
            disabled={isSaving}
            onClick={onSave}
          >
            Save
          </button>
          <button
            className="secondary-button compact"
            type="button"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}
