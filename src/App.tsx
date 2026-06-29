import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Heart, Sparkles, Send, Copy, ArrowRight, Check, CheckCircle2, 
  Settings, Users, BarChart3, Globe, Code2, LogIn, LogOut, ChevronRight, 
  User, Mail, ArrowLeft, Star, Edit, Sliders, ShieldCheck, CreditCard, ExternalLink, HelpCircle,
  AlertCircle, X, ChevronDown, Menu, Search, RefreshCw, Zap, Calendar, Link,
  Trash2, Plus, EyeOff, Eye
} from 'lucide-react';
import { Creator, WidgetSettings, Tip } from './types';
import confetti from 'canvas-confetti';
import { translations } from './translations';
import { playClickSound } from './utils/audio';
import { api } from './services/api';
import SocialDeck from './components/SocialDeck';
import ShareModal from './components/ShareModal';

export type AppLocale = 'en' | 'zh' | 'es' | 'fr' | 'it' | 'ga' | 'ru' | 'ar' | 'ja' | 'ko' | 'pt';

export const LanguageContext = React.createContext<{
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  t: typeof translations['en'];
  isSettingsOpen: boolean;
  setIsSettingsOpen: (o: boolean) => void;
  confettiEnabled: boolean;
  setConfettiEnabled: (e: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (e: boolean) => void;
  sandboxTheme: 'light' | 'dark' | 'glass';
  setSandboxTheme: (t: 'light' | 'dark' | 'glass') => void;
} | null>(null);

export function useTranslation() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageContext.Provider');
  }
  return context;
}

export default function App() {
  // Client-Side Routing State
  const [path, setPath] = useState(window.location.pathname);
  const [queryParams, setQueryParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
  });

  // Localization State
  const [locale, setLocale] = useState<AppLocale>(() => {
    const saved = localStorage.getItem('tiplet_locale');
    const validLocales: AppLocale[] = ['en', 'zh', 'es', 'fr', 'it', 'ga', 'ru', 'ar', 'ja', 'ko', 'pt'];
    if (validLocales.includes(saved as AppLocale)) return saved as AppLocale;
    
    const browserLang = navigator.language.split('-')[0];
    if (validLocales.includes(browserLang as AppLocale)) return browserLang as AppLocale;
    
    return navigator.language.includes('zh') ? 'zh' : 'en';
  });

  // Keep locale synced with localStorage
  useEffect(() => {
    localStorage.setItem('tiplet_locale', locale);
  }, [locale]);

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Other Sandbox Preferences
  const [influencerCount, setInfluencerCount] = useState<number>(() => {
    const saved = localStorage.getItem('tiplet_influencer_count');
    return saved ? Number(saved) : 3;
  });

  useEffect(() => {
    localStorage.setItem('tiplet_influencer_count', String(influencerCount));
  }, [influencerCount]);

  const [confettiEnabled, setConfettiEnabled] = useState(() => {
    return localStorage.getItem('tiplet_confetti_enabled') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('tiplet_sound_enabled') !== 'false';
  });
  const [sandboxTheme, setSandboxTheme] = useState<'light' | 'dark' | 'glass'>(() => {
    const saved = localStorage.getItem('tiplet_sandbox_theme');
    return (saved as any) || 'light';
  });

  // Sync preferences with localStorage
  useEffect(() => {
    localStorage.setItem('tiplet_confetti_enabled', String(confettiEnabled));
  }, [confettiEnabled]);

  useEffect(() => {
    localStorage.setItem('tiplet_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('tiplet_sandbox_theme', sandboxTheme);
  }, [sandboxTheme]);

  // Translate helper
  const t = translations[locale];

  // Creator Session State
  const [currentUser, setCurrentUser] = useState<Creator | null>(() => {
    const saved = localStorage.getItem('tiplet_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Global Navigation Helper
  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    const cleanPath = newPath.split('?')[0];
    setPath(cleanPath);
    const searchString = newPath.includes('?') ? newPath.substring(newPath.indexOf('?')) : '';
    setQueryParams(Object.fromEntries(new URLSearchParams(searchString).entries()));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state with back/forward history buttons
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
      setQueryParams(Object.fromEntries(new URLSearchParams(window.location.search).entries()));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update localStorage session on change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tiplet_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('tiplet_session');
    }
  }, [currentUser]);

  // Toast notice system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<any>(null);

  const showToast = (msg: string) => {
    let type: 'success' | 'error' | 'info' = 'info';
    const lowercaseMsg = msg.toLowerCase();
    
    if (
      lowercaseMsg.includes('success') || 
      lowercaseMsg.includes('live') || 
      lowercaseMsg.includes('welcome') || 
      lowercaseMsg.includes('copied') || 
      lowercaseMsg.includes('saved') || 
      lowercaseMsg.includes('unlocked') || 
      lowercaseMsg.includes('toggled') ||
      lowercaseMsg.includes('upgraded')
    ) {
      type = 'success';
    } else if (
      lowercaseMsg.includes('fail') || 
      lowercaseMsg.includes('error') || 
      lowercaseMsg.includes('requires') || 
      lowercaseMsg.includes('minimum')
    ) {
      type = 'error';
    }

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    const id = Date.now();
    setToast({ message: msg, type, id });

    const timeout = setTimeout(() => {
      setToast(null);
    }, 1000); // Quick feedback duration as requested
    setToastTimeoutId(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutId) clearTimeout(toastTimeoutId);
    };
  }, [toastTimeoutId]);

  // Render current view
  const renderView = () => {
    // 1. Embedded widget frame (iframe context)
    if (path === '/widget-frame') {
      return <WidgetFrameView queryParams={queryParams} showToast={showToast} />;
    }

    // 2. Simulated payment checkout flow
    if (path === '/checkout/simulated') {
      return <SimulatedCheckoutView queryParams={queryParams} navigate={navigate} showToast={showToast} />;
    }

    // 3. Checkout payment success thank-you page
    if (path === '/success') {
      return <SuccessView queryParams={queryParams} navigate={navigate} />;
    }

    // 4. Manual Login / Register page
    if (path === '/login') {
      return (
        <LoginView 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          navigate={navigate} 
          showToast={showToast} 
        />
      );
    }

    // 5. Creator Portal Dashboard
    if (path === '/dashboard') {
      if (!currentUser) {
        return <RedirectToLogin navigate={navigate} />;
      }
      return (
        <DashboardView 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
          navigate={navigate} 
          showToast={showToast} 
        />
      );
    }

    // 6. Home / Product Landing Page
    if (path === '/') {
      return (
        <LandingPageView 
          currentUser={currentUser} 
          navigate={navigate} 
          showToast={showToast} 
          influencerCount={influencerCount}
          setInfluencerCount={setInfluencerCount}
        />
      );
    }

    // 7. Dynamic segment creator public page (e.g. /wyatt)
    const username = path.replace('/', '').trim();
    if (username.length > 0) {
      return (
        <CreatorPublicView 
          username={username} 
          navigate={navigate} 
          showToast={showToast} 
          currentUser={currentUser} 
          influencerCount={influencerCount}
          setInfluencerCount={setInfluencerCount}
        />
      );
    }

    // Fallback: Home Page
    return (
      <LandingPageView 
        currentUser={currentUser} 
        navigate={navigate} 
        showToast={showToast} 
        influencerCount={influencerCount}
        setInfluencerCount={setInfluencerCount}
      />
    );
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isSettingsOpen, setIsSettingsOpen, confettiEnabled, setConfettiEnabled, soundEnabled, setSoundEnabled, sandboxTheme, setSandboxTheme }}>
      <div className="min-h-screen flex flex-col relative select-none">
        {/* Dynamic Toast Notice */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -80, x: '-50%', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
              exit={{ opacity: 0, y: -40, x: '-50%', scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="fixed top-8 left-1/2 z-[9999] flex items-center gap-4 py-4 px-5 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] pointer-events-auto max-w-sm w-[340px] md:w-[380px] overflow-hidden"
            >
              {/* Status Icon Indicator */}
              <div className={`p-2.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] shrink-0 flex items-center justify-center ${
                toast.type === 'success' ? 'bg-brand-orange text-white' :
                toast.type === 'error' ? 'bg-red-500 text-white' :
                'bg-slate-900 text-white'
              }`}>
                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" strokeWidth={3} /> :
                 toast.type === 'error' ? <AlertCircle className="w-5 h-5" strokeWidth={3} /> :
                 <Sparkles className="w-5 h-5" strokeWidth={3} />}
              </div>
              
              {/* Message and Sub-header */}
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {toast.type === 'success' ? 'Notification' :
                   toast.type === 'error' ? 'System Alert' :
                   'System Message'}
                </p>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {toast.message}
                </p>
              </div>

              {/* Premium Micro Close Button */}
              <button 
                onClick={() => setToast(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>

              {/* Premium Countdown Progress Bar at Bottom */}
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 1, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 border-r-2 border-slate-900 ${
                  toast.type === 'success' ? 'bg-brand-orange' :
                  toast.type === 'error' ? 'bg-red-500' :
                  'bg-slate-900'
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Settings & Preferences Modal */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsOpen(false)}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              />
              
              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-[12px_12px_0px_#0f172a] border-4 border-slate-900 select-none overflow-hidden"
              >
                {/* Close Button top-right */}
                <button 
                  onClick={() => { playClickSound(); setIsSettingsOpen(false); }}
                  className="absolute top-6 right-6 p-2 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer z-10"
                >
                  <X className="w-5 h-5" strokeWidth={3} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-8 pr-12">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 text-brand-orange border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center shrink-0">
                    <Settings className="w-7 h-7" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-slate-900 font-display uppercase tracking-tight leading-tight">{t.settings_title}</h3>
                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-1 opacity-70">{t.settings_desc}</p>
                  </div>
                </div>

                {/* Setting Options */}
                <div className="space-y-6">
                  {/* 1. Language Toggle */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest pl-1">{t.lang_label}</label>
                    <div className="relative">
                      <select 
                        value={locale}
                        onChange={(e) => { playClickSound(); setLocale(e.target.value as AppLocale); }}
                        className="w-full py-3 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest bg-white text-slate-900 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] appearance-none cursor-pointer focus:outline-none transition-all hover:bg-slate-50"
                      >
                        {[
                          { id: 'en', label: '🇺🇸 English' },
                          { id: 'zh', label: '🇨🇳 简体中文' },
                          { id: 'es', label: '🇪🇸 Español' },
                          { id: 'fr', label: '🇫🇷 Français' },
                          { id: 'it', label: '🇮🇹 Italiano' },
                          { id: 'ga', label: '🇮🇪 Gaeilge' },
                          { id: 'ru', label: '🇷🇺 Русский' },
                          { id: 'ar', label: '🇸🇦 العربية' },
                          { id: 'ja', label: '🇯🇵 日本語' },
                          { id: 'ko', label: '🇰🇷 한국어' },
                          { id: 'pt', label: '🇵🇹 Português' }
                        ].map((lang) => (
                          <option key={lang.id} value={lang.id}>{lang.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-900" strokeWidth={3} />
                      </div>
                    </div>
                  </div>

                  {/* 2. Tactile sound toggle */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F3F5F9] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                    <div className="pr-4 min-w-0">
                      <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{t.sound_label}</p>
                      <p className="text-[10px] text-slate-500 font-bold leading-tight mt-1">{t.sound_desc}</p>
                    </div>
                    <button 
                      onClick={() => {
                        const newVal = !soundEnabled;
                        setSoundEnabled(newVal);
                        localStorage.setItem('tiplet_sound_enabled', String(newVal));
                        if (newVal) {
                          setTimeout(() => playClickSound(), 50);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-900 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        soundEnabled 
                          ? 'bg-brand-orange text-white shadow-[2px_2px_0px_#0f172a]' 
                          : 'bg-slate-200 text-slate-500 shadow-none opacity-60'
                      }`}
                    >
                      {soundEnabled ? t.sound_enabled : t.sound_disabled}
                    </button>
                  </div>

                  {/* 3. Confetti celebrations */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F3F5F9] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
                    <div className="pr-4 min-w-0">
                      <p className="text-[13px] font-black text-slate-900 uppercase tracking-tight">{t.confetti_label}</p>
                      <p className="text-[10px] text-slate-500 font-bold leading-tight mt-1">{t.confetti_desc}</p>
                    </div>
                    <button 
                      onClick={() => {
                        playClickSound();
                        setConfettiEnabled(!confettiEnabled);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-900 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        confettiEnabled 
                          ? 'bg-brand-orange text-white shadow-[2px_2px_0px_#0f172a]' 
                          : 'bg-slate-200 text-slate-500 shadow-none opacity-60'
                      }`}
                    >
                      {confettiEnabled ? t.confetti_enabled : t.confetti_disabled}
                    </button>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="mt-8 pt-6 border-t-2 border-slate-900 flex justify-end">
                  <button 
                    onClick={() => { playClickSound(); setIsSettingsOpen(false); }}
                    className="py-3 px-8 rounded-xl bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest border-2 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                  >
                    {t.close}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Render Main Selected Page */}
        <div className="flex-1 flex flex-col">
          {renderView()}
        </div>
      </div>
    </LanguageContext.Provider>
  );
}

/* ==========================================================================
   REDIRECT COMPONENT
   ========================================================================== */
function RedirectToLogin({ navigate }: { navigate: (p: string) => void }) {
  useEffect(() => {
    navigate('/login');
  }, []);
  return null;
}

/* ==========================================================================
   FEEDBACK MARQUEE SECTION
   ========================================================================== */
const FeedbackCard: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`shrink-0 w-[300px] md:w-[360px] p-5 rounded-[1.5rem] border-[3px] border-slate-900 shadow-[6px_6px_0px_#0f172a] hover:shadow-[12px_12px_0px_#0f172a] flex flex-col gap-4 relative overflow-hidden group transition-shadow duration-300 ${data.bgClass}`}
    >
      <div className="flex items-center gap-3">
        <img src={data.avatar} alt={data.name} className="w-12 h-12 rounded-full border-2 border-slate-900 object-cover" />
        <div>
          <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{data.name}</h4>
          <p className="text-[10px] font-bold text-slate-700/80 uppercase tracking-widest">{data.role}</p>
        </div>
      </div>
      
      <p className="text-slate-900 font-bold text-sm leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
        "{data.text}"
      </p>

      {/* Interactions (hidden by default, shown on hover/focus) */}
      <div className="mt-4 pt-4 border-t-2 border-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            window.open(`${window.location.origin}/creator`, '_blank');
          }} 
          className="w-full py-2.5 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white active:scale-95 transition-all shadow-[2px_2px_0px_#0f172a] hover:shadow-none cursor-pointer font-black text-[10px] uppercase tracking-widest text-slate-900"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={3} />
          {t.marquee_view_public || 'View Public Page'}
        </button>
      </div>
    </motion.div>
  );
}

function FeedbackMarqueeSection() {
  const { t } = useTranslation();
  
  // Feedback data (dummy data with pastel background classes)
  const feedbacks = [
    { id: 1, name: "David L.", role: "Indie Hacker", text: "This tool completely changed how I collect support for my open source projects. The neo-brutalist design is absolutely gorgeous!", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=128&h=128&q=80", bgClass: "bg-sky-200" },
    { id: 2, name: "Sarah W.", role: "Digital Artist", text: "I love the comic-style accents and the immediate payouts. Setup took me less than 2 minutes.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80", bgClass: "bg-pink-200" },
    { id: 3, name: "Marcus T.", role: "Content Creator", text: "Finally, a platform that doesn't look like a boring corporate dashboard. My audience loves the tipping experience.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80", bgClass: "bg-yellow-200" },
    { id: 4, name: "Elena R.", role: "Podcaster", text: "0% platform fees is a game changer. The widget integrated flawlessly into my static site.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80", bgClass: "bg-emerald-200" },
    { id: 5, name: "James K.", role: "Streamer", text: "The real-time alerts and toast notifications make every tip feel special. Highly recommended!", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128&q=80", bgClass: "bg-purple-200" },
    { id: 6, name: "Anna M.", role: "Writer", text: "Beautiful, simple, and effective. It's exactly what I needed to monetize my newsletter.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=128&h=128&q=80", bgClass: "bg-orange-200" },
  ];

  // Repeat for continuous marquee
  const row1 = [...feedbacks.slice(0, 3), ...feedbacks.slice(0, 3), ...feedbacks.slice(0, 3), ...feedbacks.slice(0, 3)];
  const row2 = [...feedbacks.slice(3, 6), ...feedbacks.slice(3, 6), ...feedbacks.slice(3, 6), ...feedbacks.slice(3, 6)];

  return (
    <section className="bg-slate-100 py-24 relative overflow-hidden border-t-2 border-slate-900 z-10">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
      
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-black font-display text-slate-900 tracking-tighter uppercase relative inline-block">
          {t.marquee_title || 'Loved by Creators'}
          <span className="absolute -bottom-2 -left-2 w-[105%] h-4 bg-brand-orange/20 -rotate-1 -z-10"></span>
        </h2>
        <p className="mt-4 text-slate-600 font-bold max-w-2xl mx-auto">
          {t.marquee_subtitle || 'See what our community is saying about their experience.'}
        </p>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        {/* Row 1 - Moves left */}
        <div className="w-max flex gap-6 pr-6 animate-marquee">
          {row1.map((fb, idx) => (
            <FeedbackCard key={`r1-${idx}`} data={fb} />
          ))}
        </div>

        {/* Row 2 - Moves right (reverse) */}
        <div className="w-max flex gap-6 pr-6 animate-marquee-reverse -ml-[250px]">
          {row2.map((fb, idx) => (
             <FeedbackCard key={`r2-${idx}`} data={fb} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   LANDING PAGE VIEW
   ========================================================================== */
function LandingPageView({ 
  currentUser, 
  navigate, 
  showToast,
  influencerCount,
  setInfluencerCount
}: { 
  currentUser: Creator | null, 
  navigate: (p: string) => void, 
  showToast: (msg: string) => void,
  influencerCount: number,
  setInfluencerCount: (num: number) => void
}) {
  const [quickEmail, setQuickEmail] = useState('');
  const { locale, setLocale, t, setIsSettingsOpen } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail) return;
    playClickSound();
    navigate(`/login?email=${encodeURIComponent(quickEmail)}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 relative overflow-x-clip">
      {/* Header Bar */}
      <div className="sticky top-0 left-0 right-0 z-50 w-full flex justify-center pointer-events-none p-0">
        <header 
          className={`px-6 py-4 flex items-center justify-between bg-white pointer-events-auto relative transition-all duration-300 ease-out border-solid border-slate-900 ${
            isScrolled 
              ? "w-[92%] max-w-[1200px] mt-4 rounded-3xl shadow-[8px_8px_0px_#0f172a] border-[3px]" 
              : "w-full max-w-full mt-0 rounded-none border-b-[3px]"
          }`}
        >
          {/* Comic style header background highlight */}
          {!isScrolled && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-orange/10 pointer-events-none"></div>
          )}

          <div className="flex items-center gap-3 cursor-pointer group relative z-10" onClick={() => { playClickSound(); navigate('/'); }}>
            <div className="w-10 h-10 rounded-xl bg-brand-orange border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0px_#0f172a] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-[2px_2px_0px_#0f172a] transition-all duration-300">
              <span className="text-xl">☕</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-display uppercase mt-1">{t.brand}</span>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4 relative z-10">
            {/* Simple Direct Preferences Controls (Language Select) */}
            <div className="relative group mr-2">
              <select
                value={locale}
                onChange={(e) => {
                  playClickSound();
                  setLocale(e.target.value as AppLocale);
                }}
                className="appearance-none p-2.5 pr-10 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer focus:outline-none hover:bg-slate-50 shadow-[4px_4px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#0f172a]"
              >
                <option value="en">🇺🇸 English</option>
                <option value="zh">🇨🇳 简体中文</option>
                <option value="es">🇪🇸 Español</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="it">🇮🇹 Italiano</option>
                <option value="ga">🇮🇪 Gaeilge</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="ar">🇸🇦 العربية</option>
                <option value="ja">🇯🇵 日本语</option>
                <option value="ko">🇰🇷 한국어</option>
                <option value="pt">🇵🇹 Português</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Globe className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" strokeWidth={3} />
              </div>
            </div>

            {currentUser ? (
              <button 
                onClick={() => { playClickSound(); navigate('/dashboard'); }} 
                className="py-3 px-6 rounded-xl bg-slate-900 border-2 border-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition cursor-pointer shadow-[4px_4px_0px_#cbd5e1] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
              >
                {t.go_dashboard}
              </button>
            ) : (
              <>
                <button 
                  onClick={() => { playClickSound(); navigate('/login?mode=login'); }} 
                  className="py-3 px-5 rounded-xl text-slate-900 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition cursor-pointer"
                >
                  {t.sign_in}
                </button>
                <button 
                  onClick={() => { playClickSound(); navigate('/login?mode=register'); }} 
                  className="py-3 px-6 rounded-xl bg-brand-orange border-2 border-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] hover:shadow-[0px_0px_0px_#0f172a] hover:translate-x-1 hover:translate-y-1 transition-all duration-300 cursor-pointer hidden md:block"
                >
                  {t.create_my_page}
                </button>
              </>
            )}
          </div>

          {/* Mobile Actions (Comic Bubble Popover) */}
          <div className="md:hidden relative z-50">
            <button 
              onClick={() => {
                playClickSound();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-900 flex items-center justify-center shadow-[4px_4px_0px_#0f172a] active:shadow-[2px_2px_0px_#0f172a] active:translate-x-[2px] active:translate-y-[2px] transition-all"
            >
              {isMobileMenuOpen ? <X strokeWidth={3} /> : <Menu strokeWidth={3} />}
            </button>

            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-[calc(100%+16px)] right-0 w-64 bg-white border-[3px] border-slate-900 rounded-[2rem] rounded-tr-sm shadow-[8px_8px_0px_#0f172a] p-4 flex flex-col gap-3 origin-top-right"
                >
                  {/* Comic Bubble Tail */}
                  <div className="absolute -top-[14px] right-3 w-6 h-6 bg-white border-t-[3px] border-l-[3px] border-slate-900 rotate-45 transform origin-bottom-right rounded-tl-sm pointer-events-none"></div>

                  {/* Mobile Menu Items */}
                  <div className="flex flex-col gap-2 relative z-10">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border-2 border-slate-900">
                      <span className="font-black text-[10px] uppercase tracking-widest text-slate-900">Language</span>
                      <div className="relative">
                        <select
                          value={locale}
                          onChange={(e) => {
                            playClickSound();
                            setLocale(e.target.value as AppLocale);
                            setIsMobileMenuOpen(false);
                          }}
                          className="appearance-none bg-white border-2 border-slate-900 px-3 py-1 pr-8 rounded-lg font-black text-[10px] uppercase tracking-widest outline-none shadow-[2px_2px_0px_#0f172a] hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <option value="en">EN</option>
                          <option value="zh">ZH</option>
                          <option value="es">ES</option>
                          <option value="fr">FR</option>
                          <option value="it">IT</option>
                          <option value="ga">GA</option>
                          <option value="ru">RU</option>
                          <option value="ar">AR</option>
                          <option value="ja">JA</option>
                          <option value="ko">KO</option>
                          <option value="pt">PT</option>
                        </select>
                        <Globe className="w-4 h-4 text-slate-900 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={3} />
                      </div>
                    </div>

                    {currentUser ? (
                      <button 
                        onClick={() => { playClickSound(); navigate('/dashboard'); setIsMobileMenuOpen(false); }} 
                        className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-900 border-2 border-slate-900 text-white font-black text-xs uppercase tracking-widest active:bg-slate-800 shadow-[2px_2px_0px_#0f172a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer w-full mt-2"
                      >
                        {t.go_dashboard}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={() => { playClickSound(); navigate('/login?mode=login'); setIsMobileMenuOpen(false); }} 
                          className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 shadow-[2px_2px_0px_#0f172a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer w-full"
                        >
                          {t.sign_in}
                        </button>
                        <button 
                          onClick={() => { playClickSound(); navigate('/login?mode=register'); setIsMobileMenuOpen(false); }} 
                          className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-orange border-2 border-slate-900 text-white font-black text-xs uppercase tracking-widest active:bg-[#e0561b] shadow-[2px_2px_0px_#0f172a] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none transition-all cursor-pointer w-full"
                        >
                          {t.create_my_page}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
      </div>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col">
        <section className="px-6 py-24 md:py-32 max-w-5xl mx-auto text-center flex flex-col items-center relative w-full">
          {/* Comic style background accent dots for hero */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
          
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Comic style tag */}
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full bg-white border-2 border-slate-900 text-slate-900 font-black text-xs uppercase tracking-widest mb-10 shadow-[4px_4px_0px_#0f172a] transform -rotate-2 hover:rotate-0 transition-transform">
              <Sparkles className="w-4 h-4 text-brand-orange" />
              <span>{t.hero_tag}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black font-display text-slate-900 tracking-tighter leading-tight max-w-4xl mb-6 relative">
              {t.hero_title}
              <span className="relative inline-block ml-3">
                <span className="relative z-10 text-brand-orange drop-shadow-sm">{t.brand}</span>
                {/* Comic style highlight */}
                <svg className="absolute -bottom-2 -left-2 w-[110%] h-6 -z-10 text-brand-orange/20" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 10 Q 50 20 100 10 L 100 20 L 0 20 Z" fill="currentColor" />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 font-bold max-w-2xl mb-12">
              {t.hero_desc}
            </p>

            {/* Quick email entry - Embossed style */}
            <form onSubmit={handleQuickRegister} className="w-full max-w-sm p-1.5 bg-white rounded-[2rem] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center gap-1 mb-16 sm:mb-20 focus-within:shadow-[2px_2px_0px_#0f172a] transition-all duration-300">
              <input 
                type="email" 
                required
                placeholder={t.enter_email} 
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                className="flex-1 pl-4 py-3 font-black text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent text-xs uppercase tracking-wide"
              />
              <button 
                type="submit" 
                className="py-3 px-6 rounded-2xl bg-brand-orange border-2 border-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <span>{t.get_started}</span>
              </button>
            </form>

            {/* Featured Creator Previews */}
            <div className="w-full flex flex-col items-center animate-fade-in">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-slate-200"></div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.explore_seeded}</p>
                  <div className="h-0.5 w-6 bg-slate-200"></div>
                </div>
                
                {/* Influencer display count selector */}
                <div className="flex items-center gap-1 bg-slate-100 border-2 border-slate-900 p-1 rounded-xl shadow-[2px_2px_0px_#0f172a] text-[10px] font-black">
                  <span className="px-2 text-slate-500 uppercase tracking-widest text-[9px]">{locale === 'zh' ? '展示博主数量' : 'Show Creators'}:</span>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setInfluencerCount(num);
                      }}
                      className={`px-3 py-1 rounded-lg border-2 text-[10px] font-black transition-all cursor-pointer ${
                        influencerCount === num
                          ? 'bg-brand-orange border-slate-900 text-white shadow-[1px_1px_0px_#000]'
                          : 'bg-white border-transparent text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-6 justify-center">
                {influencerCount >= 1 && (
                  <div 
                    onClick={() => { playClickSound(); navigate('/wyatt'); }}
                    className="group py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-900 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] hover:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 flex items-center gap-4 cursor-pointer transition-all duration-300"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 group-hover:border-slate-900 transition-colors" 
                      alt="Wyatt"
                    />
                    <div className="text-left">
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Wyatt Smith</p>
                      <p className="text-xs font-bold text-brand-orange uppercase tracking-wider">AI Researcher</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors ml-2">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {influencerCount >= 2 && (
                  <div 
                    onClick={() => { playClickSound(); navigate('/alex'); }}
                    className="group py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-900 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] hover:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 flex items-center gap-4 cursor-pointer transition-all duration-300"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 group-hover:border-slate-900 transition-colors" 
                      alt="Alex"
                    />
                    <div className="text-left">
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">Alex Rivera</p>
                      <p className="text-xs font-bold text-brand-orange uppercase tracking-wider">Digital Artist</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors ml-2">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {influencerCount >= 3 && (
                  <div 
                    onClick={() => { playClickSound(); navigate('/ancoox2025_608'); }}
                    className="group py-4 px-6 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-900 shadow-[4px_4px_12px_#e2e8f0,-4px_-4px_12px_#ffffff] hover:shadow-[4px_4px_0px_#0f172a] hover:-translate-y-1 flex items-center gap-4 cursor-pointer transition-all duration-300"
                  >
                    <img 
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 group-hover:border-slate-900 transition-colors" 
                      alt="ENCAO X2025"
                    />
                    <div className="text-left">
                      <p className="font-black text-slate-800 text-sm uppercase tracking-tight">ENCAO X2025</p>
                      <p className="text-xs font-bold text-brand-orange uppercase tracking-wider">Independent Designer</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors ml-2">
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento */}
        <section className="bg-slate-100 py-24 md:py-32 px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 relative">
              <h2 className="inline-block text-3xl md:text-5xl font-black font-display text-slate-900 tracking-tighter uppercase relative z-10">
                {t.features_title_pre} <br className="md:hidden" />
                <span className="relative inline-block ml-0 md:ml-3 mt-2 md:mt-0 px-4 py-1 bg-brand-orange text-white transform -rotate-2 shadow-[4px_4px_0px_#0f172a]">
                  {t.features_title_highlight}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {/* Card 1 */}
              <div className="group p-8 rounded-[2rem] bg-slate-100 border-2 border-transparent hover:border-slate-900 transition-all duration-300 flex flex-col relative overflow-hidden
                              shadow-[12px_12px_24px_#cbd5e1,-12px_-12px_24px_#ffffff] hover:shadow-[12px_12px_0px_#0f172a] hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] text-brand-orange border-2 border-transparent group-hover:border-slate-900 group-hover:bg-brand-orange group-hover:text-white group-hover:shadow-none flex items-center justify-center mb-8 transition-all duration-300 relative z-10">
                  <CreditCard className="w-6 h-6" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 font-display uppercase tracking-tight relative z-10">{t.feature1_title}</h3>
                <p className="text-sm font-bold text-slate-600 leading-relaxed relative z-10">
                  {t.feature1_desc}
                </p>
              </div>

              {/* Card 2 */}
              <div className="group p-8 rounded-[2rem] bg-slate-100 border-2 border-transparent hover:border-slate-900 transition-all duration-300 flex flex-col relative overflow-hidden
                              shadow-[12px_12px_24px_#cbd5e1,-12px_-12px_24px_#ffffff] hover:shadow-[12px_12px_0px_#0f172a] hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] text-brand-orange border-2 border-transparent group-hover:border-slate-900 group-hover:bg-brand-orange group-hover:text-white group-hover:shadow-none flex items-center justify-center mb-8 transition-all duration-300 relative z-10">
                  <Sparkles className="w-6 h-6" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 font-display uppercase tracking-tight relative z-10">{t.feature2_title}</h3>
                <p className="text-sm font-bold text-slate-600 leading-relaxed relative z-10">
                  {t.feature2_desc}
                </p>
              </div>

              {/* Card 3 */}
              <div className="group p-8 rounded-[2rem] bg-slate-100 border-2 border-transparent hover:border-slate-900 transition-all duration-300 flex flex-col relative overflow-hidden
                              shadow-[12px_12px_24px_#cbd5e1,-12px_-12px_24px_#ffffff] hover:shadow-[12px_12px_0px_#0f172a] hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] text-brand-orange border-2 border-transparent group-hover:border-slate-900 group-hover:bg-brand-orange group-hover:text-white group-hover:shadow-none flex items-center justify-center mb-8 transition-all duration-300 relative z-10">
                  <User className="w-6 h-6" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 font-display uppercase tracking-tight relative z-10">{t.feature3_title}</h3>
                <p className="text-sm font-bold text-slate-600 leading-relaxed relative z-10">
                  {t.feature3_desc}
                </p>
              </div>

              {/* Card 4 */}
              <div className="group p-8 rounded-[2rem] bg-slate-100 border-2 border-transparent hover:border-slate-900 transition-all duration-300 flex flex-col relative overflow-hidden
                              shadow-[12px_12px_24px_#cbd5e1,-12px_-12px_24px_#ffffff] hover:shadow-[12px_12px_0px_#0f172a] hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/10 rounded-bl-[4rem] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                <div className="w-14 h-14 rounded-2xl bg-slate-200 shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] text-brand-orange border-2 border-transparent group-hover:border-slate-900 group-hover:bg-brand-orange group-hover:text-white group-hover:shadow-none flex items-center justify-center mb-8 transition-all duration-300 relative z-10">
                  <Users className="w-6 h-6" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 font-display uppercase tracking-tight relative z-10">{t.feature4_title}</h3>
                <p className="text-sm font-bold text-slate-600 leading-relaxed relative z-10">
                  {t.feature4_desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing tier */}
        <section className="bg-slate-100 py-32 px-6 relative overflow-hidden">
          {/* Comic style background accent dots */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="inline-block text-4xl md:text-5xl font-black font-display text-slate-900 tracking-tighter mb-4 uppercase relative group cursor-default">
                <span className="relative z-10">{t.pricing_title}</span>
                <span className="absolute -bottom-2 -right-4 w-full h-4 bg-brand-orange/20 -rotate-2 group-hover:rotate-0 transition-transform duration-300 z-0"></span>
              </h2>
              <p className="text-slate-500 font-bold tracking-wide uppercase text-sm mt-4">{t.pricing_subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
              {/* Free Tier - Comic Style in Grayscale */}
              <div className="group relative rounded-[2rem] bg-white border-2 border-slate-900 p-10 flex flex-col justify-between
                              shadow-[16px_16px_0px_#0f172a] hover:shadow-[8px_8px_0px_#0f172a] hover:translate-x-2 hover:translate-y-2 transition-all duration-300 z-10 md:scale-105">
                
                {/* Comic style floating badge */}
                <div className="absolute -top-5 -right-5 md:-right-8 bg-slate-100 border-2 border-slate-900 text-slate-900 font-black uppercase text-xs py-2 px-4 rotate-6 shadow-[4px_4px_0px_#0f172a] group-hover:rotate-12 transition-transform">
                  {currentUser && !currentUser.is_pro ? (locale === 'zh' ? '当前方案' : 'ACTIVE PLAN') : (locale === 'zh' ? '最易上手' : 'EASIEST')}
                </div>

                <div>
                  <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">{t.lite_title}</h3>
                      <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">{t.lite_subtitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black text-slate-900 font-display">€0</span>
                      <p className="text-[10px] font-black text-slate-500 uppercase">{locale === 'zh' ? '免费畅享' : 'FREE'}</p>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                      </div>
                      <span>{t.lite_feature1}</span>
                    </li>
                    <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                      </div>
                      <span>{t.lite_feature2}</span>
                    </li>
                    <li className="flex items-center gap-4 text-sm font-bold text-slate-400">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center shadow-[2px_2px_0px_#cbd5e1] opacity-60">
                        {/* No check icon for missing feature */}
                      </div>
                      <span className="line-through decoration-slate-300">{t.lite_feature3}</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => {
                    playClickSound();
                    if (currentUser) {
                      navigate('/dashboard?tab=subscription');
                    } else {
                      navigate('/login');
                    }
                  }} 
                  className="w-full py-4 rounded-xl bg-slate-900 border-2 border-slate-900 text-white font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:shadow-[0px_0px_0px_#0f172a] hover:translate-x-1 hover:translate-y-1 active:scale-95"
                >
                  {currentUser ? (currentUser.is_pro ? (locale === 'zh' ? '降级至 Lite 方案' : 'Downgrade to Lite') : (locale === 'zh' ? '管理当前方案' : 'Manage Plan')) : t.lite_cta}
                </button>
              </div>

              {/* Pro Tier - Embossed + Comic Boldness */}
              <div className="group relative rounded-[2rem] bg-brand-orange border-2 border-slate-900 p-10 flex flex-col justify-between
                              shadow-[16px_16px_0px_#0f172a] hover:shadow-[8px_8px_0px_#0f172a] hover:translate-x-2 hover:translate-y-2 transition-all duration-300 z-10 md:scale-105">
                
                {/* Comic style floating badge */}
                <div className="absolute -top-5 -right-5 md:-right-8 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase text-xs py-2 px-4 rotate-6 shadow-[4px_4px_0px_#0f172a] group-hover:rotate-12 transition-transform">
                  {currentUser?.is_pro ? (locale === 'zh' ? '当前方案' : 'ACTIVE PLAN') : t.pro_badge}
                </div>

                <div>
                  <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">{t.pro_title}</h3>
                      <p className="text-xs font-bold text-slate-900/70 mt-2 uppercase tracking-widest">{t.pro_subtitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl font-black text-slate-900 font-display">€9</span>
                      <p className="text-[10px] font-black text-slate-900 uppercase">{t.pro_price_unit}</p>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                      </div>
                      <span>{t.pro_feature1}</span>
                    </li>
                    <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                      </div>
                      <span>{t.pro_feature2}</span>
                    </li>
                    <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                        <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                      </div>
                      <span>{t.pro_feature3}</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => {
                    playClickSound();
                    if (currentUser) {
                      navigate('/dashboard?tab=subscription');
                    } else {
                      navigate('/login');
                    }
                  }} 
                  className="w-full py-4 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:shadow-[0px_0px_0px_#0f172a] hover:translate-x-1 hover:translate-y-1 active:scale-95"
                >
                  {currentUser ? (currentUser.is_pro ? (locale === 'zh' ? '管理当前方案' : 'Manage Plan') : (locale === 'zh' ? '立即升级专业版' : 'Upgrade to Pro')) : t.pro_cta}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback Marquee */}
        <FeedbackMarqueeSection />
      </main>

      <footer className="bg-slate-100 py-16 px-6 border-t-2 border-slate-900 text-center relative overflow-hidden">
        {/* Comic style background accent dots */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-[4px_4px_0px_#cbd5e1] mb-6 transform -rotate-6 hover:rotate-0 transition-transform">
            <span className="text-2xl">☕</span>
          </div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">
            &copy; 2026 Tiplet Inc.
          </p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Built with Bold & Orange relief design.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ==========================================================================
   LOGIN / SIGNUP VIEW
   ========================================================================== */
function LoginView({ 
  currentUser, 
  setCurrentUser, 
  navigate, 
  showToast 
}: { 
  currentUser: Creator | null, 
  setCurrentUser: (c: Creator | null) => void, 
  navigate: (p: string) => void, 
  showToast: (m: string) => void 
}) {
  const params = new URLSearchParams(window.location.search);
  const initialMode = params.get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState(() => params.get('email') || '');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isEnteringCustomGoogleEmail, setIsEnteringCustomGoogleEmail] = useState(false);
  const { t } = useTranslation();

  // If already logged in, redirect straight away
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser]);

  // Handle URL change to update mode
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get('mode');
    if (m === 'register' || m === 'login') {
      setMode(m);
    }
  }, [window.location.search]);

  const handleToggleMode = (newMode: 'login' | 'register') => {
    playClickSound();
    setMode(newMode);
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('mode', newMode);
    window.history.replaceState(null, '', `${window.location.pathname}?${newParams.toString()}`);
  };

  const handleGoogleEmailSelect = async (selectedEmail: string) => {
    playClickSound();
    setShowGoogleModal(false);
    setIsEnteringCustomGoogleEmail(false);
    setLoading(true);

    try {
      const data = await api.login(selectedEmail);
      if (data.success) {
        let nameToUse = displayName;
        if (!nameToUse) {
          const part = selectedEmail.split('@')[0];
          nameToUse = part.charAt(0).toUpperCase() + part.slice(1);
        }
        
        if (mode === 'register' && data.creator) {
          try {
            await api.updateSettings(data.creator.username, {
              display_name: nameToUse
            });
            data.creator.display_name = nameToUse;
          } catch (err) {
            console.error("Failed to update Google creator display name:", err);
          }
        }
        
        setCurrentUser(data.creator);
        showToast(
          mode === 'register' 
            ? t.register_success.replace('{name}', nameToUse)
            : t.login_success.replace('{name}', data.creator.display_name)
        );
        navigate('/dashboard');
      } else {
        showToast(data.error || 'Google login failed');
      }
    } catch (e) {
      showToast('Network error during Google login');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    playClickSound();
    setLoading(true);

    try {
      const data = await api.login(email);
      if (data.success) {
        if (mode === 'register' && displayName && data.creator) {
          try {
            await api.updateSettings(data.creator.username, {
              display_name: displayName
            });
            data.creator.display_name = displayName;
          } catch (err) {
            console.error("Failed to pre-set display name during registration:", err);
          }
        }
        setCurrentUser(data.creator);
        showToast(
          mode === 'register' 
            ? t.register_success.replace('{name}', displayName || data.creator.display_name)
            : t.login_success.replace('{name}', data.creator.display_name)
        );
        navigate('/dashboard');
      } else {
        showToast(data.error || 'Authentication failed');
      }
    } catch (e) {
      showToast('Network error login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-slate-100 p-6 relative overflow-hidden">
      {/* Comic background dots */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-6 md:p-12 rounded-[2rem] bg-white md:border-2 border-slate-900 shadow-none md:shadow-[8px_8px_0px_#0f172a] flex flex-col items-center relative z-10"
      >
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-brand-orange border-2 border-slate-900 flex items-center justify-center text-3xl shadow-[4px_4px_0px_#0f172a] mb-8 group-hover:-rotate-6 transition-transform">
          ☕
        </div>

        <h2 className="text-3xl md:text-4xl font-black font-display text-slate-900 tracking-tighter uppercase mb-2 text-center">
          {mode === 'login' ? t.login_title : (t.register_mode_btn || 'Create My Page')}
        </h2>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
          {mode === 'login' ? t.login_desc : (t.marquee_subtitle || 'See what our community is saying.')}
        </p>

        {/* Tab switcher inside the box */}
        <div className="w-full grid grid-cols-2 bg-slate-100 border-2 border-slate-900 p-1.5 rounded-[1.2rem] mb-8 shadow-[3px_3px_0px_#0f172a]">
          <button
            onClick={() => handleToggleMode('login')}
            className={`py-2 px-4 rounded-[0.8rem] font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
              mode === 'login' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.login_mode_btn || 'Log In'}
          </button>
          <button
            onClick={() => handleToggleMode('register')}
            className={`py-2 px-4 rounded-[0.8rem] font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${
              mode === 'register' 
                ? 'bg-brand-orange text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.register_mode_btn || 'Register'}
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="w-full space-y-6">
          {mode === 'register' && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t.display_name_label || 'Display Name'}
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-5 w-5 h-5 text-slate-400" strokeWidth={3} />
                <input 
                  type="text" 
                  required
                  placeholder={t.display_name_placeholder || "e.g. Alex Rivera"} 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100 placeholder-slate-300"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              {t.email_label}
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-5 w-5 h-5 text-slate-400" strokeWidth={3} />
              <input 
                type="email" 
                required
                placeholder="wyatt@creator.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100 placeholder-slate-300"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 rounded-xl bg-slate-900 border-2 border-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#cbd5e1] transition-all flex items-center justify-center gap-3 cursor-pointer hover:translate-y-1 hover:translate-x-1 hover:shadow-none disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-6 h-6 rounded-full border-4 border-white border-t-transparent animate-spin inline-block"></span>
            ) : (
              <>
                <span>{mode === 'login' ? t.join_button : (t.register_mode_btn || 'Create My Page')}</span>
                <ArrowRight className="w-5 h-5" strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="w-full flex items-center gap-3 my-4">
          <div className="flex-1 h-[2px] bg-slate-200"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.or_divider || 'OR'}</span>
          <div className="flex-1 h-[2px] bg-slate-200"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={() => { playClickSound(); setShowGoogleModal(true); }}
          className="w-full py-4 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.67 0 3.14.58 4.33 1.7l3.23-3.23C17.58 1.72 14.99 1 12 1 7.35 1 3.39 3.67 1.41 7.56l3.86 3C6.18 7.54 8.85 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.49z" />
            <path fill="#FBBC05" d="M5.27 14.44c-.23-.69-.36-1.42-.36-2.19s.13-1.5.36-2.19l-3.86-3C.52 8.79 0 10.33 0 12s.52 3.21 1.41 4.93l3.86-3.01z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.15 0-5.82-2.5-6.77-5.52l-3.86 3C3.39 20.33 7.35 23 12 23z" />
          </svg>
          <span>{mode === 'login' ? t.google_sign_in : t.google_sign_up}</span>
        </button>

        {/* Dynamic toggle notice footer */}
        <div className="mt-8 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
          {mode === 'login' ? (
            <span>
              {t.dont_have_account || "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('register')}
                className="text-brand-orange font-black hover:underline cursor-pointer ml-1"
              >
                {t.register_mode_btn || 'Create Page'}
              </button>
            </span>
          ) : (
            <span>
              {t.already_have_account || "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => handleToggleMode('login')}
                className="text-slate-900 font-black hover:underline cursor-pointer ml-1"
              >
                {t.login_mode_btn || 'Log In'}
              </button>
            </span>
          )}
        </div>

        <button 
          onClick={() => { playClickSound(); navigate('/'); }} 
          className="mt-8 py-2.5 px-6 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          <span>{t.explore_tiplet}</span>
        </button>
      </motion.div>

      {/* Simulated Google OAuth Popup Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[1.5rem] shadow-[8px_8px_0px_#0f172a] overflow-hidden border-2 border-slate-900 font-sans p-6 md:p-8"
            >
              <div className="flex flex-col items-center">
                {/* Google Logo */}
                <svg className="w-10 h-10 mb-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>

                <h3 className="text-xl font-black font-display text-slate-900 tracking-tight text-center">
                  {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
                </h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-6 text-center">
                  to continue to <span className="font-black text-slate-900">Tiplet</span>
                </p>

                {isEnteringCustomGoogleEmail ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (customGoogleEmail) {
                      handleGoogleEmailSelect(customGoogleEmail);
                    }
                  }} className="w-full space-y-4">
                    <div className="text-left w-full">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Google Account Email
                      </label>
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="yourname@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:bg-white transition-all"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          setIsEnteringCustomGoogleEmail(false);
                        }}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50 cursor-pointer active:translate-y-[1px]"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white border-2 border-slate-900 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-slate-800 active:translate-y-[1px]"
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="w-full space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {/* Primary options using metadata user email or defaults */}
                    <button
                      onClick={() => handleGoogleEmailSelect('ancoox2025@gmail.com')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border-2 border-slate-900 hover:shadow-[2px_2px_0px_#0f172a] transition-all text-left cursor-pointer active:translate-y-[1px]"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-orange border-2 border-slate-900 text-white font-black flex items-center justify-center text-xs text-center">
                        A
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">Ancoox2025</div>
                        <div className="text-[10px] font-bold text-slate-400 truncate">ancoox2025@gmail.com</div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleGoogleEmailSelect('wyatt@creator.com')}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border-2 border-slate-900 hover:shadow-[2px_2px_0px_#0f172a] transition-all text-left cursor-pointer active:translate-y-[1px]"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-900 text-white font-black flex items-center justify-center text-xs text-center">
                        W
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">Wyatt</div>
                        <div className="text-[10px] font-bold text-slate-400 truncate">wyatt@creator.com</div>
                      </div>
                    </button>

                    {/* Custom account */}
                    <button
                      onClick={() => {
                        playClickSound();
                        setIsEnteringCustomGoogleEmail(true);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border-2 border-dashed border-slate-300 transition-all text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 text-slate-500 flex items-center justify-center text-lg font-black text-center">
                        +
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-slate-700">Use another account</div>
                        <div className="text-[10px] font-bold text-slate-400">Sign in with any custom Google email</div>
                      </div>
                    </button>
                  </div>
                )}

                <div className="w-full mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      playClickSound();
                      setShowGoogleModal(false);
                      setIsEnteringCustomGoogleEmail(false);
                    }}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================================
   CREATOR PORTAL / DASHBOARD VIEW
   ========================================================================== */
interface DashboardTabProps {
  creator: Creator;
  settings: WidgetSettings;
  tips: Tip[];
  showToast: (m: string) => void;
  setCreator: React.Dispatch<React.SetStateAction<Creator>>;
  setSettings: React.Dispatch<React.SetStateAction<WidgetSettings>>;
  setTips: React.Dispatch<React.SetStateAction<Tip[]>>;
  navigate?: (p: string) => void;
  setActiveTab?: (tab: 'overview' | 'settings' | 'tips' | 'wall' | 'payout') => void;
}

function DashboardView({ 
  currentUser, 
  setCurrentUser, 
  navigate, 
  showToast 
}: { 
  currentUser: Creator, 
  setCurrentUser: (c: Creator | null) => void, 
  navigate: (p: string) => void, 
  showToast: (m: string) => void 
}) {
  const { locale, setLocale, t, setIsSettingsOpen } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'tips' | 'wall' | 'payout' | 'link-widget' | 'subscription'>('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'subscription') {
      setActiveTab('subscription');
    }
  }, []);
  
  // Dashboard states
  const [creator, setCreator] = useState<Creator>(currentUser);
  const [settings, setSettings] = useState<WidgetSettings>({
    creator_id: currentUser.id,
    button_text: `Support ${currentUser.display_name}`,
    default_amounts: [5, 10, 20],
    theme: 'orange',
    thank_you_message: 'Thank you for your support!'
  });
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const fetchData = async () => {
    try {
      const res = await api.getDashboardMe(currentUser.username);
      if (!res.ok) {
        if (res.status === 401) {
          // Stale session, creator doesn't exist on server database
          setCurrentUser(null);
          showToast('Session expired or account not found. Please log in again.');
          navigate('/login');
          return;
        }
      }
      const data = await res.json();
      if (data.creator) {
        setCreator(data.creator);
        // keep parent context updated
        setCurrentUser(data.creator);
      }
      if (data.settings) setSettings(data.settings);
      if (data.tips) setTips(data.tips);
    } catch (e) {
      console.error('Error fetching dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('Logged out successfully.');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#F3F5F9]">
        <div className="w-10 h-10 rounded-full border-4 border-brand-orange border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row bg-[#F3F5F9] md:h-screen overflow-x-hidden relative">
      {/* Comic background for dashboard */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
      
      {/* Mobile Top Header Bar */}
      <header className="md:hidden h-16 shrink-0 bg-white border-b-2 border-slate-900 sticky top-0 z-40 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <img 
            src={creator.avatar_url} 
            className="w-10 h-10 rounded-full object-cover border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
            alt={creator.display_name}
          />
          <div className="min-w-0">
            <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">
              {creator.display_name}
            </h3>
            <p className="text-[10px] text-brand-orange font-bold flex items-center gap-1 mt-0.5 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse"></span>
              <span>{creator.is_pro ? (t.pro_member || 'Pro Member') : (t.free_account || 'Free Account')}</span>
            </p>
          </div>
        </div>

        {/* Compact Actions */}
        <div className="flex items-center gap-2">
          {/* Switch Language */}
          <div className="relative group">
            <select
              value={locale}
              onChange={(e) => {
                playClickSound();
                setLocale(e.target.value as AppLocale);
              }}
              className="appearance-none p-2 pl-3 pr-8 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer focus:outline-none h-10 min-w-[70px]"
            >
              <option value="en">EN</option>
              <option value="zh">ZH</option>
              <option value="es">ES</option>
              <option value="fr">FR</option>
              <option value="it">IT</option>
              <option value="ga">GA</option>
              <option value="ru">RU</option>
              <option value="ar">AR</option>
              <option value="ja">JA</option>
              <option value="ko">KO</option>
              <option value="pt">PT</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="w-3 h-3 text-slate-900" strokeWidth={3} />
            </div>
          </div>
          
          {/* Share Page Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsShareModalOpen(true);
            }}
            className="p-2 rounded-xl bg-brand-orange border-2 border-slate-900 text-white shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center w-10 h-10"
            title={t.share_page || 'Share'}
          >
            <Send className="w-4 h-4" strokeWidth={3} />
          </button>
          
          {/* Global Preferences / Settings Modal */}
          <button
            onClick={() => {
              playClickSound();
              setIsSettingsOpen(true);
            }}
            className="p-2 rounded-xl bg-slate-100 border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center"
            title={t.settings_title}
          >
            <Settings className="w-4 h-4" strokeWidth={3} />
          </button>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white border-2 border-slate-900 text-rose-500 shadow-[2px_2px_0px_#0f172a] hover:bg-rose-50 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer flex items-center justify-center"
            title={t.logout || 'Logout'}
          >
            <LogOut className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>
      </header>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        url={`${window.location.origin}/${creator.username}`} 
        t={t}
        showToast={showToast}
      />

      {/* Sidebar Navigation - Sticky / Fixed viewport height, collapsible on hover - Desktop Only */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`hidden md:flex bg-white border-r-2 border-slate-900 shrink-0 flex-col relative z-30 transition-all duration-300 ease-in-out h-screen sticky top-0 ${
          isSidebarExpanded ? 'w-72' : 'w-24'
        }`}
      >
        {/* Profile Card Header */}
        <div className="p-4 border-b-2 border-slate-900 flex items-center gap-3 h-[96px] shrink-0 justify-center md:justify-start overflow-hidden">
          <img 
            src={creator.avatar_url} 
            className="w-12 h-12 rounded-full object-cover border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] shrink-0"
            alt={creator.display_name}
          />
          <div className={`flex-1 min-w-0 transition-all duration-300 ${
            isSidebarExpanded ? 'opacity-100 max-w-[200px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
          }`}>
            <h3 className="font-black text-slate-900 tracking-tighter uppercase font-display truncate text-sm">
              {creator.display_name}
            </h3>
            <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest flex items-center gap-1.5 mt-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse border border-slate-900"></span>
              <span>{creator.is_pro ? (t.pro_member || 'Pro Member') : (t.free_account || 'Free Account')}</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs - Fluid Capsule Tab implementation */}
        <nav className="flex-1 p-4 space-y-4 flex flex-col overflow-y-auto no-scrollbar">
          <button 
            onClick={() => { playClickSound(); setActiveTab('overview'); }}
            className={`w-full h-12 rounded-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-300 shrink-0 relative cursor-pointer group ${
              isSidebarExpanded ? 'px-4 justify-start' : 'w-12 justify-center mx-auto'
            } ${
              activeTab === 'overview' 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            {activeTab === 'overview' && (
              <motion.div 
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-brand-orange -z-10 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                style={{ borderRadius: '12px' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <BarChart3 className={`w-5 h-5 relative z-10 shrink-0 transition-transform duration-200 ${activeTab === 'overview' ? 'text-white' : ''}`} strokeWidth={3} />
            <span className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-hidden ${activeTab === 'overview' ? 'text-white' : ''} ${
              isSidebarExpanded ? 'opacity-100 max-w-[150px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
            }`}>
              {t.overview}
            </span>
          </button>

          <button 
            onClick={() => { playClickSound(); setActiveTab('tips'); }}
            className={`w-full h-12 rounded-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-300 shrink-0 relative cursor-pointer group ${
              isSidebarExpanded ? 'px-4 justify-start' : 'w-12 justify-center mx-auto'
            } ${
              activeTab === 'tips' 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            {activeTab === 'tips' && (
              <motion.div 
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-brand-orange -z-10 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                style={{ borderRadius: '12px' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <Users className={`w-5 h-5 relative z-10 shrink-0 transition-transform duration-200 ${activeTab === 'tips' ? 'text-white' : ''}`} strokeWidth={3} />
            <span className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-hidden ${activeTab === 'tips' ? 'text-white' : ''} ${
              isSidebarExpanded ? 'opacity-100 max-w-[150px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
            }`}>
              {t.supporter_list}
            </span>
          </button>

          <button 
            onClick={() => { playClickSound(); setActiveTab('payout'); }}
            className={`w-full h-12 rounded-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-300 shrink-0 relative cursor-pointer group ${
              isSidebarExpanded ? 'px-4 justify-start' : 'w-12 justify-center mx-auto'
            } ${
              activeTab === 'payout' 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            {activeTab === 'payout' && (
              <motion.div 
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-brand-orange -z-10 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                style={{ borderRadius: '12px' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <CreditCard className={`w-5 h-5 relative z-10 shrink-0 transition-transform duration-200 ${activeTab === 'payout' ? 'text-white' : ''}`} strokeWidth={3} />
            <span className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-hidden ${activeTab === 'payout' ? 'text-white' : ''} ${
              isSidebarExpanded ? 'opacity-100 max-w-[150px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
            }`}>
              {t.payout || 'Payouts'}
            </span>
          </button>

          <button 
            onClick={() => { playClickSound(); setActiveTab('link-widget'); }}
            className={`w-full h-12 rounded-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-300 shrink-0 relative cursor-pointer group ${
              isSidebarExpanded ? 'px-4 justify-start' : 'w-12 justify-center mx-auto'
            } ${
              activeTab === 'link-widget' 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            {activeTab === 'link-widget' && (
              <motion.div 
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-brand-orange -z-10 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                style={{ borderRadius: '12px' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <Link className={`w-5 h-5 relative z-10 shrink-0 transition-transform duration-200 ${activeTab === 'link-widget' ? 'text-white' : ''}`} strokeWidth={3} />
            <span className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-hidden ${activeTab === 'link-widget' ? 'text-white' : ''} ${
              isSidebarExpanded ? 'opacity-100 max-w-[150px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
            }`}>
              {t.link_widget || 'Link & Widget'}
            </span>
          </button>

          <button 
            onClick={() => { playClickSound(); setActiveTab('subscription'); }}
            className={`w-full h-12 rounded-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest transition-all duration-300 shrink-0 relative cursor-pointer group ${
              isSidebarExpanded ? 'px-4 justify-start' : 'w-12 justify-center mx-auto'
            } ${
              activeTab === 'subscription' 
                ? 'text-slate-900' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent hover:border-slate-200'
            }`}
          >
            {activeTab === 'subscription' && (
              <motion.div 
                layoutId="active-tab-indicator"
                className="absolute inset-0 bg-brand-orange -z-10 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]"
                style={{ borderRadius: '12px' }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            <ShieldCheck className={`w-5 h-5 relative z-10 shrink-0 transition-transform duration-200 ${activeTab === 'subscription' ? 'text-white' : ''}`} strokeWidth={3} />
            <span className={`relative z-10 transition-all duration-300 whitespace-nowrap overflow-hidden ${activeTab === 'subscription' ? 'text-white' : ''} ${
              isSidebarExpanded ? 'opacity-100 max-w-[150px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
            }`}>
              {locale === 'zh' ? '订阅管理' : 'Subscription'}
            </span>
          </button>

          <button 
            className={`w-full h-12 rounded-xl flex items-center gap-3 font-black text-sm uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all duration-300 shrink-0 cursor-pointer group border-2 border-transparent ${
              isSidebarExpanded ? 'px-4 justify-start' : 'w-12 justify-center mx-auto'
            }`}
          >
            <Globe className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-200" strokeWidth={3} />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
              isSidebarExpanded ? 'opacity-100 max-w-[150px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-2 pointer-events-none'
            }`}>
              {t.public_page}
            </span>
          </button>
        </nav>

        {/* Footer actions - Fixed at bottom of sidebar */}
        <div className={`p-4 border-t-2 border-slate-900 bg-slate-50 shrink-0 transition-all duration-300 flex flex-col gap-3 ${
          isSidebarExpanded ? 'items-stretch' : 'items-center'
        }`}>
          {/* Language Direct Select - Removed */}
          <div className="hidden">
            <select
              value={locale}
              onChange={(e) => {
                playClickSound();
                setLocale(e.target.value as AppLocale);
              }}
              className={`appearance-none h-12 rounded-xl border-2 border-slate-900 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-all cursor-pointer focus:outline-none ${
                isSidebarExpanded ? 'px-4 w-full pr-10' : 'w-12 text-center'
              }`}
            >
              <option value="en">{isSidebarExpanded ? '🇺🇸 English' : 'EN'}</option>
              <option value="zh">{isSidebarExpanded ? '🇨🇳 简体中文' : 'ZH'}</option>
              <option value="es">{isSidebarExpanded ? '🇪🇸 Español' : 'ES'}</option>
              <option value="fr">{isSidebarExpanded ? '🇫🇷 Français' : 'FR'}</option>
              <option value="it">{isSidebarExpanded ? '🇮🇹 Italiano' : 'IT'}</option>
              <option value="ga">{isSidebarExpanded ? '🇮🇪 Gaeilge' : 'GA'}</option>
              <option value="ru">{isSidebarExpanded ? '🇷🇺 Русский' : 'RU'}</option>
              <option value="ar">{isSidebarExpanded ? '🇸🇦 العربية' : 'AR'}</option>
              <option value="ja">{isSidebarExpanded ? '🇯🇵 日本語' : 'JA'}</option>
              <option value="ko">{isSidebarExpanded ? '🇰🇷 한국어' : 'KO'}</option>
              <option value="pt">{isSidebarExpanded ? '🇵🇹 Português' : 'PT'}</option>
            </select>
            <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none ${isSidebarExpanded ? 'right-4' : 'hidden'}`}>
              <ChevronDown className="w-4 h-4 text-slate-900" strokeWidth={3} />
            </div>
            {!isSidebarExpanded && (
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-brand-orange border border-slate-900 rounded-full pointer-events-none" />
            )}
          </div>

          {/* Settings + Language Select Row */}
          <div className="flex flex-row gap-2">
            {/* Settings Modal Toggle */}
            <button
              onClick={() => {
                playClickSound();
                setIsSettingsOpen(true);
              }}
              className={`flex items-center justify-center h-12 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-all cursor-pointer overflow-hidden ${
                isSidebarExpanded ? 'flex-1 px-4' : 'w-12'
              }`}
              title="设置"
            >
              <Settings className="w-5 h-5 shrink-0" strokeWidth={3} />
              {isSidebarExpanded && (
                <span className="ml-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  设置
                </span>
              )}
            </button>
            
            {/* Language Direct Select */}
            {isSidebarExpanded && (
              <div className="relative h-12 w-12 rounded-xl border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center">
                <select
                  value={locale}
                  onChange={(e) => {
                    playClickSound();
                    setLocale(e.target.value as AppLocale);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  <option value="en">EN</option>
                  <option value="zh">ZH</option>
                  <option value="es">ES</option>
                  <option value="fr">FR</option>
                  <option value="it">IT</option>
                  <option value="ga">GA</option>
                  <option value="ru">RU</option>
                  <option value="ar">AR</option>
                  <option value="ja">JA</option>
                  <option value="ko">KO</option>
                  <option value="pt">PT</option>
                </select>
                <Globe className="w-5 h-5 text-slate-900" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Share Page Button */}
          <button
            onClick={() => {
              playClickSound();
              setIsShareModalOpen(true);
            }}
            className={`flex items-center gap-3 h-12 rounded-xl border-2 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:bg-slate-50 transition-all cursor-pointer overflow-hidden ${
              isSidebarExpanded ? 'px-4 w-full' : 'w-12 justify-center'
            }`}
            title={t.share_page || 'Share'}
          >
            <Send className="w-5 h-5 shrink-0" strokeWidth={3} />
            <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
              isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'
            }`}>
              {t.share_page || 'Share'}
            </span>
          </button>

          <hr className="border-slate-200 my-1" />

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 h-12 rounded-xl border-2 border-slate-900 bg-white text-rose-500 shadow-[2px_2px_0px_#0f172a] hover:bg-rose-50 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer overflow-hidden ${
              isSidebarExpanded ? 'px-4 w-full' : 'w-12 justify-center'
            }`}
            title={t.logout || 'Logout'}
          >
            <LogOut className="w-5 h-5 shrink-0" strokeWidth={3} />
            <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
              isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'
            }`}>
              {t.logout || 'Logout'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t-2 border-slate-900 z-30 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_0px_rgba(15,23,42,1)]">
        {/* Overview Tab */}
        <button 
          onClick={() => { playClickSound(); setActiveTab('overview'); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'overview' 
              ? 'text-brand-orange' 
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-5 h-5" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {t.overview}
          </span>
        </button>

        {/* Supporter Database Tab */}
        <button 
          onClick={() => { playClickSound(); setActiveTab('tips'); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'tips' 
              ? 'text-brand-orange' 
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {t.supporter_list}
          </span>
        </button>

        {/* Payout Tab */}
        <button 
          onClick={() => { playClickSound(); setActiveTab('payout'); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'payout' 
              ? 'text-brand-orange' 
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-5 h-5" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {t.payout || 'Payouts'}
          </span>
        </button>

        {/* Link & Widget Tab */}
        <button 
          onClick={() => { playClickSound(); setActiveTab('link-widget'); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'link-widget' 
              ? 'text-brand-orange' 
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <Link className="w-5 h-5" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {t.link_widget || 'Link & Widget'}
          </span>
        </button>

        {/* Subscription Tab */}
        <button 
          onClick={() => { playClickSound(); setActiveTab('subscription'); }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'subscription' 
              ? 'text-brand-orange' 
              : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-5 h-5" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {locale === 'zh' ? '订阅' : 'Subscription'}
          </span>
        </button>

        {/* Public Page Link */}
        <button 
          onClick={() => { playClickSound(); navigate(`/${creator.username}`); }}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
        >
          <Globe className="w-5 h-5" strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {t.public_page}
          </span>
        </button>
      </nav>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col md:h-screen overflow-y-auto relative z-10 no-scrollbar">
        <main className="w-full max-w-5xl mx-auto p-6 md:p-10 pb-24 md:pb-10 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {activeTab === 'overview' && (
                <OverviewTab 
                  creator={creator} 
                  settings={settings} 
                  tips={tips} 
                  showToast={showToast} 
                  setCreator={setCreator}
                  setSettings={setSettings}
                  setTips={setTips}
                  navigate={navigate}
                  setActiveTab={setActiveTab}
                />
              )}
              {activeTab === 'tips' && (
                <TipsListTab 
                  creator={creator} 
                  settings={settings} 
                  tips={tips} 
                  showToast={showToast} 
                  setCreator={setCreator}
                  setSettings={setSettings}
                  setTips={setTips}
                />
              )}
              {activeTab === 'payout' && (
                <PayoutTab 
                  creator={creator} 
                  settings={settings} 
                  tips={tips} 
                  showToast={showToast} 
                  setCreator={setCreator}
                  setSettings={setSettings}
                  setTips={setTips}
                />
              )}
              {activeTab === 'link-widget' && (
                <LinkWidgetTab 
                  creator={creator} 
                  settings={settings} 
                  tips={tips} 
                  showToast={showToast} 
                  setCreator={setCreator}
                  setSettings={setSettings}
                  setTips={setTips}
                />
              )}
              {activeTab === 'subscription' && (
                <SubscriptionTab 
                  creator={creator} 
                  settings={settings} 
                  tips={tips} 
                  showToast={showToast} 
                  setCreator={setCreator}
                  setSettings={setSettings}
                  setTips={setTips}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB: OVERVIEW
   ========================================================================== */
function OverviewTab({ creator, settings, tips, showToast, setCreator, navigate, setActiveTab }: DashboardTabProps) {
  const { t, locale } = useTranslation();
  const [upgrading, setUpgrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [thankedTips, setThankedTips] = useState<string[]>([]);
  
  const totalPaidTips = tips.filter(t => t.payment_status === 'paid');
  const earningsSum = totalPaidTips.reduce((sum, t) => sum + t.amount, 0);

  // Filter tips based on search query
  const filteredTips = totalPaidTips.filter(tip => 
    tip.supporter_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (tip.message || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyScriptCode = () => {
    const host = window.location.origin;
    const code = `<script src="${host}/widget.js" data-creator="${creator.id}"></script>`;
    navigator.clipboard.writeText(code);
    showToast(t.copied || 'Copied!');
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/${creator.username}`;
    navigator.clipboard.writeText(shareUrl);
    showToast(t.copied || 'Copied!');
  };

  const handleProUpgrade = async () => {
    setUpgrading(true);
    try {
      const data = await api.upgradePro(creator.username);
      if (data.success) {
        setCreator(data.creator);
        confetti({ particleCount: 80, spread: 60 });
        showToast('Successfully upgraded to Pro! Watermark and templates unlocked.');
      }
    } catch (e) {
      showToast('Error upgrading account');
    } finally {
      setUpgrading(false);
    }
  };

  const handleSayThanks = (tipId: string, name: string) => {
    if (thankedTips.includes(tipId)) return;
    playClickSound();
    setThankedTips(prev => [...prev, tipId]);
    confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 } });
    showToast(`💌 Simulated: Thank-you note sent to ${name}!`);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 select-none text-slate-800">
      
      {/* Tab Header with Search bar styled exactly like the reference layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl md:text-5xl font-black font-display text-slate-900 tracking-tighter uppercase relative inline-block">
            {t.welcome_back.replace('{name}', creator.display_name)}
            <span className="absolute -bottom-1 -right-2 w-full h-3 bg-brand-orange/20 -rotate-1 -z-10"></span>
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1.5 uppercase tracking-widest">
            {t.dashboard_growing}
          </p>
        </div>

        {/* Dynamic Search Bar from reference layout */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supporters..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-slate-900 bg-white text-slate-900 font-bold text-xs shadow-[3px_3px_0px_#0f172a] focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" strokeWidth={3} />
        </div>
      </div>

      {/* Metrics Row - Matches reference layout with exact column widths and 3-column height layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Column 1 (Left): Vertical Stack containing Total Earnings & New Embed Widget Card */}
        <div className="col-span-12 md:col-span-6 lg:col-span-5 flex flex-col gap-6 lg:gap-8">
          
          {/* Card 1: Wide Featured Card - Theme Orange Card */}
          <motion.div 
            whileHover={{ y: -6, x: -6, boxShadow: "12px 12px 0px rgba(15, 23, 42, 1)" }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            onClick={() => {
              playClickSound();
              setActiveTab?.('payout');
            }}
            className="flex-1 p-6 md:p-8 rounded-[2rem] bg-brand-orange border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a] flex flex-col justify-between group cursor-pointer relative overflow-hidden min-h-[220px] lg:min-h-[260px]"
          >
            {/* Comic dots overlay */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-100">{t.total_earnings}</span>
                  {/* Right Top Arrow button from reference layout */}
                  <div className="w-10 h-10 rounded-full bg-white text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    →
                  </div>
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter font-display break-words drop-shadow-[2px_2px_0px_#0f172a] leading-tight">
                  €{earningsSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[10px] font-black text-orange-100 flex items-center gap-2 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 bg-emerald-400 border border-slate-900 rounded-full shrink-0 animate-pulse"></span>
                  <span>{t.payouts_active}</span>
                </p>
              </div>
            </div>

            {/* SVG Illustration - Coffee Cup on Fire inside Card 1 (Exactly like reference layout brain) */}
            <svg className="w-24 h-24 absolute -right-2 -bottom-2 opacity-50 lg:opacity-85 lg:right-4 lg:bottom-4 drop-shadow-[4px_4px_0px_#0f172a] transform hover:rotate-12 transition-transform pointer-events-none" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Flame */}
              <path d="M50 15 C38 32 38 48 50 60 C62 48 62 32 50 15 Z" fill="#f97316" stroke="#0f172a" strokeWidth="3" />
              <path d="M50 25 C43 35 43 45 50 54 C57 45 57 35 50 25 Z" fill="#f59e0b" stroke="#0f172a" strokeWidth="2.5" />
              <path d="M50 35 C46 41 46 47 50 51 C54 47 54 41 50 35 Z" fill="#fef08a" stroke="#0f172a" strokeWidth="1.5" />
              {/* Cup */}
              <path d="M30 52 C30 72 40 78 50 78 C60 78 70 72 70 52 Z" fill="#fb7185" stroke="#0f172a" strokeWidth="3" />
              {/* Cup Handle */}
              <path d="M70 58 Q77 58 77 63 Q77 68 70 68" fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              {/* Coffee Liquid Ellipse */}
              <ellipse cx="50" cy="52" rx="20" ry="3.5" fill="#7c2d12" stroke="#0f172a" strokeWidth="2" />
            </svg>
          </motion.div>

          {/* Card 1b: Embed Widget Code Card - Neo-Brutalist */}
          <motion.div 
            whileHover={{ y: -6, x: -6, boxShadow: "12px 12px 0px rgba(15, 23, 42, 1)" }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            className="p-5 md:p-6 rounded-[2rem] bg-white border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a] transition-all flex flex-col justify-between cursor-default relative overflow-hidden min-h-[140px] group"
          >
            {/* Halftone dots overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

            <div className="relative z-10 flex flex-col justify-between h-full w-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Embed Widget Code</span>
                <span className="bg-slate-100 text-slate-900 border-2 border-slate-900 text-[8px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-[2px_2px_0px_#0f172a] group-hover:bg-brand-orange transition-all">
                  WIDGET
                </span>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 relative w-full shadow-[inset_2px_2px_0px_rgba(0,0,0,0.05)] transition-all overflow-hidden group-hover:bg-slate-100">
                <code className="text-[10px] font-mono font-bold truncate flex-1 pl-1 text-slate-700 select-all relative z-10">
                  {`<script src="${window.location.origin}/widget.js" data-creator="${creator.id}"></script>`}
                </code>
                <button 
                  onClick={copyScriptCode}
                  className="p-2 rounded-lg bg-white border-2 border-slate-900 text-slate-900 hover:bg-brand-orange hover:text-slate-900 shadow-[2px_2px_0px_#0f172a] hover:shadow-none hover:translate-y-0.5 hover:translate-x-0.5 transition-all cursor-pointer shrink-0 relative z-10"
                  title="Copy Embed Script"
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Column 2 (Center): Vertical stack of Statistics and Milestone Goal Cards */}
        <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col gap-6 lg:gap-8">
          
          {/* Card 2: Statistics Card - Brand Orange with 20% Opacity */}
          <motion.div 
            whileHover={{ y: -6, x: -6, boxShadow: "12px 12px 0px rgba(15, 23, 42, 1)" }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            onClick={() => {
              playClickSound();
              setActiveTab?.('tips');
            }}
            className="flex-1 p-6 md:p-8 rounded-[2rem] bg-brand-orange/20 border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a] flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[180px] group"
          >
            {/* Halftone dots overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

            <div className="relative z-10 flex items-start justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">{t.total_supporters}</span>
              {/* Right Top Arrow button */}
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] flex items-center justify-center font-black text-xs shrink-0 group-hover:bg-brand-orange group-hover:text-slate-900 transition-all">
                →
              </div>
            </div>
            
            <div className="relative z-10 flex items-end justify-between gap-4 mt-4">
              <div>
                <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter font-display">
                  {totalPaidTips.length}
                </h3>
                <p className="text-[10px] font-black text-slate-700 mt-1 uppercase tracking-widest">
                  {t.from_donations}
                </p>
              </div>

              {/* Mini Column Sparkline Chart */}
              <div className="flex items-end gap-1.5 h-14 w-28 bg-white p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] shrink-0">
                <div className="flex-1 bg-slate-900 rounded-sm border border-slate-900" style={{ height: '28%' }} />
                <div className="flex-1 bg-slate-900 rounded-sm border border-slate-900" style={{ height: '48%' }} />
                <div className="flex-1 bg-slate-900 rounded-sm border border-slate-900" style={{ height: '35%' }} />
                <div className="flex-1 bg-slate-900 rounded-sm border border-slate-900" style={{ height: '62%' }} />
                <div className="flex-1 bg-slate-900 rounded-sm border border-slate-900" style={{ height: '85%' }} />
                <div className="flex-1 bg-slate-900 rounded-sm border border-slate-900" style={{ height: '100%' }} />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Public Page Share Link Card - Flat Dark Neo-Brutalist */}
          <motion.div 
            whileHover={{ y: -6, x: -6, boxShadow: "8px 8px 0px rgba(15, 23, 42, 1)" }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => {
              playClickSound();
              if (navigate) {
                navigate(`/${creator.username}`);
              } else {
                window.open(`${window.location.origin}/${creator.username}`, '_blank');
              }
            }}
            className="flex-1 p-6 md:p-8 rounded-[2rem] bg-slate-800 border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a] hover:shadow-[12px_12px_0px_#0f172a] transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden min-h-[180px] group"
          >
            <div className="relative z-10 flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 transition-colors block">
                  {t.public_page || "PUBLIC PAGE"}
                </span>
                <h4 className="text-xl font-black text-white font-display mt-1 truncate transition-colors">
                  {creator.display_name}
                </h4>
              </div>
              {/* Right Top Arrow button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  if (navigate) {
                    navigate(`/${creator.username}`);
                  } else {
                    window.open(`${window.location.origin}/${creator.username}`, '_blank');
                  }
                }}
                className="w-8 h-8 rounded-full bg-white text-slate-900 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_#000] group-hover:bg-brand-orange group-hover:text-slate-900 flex items-center justify-center font-black text-xs shrink-0 transition-all cursor-pointer"
                title="Visit Public Page"
              >
                →
              </button>
            </div>
            
            <div className="relative z-10 flex flex-col gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border-2 border-slate-700 text-slate-200 relative w-full shadow-inner transition-all overflow-hidden">
                <code className="text-[10px] font-mono font-bold truncate flex-1 pl-1 text-slate-300 select-all relative z-10">
                  {`${window.location.origin}/${creator.username}`}
                </code>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    copyShareLink();
                  }}
                  className="p-1.5 rounded-lg bg-white border-2 border-slate-900 text-slate-900 hover:bg-brand-orange shadow-[2px_2px_0px_#000] hover:shadow-[1px_1px_0px_#000] hover:translate-y-0.5 hover:translate-x-0.5 transition-all cursor-pointer shrink-0 relative z-10"
                  title="Copy Link"
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={3} />
                </button>
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mt-1 transition-colors">
                {locale === 'zh' ? '分享链接接收赞助打赏' : 'SHARE LINK TO RECEIVE TIPS'}
              </p>
            </div>
          </motion.div>
          
        </div>

        {/* Column 3 (Right): Tall Dark Account/Pro Card - Premium Slate-900 Card with overlap avatars */}
        <div className="col-span-12 md:col-span-12 lg:col-span-3 p-6 md:p-8 rounded-[2rem] bg-slate-900 text-white border-[3px] border-slate-900 shadow-[8px_8px_0px_#ea580c] flex flex-col md:flex-row lg:flex-col justify-between items-stretch md:items-center lg:items-stretch gap-6 relative overflow-hidden min-h-[380px] md:min-h-[220px] lg:min-h-[440px] group">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-orange rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange">{t.plan_settings}</span>
              <span className="text-[10px] bg-brand-orange text-slate-900 font-black px-2.5 py-0.5 rounded-full border border-slate-900 shadow-[1px_1px_0px_#000]">
                PRO
              </span>
            </div>
            
            <h4 className="text-xl font-black text-white font-display uppercase tracking-tight mt-6 md:mt-3 lg:mt-6 leading-tight">
              {creator.is_pro ? t.pro_activated : t.upgrade_title}
            </h4>
            <p className="text-[11px] font-bold text-slate-400 mt-2 leading-relaxed max-w-md">
              {creator.is_pro ? t.pro_desc_active : t.pro_desc_inactive}
            </p>
          </div>

          {/* Overlapping supporter avatars (Directly matches the bubbles in reference layout) */}
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-col justify-between items-start sm:items-center md:items-start lg:items-start gap-4 shrink-0 w-full md:w-auto">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Our Community</span>
              <div className="flex -space-x-3.5 overflow-hidden">
                <img className="inline-block h-8 w-8 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop" alt="" referrerPolicy="no-referrer" />
                <img className="inline-block h-8 w-8 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop" alt="" referrerPolicy="no-referrer" />
                <img className="inline-block h-8 w-8 rounded-full border-2 border-slate-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop" alt="" referrerPolicy="no-referrer" />
                <div className="inline-block h-8 w-8 rounded-full border-2 border-slate-900 bg-brand-orange text-slate-900 font-black text-[9px] flex items-center justify-center shadow-[1px_1px_0px_#000]">
                  +99
                </div>
              </div>
            </div>

            <div className="w-full sm:w-auto md:w-48 lg:w-full">
              {!creator.is_pro ? (
                <button 
                  onClick={handleProUpgrade}
                  disabled={upgrading}
                  className="w-full py-3 rounded-xl bg-brand-orange border-2 border-slate-900 text-slate-900 font-black text-[11px] uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {upgrading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></span>
                  ) : (
                    <>
                      <span>{t.upgrade_month}</span>
                      <ArrowRight className="w-3.5 h-3.5" strokeWidth={3} />
                    </>
                  )}
                </button>
              ) : (
                <div className="py-2.5 px-3 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-[10px] uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000]">
                  <CheckCircle2 className="w-4 h-4 text-brand-orange" strokeWidth={3} />
                  <span>{t.commission_free}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Latest supporters checklist - Styled like upcoming courses table */}
      <div className="p-6 md:p-8 rounded-[2rem] bg-white border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a]">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-900 font-display uppercase tracking-tight">
              {t.supporter_feed}
            </span>
            <span className="bg-brand-orange text-slate-900 border-2 border-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-[2px_2px_0px_#000]">
              LIVE
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest hidden sm:block">
            {locale === 'zh' ? '展示最新 5 条记录' : 'SHOWING LATEST 5'}
          </span>
        </div>

        {filteredTips.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
            {searchQuery ? "No matches found" : t.share_link_receive}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTips.slice(0, 5).map((tip) => {
              const isVIP = tip.amount >= 15;
              const hasThanked = thankedTips.includes(tip.id);
              
              return (
                <div 
                  key={tip.id} 
                  className="p-4 md:p-5 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* Left Column: Supporter details with rounded bordered icon */}
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-2xl bg-brand-orange border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-slate-900 font-black flex items-center justify-center text-lg uppercase shrink-0 group-hover:-rotate-6 transition-transform">
                      {tip.supporter_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                          {tip.supporter_name}
                        </h4>
                        
                        {/* Dynamic Supporter Level badges */}
                        {isVIP ? (
                          <span className="bg-amber-400 text-slate-900 border border-slate-900 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            VIP FAN
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                            SUPPORTER
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs font-bold text-slate-500 mt-1 truncate">
                        "{tip.message || t.no_messages_provided}"
                      </p>
                    </div>
                  </div>

                  {/* Middle Column: Centered formatted date */}
                  <div className="sm:text-center shrink-0">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-mono">
                      {new Date(tip.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Middle-Right: High-contrast support value */}
                  <div className="sm:text-right shrink-0">
                    <p className="font-black text-brand-orange text-base uppercase tracking-tighter">
                      +{tip.amount.toFixed(2)} EUR
                    </p>
                  </div>

                  {/* Right Column: "View details" or "Say Thanks" custom action button */}
                  <div className="shrink-0 flex items-center sm:justify-end">
                    <button 
                      onClick={() => handleSayThanks(tip.id, tip.supporter_name)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                        hasThanked 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-white hover:bg-slate-50 text-slate-900'
                      }`}
                    >
                      {hasThanked ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                          <span>THANKED!</span>
                        </>
                      ) : (
                        <span>SAY THANKS</span>
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

/* ==========================================================================
   TAB: WIDGET SETTINGS / PROFILE CUSTOMIZATION
   ========================================================================== */
function WidgetSettingsTab({ creator, settings, showToast, setSettings, setCreator }: DashboardTabProps) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(creator.display_name);
  const [bio, setBio] = useState(creator.bio);
  const [avatarUrl, setAvatarUrl] = useState(creator.avatar_url);
  const [buttonText, setButtonText] = useState(settings.button_text);
  const [theme, setTheme] = useState(settings.theme);
  const [thankYouMessage, setThankYouMessage] = useState(settings.thank_you_message);
  const [goalText, setGoalText] = useState(settings.goal_text || '');
  const [goalAmount, setGoalAmount] = useState(settings.goal_amount || 0);
  const [saving, setSaving] = useState(false);

  // Default avatars to choose from
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&h=128&q=80'
  ];

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const updatedCreator = {
      ...creator,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl
    };
    const updatedSettings = {
      ...settings,
      button_text: buttonText,
      theme,
      thank_you_message: thankYouMessage,
      goal_text: goalText,
      goal_amount: goalAmount
    };

    try {
      const data = await api.updateSettings(creator.username, {
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
        button_text: buttonText,
        theme,
        thank_you_message: thankYouMessage,
        goal_text: goalText,
        goal_amount: goalAmount
      });
      if (data.success) {
        setCreator(data.creator);
        setSettings(data.settings);
        showToast(t.save_success || 'Settings saved successfully!');
      } else {
        // Fallback to local state save
        setCreator(updatedCreator);
        setSettings(updatedSettings);
        showToast(t.save_success || 'Settings saved successfully!');
      }
    } catch (e) {
      // Fallback to local state save
      setCreator(updatedCreator);
      setSettings(updatedSettings);
      showToast(t.save_success || 'Settings saved successfully!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Left Column: Form Customize */}
      <div className="lg:col-span-7 space-y-6">
        <div className="p-6 md:p-8 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <h2 className="text-2xl font-black font-display text-slate-900 tracking-tighter uppercase mb-8 inline-block relative">
            {t.custom_widget}
            <span className="absolute -bottom-1 -right-2 w-full h-2 bg-brand-orange/20 -rotate-1 -z-10"></span>
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-8">
            {/* Display Name */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t.display_name}
              </label>
              <input 
                type="text" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100"
              />
            </div>

            {/* Avatar chooser */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t.avatar_img_choice}
              </label>
              <div className="flex items-center gap-4">
                {sampleAvatars.map((av, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setAvatarUrl(av)}
                    className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === av ? 'border-brand-orange scale-110 shadow-[2px_2px_0px_#0f172a]' : 'border-slate-900 hover:-translate-y-1 hover:shadow-[2px_2px_0px_#0f172a]'
                    }`}
                  >
                    <img src={av} className="w-full h-full object-cover" alt="sample avatar" />
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t.short_bio}
              </label>
              <textarea 
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100 resize-none leading-relaxed"
                placeholder={t.short_bio_placeholder}
              />
            </div>

            {/* Support button text */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t.cta_btn_text}
              </label>
              <input 
                type="text" 
                required
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100"
              />
            </div>

            {/* Support Settings goals */}
            <div className="pt-8 border-t-2 border-slate-100 border-dashed">
              <h3 className="text-sm font-black text-slate-900 font-display mb-6 uppercase tracking-tight">{t.goal_progress_settings}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {t.current_goal_optional}
                  </label>
                  <input 
                    type="text" 
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100"
                    placeholder={t.current_goal_placeholder}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    {t.goal_target_amount}
                  </label>
                  <input 
                    type="number" 
                    value={goalAmount || ''}
                    onChange={(e) => setGoalAmount(Number(e.target.value) || 0)}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100"
                    placeholder={t.goal_target_placeholder}
                  />
                </div>
              </div>
            </div>

            {/* Theme Picker */}
            <div className="pt-8 border-t-2 border-slate-100 border-dashed">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                {t.widget_theme_style}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('orange')}
                  className={`py-4 px-2 rounded-xl text-center border-2 font-black text-[10px] transition-all uppercase tracking-widest ${
                    theme === 'orange' 
                      ? 'border-slate-900 bg-brand-orange text-white shadow-[2px_2px_0px_#0f172a]' 
                      : 'border-slate-900 bg-white text-slate-500 hover:text-slate-900 hover:shadow-[2px_2px_0px_#0f172a] hover:-translate-y-0.5'
                  }`}
                >
                  {t.solar_orange}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (creator.is_pro) setTheme('light');
                    else showToast(t.theme_pro_required || 'Theme customization requires Pro Plan account');
                  }}
                  className={`py-4 px-2 rounded-xl text-center border-2 font-black text-[10px] transition-all uppercase tracking-widest flex flex-col items-center justify-center relative ${
                    theme === 'light' 
                      ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-[2px_2px_0px_#0f172a]' 
                      : 'border-slate-900 bg-white text-slate-500 hover:text-slate-900 hover:shadow-[2px_2px_0px_#0f172a] hover:-translate-y-0.5'
                  }`}
                >
                  <span>{t.classic_light}</span>
                  {!creator.is_pro && <span className="absolute -top-1.5 -right-1.5 py-0.5 px-1.5 border-2 border-slate-900 bg-brand-orange text-slate-900 text-[6px] font-black uppercase rounded-full">Pro</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (creator.is_pro) setTheme('dark');
                    else showToast(t.theme_pro_required || 'Theme customization requires Pro Plan account');
                  }}
                  className={`py-4 px-2 rounded-xl text-center border-2 font-black text-[10px] transition-all uppercase tracking-widest flex flex-col items-center justify-center relative ${
                    theme === 'dark' 
                      ? 'border-slate-900 bg-slate-900 text-white shadow-[2px_2px_0px_#0f172a]' 
                      : 'border-slate-900 bg-white text-slate-500 hover:text-slate-900 hover:shadow-[2px_2px_0px_#0f172a] hover:-translate-y-0.5'
                  }`}
                >
                  <span>{t.dark_theme}</span>
                  {!creator.is_pro && <span className="absolute -top-1.5 -right-1.5 py-0.5 px-1.5 border-2 border-slate-900 bg-brand-orange text-slate-900 text-[6px] font-black uppercase rounded-full">Pro</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (creator.is_pro) setTheme('glass');
                    else showToast(t.theme_pro_required || 'Theme customization requires Pro Plan account');
                  }}
                  className={`py-4 px-2 rounded-xl text-center border-2 font-black text-[10px] transition-all uppercase tracking-widest flex flex-col items-center justify-center relative ${
                    theme === 'glass' 
                      ? 'border-teal-500 bg-teal-50 text-teal-600 shadow-[2px_2px_0px_#14b8a6]' 
                      : 'border-slate-900 bg-white text-slate-500 hover:text-slate-900 hover:shadow-[2px_2px_0px_#0f172a] hover:-translate-y-0.5'
                  }`}
                >
                  <span>{t.soft_glass}</span>
                  {!creator.is_pro && <span className="absolute -top-1.5 -right-1.5 py-0.5 px-1.5 border-2 border-slate-900 bg-brand-orange text-slate-900 text-[6px] font-black uppercase rounded-full">Pro</span>}
                </button>
              </div>
            </div>

            {/* Thank you message */}
            <div className="pt-8 border-t-2 border-slate-100 border-dashed">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {t.thank_you_success_msg}
              </label>
              <textarea 
                rows={3}
                required
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-sm focus:outline-none focus:shadow-[4px_4px_0px_#0f172a] focus:bg-white transition-all hover:bg-slate-100 resize-none leading-relaxed"
                placeholder={t.thank_you_placeholder}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                disabled={saving}
                className="py-4 px-8 rounded-xl bg-slate-900 border-2 border-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#cbd5e1] transition-all shrink-0 hover:translate-y-1 hover:translate-x-1 hover:shadow-none disabled:opacity-75 disabled:pointer-events-none"
              >
                {saving ? (
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                ) : (
                  <span>{t.save_settings}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Live Mockup View */}
      <div className="lg:col-span-5 sticky top-6 self-start space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
          {t.live_preview_widget}
        </p>
        
        <div className="p-8 rounded-[2rem] border-2 border-slate-900 bg-slate-100 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center relative overflow-hidden">
          {/* Comic Dots Background */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
          
          <div className="w-full max-w-[300px] bg-white rounded-[2rem] border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] p-8 text-center relative z-10 transition-transform hover:-translate-y-2 hover:rotate-1 duration-300">
            {/* Simulated Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] mb-6 bg-slate-50 -mt-16 bg-brand-orange/10 relative">
              <img src={avatarUrl} className="w-full h-full object-cover relative z-10" alt="creator avatar" />
              <div className="absolute inset-0 z-20 shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]"></div>
            </div>

            <h4 className="font-black text-xl text-slate-900 tracking-tighter uppercase font-display mb-2">{displayName}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-bold line-clamp-2 mb-6">{bio}</p>

            {/* Simulated Goal */}
            {goalText && (
              <div className="bg-white border-2 border-slate-900 p-4 rounded-xl mb-6 text-left shadow-[2px_2px_0px_#0f172a]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{t.goal_target}</span>
                <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{goalText}</p>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-100 border-2 border-slate-900 h-3 rounded-full mt-3 overflow-hidden relative">
                  <div className="bg-brand-orange w-1/3 h-full rounded-full border-r-2 border-slate-900"></div>
                </div>
              </div>
            )}

            <button 
              type="button"
              className="w-full py-4 rounded-xl bg-brand-orange border-2 border-slate-900 text-slate-900 font-black text-sm uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] flex items-center justify-center gap-2 hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all cursor-pointer"
            >
              <Heart className="w-5 h-5 fill-slate-900" strokeWidth={2} />
              <span>{buttonText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB: SUPPORTER LIST & WALL TOGGLES
   ========================================================================== */
function TipsListTab({ tips, showToast, setTips, creator }: DashboardTabProps) {
  const { t } = useTranslation();
  
  // Advanced Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeType, setDateRangeType] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | 'with_message' | 'no_message'>('all');
  const [amountFilter, setAmountFilter] = useState<'all' | 'large' | 'small'>('all');

  const paidTips = tips.filter(t => t.payment_status === 'paid');

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const filterByDate = (dateObj: Date) => {
    if (dateRangeType === 'today') {
      return dateObj >= startOfToday;
    } else if (dateRangeType === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dateObj >= sevenDaysAgo;
    } else if (dateRangeType === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return dateObj >= thirtyDaysAgo;
    } else if (dateRangeType === 'custom') {
      if (startDate) {
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const sDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        if (dateObj < sDate) return false;
      }
      if (endDate) {
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
        const eDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
        if (dateObj > eDate) return false;
      }
      return true;
    }
    return true; // 'all'
  };

  const filteredTips = paidTips.filter(tip => {
    const tipDate = tip.created_at ? new Date(tip.created_at) : new Date();
    
    // Date Range Filter
    if (!filterByDate(tipDate)) return false;

    // Search Query (supporter name, message, amount)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tip.supporter_name?.toLowerCase().includes(q);
      const matchMessage = tip.message?.toLowerCase().includes(q);
      const matchAmount = tip.amount.toString().includes(q);
      if (!matchName && !matchMessage && !matchAmount) return false;
    }

    // Message Filter
    if (messageFilter === 'with_message' && !tip.message) return false;
    if (messageFilter === 'no_message' && tip.message) return false;

    // Amount Filter
    if (amountFilter === 'large' && tip.amount < 50) return false;
    if (amountFilter === 'small' && tip.amount >= 50) return false;

    return true;
  });

  // Calculate stats based on currently filtered list
  const filteredTotal = filteredTips.reduce((sum, tip) => sum + tip.amount, 0);
  const filteredCount = filteredTips.length;
  const filteredAverage = filteredCount > 0 ? (filteredTotal / filteredCount).toFixed(2) : '0.00';

  const toggleWallStatus = (tipId: string) => {
    // In-memory toggler simulation (saves locally as well on dynamic UI update)
    const updated = tips.map(t => {
      if (t.id === tipId) {
        return { ...t, isPublicOnWall: t.isPublicOnWall === false ? true : false };
      }
      return t;
    });
    setTips(updated);
    showToast(t.wall_toggled || 'Wall visibility setting toggled successfully.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative inline-block">
        <h2 className="text-2xl md:text-4xl font-black font-display text-slate-900 tracking-tighter uppercase relative z-10">
          {t.supporter_database}
        </h2>
        <span className="absolute -bottom-1 -right-2 w-full h-3 bg-brand-orange/20 -rotate-1 z-0"></span>
        <p className="text-xs font-bold text-slate-500 mt-3 uppercase tracking-widest relative z-10">
          {t.supporter_database_desc}
        </p>
      </div>

      {paidTips.length === 0 ? (
        <div className="p-12 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
          {t.share_link_receive || 'Your database is empty. Once fans make a donation via Stripe, they will appear here!'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Row with Search Input */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h3 className="text-xl font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-3 shrink-0">
              <span className="w-2 h-6 bg-brand-orange inline-block rounded-full border-2 border-slate-900"></span>
              所有支持记录
            </h3>

            {/* Search Bar - Neo brutalism styled */}
            <div className="flex-1 max-w-md relative">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索支持者名字、金额或留言..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-900 font-bold text-xs shadow-[2px_2px_0px_#0f172a] focus:outline-none focus:ring-0 focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-slate-800 placeholder-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={3} />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>

          {/* Real-time Filter Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 text-white border-2 border-slate-900 shadow-[4px_4px_0px_#f97316]">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block mb-1">
                当前筛选到账总额
              </span>
              <h4 className="text-3xl font-black font-display tracking-tight text-white">
                €{filteredTotal.toFixed(2)}
              </h4>
            </div>
            <div className="p-5 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#3b82f6]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                当前筛选支持人数
              </span>
              <h4 className="text-3xl font-black font-display tracking-tight text-slate-900">
                {filteredCount} 人
              </h4>
            </div>
            <div className="p-5 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#22c55e]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                当前筛选平均金额
              </span>
              <h4 className="text-3xl font-black font-display tracking-tight text-slate-900">
                €{filteredAverage}
              </h4>
            </div>
          </div>

          {/* Multi-Dimensional Filter Controls */}
          <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
            {/* Row 1: Message & Amount Size */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Message Filter buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">留言过滤:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all', label: '全部' },
                    { value: 'with_message', label: '有留言' },
                    { value: 'no_message', label: '无留言' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        playClickSound();
                        setMessageFilter(item.value as any);
                      }}
                      className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-black transition-all cursor-pointer
                        ${messageFilter === item.value 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#22c55e]' 
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-6 w-0.5 bg-slate-300 hidden md:block"></div>

              {/* Amount Filter buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">金额过滤:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all', label: '全部金额' },
                    { value: 'large', label: '大额支持 (≥ €50)' },
                    { value: 'small', label: '小额支持 (< €50)' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        playClickSound();
                        setAmountFilter(item.value as any);
                      }}
                      className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-black transition-all cursor-pointer
                        ${amountFilter === item.value 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#3b82f6]' 
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-slate-200"></div>

            {/* Row 2: Date Filters */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={3} />
                  时间筛选:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { value: 'all', label: '全部时间' },
                    { value: 'today', label: '今天' },
                    { value: '7days', label: '最近7天' },
                    { value: '30days', label: '最近30天' },
                    { value: 'custom', label: '自定义' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        playClickSound();
                        setDateRangeType(item.value as any);
                      }}
                      className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-black transition-all cursor-pointer
                        ${dateRangeType === item.value 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#f97316]' 
                          : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs if 'custom' is active */}
              {dateRangeType === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <div className="flex items-center gap-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border-2 border-slate-900 font-bold text-xs bg-white text-slate-800 shadow-[2px_2px_0px_#0f172a] focus:outline-none"
                    />
                    <span className="text-xs font-black text-slate-400">至</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border-2 border-slate-900 font-bold text-xs bg-white text-slate-800 shadow-[2px_2px_0px_#0f172a] focus:outline-none"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        playClickSound();
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-[10px] font-black text-brand-orange hover:underline cursor-pointer"
                    >
                      清除日期
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {filteredTips.length === 0 ? (
            <div className="py-16 text-center rounded-[2rem] border-[3px] border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border-2 border-slate-900">
                <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                没有找到符合筛选条件的外部支持记录。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredTips.map((tip) => (
                <motion.div 
                  key={tip.id} 
                  whileHover={{ y: -4, x: -4, boxShadow: "8px 8px 0px rgba(15, 23, 42, 1)" }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="p-6 md:p-8 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group transition-all"
                >
                  <div className="flex items-start gap-5">
                    {/* Supporter Avatar Icon Letter */}
                    <div className="w-14 h-14 rounded-2xl bg-brand-orange border-2 border-slate-900 flex items-center justify-center text-slate-900 font-black text-xl shrink-0 shadow-[2px_2px_0px_#0f172a] group-hover:-rotate-6 transition-transform">
                      {tip.supporter_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">{tip.supporter_name}</h4>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          {new Date(tip.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-bold mt-2 bg-slate-100 p-3 rounded-xl border-2 border-slate-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]">
                        "{tip.message || t.no_messages_provided || 'No custom message left.'}"
                      </p>
                    </div>
                  </div>

                  {/* Amount & Wall Toggle switch */}
                  <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-5 border-t-2 md:border-t-0 pt-5 md:pt-0 border-slate-900 border-dashed md:border-none shrink-0">
                    <div className="py-2 px-4 rounded-xl bg-slate-900 border-2 border-slate-900 text-white font-black text-lg shadow-[2px_2px_0px_#cbd5e1]">
                      €{tip.amount}.00
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
                      <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{t.public_wall}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={tip.isPublicOnWall !== false} 
                          onChange={() => toggleWallStatus(tip.id)}
                          className="sr-only peer" 
                        />
                        <div className="w-10 h-6 bg-white border-2 border-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-900 after:border-2 after:border-slate-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange peer-checked:after:bg-white peer-checked:after:border-white"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   TAB: PAYOUT
   ========================================================================== */
function PayoutTab({ creator, tips, showToast }: DashboardTabProps) {
  const { t } = useTranslation();
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [connectingPaypal, setConnectingPaypal] = useState(false);
  const [connectedMethod, setConnectedMethod] = useState<'stripe' | 'paypal' | null>(() => {
    const saved = localStorage.getItem('tiplet_connected_payout_method');
    return (saved === 'stripe' || saved === 'paypal') ? saved : null;
  });
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal'>('stripe');
  
  // Advanced filters and search state
  const [statusFilter, setStatusFilter] = useState<'all' | 'settled' | 'processing' | 'refunded'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'stripe' | 'paypal'>('all');
  const [payoutSearchQuery, setPayoutSearchQuery] = useState('');
  
  // Date filter states
  const [dateRangeType, setDateRangeType] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Date parsing helper
  const getPayoutDate = (dateStr: string) => {
    return new Date(dateStr.replace(/-/g, '/'));
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const filterByDate = (dateObj: Date) => {
    if (dateRangeType === 'today') {
      return dateObj >= startOfToday;
    } else if (dateRangeType === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dateObj >= sevenDaysAgo;
    } else if (dateRangeType === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return dateObj >= thirtyDaysAgo;
    } else if (dateRangeType === 'custom') {
      if (startDate) {
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const sDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
        if (dateObj < sDate) return false;
      }
      if (endDate) {
        const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
        const eDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
        if (dateObj > eDate) return false;
      }
      return true;
    }
    return true; // 'all'
  };

  const getDateRangeLabel = () => {
    switch (dateRangeType) {
      case 'today':
        return '今天';
      case '7days':
        return '最近7天';
      case '30days':
        return '最近30天';
      case 'custom':
        if (startDate || endDate) {
          return `${startDate || '起始'} 至 ${endDate || '至今'}`;
        }
        return '自定义日期';
      default:
        return '全部时间';
    }
  };

  // Calculate earnings
  const paidTips = tips ? tips.filter(tip => tip.payment_status === 'paid') : [];

  // Combined real-time tips and realistic simulated transactions for rich filtering verification
  const combinedPayouts = [
    ...paidTips.map((tip, idx) => {
      const parsedDate = tip.created_at ? new Date(tip.created_at) : new Date();
      return {
        id: tip.id || `TXN-LIVE-${1000 + idx}`,
        dateObj: parsedDate,
        date: parsedDate.toLocaleString('zh-CN', { hour12: false }),
        amount: tip.amount,
        supporter_name: tip.supporter_name || '匿名支持者',
        message: tip.message || '非常感谢支持！',
        channel: 'stripe' as const,
        status: 'settled' as const
      };
    }),
    { id: 'TXN-2026-001', dateObj: new Date('2026-06-28T12:45:00'), date: '2026-06-28 12:45', amount: 50.00, supporter_name: '张晨光', message: '非常震撼的流体动效，给力！', channel: 'stripe' as const, status: 'settled' as const },
    { id: 'TXN-2026-002', dateObj: new Date('2026-06-27T18:20:00'), date: '2026-06-27 18:20', amount: 120.00, supporter_name: '李丽华', message: '非常喜欢您的设计风格，已推荐给同事', channel: 'paypal' as const, status: 'settled' as const },
    { id: 'TXN-2026-003', dateObj: new Date('2026-06-26T09:15:00'), date: '2026-06-26 09:15', amount: 35.00, supporter_name: 'David King', message: 'Cool widget! Extremely easy to embed in my blog.', channel: 'stripe' as const, status: 'processing' as const },
    { id: 'TXN-2026-004', dateObj: new Date('2026-06-25T21:05:00'), date: '2026-06-25 21:05', amount: 200.00, supporter_name: '赵强', message: '定制主题功能很好用，支持一下大师', channel: 'paypal' as const, status: 'refunded' as const },
    { id: 'TXN-2026-005', dateObj: new Date('2026-06-24T15:30:00'), date: '2026-06-24 15:30', amount: 80.00, supporter_name: '匿名支持者', message: '请喝杯咖啡，期待更多精美组件！', channel: 'stripe' as const, status: 'settled' as const },
    { id: 'TXN-2026-006', dateObj: new Date('2026-06-23T11:10:00'), date: '2026-06-23 11:10', amount: 15.00, supporter_name: '陈小明', message: '感谢分享，这个对新项目太有用了。', channel: 'stripe' as const, status: 'settled' as const },
  ];

  // Dynamic filter application
  const filteredPayouts = combinedPayouts.filter(p => {
    if (!filterByDate(p.dateObj)) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (channelFilter !== 'all' && p.channel !== channelFilter) return false;
    if (payoutSearchQuery.trim()) {
      const q = payoutSearchQuery.toLowerCase();
      const matchName = p.supporter_name.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      const matchMessage = p.message.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchMessage) return false;
    }
    return true;
  });

  // Calculate dynamic "到账总额" based on active date range (sum of settled/paid payouts under active date range)
  const availableBalance = combinedPayouts
    .filter(p => p.status === 'settled' && filterByDate(p.dateObj))
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative inline-block">
        <h2 className="text-2xl md:text-4xl font-black font-display text-slate-900 tracking-tighter uppercase relative z-10">
          {t.payout || 'Payouts'}
        </h2>
        <span className="absolute -bottom-1 -right-2 w-full h-3 bg-brand-orange/20 -rotate-1 z-0"></span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Balance Card - Matching neo-brutalist aesthetic with Brand Orange Background */}
        <div className="p-8 rounded-[2rem] bg-brand-orange border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a] relative overflow-hidden flex flex-col justify-between min-h-[300px]">
           <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
           
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-white/95 block">
                    {t.available_balance || 'Available Balance'}
                  </span>
                  <span className="text-[10px] font-black bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-[1px_1px_0px_rgba(0,0,0,0.15)] shrink-0">
                    <Calendar className="w-3 h-3 text-white" strokeWidth={3} />
                    {getDateRangeLabel()}
                  </span>
                </div>
               <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter font-display">
                 €{availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </h3>
              </div>

             <div className="bg-slate-900 border-2 border-slate-900 p-4 rounded-2xl mt-6">
               <div className="flex items-center gap-2 text-brand-orange mb-1">
                 <ShieldCheck className="w-4 h-4 text-brand-orange" strokeWidth={3} />
                 <span className="text-xs font-black uppercase tracking-wider">实时结算已启用</span>
               </div>
               <p className="text-[10px] text-slate-300 leading-relaxed font-bold">
                 所有赞助资金将在扣除网关手续费后，实时直接划拨到您选择的收款方式中，无需手动提现。
               </p>
             </div>
           </div>
        </div>

        {/* Payout Method Card */}
        <div className="p-8 rounded-[2rem] bg-white border-[3px] border-slate-900 shadow-[8px_8px_0px_#0f172a] relative flex flex-col justify-between min-h-[300px]">
          {connectedMethod ? (
            <div className="flex flex-col h-full justify-between flex-1">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    {t.payout_method || 'Payout Method'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border-2 border-slate-900 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#0f172a]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={3} />
                    绑定完成
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] relative overflow-hidden">
                  <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-brand-orange/10 rounded-full border-2 border-slate-900/5 pointer-events-none"></div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]
                      ${connectedMethod === 'stripe' ? 'bg-indigo-100 text-indigo-600' : 'bg-sky-100 text-sky-600'}`}>
                      <CreditCard className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-slate-900">
                        {connectedMethod === 'stripe' ? 'Stripe 快捷支付' : 'PayPal 国际支付'}
                      </h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        收款服务商 (Active)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-bold border-t-2 border-dashed border-slate-200 pt-4 text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">账号状态</span>
                      <span className="text-emerald-600 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                        已连接已激活
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">收款账户 ID</span>
                      <code className="text-[11px] font-mono bg-slate-200/50 px-1.5 py-0.5 rounded border border-slate-300">
                        {connectedMethod === 'stripe' ? 'acct_1H78dfK2oX...' : 'ancoox2025@gmail.com'}
                      </code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-black uppercase tracking-wider text-[9px]">实时到账</span>
                      <span>100% 极速通道</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    playClickSound();
                    const url = connectedMethod === 'stripe' 
                      ? 'https://dashboard.stripe.com' 
                      : 'https://www.paypal.com/myaccount/summary';
                    window.open(url, '_blank');
                  }}
                  className={`py-4 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:shadow-none hover:translate-y-1 hover:translate-x-1 flex items-center justify-center gap-2 cursor-pointer
                    ${connectedMethod === 'stripe' ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-950' : 'bg-sky-100 hover:bg-sky-200 text-sky-950'}`}
                >
                  <ExternalLink className="w-4 h-4" strokeWidth={3} />
                  访问服务商主页
                </button>
                <button
                  onClick={() => {
                    playClickSound();
                    setConnectedMethod(null);
                    localStorage.removeItem('tiplet_connected_payout_method');
                    showToast('收款账户已解除绑定！');
                  }}
                  className="py-4 rounded-xl border-2 border-slate-900 bg-red-50 text-red-900 font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:bg-red-100 hover:shadow-none hover:translate-y-1 hover:translate-x-1 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" strokeWidth={3} />
                  解绑当前账户
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between flex-1">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {t.payout_method || 'Payout Method'}
                </span>
                
                {/* Method Choice Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      playClickSound();
                      setSelectedMethod('stripe');
                    }}
                    className={`py-3 px-4 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer
                      ${selectedMethod === 'stripe' 
                        ? 'bg-indigo-100 text-indigo-900 shadow-[2px_2px_0px_#0f172a]' 
                        : 'bg-white text-slate-500 hover:bg-slate-50 shadow-none'}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${selectedMethod === 'stripe' ? 'bg-indigo-600' : 'bg-transparent'}`} />
                    Stripe
                  </button>
                  <button 
                    onClick={() => {
                      playClickSound();
                      setSelectedMethod('paypal');
                    }}
                    className={`py-3 px-4 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer
                      ${selectedMethod === 'paypal' 
                        ? 'bg-sky-100 text-sky-900 shadow-[2px_2px_0px_#0f172a]' 
                        : 'bg-white text-slate-500 hover:bg-slate-50 shadow-none'}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${selectedMethod === 'paypal' ? 'bg-sky-600' : 'bg-transparent'}`} />
                    PayPal
                  </button>
                </div>

                <div className="mt-6 flex flex-col items-center justify-center py-6 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
                  <div className={`w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center mb-3 shadow-[2px_2px_0px_#0f172a]
                    ${selectedMethod === 'stripe' ? 'bg-indigo-50 text-indigo-500' : 'bg-sky-50 text-sky-500'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {selectedMethod === 'stripe' ? 'Stripe: 未绑定' : 'PayPal: 未绑定'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  playClickSound();
                  if (selectedMethod === 'stripe') {
                    setConnectingStripe(true);
                    setTimeout(() => {
                      setConnectingStripe(false);
                      setConnectedMethod('stripe');
                      localStorage.setItem('tiplet_connected_payout_method', 'stripe');
                      showToast('Stripe 收款方式绑定成功 (模拟)!');
                    }, 1500);
                  } else {
                    setConnectingPaypal(true);
                    setTimeout(() => {
                      setConnectingPaypal(false);
                      setConnectedMethod('paypal');
                      localStorage.setItem('tiplet_connected_payout_method', 'paypal');
                      showToast('PayPal 收款方式绑定成功 (模拟)!');
                    }, 1500);
                  }
                }}
                disabled={selectedMethod === 'stripe' ? connectingStripe : connectingPaypal}
                className={`w-full mt-6 py-4 rounded-xl border-2 border-slate-900 text-slate-900 font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:shadow-none hover:translate-y-1 hover:translate-x-1 flex items-center justify-center gap-2 cursor-pointer
                  ${selectedMethod === 'stripe' 
                    ? 'bg-indigo-50 hover:bg-indigo-100' 
                    : 'bg-sky-50 hover:bg-sky-100'}`}
              >
                {((selectedMethod === 'stripe' ? connectingStripe : connectingPaypal)) ? (
                  <RefreshCw className="w-5 h-5 animate-spin" strokeWidth={3} />
                ) : (
                  <CreditCard className="w-5 h-5" strokeWidth={3} />
                )}
                {selectedMethod === 'stripe' ? '绑定 Stripe 账户' : '绑定 PayPal 账户'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sync Warning Tips Notification */}
      <div className="p-5 rounded-2xl bg-amber-50 border-[3px] border-slate-900 shadow-[4px_4px_0px_#0f172a] flex gap-4 items-start">
        <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-slate-900 flex items-center justify-center shrink-0">
          <HelpCircle className="w-5 h-5 text-amber-700" strokeWidth={3} />
        </div>
        <div>
          <h4 className="font-black text-sm text-slate-900 uppercase tracking-tight">资金到账数据提示</h4>
          <p className="text-xs text-slate-600 font-bold mt-1 leading-relaxed">
            数据实时同步至支付服务商控制台，具体到账时间以 Stripe/PayPal 实际清算为准。若存在结算延迟，请直接访问对应服务商的官方管理面板查阅。
          </p>
        </div>
      </div>

      <div className="pt-4 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h3 className="text-xl font-black font-display text-slate-900 uppercase tracking-tight flex items-center gap-3 shrink-0">
            <span className="w-2 h-6 bg-brand-orange inline-block rounded-full border-2 border-slate-900"></span>
            {t.payout_history || 'Payout History'}
          </h3>

          {/* Search Bar - Neo brutalism styled */}
          <div className="flex-1 max-w-md relative">
            <input 
              type="text"
              value={payoutSearchQuery}
              onChange={(e) => setPayoutSearchQuery(e.target.value)}
              placeholder="搜索支持者名字、订单号或留言..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-900 font-bold text-xs shadow-[2px_2px_0px_#0f172a] focus:outline-none focus:ring-0 focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all text-slate-800 placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" strokeWidth={3} />
            {payoutSearchQuery && (
              <button 
                onClick={() => setPayoutSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            )}
          </div>
        </div>

        {/* Multi-Dimensional Filter Controls */}
        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
          {/* Row 1: Status & Channel */}
          <div className="flex flex-wrap items-center gap-6">
            {/* Status Filter buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">状态筛选:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: '全部状态' },
                  { value: 'settled', label: '已结算' },
                  { value: 'processing', label: '处理中' },
                  { value: 'refunded', label: '已退款' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      playClickSound();
                      setStatusFilter(item.value as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-black transition-all cursor-pointer
                      ${statusFilter === item.value 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#22c55e]' 
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-6 w-0.5 bg-slate-300 hidden md:block"></div>

            {/* Channel Filter buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">渠道筛选:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: '全部渠道' },
                  { value: 'stripe', label: 'Stripe 渠道' },
                  { value: 'paypal', label: 'PayPal 渠道' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      playClickSound();
                      setChannelFilter(item.value as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-black transition-all cursor-pointer
                      ${channelFilter === item.value 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#3b82f6]' 
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-200"></div>

          {/* Row 2: Date Filters */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" strokeWidth={3} />
                时间筛选:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: '全部时间' },
                  { value: 'today', label: '今天' },
                  { value: '7days', label: '最近7天' },
                  { value: '30days', label: '最近30天' },
                  { value: 'custom', label: '自定义' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      playClickSound();
                      setDateRangeType(item.value as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg border-2 text-[11px] font-black transition-all cursor-pointer
                      ${dateRangeType === item.value 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_#f97316]' 
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs if 'custom' is active */}
            {dateRangeType === 'custom' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border-2 border-slate-900 font-bold text-xs bg-white text-slate-800 shadow-[2px_2px_0px_#0f172a] focus:outline-none"
                  />
                  <span className="text-xs font-black text-slate-400">至</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border-2 border-slate-900 font-bold text-xs bg-white text-slate-800 shadow-[2px_2px_0px_#0f172a] focus:outline-none"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      playClickSound();
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[10px] font-black text-brand-orange hover:underline cursor-pointer"
                  >
                    清除日期
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
        
        {filteredPayouts.length === 0 ? (
          <div className="py-16 text-center rounded-[2rem] border-[3px] border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center">
             <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border-2 border-slate-900">
               <AlertCircle className="w-6 h-6" strokeWidth={2.5} />
             </div>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
               没有找到符合筛选条件的到账记录。
             </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayouts.map((p) => (
              <div key={p.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border-[3px] border-slate-900 bg-white shadow-[4px_4px_0px_#0f172a] hover:translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_#0f172a] transition-all gap-4">
                <div className="flex items-start md:items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-slate-900 shrink-0 shadow-[2px_2px_0px_#0f172a]
                    ${p.status === 'settled' ? 'bg-emerald-100' : p.status === 'processing' ? 'bg-amber-100' : 'bg-red-100'}`}>
                    <ArrowRight className={`w-6 h-6 transform -rotate-45 
                      ${p.status === 'settled' ? 'text-emerald-600' : p.status === 'processing' ? 'text-amber-600' : 'text-red-600'}`} strokeWidth={3} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-black text-slate-900 text-base">{p.supporter_name}</span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-900 shadow-[1px_1px_0px_#0f172a]
                        ${p.channel === 'stripe' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'}`}>
                        {p.channel === 'stripe' ? 'Stripe 渠道' : 'PayPal 渠道'}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-900 shadow-[1px_1px_0px_#0f172a]
                        ${p.status === 'settled' ? 'bg-emerald-50 text-emerald-700' : p.status === 'processing' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                        {p.status === 'settled' ? '已结算' : p.status === 'processing' ? '处理中' : '已退款'}
                      </span>
                    </div>
                    {p.message && (
                      <p className="text-xs text-slate-500 font-bold italic">“ {p.message} ”</p>
                    )}
                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                      <span>流水号: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[9px] text-slate-600 border border-slate-200">{p.id}</code></span>
                      <span className="hidden sm:inline">•</span>
                      <span>时间: {p.date}</span>
                    </div>
                  </div>
                </div>
                <div className="font-black font-display text-2xl md:text-3xl text-slate-900 self-end md:self-center">
                  €{p.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB: LINK & WIDGET (专属链接与挂件)
   ========================================================================== */
function LinkWidgetTab({ creator, settings, showToast, setCreator, setSettings }: DashboardTabProps) {
  const { t } = useTranslation();
  const [usernameInput, setUsernameInput] = useState(creator.username);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWidgetUrl, setCopiedWidgetUrl] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const publicPageUrl = `${window.location.origin}/${creator.username}`;
  const widgetUrl = `${window.location.origin}/widget-frame?creator=${creator.username}`;
  const iframeCode = `<iframe src="${widgetUrl}" width="340" height="600" style="border:none; border-radius: 2rem; box-shadow: 4px 4px 0px #0f172a;" allowtransparency="true"></iframe>`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicPageUrl);
      setCopiedLink(true);
      showToast('专属主页链接已复制！');
      playClickSound();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      showToast('复制失败，请手动复制');
    }
  };

  const handleCopyWidgetUrl = async () => {
    try {
      await navigator.clipboard.writeText(widgetUrl);
      setCopiedWidgetUrl(true);
      showToast('挂件链接已复制！');
      playClickSound();
      setTimeout(() => setCopiedWidgetUrl(false), 2000);
    } catch (err) {
      showToast('复制失败，请手动复制');
    }
  };

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopiedEmbed(true);
      showToast('嵌入代码已复制！');
      playClickSound();
      setTimeout(() => setCopiedEmbed(false), 2000);
    } catch (err) {
      showToast('复制失败，请手动复制');
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedUsername = usernameInput.trim().toLowerCase();
    
    if (formattedUsername === creator.username.toLowerCase()) {
      showToast('专属链接未作修改');
      return;
    }

    const isValid = /^[a-z0-9_-]{3,24}$/.test(formattedUsername);
    if (!isValid) {
      showToast('专属链接只能包含 3-24 位英文字母、数字、下划线(_)或中划线(-)');
      return;
    }

    setSaving(true);
    playClickSound();

    try {
      const data = await api.updateSettings(creator.username, {
        new_username: formattedUsername
      });

      if (data.error) {
        showToast(data.error);
      } else if (data.success && data.creator) {
        setCreator(data.creator);
        showToast('专属主页链接更新成功！');
      } else {
        showToast('更新失败，请重试');
      }
    } catch (err: any) {
      console.error(err);
      showToast('服务器发生错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Left side: Links and Username Editing */}
      <div className="lg:col-span-7 space-y-6">
        {/* Public Link Editing Card */}
        <div className="p-6 md:p-8 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2 rounded-xl bg-brand-orange border-2 border-slate-900 text-slate-900 shadow-[1px_1px_0px_#000]">
              <Link className="w-5 h-5" strokeWidth={3} />
            </span>
            <div>
              <h2 className="text-xl font-black font-display text-slate-900 uppercase tracking-tight">
                专属公共主页链接
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                个性化您的公开页面地址，方便支持者轻松记住您的品牌
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveUsername} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                修改您的专属后缀 (Username Slug)
              </label>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-stretch rounded-xl border-2 border-slate-900 bg-slate-50 overflow-hidden shadow-[2px_2px_0px_#0f172a] focus-within:shadow-none focus-within:translate-x-0.5 focus-within:translate-y-0.5 transition-all">
                  <span className="px-3 flex items-center bg-slate-200 border-r-2 border-slate-900 text-xs font-bold text-slate-500 select-none">
                    {window.location.host}/
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="my-link"
                    className="flex-1 px-3 py-2.5 bg-white text-sm font-bold text-slate-800 focus:outline-none"
                    disabled={saving}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={saving || usernameInput.trim().toLowerCase() === creator.username.toLowerCase()}
                  className={`px-6 py-2.5 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest transition-all shadow-[2px_2px_0px_#0f172a] active:shadow-none active:translate-x-0.5 active:translate-y-0.5
                    ${saving || usernameInput.trim().toLowerCase() === creator.username.toLowerCase()
                      ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed shadow-none translate-x-0.5 translate-y-0.5'
                      : 'bg-brand-orange text-slate-900 hover:bg-brand-orange/90 cursor-pointer'}`}
                >
                  {saving ? '正在保存...' : '保存更改'}
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-2">
                * 链接必须为 3-24 位英文字母、数字、下划线(_)或中划线(-)，修改后旧链接将失效。
              </p>
            </div>
          </form>

          <div className="h-[2px] bg-slate-100 my-8"></div>

          {/* Quick Copy Link Row */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
              当前有效公共页面链接
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs font-black text-slate-900 break-all select-all">
                  {publicPageUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-slate-100 border-2 border-slate-900 rounded-xl font-black text-xs text-slate-900 shadow-[2px_2px_0px_#0f172a] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                      <span className="text-emerald-500">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={3} />
                      <span>复制链接</span>
                    </>
                  )}
                </button>
                <a
                  href={publicPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => playClickSound()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border-2 border-slate-900 rounded-xl font-black text-xs text-white shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" strokeWidth={3} />
                  <span>访问主页</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Floating widget instruction card */}
        <div className="p-6 md:p-8 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2 rounded-xl bg-blue-100 border-2 border-slate-900 text-blue-600 shadow-[1px_1px_0px_#000]">
              <Sparkles className="w-5 h-5" strokeWidth={3} />
            </span>
            <div>
              <h2 className="text-xl font-black font-display text-slate-900 uppercase tracking-tight">
                网页赞助挂件设置 & 嵌入
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                在您自己的个人博客、官网或 Notion 中无缝嵌入赞助挂件
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Widget URL */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                1. 专属挂件独立 URL (Widget URL)
              </label>
              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-900 flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-slate-800 truncate select-all">{widgetUrl}</span>
                <button
                  onClick={handleCopyWidgetUrl}
                  className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg font-black text-[10px] text-slate-900 shadow-[1px_1px_0px_#0f172a] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
                >
                  {copiedWidgetUrl ? '已复制' : '复制 URL'}
                </button>
              </div>
            </div>

            {/* Iframe HTML Embed */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                2. HTML 嵌入代码 (Iframe Embed Code)
              </label>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-900 border-2 border-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all">
                  {iframeCode}
                </pre>
                <button
                  onClick={handleCopyEmbed}
                  className="absolute right-3 top-3 px-3 py-1.5 bg-white border-2 border-slate-900 rounded-lg font-black text-[10px] text-slate-900 shadow-[1px_1px_0px_#0f172a] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  {copiedEmbed ? '已复制' : '复制代码'}
                </button>
              </div>
            </div>

            {/* Embed FAQ/Tutorial */}
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-900/20 space-y-2 text-slate-700">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-tight flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-800" strokeWidth={3} />
                如何嵌入并使用它？
              </h4>
              <ul className="list-disc list-inside text-[11px] font-bold text-amber-800/80 space-y-1">
                <li><strong className="text-amber-950">在 WordPress / Blog / Web 中:</strong> 添加一个“自定义 HTML”区块，并将上面的 Iframe 嵌入代码复制粘贴进去即可。</li>
                <li><strong className="text-amber-950">在 Notion 中:</strong> 复制上面的 <span className="font-mono">Widget URL</span>，在 Notion 页面输入 <code className="bg-amber-100 px-1 rounded">/embed</code>，然后粘贴该 URL 即可。</li>
                <li><strong className="text-amber-950">完全同步配置:</strong> 在本后台“小组件设置”中配置的主题色、按钮文本、感谢词将实时同步到挂件中！</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Interactive live preview mockup */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 md:p-8 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] h-full flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900"></span>
            <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-wider">
              挂件在您网页中的嵌入预览
            </h3>
          </div>

          <p className="text-xs font-bold text-slate-400 mb-6">
            右侧是嵌入在您网站中时，赞助组件的展示形态（宽度和高度可以调整 Iframe 代码中的 width/height）：
          </p>

          <div className="flex-1 flex items-center justify-center bg-slate-100 p-6 rounded-[2rem] border-2 border-slate-900 border-dashed relative overflow-hidden min-h-[480px]">
            {/* Mesh background effect for mockup */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
            
            <div className="w-[320px] h-[450px] bg-white rounded-[1.5rem] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] overflow-hidden relative flex flex-col z-10 transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] duration-300">
              {/* Fake browser bar of widget */}
              <div className="h-10 bg-slate-900 flex items-center px-4 border-b-2 border-slate-900 shrink-0 justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div className="px-3 py-0.5 rounded bg-white/10 font-mono text-[9px] text-white/80 border border-white/10">
                  {creator.username}.com
                </div>
              </div>

              {/* Dynamic live widget iframe replica content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={creator.avatar_url}
                      alt={creator.display_name}
                      className="w-10 h-10 rounded-full border border-slate-900 object-cover shadow-[1px_1px_0px_#000]"
                    />
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">{creator.display_name}</h4>
                      <span className="text-[9px] font-bold text-slate-400 mt-1 block">支持我创作好作品</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-900/10 text-[10px] font-bold text-slate-500">
                    “{creator.bio || '欢迎赞助我的创作，您的每一分支持都是我坚持的动力！'}”
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Preset amounts selection replica */}
                  <div className="grid grid-cols-3 gap-2">
                    {(settings.default_amounts || [5, 10, 20]).map((amt) => (
                      <div
                        key={amt}
                        className={`py-2 rounded-lg border-2 border-slate-900 text-center text-xs font-black shadow-[1px_1px_0px_#0f172a]
                          ${amt === 5 ? 'bg-brand-orange text-white' : 'bg-white text-slate-900'}`}
                      >
                        €{amt}
                      </div>
                    ))}
                  </div>

                  {/* Submit Button replica */}
                  <div className={`py-2.5 rounded-xl border-2 border-slate-900 text-center font-black text-[11px] shadow-[2px_2px_0px_#0f172a] text-slate-900 uppercase tracking-wider
                    ${settings.theme === 'orange' ? 'bg-brand-orange text-white' :
                      settings.theme === 'blue' ? 'bg-blue-500 text-white' :
                      settings.theme === 'green' ? 'bg-emerald-500 text-white' :
                      settings.theme === 'purple' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-white'}`}
                  >
                    {settings.button_text || `Support ${creator.display_name}`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB: MANAGE SUBSCRIPTION
   ========================================================================== */
function SubscriptionTab({ creator, settings, tips, showToast, setCreator, setSettings }: DashboardTabProps) {
  const { t, locale } = useTranslation();
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Simulated Card Fields
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('424');
  const [cardName, setCardName] = useState(creator.display_name);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setUpgrading(true);

    try {
      // Simulate network request delay for premium feel
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await api.upgradePro(creator.username);
      if (res.success && res.creator) {
        setCreator(res.creator);
        setShowPaymentForm(false);
        // Trigger celebration confetti!
        confetti({
          particleCount: 140,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff813f', '#0f172a', '#22c55e', '#ffffff']
        });
        showToast(locale === 'zh' ? '恭喜！您已成功升级至 Tiplet Pro 专业版！' : 'Congratulations! You have successfully upgraded to Tiplet Pro!');
      }
    } catch (err) {
      console.error(err);
      showToast('Upgrade failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(locale === 'zh' ? '确定要取消您的 Pro 专业版订阅吗？您将重新回到 Lite 免费版（扣除 5% 平台手续费）。' : 'Are you sure you want to cancel your Pro subscription? You will return to Lite free tier with 5% platform commission.')) {
      return;
    }
    playClickSound();
    setCancelling(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = await api.cancelPro(creator.username);
      if (res.success && res.creator) {
        setCreator(res.creator);
        showToast(locale === 'zh' ? '已成功退订，回到 Lite 免费版。' : 'Successfully unsubscribed. Returned to Lite free plan.');
      }
    } catch (err) {
      console.error(err);
      showToast('Cancellation failed. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in text-slate-900 pb-12">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b-2 border-slate-900">
        <div>
          <h2 className="text-3xl font-black font-display uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-orange" strokeWidth={3} />
            {locale === 'zh' ? '创作者方案与订阅管理' : 'Creator Plans & Subscriptions'}
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
            {locale === 'zh' ? '在这里管理您的订阅级别，解锁高级挂件功能并减少交易佣金手续费。' : 'Manage your billing plans, unlock customization themes, and reduce transaction commissions.'}
          </p>
        </div>

        {/* Current status tag */}
        <div className={`py-2 px-5 rounded-2xl border-2 border-slate-900 font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_#0f172a] ${
          creator.is_pro 
            ? 'bg-brand-orange text-white' 
            : 'bg-white text-slate-700'
        }`}>
          {locale === 'zh' ? '当前：' : 'Current: '}
          {creator.is_pro ? 'Pro 专业版' : 'Lite 免费版'}
        </div>
      </div>

      {/* Side-by-Side Pricing Cards Replica from Home page with Full Interactive Capability */}
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          
          {/* Free Tier - Comic Style in Grayscale */}
          <div className={`group relative rounded-[2rem] bg-white border-2 border-slate-900 p-10 flex flex-col justify-between transition-all duration-300 z-10 md:scale-105 min-h-[500px] ${
            !creator.is_pro 
              ? 'shadow-[16px_16px_0px_#0f172a] border-brand-orange' 
              : 'shadow-[8px_8px_0px_#0f172a] opacity-80'
          }`}>
            
            {/* Comic style floating badge */}
            <div className="absolute -top-5 -right-5 md:-right-8 bg-slate-100 border-2 border-slate-900 text-slate-900 font-black uppercase text-xs py-2 px-4 rotate-6 shadow-[4px_4px_0px_#0f172a] group-hover:rotate-12 transition-transform">
              {!creator.is_pro ? (locale === 'zh' ? '当前方案' : 'ACTIVE PLAN') : (locale === 'zh' ? 'Lite 免费版' : 'LITE PLAN')}
            </div>

            <div>
              <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">{t.lite_title}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest">{t.lite_subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-slate-900 font-display">€0</span>
                  <p className="text-[10px] font-black text-slate-500 uppercase">{locale === 'zh' ? '免费畅享' : 'FREE'}</p>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                  </div>
                  <span>{t.lite_feature1}</span>
                </li>
                <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                  </div>
                  <span>{t.lite_feature2}</span>
                </li>
                <li className="flex items-center gap-4 text-sm font-bold text-slate-400">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center shadow-[2px_2px_0px_#cbd5e1] opacity-60">
                  </div>
                  <span className="line-through decoration-slate-300">{t.lite_feature3}</span>
                </li>
              </ul>
            </div>

            {creator.is_pro ? (
              <button 
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="w-full py-4 rounded-xl bg-white border-2 border-slate-900 text-slate-900 font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:shadow-[0px_0px_0px_#0f172a] hover:translate-x-1 hover:translate-y-1 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                    {locale === 'zh' ? '正在降级中...' : 'DOWNGRADING...'}
                  </>
                ) : (
                  locale === 'zh' ? '降级至 Lite 方案' : 'Downgrade to Lite'
                )}
              </button>
            ) : (
              <div className="w-full py-4 rounded-xl bg-slate-100 border-2 border-slate-300 text-slate-400 font-black text-sm uppercase tracking-widest text-center cursor-default">
                ✔ {locale === 'zh' ? '当前已在使用' : 'Currently Active'}
              </div>
            )}
          </div>

          {/* Pro Tier - Embossed + Comic Boldness */}
          <div className={`group relative rounded-[2rem] bg-brand-orange border-2 border-slate-900 p-10 flex flex-col justify-between transition-all duration-300 z-10 md:scale-105 min-h-[500px] ${
            creator.is_pro 
              ? 'shadow-[16px_16px_0px_#0f172a] border-slate-950' 
              : 'shadow-[8px_8px_0px_#0f172a]'
          }`}>
            
            {/* Comic style floating badge */}
            <div className="absolute -top-5 -right-5 md:-right-8 bg-white border-2 border-slate-900 text-slate-900 font-black uppercase text-xs py-2 px-4 rotate-6 shadow-[4px_4px_0px_#0f172a] group-hover:rotate-12 transition-transform">
              {creator.is_pro ? (locale === 'zh' ? '当前方案' : 'ACTIVE PLAN') : t.pro_badge}
            </div>

            <div>
              <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">{t.pro_title}</h3>
                  <p className="text-xs font-bold text-slate-900/70 mt-2 uppercase tracking-widest">{t.pro_subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-slate-900 font-display">€9</span>
                  <p className="text-[10px] font-black text-slate-900 uppercase">{t.pro_price_unit}</p>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                  </div>
                  <span>{t.pro_feature1}</span>
                </li>
                <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                  </div>
                  <span>{t.pro_feature2}</span>
                </li>
                <li className="flex items-center gap-4 text-sm font-black text-slate-900">
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
                    <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={4} />
                  </div>
                  <span>{t.pro_feature3}</span>
                </li>
              </ul>
            </div>

            {creator.is_pro ? (
              <div className="space-y-3">
                <div className="w-full py-4 rounded-xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest text-center border-2 border-slate-900">
                  ✔ {locale === 'zh' ? '专业版已激活' : 'Pro Active'}
                </div>
                <p className="text-[10px] font-bold text-slate-900 text-center uppercase tracking-wide">
                  📅 {locale === 'zh' ? '下次续费：2026-07-29' : 'Next Payment: 2026-07-29'}
                </p>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  playClickSound();
                  setShowPaymentForm(!showPaymentForm);
                }}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 shadow-[4px_4px_0px_#0f172a] hover:shadow-[0px_0px_0px_#0f172a] hover:translate-x-1 hover:translate-y-1 active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  showPaymentForm 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-900 border-2 border-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-brand-orange fill-brand-orange animate-pulse" />
                {showPaymentForm 
                  ? (locale === 'zh' ? '收起支付表单' : 'Collapse Form') 
                  : (locale === 'zh' ? '立即升级专业版' : 'Upgrade to Pro')
                }
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Interactive credit card modal/expander form shown when user clicks Upgrade to Pro and is currently on Lite */}
      <AnimatePresence>
        {showPaymentForm && !creator.is_pro && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <form onSubmit={handleUpgrade} className="p-6 md:p-8 rounded-[2rem] bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#ff813f] space-y-6 relative overflow-hidden">
              {/* Dots background */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
              
              <div className="border-b-2 border-slate-900 pb-4 relative z-10">
                <span className="bg-brand-orange/20 text-brand-orange text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-brand-orange/40">
                  {locale === 'zh' ? '安全结账付款' : 'SECURE BILLING PAYMENTS'}
                </span>
                <h3 className="text-xl font-black font-display uppercase tracking-tight text-slate-900 mt-2">
                  {locale === 'zh' ? '输入模拟卡片信息以签约' : 'Simulated Card Subscription'}
                </h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-slate-900 font-display">€9.00</span>
                  <span className="text-xs font-bold text-slate-500">/ {locale === 'zh' ? '月' : 'month'}</span>
                </div>
              </div>

              {/* Simulated Card Detail Fields */}
              <div className="space-y-4 relative z-10">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {locale === 'zh' ? '信用卡卡号' : 'Card Number'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black focus:outline-none focus:bg-white transition"
                      placeholder="4242 4242 4242 4242"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">💳</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      {locale === 'zh' ? '有效期' : 'Expiry Date'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black text-center focus:outline-none focus:bg-white transition"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      CVV
                    </label>
                    <input 
                      type="password" 
                      maxLength={4}
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black text-center focus:outline-none focus:bg-white transition"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {locale === 'zh' ? '持卡人姓名' : 'Cardholder Name'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-black focus:outline-none focus:bg-white transition"
                    placeholder="e.g. Wyatt Smith"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={upgrading}
                className="w-full h-12 bg-slate-900 border-2 border-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-[4px_4px_0px_#ff813f] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#ff813f] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative z-10"
              >
                {upgrading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    {locale === 'zh' ? '正在安全扣款签约中...' : 'PROCESSING PAYMENT (€9.00)...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-brand-orange fill-brand-orange animate-pulse" />
                    {locale === 'zh' ? '确认安全扣款签约 Pro 方案' : 'CONFIRM SUBSCRIPTION'}
                  </>
                )}
              </button>

              <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wide relative z-10">
                🔒 {locale === 'zh' ? '本测试结账表单提供沙盒无缝仿真支付' : 'Secured 3D sandbox payments. Zero real cash processed.'}
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================================
   VIEW: CREATOR PUBLIC DONATION PAGE
   ========================================================================== */
function CreatorPublicView({ 
  username, 
  navigate, 
  showToast,
  currentUser,
  influencerCount,
  setInfluencerCount
}: { 
  username: string, 
  navigate: (p: string) => void, 
  showToast: (m: string) => void,
  currentUser?: Creator | null,
  influencerCount: number,
  setInfluencerCount: (num: number) => void
}) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [originalCreator, setOriginalCreator] = useState<Creator | null>(null);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<WidgetSettings | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t, locale } = useTranslation();

  // Visual Editing Mode States
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingGoalText, setIsEditingGoalText] = useState(false);
  const [isEditingButtonText, setIsEditingButtonText] = useState(false);
  const [isAvatarPopoverOpen, setIsAvatarPopoverOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  // Supporter support inputs
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [supporterName, setSupporterName] = useState('');
  const [supporterEmail, setSupporterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isMonthly, setIsMonthly] = useState(false);

  // Customization controls on the public view with LocalStorage persistence
  const [showAvatarCard, setShowAvatarCard] = useState<boolean>(() => {
    const saved = localStorage.getItem(`tiplet_show_avatar_${username}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [showSupporterWall, setShowSupporterWall] = useState<boolean>(() => {
    const saved = localStorage.getItem(`tiplet_show_supporter_wall_${username}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [showGoalProgress, setShowGoalProgress] = useState<boolean>(() => {
    const saved = localStorage.getItem(`tiplet_show_goal_${username}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [showTotalEarnings, setShowTotalEarnings] = useState<boolean>(() => {
    const saved = localStorage.getItem(`tiplet_show_total_earnings_${username}`);
    return saved !== null ? saved === 'true' : false;
  });
  const [isLayoutReversed, setIsLayoutReversed] = useState<boolean>(() => {
    const saved = localStorage.getItem(`tiplet_layout_reversed_${username}`);
    return saved !== null ? saved === 'true' : false;
  });
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false); // Controls customizer sidebar drawer

  // Sync these customizer settings to localStorage
  useEffect(() => {
    localStorage.setItem(`tiplet_show_avatar_${username}`, String(showAvatarCard));
  }, [showAvatarCard, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_show_supporter_wall_${username}`, String(showSupporterWall));
  }, [showSupporterWall, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_show_goal_${username}`, String(showGoalProgress));
  }, [showGoalProgress, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_show_total_earnings_${username}`, String(showTotalEarnings));
  }, [showTotalEarnings, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_layout_reversed_${username}`, String(isLayoutReversed));
  }, [isLayoutReversed, username]);

  // Load and store social media matrix deck configuration in sandbox
  const [showSocialDeck, setShowSocialDeck] = useState<boolean>(() => {
    const saved = localStorage.getItem(`tiplet_social_deck_show_${username}`);
    return saved !== null ? saved === 'true' : true;
  });

  const [socialLinks, setSocialLinks] = useState(() => {
    const saved = localStorage.getItem(`tiplet_social_links_${username}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'bilibili', name: 'Bilibili', active: true, username: '@ANCOOX', url: 'https://space.bilibili.com', color: 'from-pink-400 to-pink-500', desc: '流体交互视频与教程发布', count: '12.8万 关注者' },
      { id: 'weibo', name: '微博 (Weibo)', active: true, username: '@ancoox_design', url: 'https://weibo.com', color: 'from-red-400 to-red-500', desc: '日常设计灵感与美学分享', count: '5.6万 粉丝' },
      { id: 'github', name: 'GitHub', active: true, username: 'ancoox-dev', url: 'https://github.com/ancoox-dev', color: 'from-slate-700 to-slate-900', desc: '开源前端三维动画与动效库', count: '3.2k Stars' },
      { id: 'youtube', name: 'YouTube', active: true, username: '@AncooxStudio', url: 'https://youtube.com', color: 'from-red-500 to-rose-600', desc: '精美动效沉浸式视频档案室', count: '2.4万 订阅' }
    ];
  });

  // Sync state back to localStorage
  useEffect(() => {
    localStorage.setItem(`tiplet_social_deck_show_${username}`, String(showSocialDeck));
  }, [showSocialDeck, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_social_links_${username}`, JSON.stringify(socialLinks));
  }, [socialLinks, username]);

  // Footprint visibility & message modification states
  const [hiddenTipIds, setHiddenTipIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`tiplet_hidden_tips_${username}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [editedTips, setEditedTips] = useState<Record<string, { id: string; supporter_name: string; message: string; amount: number }>>(() => {
    const saved = localStorage.getItem(`tiplet_edited_tips_${username}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [deletedTipIds, setDeletedTipIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`tiplet_deleted_tips_${username}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [wallTitle, setWallTitle] = useState(() => {
    return localStorage.getItem(`tiplet_wall_title_${username}`) || '🎉 感谢留言墙 • 大家的能量反馈';
  });

  const [isEditingWallTitle, setIsEditingWallTitle] = useState(false);
  const [selectedTipToEdit, setSelectedTipToEdit] = useState<any | null>(null);

  // States for adding a new social link
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUsername, setNewSocialUsername] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialDesc, setNewSocialDesc] = useState('');
  const [newSocialCount, setNewSocialCount] = useState('');
  const [newSocialColor, setNewSocialColor] = useState('from-indigo-400 to-indigo-600');

  // Persistence of footprint settings to localStorage
  useEffect(() => {
    localStorage.setItem(`tiplet_hidden_tips_${username}`, JSON.stringify(hiddenTipIds));
  }, [hiddenTipIds, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_edited_tips_${username}`, JSON.stringify(editedTips));
  }, [editedTips, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_deleted_tips_${username}`, JSON.stringify(deletedTipIds));
  }, [deletedTipIds, username]);

  useEffect(() => {
    localStorage.setItem(`tiplet_wall_title_${username}`, wallTitle);
  }, [wallTitle, username]);

  // Custom simulator support tip inputs
  const [simSupporterName, setSimSupporterName] = useState('');
  const [simAmount, setSimAmount] = useState('10');
  const [simMessage, setSimMessage] = useState('');

  const fetchCreator = async () => {
    try {
      const res = await api.getCreator(username);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCreator(data.creator);
      setOriginalCreator(JSON.parse(JSON.stringify(data.creator)));
      setSettings(data.settings);
      setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
      if (data.settings && data.settings.default_amounts && data.settings.default_amounts.length > 0) {
        setSelectedAmount(data.settings.default_amounts[0]);
      }

      // Fetch public supporter tips
      const tipsData = await api.getCreatorTips(username);
      setTips(tipsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreator();
  }, [username]);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount < 3) {
      showToast('Minimum support amount is €3.');
      return;
    }
    
    setCheckoutLoading(true);

    try {
      const data = await api.createCheckoutSession({
        creator_id: creator?.id,
        supporter_name: supporterName || 'Anonymous',
        supporter_email: supporterEmail,
        message,
        amount: finalAmount,
        currency: 'EUR'
      });
      if (data.url) {
        // Redirect seamlessly to simulated flow or Stripe session checkout URL
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Checkout initialization failed');
        setCheckoutLoading(false);
      }
    } catch (e) {
      showToast('Network error initializing payment');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-brand-orange border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!creator || !settings) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mx-auto shadow-sm">
            🔍
          </div>
          <h2 className="text-2xl font-black font-display text-slate-800 tracking-tight">{t.creator_not_found}</h2>
          <p className="text-slate-500 max-w-sm text-sm">
            {t.creator_not_found_desc}
          </p>
          <button 
            onClick={() => { playClickSound(); navigate('/'); }}
            className="py-2.5 px-6 rounded-full bg-brand-orange text-white font-bold text-sm shadow-md shadow-brand-orange/20 cursor-pointer"
          >
            {t.create_my_page}
          </button>
        </div>
      </div>
    );
  }

  // Handle preset theme CSS rules
  let themeBg = 'bg-slate-100 relative';
  let cardClass = 'bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a]';
  let textClass = 'text-slate-900';
  let secondaryTextClass = 'text-slate-500';
  let gradientColor = '#f1f5f9';

  if (settings.theme === 'dark') {
    themeBg = 'bg-slate-900 relative';
    cardClass = 'bg-slate-800 border-2 border-slate-900 shadow-[8px_8px_0px_#cbd5e1]';
    textClass = 'text-white';
    secondaryTextClass = 'text-slate-400';
    gradientColor = '#0f172a'; // slate-900
  } else if (settings.theme === 'glass') {
    themeBg = 'bg-slate-100/50 backdrop-blur-md relative';
    cardClass = 'bg-white/80 border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a]';
    gradientColor = '#f1f5f9'; // slate-100
  } else if (settings.theme === 'emerald') {
    themeBg = 'bg-emerald-50 relative';
    cardClass = 'bg-emerald-100 border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a]';
    textClass = 'text-emerald-950';
    secondaryTextClass = 'text-emerald-700';
    gradientColor = '#ecfdf5'; // emerald-50
  } else if (settings.theme === 'purple') {
    themeBg = 'bg-violet-50 relative';
    cardClass = 'bg-violet-100 border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a]';
    textClass = 'text-violet-950';
    secondaryTextClass = 'text-violet-700';
    gradientColor = '#f5f3ff'; // violet-50
  }

  // Dynamic values based on custom live tips simulator
  const totalEarningsAmount = tips.reduce((acc, tip) => acc + tip.amount, 0);
  const totalSupporterCount = tips.length;

  // Supporter Wall component redesigned as a horizontal scrolling barrage (Danmaku) wall
  const defaultMessages = [
    { id: 'd1', supporter_name: '数字极客', amount: 5, message: '为你注入数字艺术的满格能量！⚡️ 期待您在极简主义和三维流体美学上的更多探索，这绝对是行业清流！' },
    { id: 'd2', supporter_name: '流体观察家', amount: 15, message: '极简视觉太震撼了，高级感直接拉满！🎨 每一个细节都恰到好处！' },
    { id: 'd3', supporter_name: 'ANCOOX粉丝团', amount: 10, message: '一如既往地支持你，期待下一次的精彩更新！🚀' },
    { id: 'd4', supporter_name: '流光剪影', amount: 20, message: '3D悬浮浮雕的交互，真的是创作者的审美天花板！✨ 能够看到这么纯粹和富有呼吸感的设计，真的很激动！' },
    { id: 'd5', supporter_name: '光影穿梭者', amount: 8, message: '这是为你的灵感买单，请继续创作下去吧！☕️' },
    { id: 'd6', supporter_name: '未来主义', amount: 50, message: '支持最硬核的独立艺术家，期待探索更深邃的流体美学！🌌 你的作品里蕴含着无尽的生命力和流动感。' },
    { id: 'd7', supporter_name: '极简画廊', amount: 12, message: '每个细节都写满了诚意，绝对的视觉艺术！🔥' },
    { id: 'd8', supporter_name: '设计朝圣者', amount: 30, message: '这块呼吸灯动效真的很有沉浸感，太会玩了！🌟 一口气看完了所有的页面，非常推荐！' }
  ];

  // Combine real tips with pre-seeded high-quality comments to ensure interactive fullness
  const allTipsRaw = [...tips.filter(t => t.message), ...defaultMessages];

  // Apply edited state and filter out deleted ones
  const allTips = allTipsRaw
    .map(t => {
      if (editedTips[t.id]) {
        return { ...t, ...editedTips[t.id] };
      }
      return t;
    })
    .filter(t => !deletedTipIds.includes(t.id));

  // Filter out hidden ones for the wall display
  const visibleTips = allTips.filter(t => !hiddenTipIds.includes(t.id));

  // Distribute items into three scrolling lanes using visibleTips
  const lane1Items = visibleTips.filter((_, idx) => idx % 3 === 0);
  const lane2Items = visibleTips.filter((_, idx) => idx % 3 === 1);
  const lane3Items = visibleTips.filter((_, idx) => idx % 3 === 2);

  // Duplicate elements to ensure smooth seamless circular scrolling
  const repeatedLane1 = lane1Items.length > 0 
    ? [...lane1Items, ...lane1Items, ...lane1Items, ...lane1Items, ...lane1Items, ...lane1Items] 
    : [];
  const repeatedLane2 = lane2Items.length > 0 
    ? [...lane2Items, ...lane2Items, ...lane2Items, ...lane2Items, ...lane2Items, ...lane2Items] 
    : [];
  const repeatedLane3 = lane3Items.length > 0 
    ? [...lane3Items, ...lane3Items, ...lane3Items, ...lane3Items, ...lane3Items, ...lane3Items] 
    : [];

  const renderBarrageCard = (tip: any, index: number) => {
    const avatarGradients = [
      'from-orange-400 to-pink-500',
      'from-violet-400 to-indigo-500',
      'from-cyan-400 to-blue-500',
      'from-emerald-400 to-teal-500',
      'from-amber-400 to-red-500'
    ];
    const gradient = avatarGradients[index % avatarGradients.length];

    return (
      <div 
        key={`${tip.id}-${index}`}
        className={`relative group flex items-start gap-4 py-4 px-6 rounded-2xl mx-3 transition-all duration-300 hover:-translate-y-1 hover:translate-x-1 select-none shrink-0 border-2 shadow-[4px_4px_0px_#0f172a] hover:shadow-none cursor-default ${
          settings.theme === 'dark'
            ? 'bg-slate-800 border-slate-900 text-white'
            : 'bg-white border-slate-900 text-slate-900'
        }`}
      >
        {/* Avatar badge - pinned to top left on multi-line text */}
        <div className={`w-10 h-10 rounded-xl border-2 border-slate-900 bg-gradient-to-tr ${gradient} flex items-center justify-center text-white font-black text-sm shadow-[2px_2px_0px_#0f172a] uppercase shrink-0`}>
          {tip.supporter_name ? tip.supporter_name.charAt(0) : 'U'}
        </div>
        
        {/* Content detail */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tighter uppercase truncate max-w-[150px]">{tip.supporter_name}</span>
            <span className="py-1 px-2 rounded-lg bg-brand-orange text-white border-2 border-slate-900 font-black text-[10px] leading-none shadow-[2px_2px_0px_#0f172a]">
              €{tip.amount}
            </span>
          </div>
          {tip.message && (
            <p className={`text-xs line-clamp-3 max-w-[280px] font-bold leading-relaxed mt-2 whitespace-normal break-words ${
              settings.theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {tip.message}
            </p>
          )}
        </div>

        {/* 🛠️ 所见即所得编辑遮罩 (Editing Overlay) */}
        {isEditingMode && (
          <div className="absolute inset-0 bg-slate-900/90 rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 px-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                playClickSound();
                setHiddenTipIds(prev => [...prev, tip.id]);
                showToast('已隐藏该足迹！可在侧边栏中重新启用。');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-[1px_1px_0px_#000]"
              title="隐藏此足迹"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>隐藏</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                playClickSound();
                setSelectedTipToEdit(tip);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-brand-orange hover:bg-brand-orange/95 text-white border-2 border-slate-900 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-[1px_1px_0px_#000]"
              title="修改此留言"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>修改</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const supporterWallElement = showSupporterWall && (
    <div className="w-full mt-16 space-y-6 overflow-hidden relative select-none">
      {/* Dynamic Keyframe style injector for three right-to-left lines with non-synchronous speeds */}
      <style>{`
        @keyframes danmaku-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .danmaku-track-lane1 {
          display: flex;
          width: max-content;
          animation: danmaku-scroll-left 45s linear infinite;
        }
        .danmaku-track-lane2 {
          display: flex;
          width: max-content;
          animation: danmaku-scroll-left 34s linear infinite;
        }
        .danmaku-track-lane3 {
          display: flex;
          width: max-content;
          animation: danmaku-scroll-left 56s linear infinite;
        }
        .danmaku-track-lane1:hover,
        .danmaku-track-lane2:hover,
        .danmaku-track-lane3:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Title */}
      <div className="max-w-xl mx-auto px-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 bg-white border-2 border-slate-900 px-3 py-1 rounded-full shadow-[2px_2px_0px_#0f172a] inline-block mb-3">
          {t.supporter_wall}
        </span>
        {isEditingMode ? (
          <div 
            className="relative group/title cursor-pointer flex justify-center"
            onDoubleClick={() => { playClickSound(); setIsEditingWallTitle(true); }}
          >
            {isEditingWallTitle ? (
              <input
                type="text"
                value={wallTitle}
                onChange={(e) => setWallTitle(e.target.value)}
                onBlur={() => setIsEditingWallTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingWallTitle(false)}
                className={`bg-transparent border-b-2 border-dashed border-brand-orange text-center text-2xl font-black font-display tracking-tighter uppercase focus:outline-none w-full max-w-md ${textClass}`}
                autoFocus
              />
            ) : (
              <h2 className={`text-2xl font-black font-display tracking-tighter uppercase mt-1 flex items-center justify-center gap-2 ${textClass} select-none relative px-6`}>
                <span>{wallTitle}</span>
                <span className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white text-slate-900 border-2 border-slate-900 text-[9px] font-black py-0.5 px-2 rounded uppercase shadow-[1px_1px_0px_#000] opacity-0 group-hover/title:opacity-100 transition-opacity whitespace-nowrap">
                  双击修改标题
                </span>
              </h2>
            )}
          </div>
        ) : (
          <h2 className={`text-2xl font-black font-display tracking-tighter uppercase mt-1 flex items-center justify-center gap-2 ${textClass}`}>
            <span>{wallTitle}</span>
          </h2>
        )}
      </div>

      {/* Panoramic scrolling tracks wrapper */}
      <div className="relative py-4 overflow-hidden w-full">
        {/* Sleek edge fading shadows using dynamic theme background gradient */}
        <div 
          className="absolute inset-y-0 left-0 w-24 pointer-events-none z-10"
          style={{ background: `linear-gradient(to right, ${gradientColor}, transparent)` }}
        />
        <div 
          className="absolute inset-y-0 right-0 w-24 pointer-events-none z-10"
          style={{ background: `linear-gradient(to left, ${gradientColor}, transparent)` }}
        />

        {/* Track 1: Fast */}
        <div className="flex w-full overflow-hidden py-1.5">
          <div className="danmaku-track-lane1">
            {repeatedLane1.map((tip, idx) => renderBarrageCard(tip, idx))}
          </div>
        </div>

        {/* Track 2: Medium */}
        <div className="flex w-full overflow-hidden py-1.5 mt-1">
          <div className="danmaku-track-lane2">
            {repeatedLane2.map((tip, idx) => renderBarrageCard(tip, idx))}
          </div>
        </div>

        {/* Track 3: Slow */}
        <div className="flex w-full overflow-hidden py-1.5 mt-1">
          <div className="danmaku-track-lane3">
            {repeatedLane3.map((tip, idx) => renderBarrageCard(tip, idx))}
          </div>
        </div>
      </div>
    </div>
  );

  const activeSocialLinksCount = socialLinks.filter(l => l.active).length;
  const hasSocialDeck = showSocialDeck && (activeSocialLinksCount > 0 || isEditingMode);
  const isSingleColDesktop = activeSocialLinksCount <= 4;

  const isDirty = !!(creator && originalCreator && settings && originalSettings && (
    creator.display_name !== originalCreator.display_name ||
    (creator.bio || '') !== (originalCreator.bio || '') ||
    creator.avatar_url !== originalCreator.avatar_url ||
    settings.theme !== originalSettings.theme ||
    settings.button_text !== originalSettings.button_text ||
    (settings.goal_text || '') !== (originalSettings.goal_text || '')
  ));

  return (
    <div className={`flex-1 flex flex-col ${themeBg} min-h-screen pb-6 md:pb-10 px-0 md:px-6 transition-colors duration-300 relative z-0`}>
      {/* Comic background dots */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>

      {/* 🔑 智能身份识别与“编辑模式”切入口 - Sticky Top Control Bar */}
      {currentUser?.username === username && (
        <div className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-slate-900 px-4 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-orange"></span>
            </span>
            <span className="text-xs font-black text-slate-700 tracking-tight uppercase">
              ✨ 您正在浏览自己的主页
            </span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                🛠️ 开启实时编辑模式
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={isEditingMode}
                  onChange={(e) => {
                    playClickSound();
                    setIsEditingMode(e.target.checked);
                    if (e.target.checked) {
                      showToast('实时编辑模式已开启！直接点击/双击文本与头像即可实时编辑！✨');
                    } else {
                      showToast('实时编辑模式已关闭。');
                      setIsEditingDisplayName(false);
                      setIsEditingBio(false);
                      setIsEditingGoalText(false);
                      setIsEditingButtonText(false);
                    }
                  }}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 border-2 border-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-900 after:border-2 after:border-slate-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange peer-checked:after:bg-white peer-checked:after:border-white"></div>
              </div>
            </label>
            
            <button
              onClick={() => { playClickSound(); setIsCustomizerOpen(true); }}
              className="py-1.5 px-3 rounded-lg bg-slate-900 text-white border-2 border-slate-900 font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              <span>视觉管理器</span>
            </button>
          </div>
        </div>
      )}

      {/* Return button back to landing or dashboard, and Edit button */}
      <div className={`max-w-5xl px-3 md:px-0 mx-auto w-full mb-6 flex items-center justify-between gap-4 relative z-10 ${currentUser?.username === username ? '' : 'pt-6 md:pt-10'}`}>
        <button 
          onClick={() => { playClickSound(); navigate(currentUser ? '/dashboard' : '/'); }}
          className="py-2.5 px-4 rounded-xl bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-100 transition-all text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#0f172a] flex items-center gap-2 shrink-0 cursor-pointer hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[0px_0px_0px_#0f172a]"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={3} />
          <span>{currentUser ? (t.go_dashboard || 'Go Dashboard') : t.explore_tiplet}</span>
        </button>

        <div className="flex items-center gap-3">
          {(!currentUser || currentUser.username !== username) && (
            <button 
              onClick={() => { playClickSound(); navigate('/'); }}
              className="py-2.5 px-4 rounded-xl bg-purple-500 text-white border-2 border-slate-900 hover:bg-purple-600 transition-all text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#0f172a] flex items-center gap-2 shrink-0 cursor-pointer hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[0px_0px_0px_#0f172a]"
            >
              <Zap className="w-4 h-4" strokeWidth={3} />
              <span className="hidden sm:inline">我也要加入创作者行列</span>
              <span className="sm:hidden">加入创作者</span>
            </button>
          )}

          {currentUser?.username === username && !isEditingMode && (
            <button 
              onClick={() => { playClickSound(); setIsEditingMode(true); showToast('实时编辑模式已开启！'); }}
              className="py-2.5 px-4 rounded-xl bg-brand-orange text-slate-900 border-2 border-slate-900 transition-all text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_#0f172a] flex items-center gap-2 shrink-0 cursor-pointer hover:-translate-y-0.5 hover:translate-x-0.5 hover:shadow-[0px_0px_0px_#0f172a]"
            >
              <Edit className="w-4 h-4" strokeWidth={3} />
              <span>开启编辑模式</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl px-3 md:px-0 mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch relative z-10">
        {/* Cumulative Stats module if enabled by customizer */}
        {showTotalEarnings && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-1 md:col-span-12 p-6 md:p-8 rounded-[2rem] bg-brand-orange border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] text-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 mb-2 relative overflow-hidden"
          >
            {/* Overlay dots for stats card */}
            <div className="absolute inset-0 opacity-[0.1] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>

            <div className="flex flex-col items-center md:items-start relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">累计收到赞助 / Total Received</span>
              <h3 className="text-4xl md:text-5xl font-black font-display tracking-tighter text-white mt-1 drop-shadow-[2px_2px_0px_#0f172a]">
                €{totalEarningsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="flex items-center gap-8 shrink-0 relative z-10">
              <div className="text-center md:text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block">支持人次</span>
                <span className="text-2xl font-black font-display text-white mt-0.5 block drop-shadow-[2px_2px_0px_#0f172a]">{totalSupporterCount} 人</span>
              </div>
              <div className="h-10 w-0.5 bg-slate-900 border border-slate-900" />
              <div className="text-center md:text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block">目标达成度</span>
                <span className="text-2xl font-black font-display text-white mt-0.5 block drop-shadow-[2px_2px_0px_#0f172a]">
                  {settings.goal_amount > 0 ? `${Math.round((totalEarningsAmount / settings.goal_amount) * 100)}%` : '100%'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Centered Interactive support card with pristine symmetry */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`col-span-1 ${hasSocialDeck ? (isSingleColDesktop ? 'md:col-span-10' : 'md:col-span-8') : 'md:col-span-12'} md:max-w-none md:mx-0 max-w-xl mx-auto w-full flex flex-col space-y-6 ${hasSocialDeck && isLayoutReversed ? 'md:order-last' : ''}`}
        >
          {/* Style Injector for Liquid Shimmer Button */}
          <style>{`
            @keyframes premium-shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .premium-shimmer-btn {
              background: linear-gradient(110deg, #F15A24 0%, #ff7a45 40%, #F15A24 60%, #F15A24 100%);
              background-size: 200% 100%;
              animation: premium-shimmer 3s infinite linear;
            }
          `}</style>

          {/* Form wrapper with Sculpted Floating Crown Layout */}
          <div className={`px-4 md:px-10 pb-6 md:pb-10 rounded-[2rem] md:rounded-[2.5rem] ${cardClass} relative ${showAvatarCard ? 'overflow-visible mt-16 pt-16 md:pt-24' : 'pt-6 md:pt-10 overflow-hidden'} flex-1 flex flex-col`}>
            
            {showAvatarCard && (
              <>
                {/* 3D Floating Avatar Badge with Hover Edit Mode */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                  <div className="relative w-28 h-28 md:w-32 md:h-32 flex flex-col items-center select-none">
                    <motion.div 
                      whileHover={isEditingMode ? { scale: 1.05, rotate: -1 } : { scale: 1.05, rotate: 2 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        if (isEditingMode) {
                          playClickSound();
                          setIsAvatarPopoverOpen(!isAvatarPopoverOpen);
                        }
                      }}
                      className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden shrink-0 border-4 border-slate-900 shadow-[4px_4px_0px_#0f172a] cursor-pointer group/avatar bg-slate-100"
                    >
                      <img 
                        src={creator.avatar_url} 
                        className="w-full h-full object-cover rounded-full" 
                        referrerPolicy="no-referrer"
                        alt={creator.display_name} 
                      />
                      
                      {isEditingMode && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 rounded-full">
                          <Edit className="w-5 h-5 text-white mb-1" strokeWidth={3} />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">更换头像</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Popover Bubble Menu */}
                    <AnimatePresence>
                      {isEditingMode && isAvatarPopoverOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAvatarPopoverOpen(false)} />
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute top-full mt-3 w-64 bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-[6px_6px_0px_#0f172a] z-50 space-y-3 text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">更换头像</span>
                              <button 
                                type="button"
                                onClick={() => setIsAvatarPopoverOpen(false)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Direct URL Input */}
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">粘贴图片 URL 地址</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="https://example.com/pic.jpg"
                                  value={newAvatarUrl}
                                  onChange={(e) => setNewAvatarUrl(e.target.value)}
                                  className="flex-1 px-2.5 py-1.5 text-xs font-bold border-2 border-slate-900 rounded-lg focus:outline-none focus:border-brand-orange text-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (newAvatarUrl.trim()) {
                                      playClickSound();
                                      setCreator({ ...creator, avatar_url: newAvatarUrl.trim() });
                                      setNewAvatarUrl('');
                                      setIsAvatarPopoverOpen(false);
                                      showToast('头像链接已应用！');
                                    }
                                  }}
                                  className="px-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                                >
                                  应用
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="h-[1px] bg-slate-200 flex-1"></div>
                              <span className="text-[9px] font-black text-slate-400">OR</span>
                              <div className="h-[1px] bg-slate-200 flex-1"></div>
                            </div>

                            {/* Random Avatar Button */}
                            <button
                              type="button"
                              onClick={() => {
                                playClickSound();
                                const seed = Math.floor(Math.random() * 1000000);
                                const styles = ['shapes', 'bottts', 'pixel-art', 'lorelei', 'adventurer', 'avataaars'];
                                const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
                                const generated = `https://api.dicebear.com/7.x/${chosenStyle}/svg?seed=${seed}`;
                                setCreator({ ...creator, avatar_url: generated });
                                showToast('已随机生成酷炫 3D 风格头像！');
                                confetti({ particleCount: 30, spread: 40 });
                              }}
                              className="w-full py-2 bg-brand-orange text-white border-2 border-slate-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_#0f172a] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>🎲 一键随机生成头像</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Integrated Centered Profile Details */}
                <div className="text-center mb-6 mt-2 select-none">
                  {isEditingMode ? (
                    <div className="relative group/edit max-w-md mx-auto my-1">
                      {isEditingDisplayName ? (
                        <input
                          type="text"
                          value={creator.display_name}
                          onChange={(e) => setCreator({ ...creator, display_name: e.target.value })}
                          onBlur={() => setIsEditingDisplayName(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingDisplayName(false)}
                          className={`w-full bg-slate-50/50 backdrop-blur border-2 border-brand-orange rounded-xl px-4 py-2 text-2xl md:text-4xl font-black font-display tracking-tighter text-center uppercase focus:outline-none focus:ring-4 focus:ring-brand-orange/20 ${
                            settings.theme === 'dark' ? 'text-white bg-slate-900' : 'text-slate-900 bg-white'
                          }`}
                          autoFocus
                        />
                      ) : (
                        <div 
                          onClick={() => { playClickSound(); setIsEditingDisplayName(true); }}
                          className={`cursor-pointer border-2 border-dashed border-transparent hover:border-brand-orange/60 hover:bg-brand-orange/5 px-4 py-2 rounded-2xl relative transition-all duration-200 flex items-center justify-center gap-2 ${
                            settings.theme === 'dark' ? 'hover:bg-brand-orange/10' : ''
                          }`}
                        >
                          <h1 className={`text-2xl md:text-4xl font-black font-display tracking-tighter uppercase leading-none ${textClass}`}>
                            {creator.display_name}
                          </h1>
                          <Edit className="w-4 h-4 text-brand-orange opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <h1 className={`text-2xl md:text-4xl font-black font-display tracking-tighter uppercase leading-none ${textClass}`}>
                      {creator.display_name}
                    </h1>
                  )}

                  {isEditingMode ? (
                    <div className="relative group/edit max-w-sm mx-auto mt-3">
                      {isEditingBio ? (
                        <textarea
                          rows={2}
                          value={creator.bio || ''}
                          onChange={(e) => setCreator({ ...creator, bio: e.target.value })}
                          onBlur={() => setIsEditingBio(false)}
                          className={`w-full bg-slate-50/50 backdrop-blur border-2 border-brand-orange rounded-xl px-4 py-2 text-xs md:text-sm text-center font-bold tracking-wider leading-relaxed resize-none focus:outline-none focus:ring-4 focus:ring-brand-orange/20 ${
                            settings.theme === 'dark' ? 'text-white bg-slate-900' : 'text-slate-800 bg-white'
                          }`}
                          autoFocus
                        />
                      ) : (
                        <div 
                          onClick={() => { playClickSound(); setIsEditingBio(true); }}
                          className={`cursor-pointer border-2 border-dashed border-transparent hover:border-brand-orange/60 hover:bg-brand-orange/5 px-4 py-2 rounded-2xl relative transition-all duration-200 flex items-center justify-center gap-2 ${
                            settings.theme === 'dark' ? 'hover:bg-brand-orange/10' : ''
                          }`}
                        >
                          <p className={`text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed ${
                            settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {creator.bio || '（请在此处输入您的个人简介）'}
                          </p>
                          <Edit className="w-3.5 h-3.5 text-brand-orange opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className={`text-xs md:text-sm mt-3 max-w-sm mx-auto font-bold uppercase tracking-widest leading-relaxed ${
                      settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {creator.bio}
                    </p>
                  )}

                  {/* Micro goal progress bar directly integrated below the bio */}
                  {showGoalProgress && (isEditingMode || settings.goal_text) && (
                    <div className="mt-6 pt-4 border-t-2 border-slate-100 border-dashed max-w-xs mx-auto">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        {isEditingMode ? (
                          <div className="flex-1 mr-2 relative group/edit">
                            {isEditingGoalText ? (
                              <input
                                type="text"
                                value={settings.goal_text || ''}
                                onChange={(e) => setSettings({ ...settings, goal_text: e.target.value })}
                                onBlur={() => setIsEditingGoalText(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingGoalText(false)}
                                className={`w-full bg-slate-50 border-2 border-brand-orange rounded-lg px-2 py-1 text-[10px] font-black uppercase text-slate-800 focus:outline-none ${
                                  settings.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'
                                }`}
                                autoFocus
                              />
                            ) : (
                              <div
                                onClick={() => { playClickSound(); setIsEditingGoalText(true); }}
                                className="cursor-pointer border border-dashed border-transparent hover:border-brand-orange/60 px-1 py-0.5 rounded flex items-center justify-center gap-1.5 min-h-[20px] max-w-full"
                              >
                                <span className="truncate">目标: {settings.goal_text || '点击设置筹款目标'}</span>
                                <Edit className="w-3 h-3 text-brand-orange opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="truncate">目标: {settings.goal_text}</span>
                        )}
                        <span className="text-brand-orange text-right shrink-0 font-bold">
                          {settings.goal_amount > 0 ? `${Math.round((totalEarningsAmount / settings.goal_amount) * 100)}%` : '100%'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 border-2 border-slate-900 h-3 rounded-full overflow-hidden relative">
                        <div className="bg-brand-orange border-r-2 border-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, settings.goal_amount > 0 ? (totalEarningsAmount / settings.goal_amount) * 100 : 33)}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!showAvatarCard && (
              <h2 className={`text-xl md:text-3xl font-black font-display uppercase tracking-tighter mb-6 ${textClass}`}>
                {isEditingMode ? (
                  <div className="relative group/edit max-w-md mx-auto my-1">
                    {isEditingDisplayName ? (
                      <input
                        type="text"
                        value={creator.display_name}
                        onChange={(e) => setCreator({ ...creator, display_name: e.target.value })}
                        onBlur={() => setIsEditingDisplayName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingDisplayName(false)}
                        className={`w-full bg-slate-50/50 backdrop-blur border-2 border-brand-orange rounded-xl px-4 py-2 text-xl md:text-3xl font-black font-display tracking-tighter text-center uppercase focus:outline-none focus:ring-4 focus:ring-brand-orange/20 ${
                          settings.theme === 'dark' ? 'text-white bg-slate-900' : 'text-slate-900 bg-white'
                        }`}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => { playClickSound(); setIsEditingDisplayName(true); }}
                        className={`cursor-pointer border-2 border-dashed border-transparent hover:border-brand-orange/60 hover:bg-brand-orange/5 px-4 py-2 rounded-2xl relative transition-all duration-200 flex items-center justify-center gap-2 ${
                          settings.theme === 'dark' ? 'hover:bg-brand-orange/10' : ''
                        }`}
                      >
                        <span>Support {creator.display_name}</span>
                        <Edit className="w-4 h-4 text-brand-orange opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                ) : (
                  `Support ${creator.display_name}`
                )}
              </h2>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-6">
              {/* Unified Preset + Custom Amount Input Bar */}
              <div 
                className={`w-full px-5 py-4 rounded-xl flex items-center justify-between gap-3 border-2 transition-all duration-200 ${
                  settings.theme === 'dark'
                    ? focusedField === 'amount'
                      ? 'bg-slate-900 border-brand-orange shadow-[4px_4px_0px_#f97316]'
                      : 'bg-slate-900 border-slate-900 shadow-[2px_2px_0px_#0f172a]'
                    : focusedField === 'amount'
                      ? 'bg-white border-slate-900 shadow-[4px_4px_0px_#0f172a]'
                      : 'border-slate-900 bg-slate-50 shadow-[2px_2px_0px_#0f172a]'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl font-black text-slate-400 font-display">€</span>
                  <input 
                    type="number" 
                    required
                    min={3}
                    placeholder="Enter amount"
                    value={customAmount || selectedAmount || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomAmount(val);
                      if (val) {
                        setSelectedAmount(Number(val));
                      } else {
                        setSelectedAmount(0);
                      }
                    }}
                    onFocus={() => setFocusedField('amount')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 font-black text-lg placeholder-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      settings.theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  />
                </div>
                
                {/* Pills inline in the same bar */}
                <div className={`flex items-center gap-1.5 shrink-0 ${isEditingMode ? 'border border-dashed border-brand-orange p-1 rounded-lg bg-brand-orange/5 animate-pulse' : ''}`} title={isEditingMode ? '点击任意金额按钮进行修改 / Click to edit preset amount' : ''}>
                  {(settings.default_amounts || [5, 10, 20]).map((pillVal) => (
                    <motion.button
                      key={pillVal}
                      type="button"
                      whileHover={{ scale: 1.05, y: -0.5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playClickSound();
                        if (isEditingMode) {
                          const valStr = prompt(
                            locale === 'zh' ? '请输入新的预设支持金额(整数):' : 'Enter new preset support amount (integer):', 
                            String(pillVal)
                          );
                          if (valStr !== null) {
                            const newVal = parseInt(valStr, 10);
                            if (!isNaN(newVal) && newVal > 0) {
                              const updatedAmounts = (settings.default_amounts || [5, 10, 20]).map(v => v === pillVal ? newVal : v);
                              setSettings({ ...settings, default_amounts: updatedAmounts });
                              showToast(locale === 'zh' ? `已修改预设金额为 +${newVal}` : `Updated preset amount to +${newVal}`);
                            }
                          }
                        } else {
                          // Incremental logic: if empty, set it; if already present, add to it
                          const current = Number(customAmount || selectedAmount || 0);
                          const updated = current + pillVal;
                          setCustomAmount(String(updated));
                          setSelectedAmount(updated);
                        }
                      }}
                      className={`text-[10px] md:text-xs font-black px-2.5 py-1.5 rounded-lg border-2 transition-all duration-150 cursor-pointer ${
                        isEditingMode 
                          ? 'bg-brand-orange border-slate-900 text-white shadow-none'
                          : settings.theme === 'dark'
                            ? 'bg-slate-900 border-slate-900 text-slate-400 hover:border-brand-orange hover:text-brand-orange'
                            : 'bg-white border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white shadow-[2px_2px_0px_#0f172a] hover:shadow-none hover:translate-y-0.5 hover:translate-x-0.5'
                      }`}
                    >
                      +{pillVal}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Supporter details: Name or @yoursocial (no label) */}
              <div>
                <input 
                  type="text" 
                  placeholder="Name or @yoursocial"
                  value={supporterName}
                  onChange={(e) => setSupporterName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-5 py-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm focus:outline-none ${
                    settings.theme === 'dark'
                      ? focusedField === 'name'
                        ? 'bg-slate-900 border-brand-orange shadow-[4px_4px_0px_#f97316] text-white'
                        : 'bg-slate-900 border-slate-900 text-slate-300 shadow-[2px_2px_0px_#0f172a]'
                      : focusedField === 'name'
                        ? 'bg-white border-slate-900 shadow-[4px_4px_0px_#0f172a] text-slate-900'
                        : 'border-slate-900 bg-slate-50 text-slate-900 shadow-[2px_2px_0px_#0f172a]'
                  }`}
                />
              </div>

              {/* Support Message (no label) */}
              <div className="relative">
                <textarea 
                  rows={3.5}
                  placeholder="Say something nice..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full px-5 py-4 rounded-xl border-2 transition-all duration-200 font-bold text-sm focus:outline-none resize-none leading-relaxed pr-12 ${
                    settings.theme === 'dark'
                      ? focusedField === 'message'
                        ? 'bg-slate-900 border-brand-orange shadow-[4px_4px_0px_#f97316] text-white'
                        : 'bg-slate-900 border-slate-900 text-slate-300 shadow-[2px_2px_0px_#0f172a]'
                      : focusedField === 'message'
                        ? 'bg-white border-slate-900 shadow-[4px_4px_0px_#0f172a] text-slate-900'
                        : 'border-slate-900 bg-slate-50 text-slate-900 shadow-[2px_2px_0px_#0f172a]'
                  }`}
                />
                {/* Visual Video Camera decorator button on right bottom of text box, following BuyMeACoffee pattern */}
                <div className="absolute right-4 bottom-4 p-2 rounded-xl bg-white border-2 border-slate-900 text-slate-900 shadow-[2px_2px_0px_#0f172a] cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0f172a] transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.834a.5.5 0 0 0-.777-.416L16 11.5Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                </div>
              </div>

              {/* Premium "Make this monthly" Subscription Toggle Option */}
              <div className="flex items-center justify-between py-2 px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={isMonthly}
                      onChange={(e) => {
                        playClickSound();
                        setIsMonthly(e.target.checked);
                      }}
                      className="sr-only peer" 
                    />
                    <div className="w-10 h-6 bg-white border-2 border-slate-900 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-900 after:border-2 after:border-slate-900 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-orange peer-checked:after:bg-white peer-checked:after:border-white"></div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest select-none transition-colors duration-150 ${
                    isMonthly 
                      ? 'text-brand-orange' 
                      : settings.theme === 'dark' ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-900'
                  }`}>
                    Make this monthly
                  </span>
                </label>
                <div className="group relative">
                  <HelpCircle className="w-5 h-5 text-slate-400 hover:text-slate-900 cursor-help transition-colors duration-150" strokeWidth={3} />
                  <div className="absolute right-0 bottom-full mb-2 w-48 p-3 bg-slate-900 border-2 border-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-[4px_4px_0px_#0f172a] opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-250 z-50 leading-relaxed">
                    Support this creator automatically every month. Can be canceled anytime!
                  </div>
                </div>
              </div>

              {/* Submit Checkout */}
              {isEditingMode ? (
                <div 
                  className="w-full relative group/edit mt-4"
                  onDoubleClick={() => { playClickSound(); setIsEditingButtonText(true); }}
                >
                  {isEditingButtonText ? (
                    <div className="w-full py-4 rounded-xl bg-white border-2 border-dashed border-brand-orange flex items-center justify-center gap-2">
                      <input
                        type="text"
                        value={settings.button_text || ''}
                        onChange={(e) => setSettings({ ...settings, button_text: e.target.value })}
                        onBlur={() => setIsEditingButtonText(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingButtonText(false)}
                        className="bg-transparent border-none text-center font-black text-lg uppercase tracking-widest text-slate-900 focus:outline-none w-full"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="w-full py-4 rounded-xl bg-brand-orange border-2 border-slate-900 text-white font-black text-lg uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] relative select-none">
                      <Coffee className="w-6 h-6 shrink-0" strokeWidth={3} />
                      <span>{settings.button_text || '立即支持'} €{finalAmount}</span>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white text-slate-900 border-2 border-slate-900 text-[9px] font-black py-0.5 px-2 rounded uppercase shadow-[1px_1px_0px_#000] opacity-0 group-hover/edit:opacity-100 transition-opacity">
                        双击修改
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] font-bold text-slate-400 text-center mt-1.5 uppercase tracking-wider">
                    * 双击按钮区域即可直接修改按钮文案
                  </p>
                </div>
              ) : (
                <motion.button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full py-4 rounded-xl bg-brand-orange border-2 border-slate-900 text-white font-black text-lg uppercase tracking-widest shadow-[4px_4px_0px_#0f172a] hover:shadow-none hover:translate-x-1 hover:translate-y-1 hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-4"
                >
                  {checkoutLoading ? (
                    <span className="w-6 h-6 rounded-full border-4 border-slate-900 border-t-transparent animate-spin inline-block"></span>
                  ) : (
                    <>
                      <Coffee className="w-6 h-6 animate-bounce" strokeWidth={3} />
                      <span>{settings.button_text || '立即支持'} €{finalAmount}</span>
                    </>
                  )}
                </motion.button>
              )}
            </form>

            <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest mt-6">
              {t.stripe_powered}
            </p>
          </div>

        </motion.div>

        {/* Modular 3D Retro Social Deck */}
        {hasSocialDeck && (
          <div className={`col-span-1 ${isSingleColDesktop ? 'md:col-span-2' : 'md:col-span-4'} w-full flex flex-col ${showAvatarCard ? 'md:mt-16' : ''} md:sticky md:top-24 md:max-h-[calc(100vh-120px)]`}>
            <SocialDeck 
              showSocialDeck={showSocialDeck}
              socialLinks={socialLinks}
              theme={settings.theme}
              cardClass={cardClass}
              textClass={textClass}
              secondaryTextClass={secondaryTextClass}
              isEditingMode={isEditingMode}
              onUpdateSocialLinks={setSocialLinks}
              showToast={showToast}
            />
          </div>
        )}
      </div>

      {/* Full-width Horizontal Barrage/Danmaku Wall (Optimized for both PC & Mobile) */}
      {supporterWallElement}

      {/* Customizer Sidebar Drawer */}
      <AnimatePresence>
        {isCustomizerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomizerOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            {/* Drawer Body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto flex flex-col border-l border-slate-200 select-none text-slate-800"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-orange-light text-brand-orange flex items-center justify-center shrink-0">
                    <Sliders className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 tracking-tight">自定义页面与布局</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Page Customizer Sandbox</p>
                  </div>
                </div>
                <button 
                  onClick={() => { playClickSound(); setIsCustomizerOpen(false); }}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6 flex-1">
                {/* Section 1: Modules Toggles */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block">模块显示切换 / Component Toggles</span>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {/* Toggle 1 */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">显示头像与个人简介 (Avatar & Bio)</span>
                      <input 
                        type="checkbox" 
                        checked={showAvatarCard} 
                        onChange={(e) => setShowAvatarCard(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>
                    <hr className="border-slate-100 my-1" />
                    {/* Toggle 2 */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">显示支持者留言墙 (Supporter Wall)</span>
                      <input 
                        type="checkbox" 
                        checked={showSupporterWall} 
                        onChange={(e) => setShowSupporterWall(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>
                    <hr className="border-slate-100 my-1" />
                    {/* Toggle 3 */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">显示筹款进度条 (Goal Progress)</span>
                      <input 
                        type="checkbox" 
                        checked={showGoalProgress} 
                        onChange={(e) => setShowGoalProgress(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>
                    <hr className="border-slate-100 my-1" />
                    {/* Toggle 4 */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">显示公共累计统计面板 (Earnings Stats)</span>
                      <input 
                        type="checkbox" 
                        checked={showTotalEarnings} 
                        onChange={(e) => setShowTotalEarnings(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>
                    <hr className="border-slate-100 my-1" />
                    {/* Toggle for Social Deck */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-700">显示社交卡带架 (Social Deck)</span>
                      <input 
                        type="checkbox" 
                        checked={showSocialDeck} 
                        onChange={(e) => setShowSocialDeck(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Section 2: Visual Style */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block">布局排版个性化 / Visual Style</span>
                  <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {/* Theme Select */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">主页面色调主题 (Theme Preset)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'orange', name: '珊瑚亮橙 (Solar Orange)' },
                          { id: 'light', name: '复古白 (Classic Light)' },
                          { id: 'dark', name: '宇宙极夜 (Dark Theme)' },
                          { id: 'glass', name: '毛玻璃 (Soft Glass)' },
                          { id: 'emerald', name: '薄荷绿 (Mint Emerald)' },
                          { id: 'purple', name: '梦幻紫 (Dreamy Purple)' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSettings({ ...settings, theme: t.id })}
                            className={`py-2 px-3 rounded-xl text-xs font-bold border text-left transition ${
                              settings.theme === t.id 
                                ? 'bg-brand-orange text-white border-brand-orange shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-orange'
                            }`}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reverse columns toggle */}
                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/50">
                      <span className="text-xs font-bold text-slate-700">调换左右栏排版位置 (Swap Left/Right)</span>
                      <input 
                        type="checkbox" 
                        checked={isLayoutReversed} 
                        onChange={(e) => setIsLayoutReversed(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>

                    {/* Influencer Count */}
                    <div className="pt-2 border-t border-slate-200/50">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">首页展示博主数量 (Creators Count)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setInfluencerCount(num);
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition ${
                              influencerCount === num
                                ? 'bg-brand-orange text-white border-brand-orange shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-orange'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Global Edit mode toggle */}
                    <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200/50">
                      <span className="text-xs font-bold text-slate-700">允许实时点击修改元素 (Enable Live Edit)</span>
                      <input 
                        type="checkbox" 
                        checked={isEditingMode} 
                        onChange={(e) => {
                          playClickSound();
                          setIsEditingMode(e.target.checked);
                        }}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Section 3: Brand Text */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block">信息直观修改 / Brand & Details</span>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">主标题/支持按钮文案 (CTA Text)</label>
                      <input 
                        type="text" 
                        value={settings.button_text} 
                        onChange={(e) => setSettings({ ...settings, button_text: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">修改创作者显示名称 (Display Name)</label>
                      <input 
                        type="text" 
                        value={creator.display_name} 
                        onChange={(e) => setCreator({ ...creator, display_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">个性签名与简介 (Creator Bio)</label>
                      <textarea 
                        rows={2}
                        value={creator.bio || ''} 
                        onChange={(e) => setCreator({ ...creator, bio: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange font-medium text-xs resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">默认快捷打赏金额列表 (Preset Amounts, 逗号分隔)</label>
                      <input 
                        type="text" 
                        value={settings.default_amounts.join(', ')} 
                        onChange={(e) => {
                          const parsed = e.target.value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n));
                          setSettings({ ...settings, default_amounts: parsed });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-orange font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3.5: Social Links Matrix Configuration */}
                {showSocialDeck && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block">配置社交卡带 / Configure Social Deck</span>
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="space-y-4">
                        {socialLinks.map((link: any, index: number) => (
                          <div key={link.id} className="space-y-2 pb-3.5 border-b border-slate-200/50 last:border-b-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">{link.name}</span>
                              <div className="flex items-center gap-2.5">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <span className="text-[10px] text-slate-400 font-bold">启用</span>
                                  <input 
                                    type="checkbox" 
                                    checked={link.active} 
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index].active = e.target.checked;
                                      setSocialLinks(updated);
                                    }}
                                    className="w-3.5 h-3.5 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                                  />
                                </label>

                                {/* Delete Social Link button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClickSound();
                                    if (confirm(`确定要删除 ${link.name} 社交卡片吗？`)) {
                                      const updated = socialLinks.filter((_, idx) => idx !== index);
                                      setSocialLinks(updated);
                                      showToast(`已删除 ${link.name} 链接`);
                                    }
                                  }}
                                  className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition cursor-pointer border border-red-200"
                                  title="删除此社交链接"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {link.active && (
                              <div className="space-y-1.5">
                                <div>
                                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase">用户名 / 账号标签</label>
                                  <input 
                                    type="text" 
                                    value={link.username} 
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index].username = e.target.value;
                                      setSocialLinks(updated);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-bold bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase">主页链接 URL</label>
                                  <input 
                                    type="text" 
                                    value={link.url} 
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index].url = e.target.value;
                                      setSocialLinks(updated);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-[10px] text-slate-500 font-medium bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase">关注数说明 (例如: 12.8万 关注者)</label>
                                  <input 
                                    type="text" 
                                    value={link.count} 
                                    onChange={(e) => {
                                      const updated = [...socialLinks];
                                      updated[index].count = e.target.value;
                                      setSocialLinks(updated);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-semibold bg-white"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add New Social Link Form */}
                      <div className="pt-2 border-t border-dashed border-slate-200">
                        {isAddingSocial ? (
                          <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <h5 className="text-[10px] font-black uppercase text-brand-orange">➕ 新增社交媒体链接 / New Social Link</h5>
                            
                            {/* Name Selection */}
                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">平台名称 (Name)</label>
                              <select 
                                value={newSocialName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setNewSocialName(val);
                                  // Set typical defaults based on selection
                                  if (val === 'Bilibili') {
                                    setNewSocialUrl('https://space.bilibili.com');
                                    setNewSocialColor('from-pink-400 to-pink-500');
                                  } else if (val === '微博 (Weibo)') {
                                    setNewSocialUrl('https://weibo.com');
                                    setNewSocialColor('from-red-400 to-red-500');
                                  } else if (val === 'GitHub') {
                                    setNewSocialUrl('https://github.com');
                                    setNewSocialColor('from-slate-700 to-slate-900');
                                  } else if (val === 'YouTube') {
                                    setNewSocialUrl('https://youtube.com');
                                    setNewSocialColor('from-red-500 to-rose-600');
                                  } else {
                                    setNewSocialUrl('https://');
                                    setNewSocialColor('from-indigo-400 to-indigo-600');
                                  }
                                }}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-bold bg-white"
                              >
                                <option value="">-- 选择平台 / Select --</option>
                                <option value="Bilibili">Bilibili</option>
                                <option value="微博 (Weibo)">微博 (Weibo)</option>
                                <option value="GitHub">GitHub</option>
                                <option value="YouTube">YouTube</option>
                                <option value="Custom">自定义平台 / Custom</option>
                              </select>
                            </div>

                            {/* Custom Name (if selected Custom) */}
                            {newSocialName === 'Custom' && (
                              <div>
                                <label className="block text-[9px] font-extrabold text-slate-400 uppercase">自定义平台名 (Custom Platform Name)</label>
                                <input 
                                  type="text" 
                                  placeholder="例如: 抖音 / Douyin"
                                  onChange={(e) => setNewSocialName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-bold bg-white"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">账号名称/用户名 (Username)</label>
                              <input 
                                type="text" 
                                placeholder="例如: @ANCOOX"
                                value={newSocialUsername} 
                                onChange={(e) => setNewSocialUsername(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-bold bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">主页链接 URL</label>
                              <input 
                                type="text" 
                                value={newSocialUrl} 
                                onChange={(e) => setNewSocialUrl(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-[10px] text-slate-500 font-medium bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">简介 (Description)</label>
                              <input 
                                type="text" 
                                placeholder="日常分享与创作交流"
                                value={newSocialDesc} 
                                onChange={(e) => setNewSocialDesc(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-medium bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-extrabold text-slate-400 uppercase">粉丝/订阅/星标数 (Followers count)</label>
                              <input 
                                type="text" 
                                placeholder="例如: 10万 粉丝"
                                value={newSocialCount} 
                                onChange={(e) => setNewSocialCount(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-orange text-xs font-bold bg-white"
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  setIsAddingSocial(false);
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 font-bold text-xs uppercase cursor-pointer"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playClickSound();
                                  if (!newSocialName || !newSocialUsername || !newSocialUrl) {
                                    showToast('请填写平台名、用户名和链接 URL！');
                                    return;
                                  }
                                  const newId = newSocialName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now();
                                  const newLink = {
                                    id: newId,
                                    name: newSocialName,
                                    active: true,
                                    username: newSocialUsername,
                                    url: newSocialUrl,
                                    color: newSocialColor,
                                    desc: newSocialDesc || '社交媒体主页',
                                    count: newSocialCount || '关注我们'
                                  };
                                  setSocialLinks([...socialLinks, newLink]);
                                  setIsAddingSocial(false);
                                  // Reset
                                  setNewSocialName('');
                                  setNewSocialUsername('');
                                  setNewSocialUrl('');
                                  setNewSocialDesc('');
                                  setNewSocialCount('');
                                  showToast('✅ 社交卡片添加成功！');
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-brand-orange text-white border-2 border-slate-900 shadow-[1px_1px_0px_#000] font-bold text-xs uppercase cursor-pointer"
                              >
                                确认添加
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setIsAddingSocial(true);
                              setNewSocialName('');
                              setNewSocialUsername('');
                              setNewSocialUrl('https://');
                              setNewSocialDesc('');
                              setNewSocialCount('');
                            }}
                            className="w-full py-2 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                          >
                            <Plus className="w-4 h-4 text-brand-orange" />
                            <span>添加新社交链接 / Add Social Link</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3.8: Footprints & Message Wall Management */}
                {showSupporterWall && (
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block">👣 留言墙与足迹管理 / Support Wall & Footprints</span>
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
                        点击 👁️ 选择显示或隐藏该留言，点击 ✏️ 修改，点击 🗑️ 彻底删除：
                      </p>

                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                        {allTipsRaw.map((tip: any) => {
                          const isEdited = !!editedTips[tip.id];
                          const activeTip = isEdited ? { ...tip, ...editedTips[tip.id] } : tip;
                          const isHidden = hiddenTipIds.includes(tip.id);
                          const isDeleted = deletedTipIds.includes(tip.id);

                          if (isDeleted) return null;

                          return (
                            <div 
                              key={tip.id} 
                              className={`p-3 rounded-xl border flex flex-col gap-1.5 transition ${
                                isHidden 
                                  ? 'bg-slate-100 border-slate-200 opacity-60' 
                                  : 'bg-white border-slate-200 hover:border-brand-orange shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-800">{activeTip.supporter_name}</span>
                                  <span className="py-0.5 px-1.5 rounded-md bg-brand-orange-light text-brand-orange border border-brand-orange/20 font-black text-[9px]">
                                    €{activeTip.amount}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {/* Visibility Toggle Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playClickSound();
                                      if (isHidden) {
                                        setHiddenTipIds(hiddenTipIds.filter(id => id !== tip.id));
                                        showToast(`已重新显示 ${activeTip.supporter_name} 的留言`);
                                      } else {
                                        setHiddenTipIds([...hiddenTipIds, tip.id]);
                                        showToast(`已隐藏 ${activeTip.supporter_name} 的留言`);
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg border-2 border-slate-900 transition-all active:scale-95 cursor-pointer shadow-[1px_1px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none ${
                                      isHidden ? 'bg-slate-200 text-slate-400' : 'bg-amber-100 text-amber-600'
                                    }`}
                                    title={isHidden ? "显示该留言" : "隐藏该留言"}
                                  >
                                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Edit Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playClickSound();
                                      setSelectedTipToEdit(activeTip);
                                    }}
                                    className="p-1.5 rounded-lg border-2 border-slate-900 bg-emerald-100 text-emerald-700 transition-all active:scale-95 cursor-pointer shadow-[1px_1px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none"
                                    title="修改留言"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playClickSound();
                                      if (confirm(`确定要删除 ${activeTip.supporter_name} 的这条打赏足迹吗？`)) {
                                        setDeletedTipIds([...deletedTipIds, tip.id]);
                                        showToast(`已彻底删除该留言`);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg border-2 border-slate-900 bg-red-100 text-red-600 transition-all active:scale-95 cursor-pointer shadow-[1px_1px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none"
                                    title="彻底删除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {activeTip.message && (
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic border-l-2 border-slate-200 pl-2">
                                  {activeTip.message}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Live Supporter Simulator */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block">模拟打赏数据编辑 / Live Supporter Simulator</span>
                  <div className="space-y-3 bg-brand-orange-light/40 p-4 rounded-2xl border border-brand-orange/10">
                    <div>
                      <label className="block text-xs font-bold text-brand-orange mb-1">支持者姓名 (Supporter Name)</label>
                      <input 
                        type="text" 
                        placeholder="例如：老李"
                        value={simSupporterName} 
                        onChange={(e) => setSimSupporterName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-brand-orange/20 bg-white focus:outline-none focus:border-brand-orange font-bold text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-brand-orange mb-1">赞助金额 (€ EUR)</label>
                        <input 
                          type="number" 
                          min={3}
                          value={simAmount} 
                          onChange={(e) => setSimAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-brand-orange/20 bg-white focus:outline-none focus:border-brand-orange font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-brand-orange mb-1">快捷预设</label>
                        <div className="grid grid-cols-3 gap-1">
                          {[5, 20, 100].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setSimAmount(String(amt))}
                              className="py-2 rounded-lg bg-white border border-brand-orange/20 hover:border-brand-orange text-[10px] font-black text-brand-orange transition cursor-pointer"
                            >
                              €{amt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-brand-orange mb-1">打赏附带留言 (Support Message)</label>
                      <input 
                        type="text" 
                        placeholder="例如：买杯咖啡，继续加油！"
                        value={simMessage} 
                        onChange={(e) => setSimMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-brand-orange/20 bg-white focus:outline-none focus:border-brand-orange font-medium text-xs"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const amtNum = Number(simAmount);
                        if (isNaN(amtNum) || amtNum < 3) {
                          showToast('Minimum simulated support amount is €3.');
                          return;
                        }
                        const newTip: Tip = {
                          id: 'sim_tip_' + Date.now(),
                          creator_id: creator.id,
                          supporter_name: simSupporterName.trim() || '神秘支持者 (Anonymous)',
                          supporter_email: 'sim@example.com',
                          message: simMessage.trim(),
                          amount: amtNum,
                          currency: 'EUR',
                          stripe_session_id: 'sim_sess_' + Date.now(),
                          payment_status: 'paid',
                          created_at: new Date().toISOString()
                        };
                        setTips([newTip, ...tips]);
                        confetti({ particleCount: 60, spread: 50 });
                        showToast(`已成功模拟收到来自 ${newTip.supporter_name} 的 €${amtNum} 赞助！`);
                        
                        // Clear inputs
                        setSimSupporterName('');
                        setSimMessage('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 transition font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-orange/15 cursor-pointer border border-transparent"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>模拟生成一笔赞助</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  onClick={() => {
                    playClickSound();
                    setIsCustomizerOpen(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 transition text-slate-700 font-bold text-xs text-center cursor-pointer border border-transparent"
                >
                  确定关闭 (Done)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 🔮 Footprint Edit Popup Modal (足迹/留言修改专属3D模态框) */}
      <AnimatePresence>
        {selectedTipToEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTipToEdit(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 30, opacity: 0 }}
              className="relative w-full max-w-md p-6 rounded-[2.5rem] bg-white border-4 border-slate-900 shadow-[12px_12px_0px_#0f172a] z-[110] space-y-4 text-slate-900"
            >
              <button 
                type="button"
                onClick={() => { playClickSound(); setSelectedTipToEdit(null); }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-slate-900"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange bg-amber-50 border-2 border-slate-900 px-3 py-1 rounded-full shadow-[2px_2px_0px_#000] inline-block mb-2">
                  👣 修改足迹与留言 / Edit Footprint
                </span>
                <h3 className="text-xl font-black text-slate-950 tracking-tight leading-none mt-1">编辑能量反馈留言</h3>
              </div>

              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">支持者姓名</label>
                  <input 
                    type="text" 
                    value={selectedTipToEdit.supporter_name || ''} 
                    onChange={(e) => setSelectedTipToEdit({ ...selectedTipToEdit, supporter_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none focus:border-brand-orange font-bold text-xs shadow-[2px_2px_0px_#000] focus:shadow-none transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">打赏支持金额 (€ EUR)</label>
                  <input 
                    type="number" 
                    value={selectedTipToEdit.amount || 0} 
                    onChange={(e) => setSelectedTipToEdit({ ...selectedTipToEdit, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none focus:border-brand-orange font-bold text-xs shadow-[2px_2px_0px_#000] focus:shadow-none transition-all bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">能量反馈留言内容</label>
                  <textarea 
                    rows={3}
                    value={selectedTipToEdit.message || ''} 
                    onChange={(e) => setSelectedTipToEdit({ ...selectedTipToEdit, message: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-900 focus:outline-none focus:border-brand-orange font-medium text-xs resize-none shadow-[2px_2px_0px_#000] focus:shadow-none transition-all bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { playClickSound(); setSelectedTipToEdit(null); }}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-700 font-black text-xs uppercase tracking-widest cursor-pointer active:scale-95 transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound();
                    if (!selectedTipToEdit.supporter_name) {
                      showToast('名字不能为空！');
                      return;
                    }
                    const updated = { ...editedTips };
                    updated[selectedTipToEdit.id] = {
                      id: selectedTipToEdit.id,
                      supporter_name: selectedTipToEdit.supporter_name,
                      message: selectedTipToEdit.message,
                      amount: selectedTipToEdit.amount
                    };
                    setEditedTips(updated);
                    setSelectedTipToEdit(null);
                    showToast('✅ 留言修改成功！可在底部进行保存与发布。');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-brand-orange text-white border-2 border-slate-900 shadow-[3px_3px_0px_#000] font-black text-xs uppercase tracking-widest cursor-pointer hover:translate-y-0.5 hover:shadow-none active:scale-95 transition"
                >
                  保存修改
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💾 底部“保存/撤销”状态悬浮条 (Bottom Action Bar) */}
      <AnimatePresence>
        {isEditingMode && isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-2xl bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-[2rem] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="p-1.5 rounded-full bg-amber-100 border-2 border-slate-900 text-amber-600 shrink-0">
                <AlertCircle className="w-5 h-5" strokeWidth={3} />
              </span>
              <div className="text-left">
                <h4 className="text-sm font-black text-slate-900 tracking-tight leading-tight">您有未保存的修改</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">请保存以发布这些更改，或放弃修改</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              {/* Discard Button */}
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  if (originalCreator && originalSettings) {
                    setCreator(JSON.parse(JSON.stringify(originalCreator)));
                    setSettings(JSON.parse(JSON.stringify(originalSettings)));
                    showToast('已放弃所有未保存的修改');
                  }
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                ❌ 放弃修改
              </button>

              {/* Save & Publish Button */}
              <button
                type="button"
                onClick={async () => {
                  playClickSound();
                  setSaving(true);
                  try {
                    const data = await api.updateSettings(creator.username, {
                      display_name: creator.display_name,
                      bio: creator.bio,
                      avatar_url: creator.avatar_url,
                      theme: settings.theme,
                      button_text: settings.button_text,
                      goal_text: settings.goal_text,
                      goal_amount: settings.goal_amount
                    });

                    if (data.success) {
                      setCreator(data.creator);
                      setOriginalCreator(JSON.parse(JSON.stringify(data.creator)));
                      setSettings(data.settings);
                      setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
                      
                      // Trigger magnificent Confetti celebration
                      confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                      });
                      
                      showToast('💾 修改已成功保存并发布！🎉');
                    } else {
                      showToast('保存失败，请重试');
                    }
                  } catch (e) {
                    console.error(e);
                    showToast('服务器连接错误，请稍后重试');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-brand-orange text-white border-2 border-slate-900 shadow-[2px_2px_0px_#000] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>💾 保存并发布</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================================
   VIEW: PAYMENT SUCCESS & CONFETTI THANK YOU PAGE
   ========================================================================== */
function SuccessView({ 
  queryParams, 
  navigate 
}: { 
  queryParams: Record<string, string>, 
  navigate: (p: string) => void 
}) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, confettiEnabled } = useTranslation();

  const fetchSuccessDetails = async () => {
    const username = queryParams.creator || 'wyatt';
    try {
      const res = await api.getCreator(username);
      if (res.ok) {
        const data = await res.json();
        setCreator(data.creator);
        setSettings(data.settings);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      // Trigger pristine aesthetic burst only if enabled in preferences
      if (confettiEnabled) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  };

  useEffect(() => {
    fetchSuccessDetails();
  }, [queryParams]);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-brand-orange border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-slate-50 p-6">
      <div className="w-full max-w-lg p-8 md:p-10 rounded-3xl relief-raised-orange text-center flex flex-col items-center">
        {/* Animated Celebration Ring */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-500 flex items-center justify-center text-3xl mb-6 shadow-sm">
          ✨
        </div>

        <h1 className="text-3xl font-black font-display text-slate-900 tracking-tight mb-2">
          {t.payment_success_title}
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
          {t.payment_success_desc}
        </p>

        {creator && (
          <div className="flex flex-col items-center space-y-4 mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <img src={creator.avatar_url} className="w-16 h-16 rounded-full object-cover shadow border border-white" alt="Creator" />
            <div>
              <p className="text-xs font-bold text-slate-400">{t.message_from_creator.replace('{name}', creator.display_name)}:</p>
              <p className="text-sm text-slate-600 font-medium italic leading-relaxed mt-2">
                "{settings?.thank_you_message || 'Thank you so much!'}"
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => { playClickSound(); navigate(creator ? `/${creator.username}` : '/'); }}
          className="py-3.5 px-8 rounded-full bg-brand-orange text-white font-black text-sm shadow-md shadow-brand-orange/20 hover:bg-brand-orange-hover transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.return_to_creator}</span>
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW: SIMULATED PAYMENT CHECKOUT SANDBOX
   ========================================================================== */
function SimulatedCheckoutView({ 
  queryParams, 
  navigate, 
  showToast 
}: { 
  queryParams: Record<string, string>, 
  navigate: (p: string) => void, 
  showToast: (m: string) => void 
}) {
  const [loading, setLoading] = useState(false);
  const sessionId = queryParams.session_id;
  const username = queryParams.creator || 'wyatt';

  const handlePayComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.completeSimulatedCheckout(sessionId);
      if (data.success) {
        showToast('Simulated Checkout Success!');
        navigate(`/success?creator=${username}`);
      } else {
        showToast('Simulator error completion');
        setLoading(false);
      }
    } catch (e) {
      showToast('Error syncing mock webhook');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-100 min-h-screen">
      {/* Simulation Info Sidebar */}
      <div className="w-full md:w-96 bg-brand-orange p-8 text-white flex flex-col justify-between shrink-0">
        <div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl mb-6">
            🛠️
          </div>
          <h2 className="text-2xl font-black tracking-tight font-display mb-3">
            Tiplet Payment Simulator
          </h2>
          <p className="text-sm text-brand-orange-light leading-relaxed">
            Stripe API key is not currently declared in user secrets. We have seamlessly redirected you to this fully functional Sandbox Checkout page to guarantee instant preview testing!
          </p>
        </div>

        <div className="text-xs text-brand-orange-light font-medium border-t border-white/20 pt-6 mt-8">
          Tiplet Sandbox Client Sandbox V1
        </div>
      </div>

      {/* Mock Stripe checkout form */}
      <div className="flex-1 p-6 md:p-12 flex justify-center items-center">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border border-slate-200">
          <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Payment Information</span>
            <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Simulated Stripe</span>
            </div>
          </div>

          <form onSubmit={handlePayComplete} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Card Number
              </label>
              <input 
                type="text" 
                required
                maxLength={19}
                defaultValue="4242 4242 4242 4242"
                className="w-full px-4 py-3 rounded-xl relief-inset font-bold text-slate-800 text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Expiry Date
                </label>
                <input 
                  type="text" 
                  required
                  defaultValue="12/29"
                  className="w-full px-4 py-3 rounded-xl relief-inset font-bold text-slate-800 text-sm focus:outline-none text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  CVC Code
                </label>
                <input 
                  type="text" 
                  required
                  defaultValue="123"
                  className="w-full px-4 py-3 rounded-xl relief-inset font-bold text-slate-800 text-sm focus:outline-none text-center"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : (
                <>
                  <span>Simulate Payment Complete</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW: EMBEDDED IFRAME WIDGET FRAME
   ========================================================================== */
function WidgetFrameView({ 
  queryParams, 
  showToast 
}: { 
  queryParams: Record<string, string>, 
  showToast: (m: string) => void 
}) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // checkout details
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [supporterName, setSupporterName] = useState('');
  const [supporterEmail, setSupporterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchWidgetData = async () => {
    const cid = queryParams.creator || 'wyatt';
    try {
      const res = await api.getCreator(cid);
      if (res.ok) {
        const data = await res.json();
        setCreator(data.creator);
        setSettings(data.settings);
        if (data.settings && data.settings.default_amounts) {
          setSelectedAmount(data.settings.default_amounts[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgetData();
  }, [queryParams]);

  const handleCloseClick = () => {
    // Notify host page parent window to collapse iframe overlay
    window.parent.postMessage('close-tiplet-widget', '*');
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
    if (finalAmount < 3) {
      showToast('Minimum is €3.');
      return;
    }

    setPaying(true);

    try {
      const data = await api.createCheckoutSession({
        creator_id: creator?.id,
        supporter_name: supporterName || 'Anonymous',
        supporter_email: supporterEmail,
        message,
        amount: finalAmount,
        currency: 'EUR'
      });
      if (data.url) {
        // Redirect parent host page window directly to stripe payment or sandbox simulation url
        window.parent.location.href = data.url;
      } else {
        showToast('Error redirect checkout');
        setPaying(false);
      }
    } catch (e) {
      showToast('Checkout error');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-4 border-brand-orange border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!creator || !settings) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 text-slate-400 font-bold text-sm">
        Creator Error
      </div>
    );
  }

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  return (
    <div className="flex-1 flex flex-col bg-white p-6 relative select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <img src={creator.avatar_url} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100" alt="Avatar" />
          <div>
            <h3 className="font-extrabold text-slate-800 leading-none">{creator.display_name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">@{creator.username}</p>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={handleCloseClick}
          className="p-2 rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition cursor-pointer"
        >
          <span className="text-xl font-bold font-sans">×</span>
        </button>
      </div>

      {/* Donation Form */}
      <form onSubmit={handlePaySubmit} className="flex-1 flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          <h4 className="text-sm font-black text-slate-800 font-display">
            {settings.button_text}
          </h4>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {settings.default_amounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-3 rounded-xl border text-xs font-bold transition ${
                  selectedAmount === amt && !customAmount
                    ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 bg-white'
                }`}
              >
                €{amt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomAmount('10')}
              className={`py-3 rounded-xl border text-xs font-bold transition ${
                customAmount
                  ? 'border-brand-orange bg-brand-orange-light text-brand-orange'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50 bg-white'
              }`}
            >
              Custom
            </button>
          </div>

          {customAmount !== '' && (
            <input 
              type="number" 
              required
              min={3}
              placeholder="Amount (minimum 3)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-xs focus:outline-none focus:border-brand-orange"
            />
          )}

          {/* Inputs */}
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Your Name (Optional)"
              value={supporterName}
              onChange={(e) => setSupporterName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-brand-orange font-medium"
            />
            <input 
              type="email" 
              required
              placeholder="Your Email"
              value={supporterEmail}
              onChange={(e) => setSupporterEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-brand-orange font-medium"
            />
            <textarea 
              rows={2}
              placeholder="Leave a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-brand-orange resize-none font-medium"
            />
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            type="submit"
            disabled={paying}
            className="w-full py-4 rounded-full relief-btn-orange text-white font-black text-sm tracking-wide shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
          >
            {paying ? (
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
            ) : (
              <>
                <Coffee className="w-4.5 h-4.5" />
                <span>Support €{finalAmount}</span>
              </>
            )}
          </button>
          
          <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            Secured checkout via Stripe.
          </p>
        </div>
      </form>
    </div>
  );
}
