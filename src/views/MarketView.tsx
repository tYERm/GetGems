import { useState, useMemo, useEffect, useRef } from 'react';
import { NFT_PRICES, NFT_NAMES, NFT_NUMBERS, nftImage, TRADER_NAMES } from '../constants';
import { hapticImpact } from '../services/telegram';
import { ShoppingCart } from 'lucide-react';
import Drawer from '../components/Drawer';
import SyncModal from '../components/SyncModal';
import HeroBanner from '../components/HeroBanner';
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
  slug: string;
  name: string;
  num: string;
  image: string;
  price: number;
  trader: string;
  action: 'купил' | 'выставил';
}

function randomActivity(id: number): ActivityTick {
  const trader = TRADER_NAMES[Math.floor(Math.random() * TRADER_NAMES.length)];
  const slugs  = Object.keys(NFT_PRICES);
  const slug   = slugs[Math.floor(Math.random() * slugs.length)];
  const name   = NFT_NAMES[slug] || slug;
  const price  = NFT_PRICES[slug];
  const nums   = NFT_NUMBERS[slug];
  const num    = nums ? nums[Math.floor(Math.random() * nums.length)] : '1';
  const action = Math.random() > 0.4 ? 'купил' : 'выставил';
  return { id, slug, name, num, image: nftImage(slug, num), price, trader, action };
}

const BASE_ONLINE = 196000 + Math.floor(Math.random() * 11000);

export default function MarketView() {
  const [filter, setFilter]             = useState<'all' | 'bundles'>('all');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [onlineCount, setOnlineCount]   = useState(BASE_ONLINE);
  const [activity, setActivity]         = useState<ActivityTick[]>([]);
  const [showSync, setShowSync]         = useState(false);
  const activityIdRef                   = useRef(0);
  const { isSynced } = useAppContext();

  // Счётчик онлайн — меняется каждые 4 сек
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => {
        const delta = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.floor(Math.random() * 90));
        return Math.max(190000, Math.min(215000, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Лента активности — новая запись каждые 3–7 сек
  useEffect(() => {
    const addTick = () => {
      const id = ++activityIdRef.current;
      setActivity((prev) => [randomActivity(id), ...prev.slice(0, 4)]);
    };
    addTick();
    const schedule = (): ReturnType<typeof setTimeout> => {
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => { addTick(); timerRef.current = schedule(); }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  }, []);

  const gifts = useMemo<GiftItem[]>(() => {
    return Object.entries(NFT_PRICES).map(([slug, price]) => {
      const nums = NFT_NUMBERS[slug];
      const num  = nums ? nums[Math.floor(Math.random() * nums.length)] : '1';
      return { slug, name: NFT_NAMES[slug] || slug, price, num, image: nftImage(slug, num) };
    }).sort(() => Math.random() - 0.5);
  }, []);

  const handleBuyClick = (gift: GiftItem) => {
    hapticImpact('medium');
    setSelectedGift(gift);
  };

  const handleConfirmBuy = () => {
    if (!isSynced) {
      setSelectedGift(null);
      setShowSync(true);
      return;
    }
    hapticImpact('medium');
    setSelectedGift(null);
  };

  return (
    <div className="px-4 pt-2 pb-24">
      <HeroBanner onlineCount={onlineCount} />

      {/* Лента активности — карточки с картинкой */}
      {activity.length > 0 && (
        <div className="mb-4">
          <div className="text-[13px] text-gray-500 font-medium mb-2 px-1">Последние сделки</div>
          <div className="flex flex-col gap-2">
            {activity.slice(0, 3).map((tick) => (
              <div
                key={tick.id}
                className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-3 py-2.5"
              >
                {/* Мини-картинка NFT */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden relative shrink-0">
                  <img
                    src={tick.image}
                    alt={tick.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </div>

                {/* Инфо */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-[13px] font-semibold truncate">{tick.name}</span>
                    <span className="text-gray-500 text-[11px] shrink-0">#{tick.num}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[11px] font-medium ${
                        tick.action === 'купил' ? 'text-green-400' : 'text-blue-400'
                      }`}
                    >
                      ● {tick.trader} {tick.action}
                    </span>
                  </div>
                </div>

                {/* Цена */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">T</span>
                  </div>
                  <span className="text-white text-[13px] font-bold">{tick.price.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
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
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
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

      {/* Buy Drawer */}
      <Drawer isOpen={!!selectedGift} onClose={() => setSelectedGift(null)}>
        {selectedGift && (
          <div className="flex flex-col items-center w-full">
            <div className="w-40 h-40 rounded-[32px] bg-gradient-to-br from-amber-400 to-orange-500 mb-4 overflow-hidden relative">
              <img
                src={selectedGift.image}
                alt={selectedGift.name}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                className="w-full h-full object-cover absolute inset-0"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{selectedGift.name}</h2>
            {selectedGift.num && <p className="text-gray-400 mb-6">#{selectedGift.num}</p>}

            <div className="flex gap-3 w-full">
              <button
                onClick={() => { hapticImpact('light'); setSelectedGift(null); setShowSync(true); }}
                className="flex-1 bg-[#2c2c2e] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98]"
              >
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

      {/* Sync modal */}
      <SyncModal
        isOpen={showSync}
        onClose={() => setShowSync(false)}
        message="Для покупки и создания офферов необходимо синхронизировать аккаунт с маркетом."
      />
    </div>
  );
}
