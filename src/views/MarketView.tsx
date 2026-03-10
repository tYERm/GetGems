import { useState, useMemo, useEffect, useRef } from 'react';
import { NFT_PRICES, NFT_NAMES, NFT_NUMBERS, nftImage, TRADER_NAMES } from '../constants';
import { hapticImpact } from '../services/telegram';
import { ShoppingCart, Users } from 'lucide-react';
import Drawer from '../components/Drawer';
import { useAppContext } from '../store';

interface GiftItem {
  slug: string;
  name: string;
  price: number;
  num: string;
  image: string;
}

interface ActivityTick {
  id: number;
  text: string;
}

// Генерирует строку фейковой активности
function randomActivity(): string {
  const trader = TRADER_NAMES[Math.floor(Math.random() * TRADER_NAMES.length)];
  const slugs  = Object.keys(NFT_PRICES);
  const slug   = slugs[Math.floor(Math.random() * slugs.length)];
  const name   = NFT_NAMES[slug] || slug;
  const price  = NFT_PRICES[slug];
  const action = Math.random() > 0.4 ? 'купил' : 'выставил';
  return `${trader} ${action} ${name} за ${price.toFixed(1)} TON`;
}

// Базовое количество "онлайн" — 196 000..207 000
const BASE_ONLINE = 196000 + Math.floor(Math.random() * 11000);

export default function MarketView() {
  const [filter, setFilter]         = useState<'all' | 'bundles'>('all');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [onlineCount, setOnlineCount] = useState(BASE_ONLINE);
  const [activity, setActivity]     = useState<ActivityTick[]>([]);
  const activityIdRef               = useRef(0);
  const { isSynced, setCurrentView } = useAppContext();

  // Имитация онлайн счётчика — меняется каждые 4 сек на ±30..120
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.floor(Math.random() * 90));
        const next  = prev + delta;
        return Math.max(190000, Math.min(215000, next));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Лента активности — новая запись каждые 3..7 сек
  useEffect(() => {
    const addTick = () => {
      const id = ++activityIdRef.current;
      setActivity((prev) => [{ id, text: randomActivity() }, ...prev.slice(0, 4)]);
    };

    addTick();
    const schedule = () => {
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => { addTick(); timerRef.current = schedule(); }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  }, []);

  const gifts = useMemo<GiftItem[]>(() => {
    return Object.entries(NFT_PRICES).map(([slug, price]) => {
      const nums = NFT_NUMBERS[slug];
      const num  = nums ? nums[Math.floor(Math.random() * nums.length)] : '';
      return {
        slug,
        name:  NFT_NAMES[slug] || slug,
        price,
        num,
        image: nftImage(slug, num || undefined),
      };
    }).sort(() => Math.random() - 0.5);
  }, []);

  const handleBuyClick = (gift: GiftItem) => {
    hapticImpact('medium');
    setSelectedGift(gift);
  };

  const handleConfirmBuy = () => {
    if (!isSynced) {
      setSelectedGift(null);
      setCurrentView('registration');
      return;
    }
    hapticImpact('medium');
    alert('Покупка успешна!');
    setSelectedGift(null);
  };

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Banner с онлайн счётчиком */}
      <div className="w-full h-40 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 bg-black/20" />
        <h2 className="text-2xl font-bold text-white z-10 relative mb-2">NFT Gifts Market</h2>
        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 z-10 relative">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <Users className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white">
            {onlineCount.toLocaleString('ru-RU')} онлайн
          </span>
        </div>
      </div>

      {/* Лента активности */}
      {activity.length > 0 && (
        <div className="mb-4 bg-[#1a1a1a] rounded-2xl px-3 py-2 overflow-hidden">
          <div className="text-[11px] text-gray-500 mb-1 font-medium">Последние сделки</div>
          {activity.slice(0, 3).map((tick) => (
            <div key={tick.id} className="text-[12px] text-gray-300 truncate py-0.5">
              <span className="text-green-400 mr-1">●</span>
              {tick.text}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 bg-[#1a1a1a] p-1 rounded-2xl mb-6">
        <button
          onClick={() => { hapticImpact('light'); setFilter('all'); }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            filter === 'all' ? 'bg-[#2a2a2d] text-white' : 'text-gray-400'
          }`}
        >
          Все подарки
        </button>
        <button
          onClick={() => { hapticImpact('light'); setFilter('bundles'); }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            filter === 'bundles' ? 'bg-[#2a2a2d] text-white' : 'text-gray-400'
          }`}
        >
          Бандлы
        </button>
      </div>

      {/* Grid */}
      {filter === 'all' ? (
        <div className="grid grid-cols-2 gap-4">
          {gifts.map((gift, i) => (
            <div
              key={i}
              className="bg-[#1c1c1e] border border-white/5 rounded-[22px] overflow-hidden flex flex-col active:scale-[0.98] transition-transform"
            >
              <div className="w-full aspect-square p-2">
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden relative flex items-center justify-center">
                  <img
                    src={gift.image}
                    alt={gift.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <h3 className="text-sm font-semibold text-white truncate">{gift.name}</h3>
                {gift.num && <p className="text-xs text-gray-400">#{gift.num}</p>}
                <div className="mt-auto pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleBuyClick(gift)}
                    className="flex-1 bg-[#2382ff] text-white text-[13px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 active:bg-[#1a6fd9]"
                  >
                    <div className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center text-[8px]">T</div>
                    {gift.price.toFixed(2)}
                  </button>
                  <button className="w-8 h-8 bg-[#2a2a2d] rounded-lg flex items-center justify-center text-white active:bg-[#353538]">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10">Бандлы скоро появятся</div>
      )}

      {/* Drawer */}
      <Drawer isOpen={!!selectedGift} onClose={() => setSelectedGift(null)}>
        {selectedGift && (
          <div className="flex flex-col items-center w-full">
            <div className="w-40 h-40 rounded-[32px] bg-gradient-to-br from-amber-400 to-orange-500 mb-4 overflow-hidden relative">
              <img
                src={selectedGift.image}
                alt={selectedGift.name}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{selectedGift.name}</h2>
            {selectedGift.num && <p className="text-gray-400 mb-6">#{selectedGift.num}</p>}

            <div className="flex gap-3 w-full">
              <button className="flex-1 bg-[#2c2c2e] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98]">
                Сделать оффер
              </button>
              <button
                onClick={handleConfirmBuy}
                className="flex-1 bg-[#007aff] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] flex flex-col items-center justify-center leading-tight"
              >
                <span>Купить подарок</span>
                <span className="text-xs opacity-90">{selectedGift.price.toFixed(2)} TON</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
