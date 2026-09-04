import { useState } from 'react';
import { Send, X, Sparkles, Headphones } from 'lucide-react';
import { sound } from '../utils/audio';

interface CustomerServiceModalProps {
  onClose: () => void;
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

export function CustomerServiceModal({ onClose }: CustomerServiceModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Hello! Welcome to HGNICE 24/7 VIP Customer Support. How can we assist you today regarding Deposit, Withdrawal, Win Go, or VIP Bonuses?',
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');

  const quickQuestions = [
    'How do I deposit via bKash / Nagad?',
    'What is the minimum withdrawal time?',
    'How does Win Go 1-Min color prediction work?',
    'How do I claim my VIP salary?',
  ];

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;
    sound.playClick();

    const newMsg: Message = {
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    // Instant smart assistant reply
    setTimeout(() => {
      sound.playChip();
      let botReply = 'Thank you for reaching out! Our financial support team is active 24/7.';
      if (userText.toLowerCase().includes('deposit') || userText.toLowerCase().includes('bkash')) {
        botReply = 'Deposits via bKash & Nagad are automatically credited in 1-3 minutes! Simply copy our official merchant number from the Deposit Cashier, complete payment, and paste your TrxID.';
      } else if (userText.toLowerCase().includes('withdraw')) {
        botReply = 'Withdrawals are processed super-fast in 3-10 minutes. Minimum withdrawal is ৳500 with zero transaction fees for VIP members.';
      } else if (userText.toLowerCase().includes('win go') || userText.toLowerCase().includes('color')) {
        botReply = 'In Win Go 1-Min, guess Green (1,3,7,9), Red (2,4,6,8), or Violet (0,5). Number predictions pay out at a 9X multiplier!';
      } else if (userText.toLowerCase().includes('vip')) {
        botReply = 'VIP members receive daily check-in attendance rewards, weekly rebates, and automated monthly salaries up to ৳75,000!';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0e1d44] via-[#091533] to-[#060e22] border border-blue-500/40 shadow-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#091636] border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-[#08122c] rounded-[14px] flex items-center justify-center p-1.5 text-amber-400">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#091636]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1">
                <span>VIP Live Support</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </h3>
              <p className="text-[10px] text-emerald-400 font-semibold">● Online • 24/7 Dedicated Agent</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 text-xs ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5 p-1 text-amber-300">
                  <Headphones className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-bold rounded-br-none shadow-md'
                    : 'bg-[#0d1c3e] border border-blue-500/30 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
                <span className="text-[9px] text-slate-400 mt-1 block text-right font-mono">
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Question Chips */}
        <div className="px-3 py-2 bg-[#08122c] border-t border-blue-950/60 overflow-x-auto flex gap-1.5 scrollbar-none no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full bg-[#11234c] hover:bg-blue-900/60 border border-blue-500/30 text-[10px] text-sky-300 whitespace-nowrap transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#091636] border-t border-blue-900/60 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type your message..."
            className="flex-1 bg-[#08122c] border border-blue-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="button"
            onClick={() => handleSend(input)}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
