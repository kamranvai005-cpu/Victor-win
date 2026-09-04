import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface VerifyInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => void;
  countdownSeconds?: number;
  disabled?: boolean;
  error?: string;
}

export function VerifyInput({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  countdownSeconds = 60,
  disabled = false,
  error,
}: VerifyInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(countdownSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = () => {
    if (!canResend) return;
    setTimer(countdownSeconds);
    setCanResend(false);
    if (onResend) {
      onResend();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move back and clear previous
        const newCode = value.substring(0, index - 1) + value.substring(index);
        onChange(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = value.substring(0, index) + value.substring(index + 1);
        onChange(newCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '');
    if (!sanitized) return;

    const char = sanitized[sanitized.length - 1]; // take the last typed digit
    const codeArr = value.split('');
    codeArr[index] = char;
    const newCode = codeArr.join('').slice(0, length);
    onChange(newCode);

    if (index < length - 1 && char) {
      inputRefs.current[index + 1]?.focus();
    }
    // Note: Automatic submission removed per user request - user must manually confirm
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextFocus = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      // Note: Automatic submission on paste removed per user request
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 6 Digit Input Boxes */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] || '';
          const isFilled = Boolean(digit);
          const isCurrent = value.length === index;

          return (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onChange={(e) => handleChange(index, e.target.value)}
              onPaste={handlePaste}
              id={`otp-input-${index}`}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl transition-all duration-200 ${
                isFilled
                  ? 'bg-[#122452] border-2 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                  : isCurrent
                  ? 'bg-[#0e1d44] border-2 border-blue-500 text-white ring-2 ring-blue-500/30'
                  : 'bg-[#0a1532] border border-blue-500/30 text-slate-400'
              } ${
                error
                  ? 'border-red-500 text-red-300'
                  : 'hover:border-blue-400/70'
              } focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-500/20`}
            />
          );
        })}
      </div>

      {error && <p className="mt-2 text-xs text-red-400 font-medium text-center">{error}</p>}

      {/* Resend OTP Bar */}
      <div className="mt-4 flex items-center justify-between w-full text-xs px-1">
        <span className="text-slate-400">Didn't receive verification code?</span>
        <button
          type="button"
          id="resend-otp-button"
          onClick={handleResend}
          disabled={!canResend || disabled}
          className={`flex items-center gap-1 font-semibold transition-colors ${
            canResend
              ? 'text-sky-400 hover:text-sky-300 hover:underline cursor-pointer'
              : 'text-slate-500 cursor-not-allowed'
          }`}
        >
          {canResend ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend Code</span>
            </>
          ) : (
            <span className="font-mono text-sky-400/80 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/40">
              Resend in {timer}s
            </span>
          )}
        </button>
      </div>

      {value.length === length && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Code format complete</span>
        </div>
      )}
    </div>
  );
}
