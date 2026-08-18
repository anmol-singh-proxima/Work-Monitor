import { formatMonthName } from '../dateUtils';
import { formatMinutes, formatMinutesShort, getIntensityLevel } from '../timeUtils';
import { SkeletonRows } from './Skeleton';
import StatTile from './StatTile';

export default function YearView({
  year,
  yearLabel,
  isLoading,
  message,
  onPrevYear,
  onNextYear,
  onSelectMonth
}) {
  const maxMonthMinutes = year
    ? Math.max(1, ...year.months.map((month) => month.totalMinutes))
    : 1;

  return (
    <section className="year-panel" aria-labelledby="year-title">
      <header className="section-header">
        <button
          className="icon-button"
          type="button"
          aria-label="Previous year"
          onClick={onPrevYear}
        >
          &lt;
        </button>

        <div>
          <p className="eyebrow">Year Overview</p>
          <h2 id="year-title">{yearLabel}</h2>
        </div>

        <button
          className="icon-button"
          type="button"
          aria-label="Next year"
          onClick={onNextYear}
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
          <SkeletonRows count={6} className="skeleton-rows--grid" />
        </div>
      )}

      {!isLoading && year && (
        <>
          <div className="stat-row">
            <StatTile label="Total Hours" value={formatMinutes(year.totalMinutes)} />
            <StatTile
              label="Daily Average"
              value={formatMinutes(year.averageMinutes)}
              hint="per active day"
            />
            <StatTile label="Active Days" value={`${year.activeDays}`} />
          </div>

          <div className="month-grid" aria-label="Months in this year">
            {year.months.map((month) => (
              <button
                key={month.month}
                type="button"
                className={`month-card level-${getIntensityLevel(month.totalMinutes, maxMonthMinutes)}`}
                onClick={() => onSelectMonth(month.monthStartDate)}
              >
                <span className="month-card-name">{formatMonthName(year.year, month.month)}</span>
                <strong className="month-card-total">{formatMinutesShort(month.totalMinutes) || '0m'}</strong>
                <span className="month-card-avg">avg {formatMinutesShort(month.averageMinutes) || '0m'}</span>
                <span className="month-card-days">
                  {month.activeDays} active {month.activeDays === 1 ? 'day' : 'days'}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
