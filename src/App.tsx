import { useEffect, useState } from 'react';
import { initTelegram } from './services/telegram';
import { trackVisitor } from './services/api';
import { isSynced as checkSynced } from './services/inventory';
import { AppContext, ViewType } from './store';
import { parseGiftId } from './constants';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MarketView from './views/MarketView';
import MyGiftsView from './views/MyGiftsView';
import SeasonsView from './views/SeasonsView';
import ProfileView from './views/ProfileView';
import AuthView from './views/AuthView';
import DepositTonView from './views/DepositTonView';
import DepositStarsView from './views/DepositStarsView';
import GiftWelcomeView from './views/GiftWelcomeView';

export default function App() {
  const [currentView,  setCurrentView]  = useState<ViewType>('market');
  const [isSynced,     setIsSynced]     = useState(false);
  const [tonBalance,   setTonBalance]   = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);
  const [giftId,       setGiftId]       = useState('');
  const [giftSlug,     setGiftSlug]     = useState('');
  const [giftNum,      setGiftNum]      = useState('');

  useEffect(() => {
    initTelegram();
    trackVisitor();

    const urlParams = new URLSearchParams(window.location.search);
    const rawGiftId = urlParams.get('gift_id') || '';

    // isSynced reads from localStorage keyed by Telegram uid.
    // The Telegram SDK populates initDataUnsafe asynchronously after tg.ready().
    // We poll until uid is available (max ~1 second), then decide the initial view.
    // This prevents the "everyone looks synced" bug without losing the gift flow.
    let attempts = 0;
    const maxAttempts = 10;

    const resolve = () => {
      const tgUid = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id;

      if (!tgUid && attempts < maxAttempts) {
        attempts++;
        setTimeout(resolve, 200);
        return;
      }

      const synced = checkSynced();
      setIsSynced(synced);

      if (rawGiftId) {
        const parsed = parseGiftId(rawGiftId);
        setGiftId(rawGiftId);
        setGiftSlug(parsed.slug);
        setGiftNum(parsed.num);

        // Всегда показываем экран подарка при переходе по подарочной ссылке —
        // даже если пользователь уже синхронизирован, он должен видеть что ему подарили
        setCurrentView('gift-welcome');
      }
    };

    setTimeout(resolve, 100);
  }, []);

  const isAuthView        = currentView === 'registration';
  const isDepositView     = currentView === 'deposit-ton' || currentView === 'deposit-stars';
  const isGiftWelcomeView = currentView === 'gift-welcome';
  const showHeaderAndNav  = !isAuthView && !isDepositView && !isGiftWelcomeView;

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      isSynced,    setIsSynced,
      tonBalance,  setTonBalance,
      starsBalance, setStarsBalance,
      giftId,      setGiftId,
      giftSlug,    setGiftSlug,
      giftNum,     setGiftNum,
    }}>
      <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden pb-[72px]">
        {currentView === 'market' && <Header />}

        <main className="relative z-10 w-full h-full">
          {currentView === 'market'        && <MarketView />}
          {currentView === 'my-gifts'      && <MyGiftsView />}
          {currentView === 'seasons'       && <SeasonsView />}
          {currentView === 'profile'       && <ProfileView />}
          {currentView === 'registration'  && <AuthView />}
          {currentView === 'deposit-ton'   && <DepositTonView />}
          {currentView === 'deposit-stars' && <DepositStarsView />}
          {currentView === 'gift-welcome'  && <GiftWelcomeView />}
        </main>

        {showHeaderAndNav && <BottomNav />}
      </div>
    </AppContext.Provider>
  );
}
