export const BLOCKED_SESSION_STATUSES = new Set(['completed', 'finished', 'cancelled', 'ended', 'closed', 'inactive', 'archived', 'expired']);

export const isSessionJoinAllowed = (statusOrSession, scheduledAtValue) => {
  const session = typeof statusOrSession === 'object' && statusOrSession !== null
    ? statusOrSession
    : { status: statusOrSession, scheduledAt: scheduledAtValue };

  const status = session.status ?? session.state ?? (session.isActive ? 'live' : 'scheduled');
  const normalized = String(status ?? '').trim().toLowerCase();
  if (!normalized) return true;
  if (BLOCKED_SESSION_STATUSES.has(normalized)) return false;

  const allowedAfter = session.scheduledAt ?? session.startedAt ?? session.createdAt;
  if (allowedAfter) {
    const scheduledDate = new Date(allowedAfter).getTime();
    if (!Number.isNaN(scheduledDate) && scheduledDate > Date.now()) {
      return false;
    }
  }

  return true;
};

export const isSessionVisibleInUpcomingList = (session = {}) => {
  if (!session || typeof session !== 'object') return false;
  if (session.isActive === false) return false;

  const status = session.status ?? session.state ?? (session.isActive ? 'live' : 'scheduled');
  const normalized = String(status ?? '').trim().toLowerCase();

  if (!normalized) return true;
  if (session.completedAt || session.endedAt || session.finishedAt) return false;
  return !BLOCKED_SESSION_STATUSES.has(normalized);
};
