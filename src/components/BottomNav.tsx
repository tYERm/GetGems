import { ShoppingBag, Gift, Star, User } from 'lucide-react';
import { useAppContext, ViewType } from '../store';
import { hapticImpact } from '../services/telegram';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const { currentView, setCurrentView } = useAppContext();

  const handleNav = (view: ViewType) => {
    if (currentView !== view) { hapticImpact('light'); setCurrentView(view); }
  };

  const navItems = [
    { id: 'market',   label: 'Маркет',      icon: ShoppingBag },
    { id: 'my-gifts', label: 'Мои подарки', icon: Gift },
    { id: 'seasons',  label: 'Сезоны',      icon: Star },
    { id: 'profile',  label: 'Профиль',     icon: User },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2"
      style={{
        zIndex: 40,
        background: 'rgba(18,18,22,0.92)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        paddingTop: '8px',
        height: 'calc(64px + max(env(safe-area-inset-bottom, 0px), 8px))',
      }}
    >
      {navItems.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
          >
            {/* Glow blob behind active icon */}
            {isActive && (
              <motion.div
                layoutId="nav-glow"
                className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(35,130,255,0.08)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <motion.div
              animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Icon
                className="w-6 h-6 transition-all duration-200"
                style={{
                  color: isActive ? '#2382ff' : '#6b6b72',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(35,130,255,0.7))' : 'none',
                }}
              />
            </motion.div>
            <span
              className="text-[10px] font-semibold transition-all duration-200"
              style={{ color: isActive ? '#2382ff' : '#6b6b72', fontFamily: 'DM Sans, sans-serif' }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
