import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Star } from 'lucide-react';
import { useAppContext } from '../store';
import { nftImage, NFT_NAMES, NFT_PRICES } from '../constants';
import { addToInventory } from '../services/inventory';
import { hapticImpact, hapticNotification } from '../services/telegram';

interface Particle { x: number; y: number; size: number; color: string; dur: number; delay: number; drift: number; }

function useParticles(count: number): Particle[] {
  const ref = useRef<Particle[]>([]);
  if (!ref.current.length) {
    const colors = ['rgba(135,116,225,', 'rgba(35,130,255,', 'rgba(255,255,255,'];
    ref.current = Array.from({ length: count }, () => ({
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 80,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)] + (0.3 + Math.random() * 0.5) + ')',
      dur: 5 + Math.random() * 8,
      delay: Math.random() * 4,
      drift: (Math.random() - 0.5) * 60,
    }));
  }
  return ref.current;
}

export default function GiftWelcomeView() {
  const { giftSlug, giftNum, setCurrentView } = useAppContext();
  const particles = useParticles(16);

  const displayName  = NFT_NAMES[giftSlug] || giftSlug || 'NFT Подарок';
  const price        = giftSlug ? NFT_PRICES[giftSlug] : undefined;
  const imageUrl     = giftSlug ? nftImage(giftSlug, giftNum || undefined) : '';
  const hasValidGift = Boolean(giftSlug);

  useEffect(() => {
    hapticImpact('medium');
    setTimeout(() => hapticImpact('light'), 300);
  }, []);

  const handleClaim = () => {
    hapticImpact('medium');
    if (giftSlug) addToInventory(giftSlug, giftNum || '0');
    setCurrentView('registration');
  };

  const handleSkip = () => {
    hapticImpact('light');
    if (giftSlug) { addToInventory(giftSlug, giftNum || '0'); hapticNotification('success'); }
    setCurrentView('my-gifts');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #120d1f 0%, #0a0a0d 70%)',
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))',
      }}
    >
      {/* Particle field */}
      {particles.map((p, i) => (
        <div key={i} className="particle" style={{
          left: `${p.x}%`,
          bottom: `${p.y}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          '--dur': `${p.dur}s`,
          '--delay': `${p.delay}s`,
          '--drift': `${p.drift}px`,
        } as React.CSSProperties} />
      ))}

      {/* Big ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,116,225,0.2) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'glow-pulse 4s ease-in-out infinite' }} />

      <div className="w-full max-w-sm flex flex-col items-center px-6 relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{ background: 'rgba(135,116,225,0.15)', border: '1px solid rgba(135,116,225,0.35)' }}
        >
          <Sparkles className="w-4 h-4 text-[#8774e1]" />
          <span className="text-[13px] font-bold text-[#8774e1]">Вам подарили NFT!</span>
        </motion.div>

        {/* NFT Image */}
        <motion.div
          initial={{ scale: 0.65, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 160, damping: 16 }}
          className="relative mb-6"
        >
          {/* Rotating ring */}
          <motion.div
            className="absolute -inset-3 rounded-[44px]"
            style={{ border: '1px solid rgba(135,116,225,0.3)', borderTopColor: 'rgba(135,116,225,0.8)', borderRadius: 44 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -inset-5 rounded-[52px]"
            style={{ border: '1px solid rgba(35,130,255,0.15)', borderBottomColor: 'rgba(35,130,255,0.5)', borderRadius: 52 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />

          <div className="w-52 h-52 rounded-[36px] overflow-hidden shadow-2xl relative"
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(135,116,225,0.2)' }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2a1a0a, #1a0f00)' }} />
            {hasValidGift && (
              <img src={imageUrl} alt={displayName} className="w-full h-full object-cover absolute inset-0"
                referrerPolicy="no-referrer" onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
            )}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)' }} />
          </div>

          {/* Corner badge */}
          <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #8774e1, #6c5fc7)', boxShadow: '0 4px 16px rgba(135,116,225,0.5)' }}>
            <Gift className="w-5 h-5 text-white" />
          </div>

          {/* Floating stars */}
          {[{x:-20,y:-10,delay:0},{x:210,y:30,delay:0.5},{x:190,y:180,delay:1}].map((s,i)=>(
            <motion.div key={i}
              className="absolute"
              style={{ left: s.x, top: s.y }}
              animate={{ y: [-4,4,-4], opacity: [0.6,1,0.6] }}
              transition={{ duration: 2+i*0.3, repeat: Infinity, delay: s.delay }}
            >
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </motion.div>
          ))}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-2"
        >
          <h1 className="text-[28px] font-bold text-white leading-tight font-display">{displayName}</h1>
          {giftNum && <p className="text-[15px] text-gray-400 font-medium mt-1">#{giftNum}</p>}
        </motion.div>

        {/* Price */}
        {price !== undefined && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full mb-5"
            style={{ background: 'rgba(35,130,255,0.1)', border: '1px solid rgba(35,130,255,0.25)' }}
          >
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">T</div>
            <span className="text-[14px] font-bold text-white">{price.toFixed(2)} TON</span>
            <span className="text-gray-400 text-sm">≈ ${(price * 3).toFixed(0)}</span>
          </motion.div>
        )}

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleClaim}
          className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center active:scale-[0.97] transition-transform mb-3 text-[16px]"
          style={{ background: 'linear-gradient(135deg, #8774e1, #6c5fc7)', boxShadow: '0 6px 24px rgba(135,116,225,0.4)' }}
          whileTap={{ scale: 0.96 }}
        >
          <Gift className="w-5 h-5 mr-2" />
          Получить подарок
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          onClick={handleSkip}
          className="text-[13px] text-gray-500 py-2 active:text-gray-300 transition-colors"
        >
          Пропустить — подарок будет сохранён
        </motion.button>
      </div>
    </div>
  );
}
