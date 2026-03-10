export function initTelegram() {
  const tg = (window as any).Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes();
  tg.setHeaderColor('#141414');
  tg.setBackgroundColor('#141414');

  const root = document.documentElement;
  function setViewportVariables() {
    root.style.setProperty('--tg-safe-area-top', `${tg.safeAreaInset?.top || 0}px`);
    root.style.setProperty('--tg-safe-area-bottom', `${tg.safeAreaInset?.bottom || 0}px`);
    root.style.setProperty('--tg-content-safe-area-top', `${tg.contentSafeAreaInset?.top || 0}px`);
    root.style.setProperty('--tg-content-safe-area-bottom', `${tg.contentSafeAreaInset?.bottom || 0}px`);
    if (tg.viewportStableHeight) {
      root.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
    }
  }
  setViewportVariables();
  tg.onEvent('viewportChanged', (e: any) => { if (e.isStateStable) setViewportVariables(); });
  tg.onEvent('safeAreaChanged', () => setViewportVariables());
  tg.onEvent('contentSafeAreaChanged', () => setViewportVariables());

  const isMobile = tg.platform === 'ios' || tg.platform === 'android';
  if (isMobile) {
    try { tg.requestFullscreen(); document.body.classList.add('mobile-fullscreen'); } catch {}
  }
}

export function getUserData() {
  const tg = (window as any).Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || {};
  const first = user.first_name || '';
  const last = user.last_name || '';
  const uname = user.username ? `@${user.username}` : '';
  return {
    id: user.id,
    name: (first || last) ? `${first} ${last}`.trim() : (uname || 'Пользователь'),
    username: user.username || '',
    photoUrl: user.photo_url || '',
    isPremium: user.is_premium || false,
    langCode: user.language_code || 'ru'
  };
}

export function hapticImpact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(style);
  }
}

export function hapticNotification(type: 'error' | 'success' | 'warning' = 'success') {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type);
  }
}
