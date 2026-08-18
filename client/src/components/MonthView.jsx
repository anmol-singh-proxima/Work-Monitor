import { formatShortDate } from '../dateUtils';
import { formatMinutes, formatMinutesShort, getIntensityLevel } from '../timeUtils';
import { SkeletonRows } from './Skeleton';
import StatTile from './StatTile';

export default function MonthView({
  month,
  monthLabel,
  isLoading,
  message,
  onPrevMonth,
  onNextMonth,
  onSelectWeek
}) {
  return (
    <section className="month-panel" aria-labelledby="month-title">
      <header className="section-header">
        <button
          className="icon-button"
          type="button"
          aria-label="Previous month"
          onClick={onPrevMonth}
        >
          &lt;
        </button>

        <div>
          <p className="eyebrow">Month Overview</p>
          <h2 id="month-title">{monthLabel}</h2>
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="Next month"
          onClick={onNextMonth}
        >
          &gt;
        </button>
      </header>

      {message && (
        <p className="message" role="alert">
          {message}
        </p>
      )}

      {isLoading && (
        <div className="skeleton-panel">
          <SkeletonRows count={3} className="skeleton-rows--stats" />
          <SkeletonRows count={5} className="skeleton-rows--week" />
        </div>
      )}

      {!isLoading && month && (
        <>
          <div className="stat-row">
            <StatTile label="Total Hours" value={formatMinutes(month.totalMinutes)} />
            <StatTile
              label="Daily Average"
              value={formatMinutes(month.averageMinutes)}
              hint="per active day"
            />
            <StatTile label="Active Days" value={`${month.activeDays} / ${month.daysInMonth}`} />
          </div>

          <div className="week-list" aria-label="Weeks in this month">
            {month.weeks.map((week) => {
              const maxMinutes = Math.max(1, ...week.days.map((day) => day.totalMinutes));

              return (
                <button
                  key={week.weekStartDate}
                  type="button"
                  className="week-row"
                  onClick={() => onSelectWeek(week.weekStartDate)}
                >
                  <span className="week-row-range">
                    {formatShortDate(week.weekStartDate)} - {formatShortDate(week.weekEndDate)}
                  </span>

                  <span className="week-row-pills" aria-hidden="true">
                    {week.days.map((day) => (
                      <span
                        key={day.date}
                        className={
                          day.inMonth
                            ? `day-pill level-${getIntensityLevel(day.totalMinutes, maxMinutes)}`
                            : 'day-pill day-pill--out'
                        }
                        title={day.inMonth ? `${day.date}: ${formatMinutes(day.totalMinutes)}` : ''}
                      />
                    ))}
                  </span>

                  <span className="week-row-stats">
                    <strong>{formatMinutesShort(week.totalMinutes) || '0m'}</strong>
                    <span className="week-row-avg">avg {formatMinutesShort(week.averageMinutes) || '0m'}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
