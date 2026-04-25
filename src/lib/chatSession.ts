const COOKIE_NAME = 'fto_chat_used';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export function getSessionCount(): number {
  if (typeof document === 'undefined') return 0;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === COOKIE_NAME) {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : Math.min(parsed, 2);
    }
  }
  return 0;
}

export function incrementSessionCount(): number {
  if (typeof document === 'undefined') return 0;
  
  const current = getSessionCount();
  const next = Math.min(current + 1, 2);
  
  const date = new Date();
  date.setTime(date.getTime() + COOKIE_MAX_AGE * 1000);
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `${COOKIE_NAME}=${next};${expires};path=/`;
  
  return next;
}

export function resetSessionCount(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
