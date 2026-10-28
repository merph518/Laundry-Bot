-- Adds a 'cancelled' notification status, so a cycle completed by hand is not recorded as a failure.
-- Run this before deploying the bot version that writes it.

ALTER TABLE LAUNDRY_NOTIFICATIONS DROP CONSTRAINT LAUNDRY_NOTIFICATIONS_STATUS_CK;

ALTER TABLE LAUNDRY_NOTIFICATIONS ADD CONSTRAINT LAUNDRY_NOTIFICATIONS_STATUS_CK CHECK (
  STATUS IN ('pending', 'sent', 'failed', 'cancelled')
);

UPDATE LAUNDRY_NOTIFICATIONS
SET STATUS = 'cancelled'
WHERE STATUS = 'failed'
  AND NOTES = 'Cancelled by manual completion.';

COMMIT;
