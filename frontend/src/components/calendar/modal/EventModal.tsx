import { Dialog } from '@mui/material';
import { useCalendarStore } from '../../../stores/calendarStore';
import { EventModalContent } from './EventModalContent';

export function EventModal() {
  const { modal, closeModal, displayTimezone } = useCalendarStore();
  const { open, mode, selectedEvent, prefillStart, prefillEnd } = modal;

  // Changing `key` when the modal opens with new data causes EventModalContent
  // to remount with fresh initialised state — no effect or setState-in-effect needed.
  const contentKey = open
    ? `${mode}-${selectedEvent?.id ?? 'new'}-${prefillStart ?? ''}`
    : 'closed';

  return (
    <Dialog open={open} onClose={closeModal} fullWidth maxWidth="sm">
      {open && (
        <EventModalContent
          key={contentKey}
          mode={mode}
          selectedEvent={selectedEvent}
          prefillStart={prefillStart}
          prefillEnd={prefillEnd}
          displayTimezone={displayTimezone}
          closeModal={closeModal}
        />
      )}
    </Dialog>
  );
}
