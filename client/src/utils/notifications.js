const STORAGE_KEY = 'interview_ai_notifications';

const normalizeEmail = (value = '') => String(value || '').trim().toLowerCase();

export const getStoredNotifications = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Unable to load notifications from storage.', error);
    return [];
  }
};

export const getNotificationsForUser = (userEmail = '') => {
  const notifications = getStoredNotifications();
  if (!userEmail) return notifications;

  const normalizedEmail = normalizeEmail(userEmail);
  return notifications.filter((item) => {
    const recipientCandidates = [
      item.recipientEmail,
      item.candidateEmail,
      item.email,
      item.userEmail,
    ];

    const hasRecipient = recipientCandidates.some((candidate) => normalizeEmail(candidate));
    if (!hasRecipient) return true;

    return recipientCandidates.some((candidate) => normalizeEmail(candidate) === normalizedEmail);
  });
};

export const addLiveRoomNotification = (roomId, details = {}) => {
  if (!roomId || typeof window === 'undefined') return null;

  const recipientEmail = details.recipientEmail || details.candidateEmail || details.email || '';
  const normalizedRecipientEmail = normalizeEmail(recipientEmail);
  const payload = {
    id: `live-room-${roomId}-${Date.now()}`,
    type: 'live-room-invite',
    title: details.title || 'Live room invitation',
    message:
      details.message ||
      'Your interviewer has shared a live interview room link for you to join.',
    roomId,
    recipientEmail: normalizedRecipientEmail,
    candidateEmail: normalizeEmail(details.candidateEmail || recipientEmail || ''),
    email: normalizedRecipientEmail,
    userEmail: normalizedRecipientEmail,
    candidateName: details.candidateName || '',
    actionUrl: details.actionUrl || `/live-room/${roomId}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const existing = getStoredNotifications();
  const next = [payload, ...existing.filter((item) => {
    if (item.roomId !== roomId) return true;
    if (!normalizedRecipientEmail) return false;
    return normalizeEmail(item.recipientEmail || item.candidateEmail || item.email || item.userEmail) !== normalizedRecipientEmail;
  })].slice(0, 12);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('live-room-notification', { detail: payload }));
    window.dispatchEvent(new CustomEvent('notification-storage-sync', { detail: next }));

    if (typeof StorageEvent !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify(next) }));
    } else {
      window.dispatchEvent(new Event('storage'));
    }
  }

  return payload;
};

export const markNotificationRead = (notificationId) => {
  if (typeof window === 'undefined') return [];

  const next = getStoredNotifications().map((item) =>
    item.id === notificationId ? { ...item, read: true } : item,
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const clearNotifications = () => {
  if (typeof window === 'undefined') return [];
  localStorage.removeItem(STORAGE_KEY);
  return [];
};
