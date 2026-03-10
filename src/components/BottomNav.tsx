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
    { id: 'market', label: 'Маркет', icon: ShoppingBag },
    { id: 'my-gifts', label: 'Мои подарки', icon: Gift },
    { id: 'seasons', label: 'Сезоны', icon: Star },
    { id: 'profile', label: 'Профиль', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-4 left-2 right-2 h-[70px] bg-[#1c1c1e]/80 backdrop-blur-xl rounded-[28px] border border-white/10 shadow-2xl flex items-center justify-around px-4 z-50">
      {navItems.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        return (
          <button
            key={id}
            onClick={() => handleNav(id)}
            className="flex flex-col items-center justify-center gap-1 min-w-[60px] active:opacity-70 transition-opacity"
          >
            <Icon 
              className={clsx(
                "w-6 h-6 transition-colors",
                isActive ? "text-[#2382ff]" : "text-[#7d7d85]"
              )} 
            />
            <span 
              className={clsx(
                "text-[11px] font-medium transition-colors",
                isActive ? "text-[#2382ff]" : "text-[#7d7d85]"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
