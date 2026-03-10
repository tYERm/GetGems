import { ShoppingBag, Gift, Star, User } from 'lucide-react';
import { useAppContext, ViewType } from '../store';
import { hapticImpact } from '../services/telegram';
import { clsx } from 'clsx';

export default function BottomNav() {
  const { currentView, setCurrentView } = useAppContext();

  const handleNav = (view: ViewType) => {
    if (currentView !== view) {
      hapticImpact('light');
      setCurrentView(view);
    }
  };

  const navItems = [
    { id: 'market',   label: 'Маркет',      icon: ShoppingBag },
    { id: 'my-gifts', label: 'Мои подарки', icon: Gift },
    { id: 'seasons',  label: 'Сезоны',      icon: Star },
    { id: 'profile',  label: 'Профиль',     icon: User },
  ] as const;

  return (
    // zIndex: 40 через inline style — гарантированно ниже Drawer (inline zIndex: 2000/2001)
    // и SyncModal (inline zIndex: 3000/3001), но выше обычного контента страницы
    <nav
      className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e]/90 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-2"
      style={{
        zIndex: 40,
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
            className="flex flex-col items-center justify-center gap-1 flex-1 active:opacity-70 transition-opacity py-1"
          >
            <Icon className={clsx('w-6 h-6 transition-colors', isActive ? 'text-[#2382ff]' : 'text-[#7d7d85]')} />
            <span className={clsx('text-[11px] font-medium transition-colors', isActive ? 'text-[#2382ff]' : 'text-[#7d7d85]')}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
