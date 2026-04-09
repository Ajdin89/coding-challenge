export interface CalendarEvent {
  id: string;
  title: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  startUtc: string;
  endUtc: string;
  timezone: string;
}

export interface UpdateEventPayload {
  title?: string;
  startUtc?: string;
  endUtc?: string;
  timezone?: string;
}

export interface ConflictError {
  message: string;
  conflictingEvent: CalendarEvent;
}
