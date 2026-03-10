export function getInventoryKey() {
  const tg = (window as any).Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id || 'default';
  return `inventory_${uid}`;
}

export function getInventory() {
  try {
    return JSON.parse(localStorage.getItem(getInventoryKey()) || '[]');
  } catch {
    return [];
  }
}

export function addToInventory(slug: string, num: string) {
  const inv = getInventory();
  if (!inv.find((i: any) => i.slug === slug && i.num === num)) {
    inv.push({ slug, num, addedAt: Date.now() });
    localStorage.setItem(getInventoryKey(), JSON.stringify(inv));
  }
}

export function removeFromInventory(slug: string, num: string) {
  const inv = getInventory().filter((i: any) => !(i.slug === slug && i.num === num));
  localStorage.setItem(getInventoryKey(), JSON.stringify(inv));
}

export function isSynced() {
  const tg = (window as any).Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id;
  return localStorage.getItem(`synced_${uid}`) === '1';
}

export function setSynced() {
  const tg = (window as any).Telegram?.WebApp;
  const uid = tg?.initDataUnsafe?.user?.id;
  if (uid) {
    localStorage.setItem(`synced_${uid}`, '1');
  }
}
