import axios from 'axios';
import type { CalendarEvent, CreateEventPayload, UpdateEventPayload } from '../types/event';

const api = axios.create({ baseURL: 'http://localhost:3000' });

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data } = await api.get<CalendarEvent[]>('/events');
  return data;
}

export async function createEvent(payload: CreateEventPayload): Promise<CalendarEvent> {
  const { data } = await api.post<CalendarEvent>('/events', payload);
  return data;
}

export async function updateEvent(id: string, payload: UpdateEventPayload): Promise<CalendarEvent> {
  const { data } = await api.patch<CalendarEvent>(`/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await api.delete(`/events/${id}`);
}
