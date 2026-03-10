import { useState } from 'react';
import { getUserData } from '../services/telegram';
import { Gift, Rocket, ShieldCheck, Star, Coins, Copy, Check, RefreshCw, Clock } from 'lucide-react';
import { useAppContext } from '../store';
import { clearSynced, getInventory } from '../services/inventory';
import { hapticImpact, hapticNotification } from '../services/telegram';
import { NFT_NAMES, nftImage } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileView() {
  const user = getUserData();
  const { isSynced, setIsSynced, setCurrentView } = useAppContext();
  const [copied, setCopied]             = useState(false);
  const [showHistory, setShowHistory]   = useState(false);

  // Bot username — derived from the same BOT_API domain or fallback
  const botUsername = 'getgemsnft_bot'; // replace with real username if needed

  const inventory = getInventory();

  const handleSyncClick = () => {
    hapticImpact('medium');
    if (isSynced) {
      // Allow re-sync: clear the flag so they can authenticate again
      clearSynced();
      setIsSynced(false);
    }
    setCurrentView('registration');
  };

  const handleInvite = async () => {
    hapticImpact('light');
    const tg = (window as any).Telegram?.WebApp;
    const userId = tg?.initDataUnsafe?.user?.id || '';
    const link = `https://t.me/${botUsername}?start=ref_${userId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      hapticNotification('success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for Telegram WebApp where clipboard API may be restricted
      try {
        tg?.HapticFeedback?.notificationOccurred('success');
      } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-24">
      <div className="w-24 h-24 rounded-full border-[3px] border-white/20 mb-4 overflow-hidden bg-[#2c2c2e] flex items-center justify-center text-3xl font-bold text-white">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>

      <h2 className="text-xl font-bold text-white mb-4">{user.name}</h2>

      <div className="w-full max-w-[360px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

      <div className="grid grid-cols-3 gap-3 w-full max-w-[420px] mb-6">
        <div className="flex flex-col items-center relative after:content-[''] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-gradient-to-b after:from-transparent after:via-white/20 after:to-transparent">
          <div className="flex items-center gap-1.5 text-[17px] font-bold text-white">
            0 <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-[8px] flex items-center justify-center">T</div>
          </div>
          <span className="text-[13px] text-gray-400">Объём</span>
        </div>
        <div className="flex flex-col items-center relative after:content-[''] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-gradient-to-b after:from-transparent after:via-white/20 after:to-transparent">
          <div className="flex items-center gap-1.5 text-[17px] font-bold text-white">
            0 <Gift className="w-4 h-4 text-gray-300" />
          </div>
          <span className="text-[13px] text-gray-400">Куплено</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[17px] font-bold text-white">
            {inventory.length} <Gift className="w-4 h-4 text-gray-300" />
          </div>
          <span className="text-[13px] text-gray-400">Получено</span>
        </div>
      </div>

      {/* Sync button — always clickable, shows "Синхронизировать снова" when synced */}
      <button
        onClick={handleSyncClick}
        className="w-full max-w-[420px] py-3.5 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#2a2a30] text-white font-bold shadow-lg mb-2 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4 opacity-70" />
        {isSynced ? 'Синхронизировать снова' : 'Синхронизация'}
      </button>

      {/* Transaction history button */}
      <button
        onClick={() => { hapticImpact('light'); setShowHistory(true); }}
        className="w-full max-w-[420px] py-3.5 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#2a2a30] text-white font-bold shadow-lg mb-6 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <Clock className="w-4 h-4 opacity-70" />
        История транзакций
      </button>

      {/* Referral / invite block */}
      <div className="w-full max-w-[420px] rounded-2xl bg-gradient-to-br from-[#1b1d24] to-[#111218] border border-white/5 p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white leading-tight">Приглашайте друзей и зарабатывайте TON</h3>
            <p className="text-[13px] text-gray-400 leading-tight mt-1">От 20% до 50% в TON и +10% очков сезона с покупок рефералов</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2.5">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <div className="text-[15px] font-bold text-white">Реферальные комиссии</div>
              <div className="text-[13px] text-gray-400">Зарабатывайте от 20% до 50% в TON от их покупок</div>
            </div>
          </div>
          <div className="h-px w-full bg-white/5" />
          <div className="flex gap-2.5">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
            <div>
              <div className="text-[15px] font-bold text-white">10% очков сезона</div>
              <div className="text-[13px] text-gray-400">Из очков, заработанных вашими рефералами</div>
            </div>
          </div>
          <div className="h-px w-full bg-white/5" />
          <div className="flex gap-2.5">
            <Coins className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-[15px] font-bold text-white">Кэшбэк — зарабатывайте с покупок</div>
              <div className="text-[13px] text-gray-400">Растёт вместе с объёмом ваших покупок</div>
            </div>
          </div>
        </div>

        {/* Invite button — copies referral link */}
        <button
          onClick={handleInvite}
          className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white font-bold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Скопировано!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Пригласить друзей
            </>
          )}
        </button>
      </div>

      {/* ─── Transaction history modal ─── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-[24px] p-4 pb-10 z-[2001] max-h-[80vh] overflow-y-auto"
            >
              <div className="w-10 h-1.5 bg-white/30 rounded-full mb-4 mx-auto" />
              <h2 className="text-lg font-bold text-white mb-4 text-center">История транзакций</h2>

              {inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                  <Clock className="w-12 h-12 text-gray-500 mb-3" />
                  <p className="text-gray-400 text-sm">История пуста</p>
                  <p className="text-gray-500 text-xs mt-1">Здесь появятся полученные подарки</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {inventory.map((item, i) => {
                    const name = NFT_NAMES[item.slug] || item.slug;
                    const img  = nftImage(item.slug, item.num || undefined);
                    const date = new Date(item.addedAt).toLocaleDateString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    });
                    return (
                      <div key={i} className="flex items-center gap-3 bg-[#2c2c2e] rounded-2xl p-3">
                        {/* NFT thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden shrink-0 relative">
                          <img
                            src={img}
                            alt={name}
                            referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                            className="w-full h-full object-cover absolute inset-0"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-white font-semibold text-sm truncate">{name} #{item.num}</span>
                          <span className="text-gray-400 text-xs mt-0.5">{date}</span>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-1.5 bg-green-500/15 text-green-400 text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0">
                          <Check className="w-3 h-3" />
                          Получен
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
