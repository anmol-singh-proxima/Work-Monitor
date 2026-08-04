import { useEffect, useMemo, useState } from 'react';
import { addSession, deleteSession, getWorklog, updateSession } from './api';
import { formatReadableDate, getTodayInputValue, shiftDate } from './dateUtils';
import { calculateDuration, formatMinutes, validateSession } from './timeUtils';

const emptySession = {
  startTime: '',
  endTime: ''
};

export default function App() {
  const [selectedDate, setSelectedDate] = useState(getTodayInputValue);
  const [day, setDay] = useState({ date: selectedDate, sessions: [], totalMinutes: 0 });
  const [draft, setDraft] = useState(emptySession);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const activeFormKey = isAdding ? 'add' : editingId;
  const readableDate = useMemo(() => formatReadableDate(selectedDate), [selectedDate]);

  useEffect(() => {
    let ignore = false;

    async function loadDay() {
      setIsLoading(true);
      setMessage('');

      try {
        const nextDay = await getWorklog(selectedDate);
        if (!ignore) {
          setDay(nextDay);
          resetForm();
        }
      } catch (error) {
        if (!ignore) {
          setMessage(error.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDay();

    return () => {
      ignore = true;
    };
  }, [selectedDate]);

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
      <section className="workspace" aria-labelledby="page-title">
        <header className="page-header">
          <div>
            <p className="eyebrow">Current Date</p>
            <h1 id="page-title">{readableDate}</h1>
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
                      Loading sessions...
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
      </section>
    </main>
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
