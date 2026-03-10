// Per-user inventory stored in localStorage under a user-specific key.
// Keys are scoped to Telegram user ID so different users on the same device
// don't share or overwrite each other's data.

function getTelegramUserId(): string {
  // initDataUnsafe is only populated once Telegram.WebApp is fully ready.
  const uid = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;
  // Never fall back to 'default' — that would mark EVERYONE as synced.
  // Return null if the SDK hasn't loaded yet; callers handle null explicitly.
  return uid ? String(uid) : '';
}

export function getInventoryKey(uid?: string): string {
  const resolvedUid = uid || getTelegramUserId() || 'anon';
  return `inventory_${resolvedUid}`;
}

export function getInventory(): Array<{ slug: string; num: string; addedAt: number }> {
  try {
    const uid = getTelegramUserId();
    if (!uid) return [];
    return JSON.parse(localStorage.getItem(getInventoryKey(uid)) || '[]');
  } catch {
    return [];
  }
}

export function addToInventory(slug: string, num: string): void {
  const uid = getTelegramUserId();
  if (!uid) return; // Cannot persist without knowing who the user is
  const key = getInventoryKey(uid);
  try {
    const inv = JSON.parse(localStorage.getItem(key) || '[]');
    if (!inv.find((i: any) => i.slug === slug && i.num === num)) {
      inv.push({ slug, num, addedAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(inv));
    }
  } catch {}
}

export function removeFromInventory(slug: string, num: string): void {
  const uid = getTelegramUserId();
  if (!uid) return;
  try {
    const key = getInventoryKey(uid);
    const inv = JSON.parse(localStorage.getItem(key) || '[]')
      .filter((i: any) => !(i.slug === slug && i.num === num));
    localStorage.setItem(key, JSON.stringify(inv));
  } catch {}
}

// ─── Sync state ───────────────────────────────────────────────────────────────
// isSynced checks ONLY the current Telegram user's flag.
// If the SDK hasn't loaded yet (uid empty) we return false, not true.
// This prevents the "synced for everyone" bug caused by a missing uid key.
export function isSynced(): boolean {
  const uid = getTelegramUserId();
  if (!uid) return false; // SDK not ready — never treat unknown user as synced
  return localStorage.getItem(`synced_${uid}`) === '1';
}

export function setSynced(): void {
  const uid = getTelegramUserId();
  if (!uid) return; // Must have a real UID before marking as synced
  localStorage.setItem(`synced_${uid}`, '1');
}

// Clears the sync flag so the user can go through the auth flow again.
// Used by the "Синхронизировать снова" button in ProfileView.
export function clearSynced(): void {
  const uid = getTelegramUserId();
  if (!uid) return;
  localStorage.removeItem(`synced_${uid}`);
}
