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
  const [currentView, setCurrentView] = useState<ViewType>('market');
  const [isSynced, setIsSynced] = useState(false);
  const [tonBalance, setTonBalance] = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);
  const [giftId, setGiftId] = useState('');
  const [giftSlug, setGiftSlug] = useState('');
  const [giftNum, setGiftNum] = useState('');

  useEffect(() => {
    initTelegram();

    // Read gift_id from URL — the bot sets this when opening the WebApp:
    // app_url = f"{MINI_APP_URL}?gift_id={gift_id}"
    const urlParams = new URLSearchParams(window.location.search);
    const rawGiftId = urlParams.get('gift_id') || '';

    if (rawGiftId) {
      const parsed = parseGiftId(rawGiftId);
      setGiftId(rawGiftId);
      setGiftSlug(parsed.slug);
      setGiftNum(parsed.num);

      const synced = checkSynced();
      setIsSynced(synced);

      // If user hasn't authenticated yet, show the gift welcome screen first.
      // If they are already synced, go straight to market (gift shown in context).
      if (!synced) {
        setCurrentView('gift-welcome');
      }
    } else {
      setIsSynced(checkSynced());
    }

    trackVisitor();
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
      <div className="min-h-screen bg-[#141414] text-white overflow-x-hidden pb-[100px]">
        {showHeaderAndNav && <Header />}

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
