// Values stored in the STATUS columns. The SQL check constraints in db/ list the same strings.
export const LAUNDRY_STATUS = {
  AVAILABLE: "available",
  IN_USE: "in_use",
  MAINTENANCE: "maintenance",
} as const;

export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
} as const;
