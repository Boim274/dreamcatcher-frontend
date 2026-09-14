export function getUserSession() {
  let userId = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id != null) userId = parsed.id;
    }
  } catch {
    /* ignore malformed user */
  }

  const storageKey = userId != null ? `user_session_u${userId}` : 'user_session_guest';
  let session = localStorage.getItem(storageKey);
  if (!session) {
    session = crypto.randomUUID();
    localStorage.setItem(storageKey, session);
  }
  return session;
}

