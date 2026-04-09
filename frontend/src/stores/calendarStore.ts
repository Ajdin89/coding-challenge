import { create } from 'zustand';
import {
  startOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addMonths,
  subMonths,
} from 'date-fns';
import type { CalendarEvent } from '../types/event';

export type CalendarView = 'day' | 'week' | 'month';

interface ModalState {
  open: boolean;
  mode: 'create' | 'edit';
  selectedEvent: CalendarEvent | null;
  prefillStart?: string;
  prefillEnd?: string;
}

interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  displayTimezone: string;
  modal: ModalState;

  setView: (view: CalendarView) => void;
  goToToday: () => void;
  goNext: () => void;
  goPrev: () => void;
  goToDate: (date: Date) => void;
  setDisplayTimezone: (tz: string) => void;
  openCreateModal: (prefillStart?: string, prefillEnd?: string) => void;
  openEditModal: (event: CalendarEvent) => void;
  closeModal: () => void;
}

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const useCalendarStore = create<CalendarState>((set, get) => ({
  view: 'week',
  currentDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
  displayTimezone: userTimezone,
  modal: { open: false, mode: 'create', selectedEvent: null },

  setView: (view) => set({ view }),

  goToToday: () => set({ currentDate: new Date() }),

  goNext: () => {
    const { view, currentDate } = get();
    if (view === 'week') set({ currentDate: addWeeks(currentDate, 1) });
    else if (view === 'day') set({ currentDate: addDays(currentDate, 1) });
    else set({ currentDate: addMonths(currentDate, 1) });
  },

  goPrev: () => {
    const { view, currentDate } = get();
    if (view === 'week') set({ currentDate: subWeeks(currentDate, 1) });
    else if (view === 'day') set({ currentDate: subDays(currentDate, 1) });
    else set({ currentDate: subMonths(currentDate, 1) });
  },

  goToDate: (date) => set({ currentDate: date }),

  setDisplayTimezone: (tz) => set({ displayTimezone: tz }),

  openCreateModal: (prefillStart, prefillEnd) =>
    set({ modal: { open: true, mode: 'create', selectedEvent: null, prefillStart, prefillEnd } }),

  openEditModal: (event) =>
    set({ modal: { open: true, mode: 'edit', selectedEvent: event } }),

  closeModal: () =>
    set({ modal: { open: false, mode: 'create', selectedEvent: null } }),
}));
