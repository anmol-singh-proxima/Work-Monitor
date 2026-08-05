# Work Monitor

A simple full-stack web application for tracking daily work sessions. The app uses React for the UI, Express for the API and static hosting, and a JSON file for persistence.

## Features

- Track multiple work sessions per date.
- Add, edit, and delete sessions.
- Enter all times in 24-hour `HH:MM` format.
- Automatically calculate session duration from start and end time.
- Automatically recalculate the daily total after every change.
- Navigate to previous and next days.
- Auto-select today's date on page load.
- View the selected date's weekly summary from Monday through Sunday.
- Store data in `server/data/worklog.json`.
- Serve the React app and REST API from one Express server.

## Project Structure

```text
project-root/
  server/
    server.js
    routes/
    controllers/
    services/
    data/
  client/
    src/
    public/
  package.json
```

## Install And Run

```bash
npm install
npm start
```

`npm start` builds the React app and then starts one Node.js server at:

```text
http://localhost:3000
```

Set a different port if needed:

```bash
PORT=4000 npm start
```

## Environment Variables

The app reads configuration from `.env` at the project root. A template is available in `.env.sample`.

```text
PORT=3000
WORKLOG_DATA_FILE=server/data/worklog.json
```

- `PORT` controls the single Express server port.
- `WORKLOG_DATA_FILE` controls where JSON worklog data is stored. Relative paths are resolved from the project root.

## REST API

```text
GET    /api/worklog/:date
GET    /api/worklog/week/:date
POST   /api/worklog/:date
PUT    /api/worklog/:date/:id
DELETE /api/worklog/:date/:id
```

Dates use `YYYY-MM-DD`.

The weekly endpoint always uses Monday as the first day of the week and returns the date range for that week.

### Session Body

```json
{
  "startTime": "09:00",
  "endTime": "10:15"
}
```

The API calculates `duration` and `totalMinutes`; clients should not send those values.

### Weekly Response

```json
{
  "weekStartDate": "2026-08-03",
  "weekEndDate": "2026-08-09",
  "days": [
    {
      "date": "2026-08-03",
      "sessionsCount": 2,
      "totalMinutes": 165
    }
  ],
  "totalMinutes": 165
}
```

## Data Storage

Data is stored in:

```text
server/data/worklog.json
```

The file repository is isolated in `server/services/fileWorklogRepository.js`, while the business rules live in `server/services/worklogService.js`. This keeps the API contract stable if JSON storage is replaced later with PostgreSQL, MySQL, MongoDB, or another database.

## Validation

The backend validates:

- Start time is required.
- End time is required.
- Times must use 24-hour `HH:MM` format.
- End time must be after start time.
- Date must use `YYYY-MM-DD` format.

The frontend mirrors those checks for quick feedback, but the backend remains the source of truth.
