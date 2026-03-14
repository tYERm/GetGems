import { useState } from 'react';
import { getInventory } from '../services/inventory';
import { NFT_NAMES, NFT_PRICES, nftImage } from '../constants';
import { Plus, Upload, ShoppingCart, Gift, TrendingUp, BarChart2, Check, Tag, Clock } from 'lucide-react';
import { hapticImpact } from '../services/telegram';
import Drawer from '../components/Drawer';
import SyncModal from '../components/SyncModal';

interface InventoryItem {
  slug: string;
  num: string;
  addedAt: number;
}

export default function MyGiftsView() {
  const [tab, setTab]                   = useState<'gifts' | 'offers' | 'history'>('gifts');
  const [status, setStatus]             = useState<'unlisted' | 'listed'>('unlisted');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showSync, setShowSync]         = useState(false);
  const [syncMessage, setSyncMessage]   = useState('');

  const inventory: InventoryItem[] = getInventory();

  const requireSync = (message: string) => {
    hapticImpact('medium');
    setSyncMessage(message);
    setShowSync(true);
  };

  const handleGiftClick = (item: InventoryItem) => {
    hapticImpact('light');
    setSelectedItem(item);
  };

  const getGiftPriceInfo = (item: InventoryItem) => {
    const floor   = NFT_PRICES[item.slug] ?? 0;
    const seed    = parseInt(item.num || '1', 10) || 1;
    const factor  = 1.04 + ((seed % 12) * 0.01);
    const listing = parseFloat((floor * factor).toFixed(2));
    return { floor, listing };
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Tabs ── */}
      <div className="flex bg-[#141414] border-b border-white/10 px-4 pt-4 pb-0">
        {(['gifts', 'offers', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { hapticImpact('light'); setTab(t); }}
            className={`flex-1 text-center pb-3 text-[15px] font-medium transition-colors relative ${
              tab === t ? 'text-white font-semibold' : 'text-gray-400'
            }`}
          >
            {t === 'gifts' ? 'Гифты' : t === 'offers' ? 'Офферы' : 'История'}
            {tab === t && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2d7bff] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* ── TAB: Гифты ── */}
      {/* ══════════════════════════════════════════ */}
      {tab === 'gifts' && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 p-3 bg-[#141414] border-b border-white/10">
            <button
              onClick={() => { hapticImpact('light'); setStatus('unlisted'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                status === 'unlisted' ? 'bg-[#2d7bff]/15 text-[#2d7bff]' : 'bg-white/5 text-gray-400'
              }`}
            >
              Гифты
              <span className={`px-2 py-0.5 rounded-lg text-xs ${status === 'unlisted' ? 'bg-[#2d7bff]/20' : 'bg-white/10'}`}>
                {inventory.length}
              </span>
            </button>
            <button
              onClick={() => { hapticImpact('light'); setStatus('listed'); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                status === 'listed' ? 'bg-[#2d7bff]/15 text-[#2d7bff]' : 'bg-white/5 text-gray-400'
              }`}
            >
              Сделки
              <span className={`px-2 py-0.5 rounded-lg text-xs ${status === 'listed' ? 'bg-[#2d7bff]/20' : 'bg-white/10'}`}>
                0
              </span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 p-3 bg-[#141414]">
            {([
              { icon: Plus,         label: 'Добавить', msg: 'Чтобы добавить подарок, нужна синхронизация аккаунта.' },
              { icon: Upload,       label: 'Вывод',    msg: 'Для вывода NFT необходима синхронизация аккаунта.' },
              { icon: ShoppingCart, label: 'Продать',  msg: 'Для продажи NFT необходима синхронизация аккаунта.' },
              { icon: Gift,         label: 'Отправить',msg: 'Для отправки NFT необходима синхронизация аккаунта.' },
            ]).map(({ icon: Icon, label, msg }) => (
              <button
                key={label}
                onClick={() => requireSync(msg)}
                className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-3 flex flex-col items-center gap-1.5 transition-colors active:scale-95"
              >
                <Icon className="w-6 h-6 text-white" />
                <span className="text-xs font-medium text-white">{label}</span>
              </button>
            ))}
          </div>

          {/* Gift grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-xl font-semibold text-white mb-2">Мои подарки</h2>
                <p className="text-sm text-gray-400">Здесь будут ваши купленные или полученные подарки.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {inventory.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => handleGiftClick(item)}
                    className="bg-[#1c1c1e] border border-white/5 rounded-[22px] overflow-hidden flex flex-col active:scale-[0.97] transition-transform cursor-pointer"
                  >
                    <div className="w-full aspect-square p-2">
                      <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden relative">
                        <img
                          src={nftImage(item.slug, item.num || undefined)}
                          alt={item.slug}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-white truncate">{NFT_NAMES[item.slug] || item.slug}</h3>
                      <p className="text-xs text-gray-400">#{item.num}</p>
                      {NFT_PRICES[item.slug] && (
                        <p className="text-xs text-[#2d7bff] font-medium mt-1">{NFT_PRICES[item.slug].toFixed(2)} TON</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* ── TAB: Офферы — пустое состояние ── */}
      {/* ══════════════════════════════════════════ */}
      {tab === 'offers' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Tag className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Нет активных офферов</h2>
          <p className="text-sm text-gray-400 max-w-[260px]">
            У вас пока нет офферов на покупку или продажу NFT подарков.
          </p>
          <button
            onClick={() => requireSync('Для создания офферов необходима синхронизация аккаунта.')}
            className="mt-6 bg-[#2d7bff]/15 text-[#2d7bff] font-semibold px-6 py-3 rounded-xl active:scale-95 transition-transform text-sm"
          >
            Создать оффер
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* ── TAB: История ── */}
      {/* ══════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto p-4">
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">История пуста</h2>
              <p className="text-sm text-gray-400">
                Здесь появятся полученные NFT подарки.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...inventory].reverse().map((item, i) => {
                const name = NFT_NAMES[item.slug] || item.slug;
                const img  = nftImage(item.slug, item.num || undefined);
                const date = new Date(item.addedAt).toLocaleDateString('ru-RU', {
                  day: '2-digit', month: '2-digit', year: '2-digit',
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div key={i} className="flex items-center gap-3 bg-[#1c1c1e] border border-white/5 rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden shrink-0 relative">
                      <img
                        src={img}
                        alt={name}
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-white font-semibold text-sm truncate">{name}</span>
                      <span className="text-gray-400 text-xs">#{item.num}</span>
                      <span className="text-gray-500 text-xs mt-0.5">{date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-green-500/15 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0">
                      <Check className="w-3 h-3" />
                      Получен
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Gift detail Drawer ── */}
      <Drawer isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (() => {
          const name               = NFT_NAMES[selectedItem.slug] || selectedItem.slug;
          const { floor, listing } = getGiftPriceInfo(selectedItem);
          const imgUrl             = nftImage(selectedItem.slug, selectedItem.num || undefined);

          return (
            <div className="flex flex-col items-center w-full gap-4">
              <div className="w-36 h-36 rounded-[28px] bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden relative shrink-0">
                <img
                  src={imgUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                  className="w-full h-full object-cover absolute inset-0"
                />
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold text-white">{name}</h2>
                <p className="text-sm text-gray-400">#{selectedItem.num}</p>
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                <div className="bg-[#2c2c2e] rounded-2xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Флор цена</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white">T</span>
                    </div>
                    <span className="text-white font-bold text-[15px]">{floor.toFixed(2)}</span>
                  </div>
                </div>
                <div className="bg-[#2c2c2e] rounded-2xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>На продаже</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-white">T</span>
                    </div>
                    <span className="text-white font-bold text-[15px]">{listing.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-[#1a2535] border border-[#2d7bff]/20 rounded-2xl p-3">
                <p className="text-xs text-gray-400 mb-1">Примерная стоимость</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">T</span>
                    </div>
                    <span className="text-white font-bold text-lg">{floor.toFixed(2)} TON</span>
                  </div>
                  <span className="text-xs text-[#2d7bff] font-semibold bg-[#2d7bff]/10 px-2 py-1 rounded-lg">
                    ≈ ${(floor * 3).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Кнопки видны всегда — drawer перекрывает nav благодаря z-[2001] */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    requireSync('Для продажи NFT необходима синхронизация аккаунта.');
                  }}
                  className="flex-1 bg-[#2c2c2e] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                >
                  Продать
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    requireSync('Для передачи NFT необходима синхронизация аккаунта.');
                  }}
                  className="flex-1 bg-[#2d7bff] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
                >
                  Передать
                </button>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* Sync modal */}
      <SyncModal isOpen={showSync} onClose={() => setShowSync(false)} message={syncMessage} />
    </div>
  );
}
