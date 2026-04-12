export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurrencePayload {
  frequency: RecurrenceFrequency;
  interval: number;
  /** 0 = Sun, 6 = Sat. Only used for weekly. */
  daysOfWeek?: number[];
  /** Inclusive end date of the series (YYYY-MM-DD). */
  until: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
  color: string | null;
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
  color?: string | null;
  recurrence?: RecurrencePayload;
}

export interface UpdateEventPayload {
  title?: string;
  startUtc?: string;
  endUtc?: string;
  timezone?: string;
  color?: string | null;
}

export type DeleteScope = 'single' | 'series';

export interface ConflictError {
  message: string;
  conflictingEvent: CalendarEvent;
}
