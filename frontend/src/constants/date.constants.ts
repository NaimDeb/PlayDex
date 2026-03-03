/**
 * Time and date calculation constants
 * @module constants/date
 */

/** Milliseconds in one second */
export const MILLISECONDS_PER_SECOND = 1000;

/** Seconds in one minute */
export const SECONDS_PER_MINUTE = 60;

/** Minutes in one hour */
export const MINUTES_PER_HOUR = 60;

/** Hours in one day */
export const HOURS_PER_DAY = 24;

/** Days in one year (approximate) */
export const DAYS_PER_YEAR = 365;

/** Milliseconds in one minute */
export const MS_PER_MINUTE = MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE;

/** Milliseconds in one hour */
export const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR;

/** Milliseconds in one day */
export const MS_PER_DAY = MS_PER_HOUR * HOURS_PER_DAY;

/** Milliseconds in one year (approximate) */
export const MS_PER_YEAR = MS_PER_DAY * DAYS_PER_YEAR;
