import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../api/events';
import type { CreateEventPayload, UpdateEventPayload } from '../types/event';

const EVENTS_KEY = ['events'] as const;

export function useEvents() {
  return useQuery({ queryKey: EVENTS_KEY, queryFn: fetchEvents });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventPayload }) =>
      updateEvent(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EVENTS_KEY }),
  });
}
