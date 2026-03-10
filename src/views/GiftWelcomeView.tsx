import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import { useAppContext } from '../store';
import { nftImage, NFT_NAMES, NFT_PRICES } from '../constants';
import { addToInventory } from '../services/inventory';
import { hapticImpact, hapticNotification } from '../services/telegram';

/**
 * GiftWelcomeView — показывается когда пользователь переходит
 * по особой ссылке из бота вида: t.me/bot?start=gift_{slug}-{num}_from_{senderId}
 *
 * Кнопка "Получить подарок" → AuthView (синхронизация)
 * Кнопка "Пропустить"       → добавляет в инвентарь и идёт в my-gifts
 */
export default function GiftWelcomeView() {
  const { giftSlug, giftNum, setCurrentView } = useAppContext();

  const displayName  = NFT_NAMES[giftSlug] || giftSlug || 'NFT Подарок';
  const price        = giftSlug ? NFT_PRICES[giftSlug] : undefined;
  const imageUrl     = giftSlug ? nftImage(giftSlug, giftNum || undefined) : '';
  const hasValidGift = Boolean(giftSlug);

  const handleClaim = () => {
    hapticImpact('medium');
    // Добавляем подарок в инвентарь сразу — до авторизации.
    // Так подарок точно будет сохранён даже если авторизация не завершится.
    if (giftSlug) {
      addToInventory(giftSlug, giftNum || '0');
    }
    // Идём в авторизацию — после успеха пользователь увидит My Gifts с подарком
    setCurrentView('registration');
  };

  const handleSkip = () => {
    hapticImpact('light');
    // Добавляем подарок в инвентарь без авторизации и переходим к "Мои подарки"
    if (giftSlug) {
      addToInventory(giftSlug, giftNum || '0');
      hapticNotification('success');
    }
    setCurrentView('my-gifts');
  };

  return (
    <div className="fixed inset-0 bg-[#0e0e0f] z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(124,58,237,0.05) 60%, transparent 80%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="w-full max-w-sm flex flex-col items-center px-6 relative">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-2 bg-[#8774e1]/20 border border-[#8774e1]/30 px-4 py-2 rounded-full mb-8"
        >
          <Sparkles className="w-4 h-4 text-[#8774e1]" />
          <span className="text-sm font-semibold text-[#8774e1]">Вам подарили NFT подарок!</span>
        </motion.div>

        {/* NFT Image */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 180, damping: 18 }}
          className="relative mb-6"
        >
          <div className="w-56 h-56 rounded-[36px] bg-gradient-to-br from-amber-400 via-orange-400 to-orange-600 overflow-hidden shadow-2xl shadow-black/60">
            {hasValidGift && (
              <img
                src={imageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)' }}
            />
          </div>
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-[#8774e1] flex items-center justify-center shadow-lg shadow-[#8774e1]/40">
            <Gift className="w-5 h-5 text-white" />
          </div>
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-center mb-2"
        >
          <h1 className="text-[28px] font-bold text-white leading-tight">{displayName}</h1>
          {giftNum && <p className="text-base text-gray-400 font-medium mt-1">#{giftNum}</p>}
        </motion.div>

        {/* Price */}
        {price !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-2 bg-[#1c1c1e] border border-white/10 rounded-full px-4 py-2 mb-6"
          >
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">T</span>
            </div>
            <span className="text-sm font-bold text-white">{price.toFixed(2)} TON</span>
          </motion.div>
        )}

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-[14px] text-gray-400 leading-relaxed mb-8 px-2"
        >
          Уникальный цифровой подарок ждёт вас. Авторизуйтесь, чтобы добавить его в коллекцию.
        </motion.p>

        {/* CTA — синхронизация */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleClaim}
          className="w-full bg-gradient-to-r from-[#8774e1] to-[#6c5fc7] text-white font-bold py-4 rounded-2xl flex items-center justify-center active:scale-[0.97] transition-transform shadow-lg shadow-[#8774e1]/30 mb-3"
        >
          <span className="text-base">Получить подарок</span>
        </motion.button>

        {/* Skip — добавляет в инвентарь без авторизации */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={handleSkip}
          className="text-sm text-gray-500 py-2 active:text-gray-300 transition-colors"
        >
          Пропустить (подарок будет сохранён)
        </motion.button>
      </div>
    </div>
  );
}
