import { useState, useMemo, useEffect, useRef } from 'react';
import { NFT_PRICES, NFT_NAMES, NFT_NUMBERS, nftImage, TRADER_NAMES } from '../constants';
import { hapticImpact } from '../services/telegram';
import { ShoppingCart, Users, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Drawer from '../components/Drawer';
import SyncModal from '../components/SyncModal';
import { useAppContext } from '../store';

interface GiftItem { slug: string; name: string; price: number; num: string; image: string; }
interface ActivityTick { id: number; slug: string; name: string; num: string; image: string; price: number; trader: string; action: 'купил' | 'выставил'; }

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

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.floor(Math.random() * 90));
        return Math.max(190000, Math.min(215000, prev + delta));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const addTick = () => {
      const id = ++activityIdRef.current;
      setActivity(prev => [randomActivity(id), ...prev.slice(0, 4)]);
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

  const handleBuyClick = (gift: GiftItem) => { hapticImpact('medium'); setSelectedGift(gift); };

  const handleConfirmBuy = () => {
    if (!isSynced) { setSelectedGift(null); setShowSync(true); return; }
    hapticImpact('medium');
    setSelectedGift(null);
  };

  return (
    <div className="px-4 pt-2 pb-24">
      {/* Banner */}
      <div className="w-full h-44 rounded-[22px] mb-4 flex flex-col items-center justify-center overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1e3d 40%, #1a1035 100%)' }}>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'linear-gradient(rgba(35,130,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(35,130,255,0.3) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Glow */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(35,130,255,0.25) 0%, transparent 65%)' }} />

        {/* Floating NFT orbs */}
        {[0,1,2].map(i => (
          <motion.div key={i}
            className="absolute w-8 h-8 rounded-xl overflow-hidden opacity-40"
            style={{ left: `${15 + i * 30}%`, top: `${20 + (i % 2) * 30}%` }}
            animate={{ y: [-4, 4, -4], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
          >
            <img src={gifts[i]?.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"
              onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
          </motion.div>
        ))}

        <div className="relative z-10 flex flex-col items-center">
          <p className="text-[11px] text-[#2382ff] font-bold uppercase tracking-[0.2em] mb-1">GetGems Market</p>
          <h2 className="text-[26px] font-bold text-white font-display leading-tight">NFT Gifts</h2>
          <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <motion.div className="w-2 h-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <Users className="w-3.5 h-3.5 text-white opacity-70" />
            <motion.span
              key={onlineCount}
              className="text-[12px] font-bold text-white"
              initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
            >
              {onlineCount.toLocaleString('ru-RU')} онлайн
            </motion.span>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <AnimatePresence>
        {activity.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#2382ff]" />
              <span className="text-[12px] text-gray-400 font-semibold uppercase tracking-wide">Последние сделки</span>
            </div>
            <div className="flex flex-col gap-2">
              {activity.slice(0, 3).map((tick, idx) => (
                <motion.div
                  key={tick.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5"
                  style={{ background: 'rgba(28,28,32,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden relative shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f6a827, #e66b12)' }}>
                    <img src={tick.image} alt={tick.name} referrerPolicy="no-referrer"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      className="w-full h-full object-cover absolute inset-0" />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-[13px] font-semibold truncate">{tick.name}</span>
                      <span className="text-gray-500 text-[11px] shrink-0">#{tick.num}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: tick.action === 'купил' ? '#22c55e' : '#2382ff' }} />
                      <span className="text-[11px]" style={{ color: tick.action === 'купил' ? '#22c55e' : '#2382ff' }}>
                        {tick.trader} {tick.action}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[7px] font-bold text-white">T</div>
                    <span className="text-white text-[13px] font-bold">{tick.price.toFixed(1)}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 p-1 rounded-2xl mb-6" style={{ background: 'rgba(28,28,32,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['all', 'bundles'] as const).map(f => (
          <button key={f}
            onClick={() => { hapticImpact('light'); setFilter(f); }}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all relative overflow-hidden"
            style={{ color: filter === f ? '#fff' : '#666' }}
          >
            {filter === f && (
              <motion.div layoutId="filter-bg" className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.09)' }} />
            )}
            <span className="relative">{f === 'all' ? 'Все подарки' : 'Бандлы'}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filter === 'all' ? (
        <div className="grid grid-cols-2 gap-3">
          {gifts.map((gift, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.6) }}
              className="rounded-[20px] overflow-hidden flex flex-col active:scale-[0.97] transition-transform cursor-pointer"
              style={{ background: 'rgba(26,26,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-full aspect-square p-2">
                <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2a1a0a, #1a0f00)' }}>
                  <img src={gift.image} alt={gift.name} referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    className="w-full h-full object-cover absolute inset-0" />
                  {/* Shine overlay */}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)' }} />
                </div>
              </div>
              <div className="px-3 pb-3 pt-1 flex flex-col gap-1 flex-1">
                <h3 className="text-[13px] font-semibold text-white truncate">{gift.name}</h3>
                {gift.num && <p className="text-[11px] text-gray-500">#{gift.num}</p>}
                <div className="mt-auto pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleBuyClick(gift)}
                    className="flex-1 text-white text-[12px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #1a4fd8, #2382ff)', boxShadow: '0 2px 12px rgba(35,130,255,0.3)' }}
                  >
                    <div className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center text-[7px]">T</div>
                    {gift.price.toFixed(2)}
                  </button>
                  <button
                    onClick={() => { hapticImpact('light'); setShowSync(true); }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    <ShoppingCart className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 opacity-50">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-400 text-sm">Бандлы скоро появятся</p>
        </div>
      )}

      {/* Buy Drawer */}
      <Drawer isOpen={!!selectedGift} onClose={() => setSelectedGift(null)}>
        {selectedGift && (
          <div className="flex flex-col items-center w-full">
            {/* NFT image */}
            <div className="w-44 h-44 rounded-[32px] mb-4 overflow-hidden relative shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #2a1a0a, #1a0f00)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
              <img src={selectedGift.image} alt={selectedGift.name} referrerPolicy="no-referrer"
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                className="w-full h-full object-cover absolute inset-0" />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
            </div>

            <h2 className="text-[22px] font-bold text-white mb-1 font-display">{selectedGift.name}</h2>
            {selectedGift.num && <p className="text-gray-400 mb-1 text-sm">#{selectedGift.num}</p>}

            {/* Price display */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ background: 'rgba(35,130,255,0.1)', border: '1px solid rgba(35,130,255,0.25)' }}>
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold text-white">T</div>
              <span className="text-white font-bold">{selectedGift.price.toFixed(2)} TON</span>
              <span className="text-gray-400 text-sm">≈ ${(selectedGift.price * 3).toFixed(0)}</span>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => { hapticImpact('light'); setSelectedGift(null); setShowSync(true); }}
                className="flex-1 font-semibold py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Сделать оффер
              </button>
              <button
                onClick={handleConfirmBuy}
                className="flex-1 text-white font-bold py-3.5 rounded-2xl active:scale-[0.97] transition-transform"
                style={{ background: 'linear-gradient(135deg, #1a4fd8, #2382ff)', boxShadow: '0 4px 20px rgba(35,130,255,0.35)' }}
              >
                <div>Купить</div>
                <div className="text-[11px] opacity-80">{selectedGift.price.toFixed(2)} TON</div>
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <SyncModal isOpen={showSync} onClose={() => setShowSync(false)}
        message="Для покупки и создания офферов необходимо синхронизировать аккаунт с маркетом." />
    </div>
  );
}
