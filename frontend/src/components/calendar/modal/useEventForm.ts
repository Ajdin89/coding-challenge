import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useCreateEvent, useUpdateEvent, useDeleteEvent } from '../../../hooks/useEvents';
import { localToUtc, utcToLocalInput } from '../../../utils/timezone';
import {
  splitLocal,
  formatDurationLabel,
  formatTimeLabel,
  HALF_HOUR_TIMES,
} from '../../../utils/timeOptions';
import type { CalendarEvent, RecurrencePayload } from '../../../types/event';
import type { RecurrenceState } from './RecurrencePanel';
import type { ContentProps } from './EventModalContent';

function getDayOfWeekFromLocal(localStr: string): number {
  if (!localStr) return new Date().getDay();
  const d = new Date(localStr);
  return Number.isNaN(d.getTime()) ? new Date().getDay() : d.getDay();
}

function defaultUntilFromLocal(localStr: string): string {
  const base = localStr ? new Date(localStr) : new Date();
  const target = Number.isNaN(base.getTime()) ? new Date() : new Date(base);
  target.setMonth(target.getMonth() + 3);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type FormState = {
  title: string;
  timezone: string;
  color: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  conflictError: string | null;
};

function clampEnd(f: FormState): FormState {
  let { endDate, endTime } = f;
  if (f.startDate && endDate && endDate < f.startDate) {
    endDate = f.startDate;
  }
  if (f.startDate && f.startTime && endDate === f.startDate && endTime && endTime < f.startTime) {
    endTime = f.startTime;
  }
  return { ...f, endDate, endTime };
}

function buildInitialForm(
  mode: ContentProps['mode'],
  selectedEvent: CalendarEvent | null | undefined,
  prefillStart: string | undefined,
  prefillEnd: string | undefined,
  displayTimezone: string,
): FormState {
  if (mode === 'edit' && selectedEvent) {
    const s = splitLocal(utcToLocalInput(selectedEvent.startUtc, selectedEvent.timezone));
    const e = splitLocal(utcToLocalInput(selectedEvent.endUtc, selectedEvent.timezone));
    return {
      title: selectedEvent.title,
      timezone: selectedEvent.timezone,
      color: selectedEvent.color ?? '',
      startDate: s.date,
      startTime: s.time,
      endDate: e.date,
      endTime: e.time,
      conflictError: null,
    };
  }
  const s = splitLocal(prefillStart ?? '');
  const e = splitLocal(prefillEnd ?? '');
  return {
    title: '',
    timezone: displayTimezone,
    color: '',
    startDate: s.date,
    startTime: s.time,
    endDate: e.date,
    endTime: e.time,
    conflictError: null,
  };
}

export function useEventForm({
  mode,
  selectedEvent,
  prefillStart,
  prefillEnd,
  displayTimezone,
  closeModal,
}: ContentProps) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(mode, selectedEvent, prefillStart, prefillEnd, displayTimezone),
  );
  const [recurrence, setRecurrence] = useState<RecurrenceState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { title, startDate, startTime, endDate, endTime, timezone, color, conflictError } = form;

  const isSeries = Boolean(selectedEvent?.seriesId);
  const isEditingSeriesInstance = mode === 'edit' && isSeries;
  const previewId = (selectedEvent?.id ?? title.trim()) || 'preview';
  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  // Ensure the currently-selected time is in the options list, even if it's not
  // on the 30-minute grid (e.g. an existing event saved at 14:15).
  const startTimeOptions = useMemo(() => {
    const opts = HALF_HOUR_TIMES.map((o) => ({ ...o }));
    if (startTime && !opts.some((o) => o.value === startTime)) {
      opts.push({ value: startTime, label: formatTimeLabel(startTime) });
      opts.sort((a, b) => a.value.localeCompare(b.value));
    }
    return opts;
  }, [startTime]);

  // End time options include a duration hint relative to the current start.
  // When start and end fall on the same day, earlier times are filtered out.
  const endTimeOptions = useMemo(() => {
    const sameDay = !!startDate && startDate === endDate;
    const opts = HALF_HOUR_TIMES.filter(
      (o) => !sameDay || !startTime || o.value >= startTime,
    ).map((o) => {
      const duration = formatDurationLabel(startDate, startTime, endDate, o.value);
      return { value: o.value, label: duration ? `${o.label} (${duration})` : o.label };
    });
    if (endTime && !opts.some((o) => o.value === endTime)) {
      const duration = formatDurationLabel(startDate, startTime, endDate, endTime);
      const base = formatTimeLabel(endTime);
      opts.push({ value: endTime, label: duration ? `${base} (${duration})` : base });
      opts.sort((a, b) => a.value.localeCompare(b.value));
    }
    return opts;
  }, [startDate, startTime, endDate, endTime]);

  const setTitle = (title: string) => setForm((f) => ({ ...f, title }));
  const setColor = (color: string) => setForm((f) => ({ ...f, color }));
  const setTimezone = (timezone: string) => setForm((f) => ({ ...f, timezone }));

  const setStartDate = (value: string) =>
    setForm((f) => {
      // While recurring, every occurrence is same-day — keep end in sync with
      // start so the duration stays as the time-of-day delta.
      const endDate = recurrence ? value : f.endDate;
      return clampEnd({ ...f, startDate: value, endDate });
    });

  const setStartTime = (value: string) => setForm((f) => clampEnd({ ...f, startTime: value }));
  const setEndDate = (value: string) => setForm((f) => clampEnd({ ...f, endDate: value }));
  const setEndTime = (value: string) => setForm((f) => clampEnd({ ...f, endTime: value }));

  const toggleRecurring = () => {
    if (recurrence) {
      setRecurrence(null);
      return;
    }
    // A recurring event's single occurrence is always same-day — collapse
    // any multi-day setup that existed before toggling recurring on.
    setForm((f) => clampEnd({ ...f, endDate: f.startDate }));
    const startLocal = startDate && startTime ? `${startDate}T${startTime}` : '';
    setRecurrence({
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [getDayOfWeekFromLocal(startLocal)],
      until: defaultUntilFromLocal(startLocal),
    });
  };

  const updateRecurrence = (patch: Partial<RecurrenceState>) =>
    setRecurrence((r) => (r ? { ...r, ...patch } : r));

  const toggleDayOfWeek = (day: number) => {
    setRecurrence((r) => {
      if (!r) return r;
      const next = r.daysOfWeek.includes(day)
        ? r.daysOfWeek.filter((d) => d !== day)
        : [...r.daysOfWeek, day];
      // Always keep at least one day selected.
      return { ...r, daysOfWeek: next.length === 0 ? r.daysOfWeek : next };
    });
  };

  const buildRecurrencePayload = (): RecurrencePayload | undefined => {
    if (!recurrence) return undefined;
    return {
      frequency: recurrence.frequency,
      interval: recurrence.interval,
      daysOfWeek: recurrence.frequency === 'weekly' ? recurrence.daysOfWeek : undefined,
      until: recurrence.until,
    };
  };

  const handleSave = async () => {
    setForm((f) => ({ ...f, conflictError: null }));
    if (!title.trim() || !startDate || !startTime || !endDate || !endTime) return;

    const startUtc = localToUtc(`${startDate}T${startTime}`, timezone);
    const endUtc = localToUtc(`${endDate}T${endTime}`, timezone);

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          title: title.trim(),
          startUtc,
          endUtc,
          timezone,
          color: color || undefined,
          recurrence: buildRecurrencePayload(),
        });
      } else if (selectedEvent) {
        await updateMutation.mutateAsync({
          id: selectedEvent.id,
          payload: { title: title.trim(), startUtc, endUtc, timezone, color: color || null },
        });
      }
      closeModal();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        const body = err.response.data as {
          message?: string;
          conflictingEvent?: { title: string };
        };
        const conflicting = body?.conflictingEvent?.title;
        setForm((f) => ({
          ...f,
          conflictError: conflicting
            ? `Conflicts with "${conflicting}"`
            : 'This time slot conflicts with an existing event.',
        }));
      }
    }
  };

  const handleDelete = async (scope: 'single' | 'series') => {
    if (!selectedEvent) return;
    await deleteMutation.mutateAsync({ id: selectedEvent.id, scope });
    closeModal();
  };

  const onDeleteClick = () => {
    if (isSeries) {
      setConfirmDelete(true);
      return;
    }
    void handleDelete('single');
  };

  return {
    // Field values
    title,
    startDate,
    startTime,
    endDate,
    endTime,
    timezone,
    color,
    conflictError,
    recurrence,
    confirmDelete,
    // Derived state
    isPending,
    isEditingSeriesInstance,
    previewId,
    startTimeOptions,
    endTimeOptions,
    // Field setters
    setTitle,
    setColor,
    setTimezone,
    setStartDate,
    setStartTime,
    setEndDate,
    setEndTime,
    setConfirmDelete,
    // Action handlers
    handleSave,
    handleDelete,
    onDeleteClick,
    toggleRecurring,
    updateRecurrence,
    toggleDayOfWeek,
  };
}
