export function getUserSession() {
  let session = localStorage.getItem('user_session');
  if (!session) {
    session = crypto.randomUUID();
    localStorage.setItem('user_session', session);
  }
  return session;
}
