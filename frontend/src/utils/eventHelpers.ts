import { User } from '../types/event';

/**
 * Formats a user label for display purposes.
 */
export const getUserLabel = (user: User): string => {
  const name = user.fullName
    ? user.fullName
    : user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || `User #${user.id}`;
  return user.context ? `${name} (${user.context})` : name;
};

// Event type classification has moved to hooks/useEventTypeFlags.ts
// Use getEventTypeFlags() or useEventTypeFlags() hook instead.
