import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ExternalLink,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Save,
  Sparkles,
} from "lucide-react";
import { playClickSound } from "../utils/audio";
import { LanguageContext } from "../App";
import { translations } from "../translations";
import confetti from "canvas-confetti";

interface SocialLink {
  id: string;
  name: string;
  active: boolean;
  username: string;
  url: string;
  color: string;
  desc: string;
  count: string;
}

interface SocialDeckProps {
  showSocialDeck: boolean;
  socialLinks: SocialLink[];
  theme: string;
  cardClass: string;
  textClass: string;
  secondaryTextClass: string;
  isEditingMode?: boolean;
  onUpdateSocialLinks?: (links: SocialLink[]) => void;
  showToast?: (msg: string) => void;
}

const getTranslatedCardField = (
  id: string,
  field: "desc" | "count",
  locale: "en" | "zh",
  defaultValue: string,
) => {
  const translationsMap: Record<
    string,
    Record<"desc" | "count", Record<"en" | "zh", string>>
  > = {
    bilibili: {
      desc: {
        en: "Video tutorials & interactive motion showcases",
        zh: "流体交互视频与教程发布",
      },
      count: { en: "128k Followers", zh: "12.8万 关注者" },
    },
    weibo: {
      desc: {
        en: "Daily design inspiration & aesthetic sharing",
        zh: "日常设计灵感与美学分享",
      },
      count: { en: "56k Followers", zh: "5.6万 粉丝" },
    },
    github: {
      desc: {
        en: "Open-source 3D animations & UI motion libraries",
        zh: "开源前端三维动画与动效库",
      },
      count: { en: "3.2k Stars", zh: "3.2k Stars" },
    },
    youtube: {
      desc: {
        en: "Immersive motion design video archives",
        zh: "精美动效沉浸式视频档案室",
      },
      count: { en: "24k Subscribers", zh: "2.4万 订阅" },
    },
  };

  const entry = translationsMap[id];
  if (!entry) return defaultValue;

  const isDefaultZH = defaultValue === entry[field].zh;
  const isDefaultEN = defaultValue === entry[field].en;

  if (isDefaultZH || isDefaultEN) {
    return entry[field][locale];
  }

  return defaultValue;
};

// Handcrafted brand SVG icons for perfect aesthetic and branding matching
const getBrandIcon = (id: string) => {
  switch (id.toLowerCase()) {
    case "bilibili":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M17.8 2c.4 0 .8.2 1 .5l2.2 2.7c.5.5.5 1.3 0 1.8L19 9H5L3 7c-.5-.5-.5-1.3 0-1.8l2.2-2.7c.3-.3.7-.5 1-.5h11.6M12 11c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8m-4 4c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1m8 0c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1M9 3v3h6V3H9z" />
        </svg>
      );
    case "weibo":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 14.15c-1.37.52-2.84.51-3.95-.01-.7-.33-1.07-.82-1.05-1.42.04-.97.94-1.74 2.22-1.92 1.35-.19 2.72.16 3.42.84.42.4.52.92.36 1.51zm.61-2.92c-.37-.15-.55-.54-.4-.91.54-1.33.22-2.76-.87-3.8-1.07-1.02-2.52-1.28-3.82-.69-.36.16-.78-.01-.95-.37-.16-.36.01-.78.37-.95 1.76-.79 3.73-.44 5.17.93 1.48 1.42 1.91 3.37 1.18 5.19-.15.37-.54.55-.91.4-.23-.09-.37-.28-.37-.4z" />
        </svg>
      );
    case "github":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "twitter":
    case "x":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    case "tiktok":
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.18 1.13 1.2 2.71 1.95 4.38 2.1v3.91c-1.63-.03-3.23-.49-4.63-1.34-.34-.2-.67-.44-.97-.71v6.86c.01 1.93-.5 3.86-1.52 5.48-1.57 2.4-4.22 3.88-7.1 3.99-2.92.08-5.87-.97-7.85-3.15C-1.52 17.84-1.92 13.91.46 11.1c1.55-1.95 3.97-3.11 6.47-3.08.13 0 .27.01.4.03v4.03c-1.17-.18-2.4.15-3.27.95-.94.81-1.37 2.11-1.11 3.3.26 1.16 1.25 2.05 2.44 2.19 1.19.11 2.39-.42 2.97-1.47.33-.58.46-1.25.45-1.92V.02z" />
        </svg>
      );
    default:
      return (
        <svg
          className="w-8 h-8 md:w-9 md:h-9 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      );
  }
};

const COLOR_PRESETS = [
  { id: "pink", name: "哔哩粉", value: "from-pink-400 to-pink-500" },
  { id: "red", name: "微博红", value: "from-red-400 to-red-500" },
  { id: "slate", name: "极客黑", value: "from-slate-700 to-slate-900" },
  { id: "pure-red", name: "油管红", value: "from-red-500 to-rose-600" },
  { id: "blue", name: "推特蓝", value: "from-sky-400 to-sky-500" },
  { id: "purple", name: "网图紫", value: "from-purple-500 to-pink-500" },
  { id: "indigo", name: "音符蓝", value: "from-indigo-500 to-purple-600" },
  { id: "orange", name: "活力橙", value: "from-orange-400 to-brand-orange" },
];

export default function SocialDeck({
  showSocialDeck,
  socialLinks,
  theme,
  cardClass,
  textClass,
  secondaryTextClass,
  isEditingMode = false,
  onUpdateSocialLinks,
  showToast,
}: SocialDeckProps) {
  const [selectedCard, setSelectedCard] = useState<SocialLink | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { locale } = useContext(LanguageContext);
  const t = translations[locale];

  // Inline configuration states
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states for add/edit
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCount, setFormCount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState("from-slate-700 to-slate-900");
  const [formActive, setFormActive] = useState(true);

  if (!showSocialDeck) return null;

  // In edit mode, show all of them so we can configure hide/show, otherwise only active ones
  const displayedLinks = isEditingMode
    ? socialLinks
    : socialLinks.filter((l) => l.active);

  const maxInitialLinks = 8;
  const activeLinksCount = socialLinks.filter((l) => l.active).length;
  const hasMore = !isEditingMode && activeLinksCount > maxInitialLinks;
  const renderLinks =
    isEditingMode || isExpanded
      ? displayedLinks
      : displayedLinks.slice(0, maxInitialLinks);

  const gridColsClass = "grid-cols-2 md:grid-cols-1";

  // Handle open editor for a link
  const openEditor = (link: SocialLink) => {
    setEditingLink(link);
    setIsAddingNew(false);
    setFormName(link.name);
    setFormUsername(link.username);
    setFormUrl(link.url);
    setFormCount(link.count);
    setFormDesc(link.desc || "");
    setFormColor(link.color);
    setFormActive(link.active);
  };

  // Handle open editor for NEW link
  const openNewLinkEditor = () => {
    setIsAddingNew(true);
    setEditingLink({
      id: `custom_${Date.now()}`,
      name: "Custom Link",
      active: true,
      username: "@myhandle",
      url: "https://",
      color: "from-orange-400 to-brand-orange",
      desc: "我的自定义社交渠道分享",
      count: "1.2k 关注者",
    });
    setFormName("Custom Link");
    setFormUsername("@myhandle");
    setFormUrl("https://");
    setFormCount("1.2k 关注者");
    setFormDesc("我的自定义社交渠道分享");
    setFormColor("from-orange-400 to-brand-orange");
    setFormActive(true);
  };

  // Handle saving link modifications
  const handleSaveLink = () => {
    if (!editingLink) return;
    playClickSound();

    const updatedLink: SocialLink = {
      ...editingLink,
      name: formName,
      username: formUsername,
      url: formUrl,
      count: formCount,
      desc: formDesc,
      color: formColor,
      active: formActive,
    };

    let newLinks = [...socialLinks];
    if (isAddingNew) {
      newLinks.push(updatedLink);
      if (showToast) showToast(`成功添加社交卡片: ${formName}！✨`);
      confetti({ particleCount: 30, spread: 60 });
    } else {
      newLinks = socialLinks.map((l) =>
        l.id === editingLink.id ? updatedLink : l,
      );
      if (showToast) showToast(`社交卡片 ${formName} 配置已更新！`);
    }

    if (onUpdateSocialLinks) {
      onUpdateSocialLinks(newLinks);
    }

    setEditingLink(null);
    setIsAddingNew(false);
  };

  // Handle removing a link
  const handleRemoveLink = (id: string, name: string) => {
    playClickSound();
    if (window.confirm(`确定要彻底删除 ${name} 社交卡片吗？`)) {
      const newLinks = socialLinks.filter((l) => l.id !== id);
      if (onUpdateSocialLinks) {
        onUpdateSocialLinks(newLinks);
      }
      if (showToast) showToast(`已彻底移除 ${name} 社交卡片`);
      setEditingLink(null);
    }
  };

  return (
    <div className="w-full select-none flex flex-col h-full">
      {/* Editorial Title for Edit Mode */}
      {isEditingMode && (
        <div className="mb-2 text-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange block animate-pulse">
            🛠️ 社交卡带编辑状态 (点击任意图标配置)
          </span>
        </div>
      )}

      {/* Retro Skeuomorphic Slots Base & Rack Container */}
      <div
        className={`relative flex-1 flex flex-col min-h-0 p-5 md:p-6 rounded-[2.5rem] border-4 shadow-[8px_8px_0px_#0f172a] overflow-hidden ${
          isEditingMode
            ? "border-dashed border-brand-orange/60 bg-brand-orange/5"
            : ""
        } ${
          theme === "dark"
            ? "bg-slate-800 border-slate-900"
            : "bg-white border-slate-900"
        }`}
      >
        {/* 3D Rack slots alignment */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar relative z-10 py-4 w-full h-full">
          <div
            className={`grid ${gridColsClass} content-start justify-items-center gap-4 w-full`}
          >
            {renderLinks.map((link) => (
              <div
                key={link.id}
                className="relative group/card w-full max-w-[80px]"
              >
                {/* Visual EyeOff overlay if link is hidden/inactive in edit mode */}
                {isEditingMode && !link.active && (
                  <div className="absolute top-0 right-0 z-20 bg-slate-900 border border-white text-white p-0.5 rounded-full shadow translate-x-1 -translate-y-1 scale-90">
                    <EyeOff className="w-3 h-3" />
                  </div>
                )}

                <SocialCard
                  link={link}
                  theme={theme}
                  isEditingMode={isEditingMode}
                  onCardClick={(selected) => {
                    playClickSound();
                    if (isEditingMode) {
                      openEditor(selected);
                    } else {
                      setSelectedCard(selected);
                    }
                  }}
                />

                {/* Edit overlay on hover in edit mode */}
                {isEditingMode && (
                  <div className="absolute inset-0 bg-brand-orange/10 border-2 border-brand-orange rounded-2xl pointer-events-none scale-105 animate-pulse opacity-40 group-hover/card:opacity-100 transition-opacity" />
                )}
              </div>
            ))}

            {/* "+" Add custom social icon card in edit mode */}
            {isEditingMode && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={openNewLinkEditor}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-dashed border-slate-400 hover:border-slate-900 bg-slate-50/50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all cursor-pointer shadow-sm relative"
                title="添加新社交链接"
              >
                <Plus className="w-6 h-6" strokeWidth={3} />
              </motion.button>
            )}
          </div>
        </div>

        {hasMore && (
          <div className="relative z-10 mt-3 pt-3 border-t-2 border-slate-900 border-dashed flex justify-center">
            <button
              onClick={() => {
                playClickSound();
                setIsExpanded(!isExpanded);
              }}
              className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 py-2 px-4 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0f172a] ${
                theme === "dark"
                  ? "bg-slate-900 text-white hover:bg-slate-900"
                  : "bg-slate-50 text-slate-900 hover:bg-white"
              }`}
            >
              {isExpanded ? (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  {locale === "zh" ? "收起" : "Show Less"}
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  {locale === "zh"
                    ? `展示更多 (${activeLinksCount - maxInitialLinks})`
                    : `Show More (${activeLinksCount - maxInitialLinks})`}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Popout Slide-out Card Drawer Modal (Visitor View) */}
      <AnimatePresence>
        {selectedCard && !isEditingMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCard(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-sm p-8 rounded-[2.5rem] border-4 shadow-[12px_12px_0px_#0f172a] overflow-hidden z-10 ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-900 text-white"
                  : "bg-white border-slate-900 text-slate-900"
              }`}
            >
              <div
                className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${selectedCard.color}`}
              />

              <button
                onClick={() => {
                  playClickSound();
                  setSelectedCard(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer text-slate-900"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>

              <div className="flex flex-col items-center text-center mt-3 space-y-6">
                <div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${selectedCard.color} text-white flex items-center justify-center shadow-[6px_6px_0px_#0f172a] border-4 border-slate-900`}
                >
                  <div className="scale-125">
                    {getBrandIcon(selectedCard.id)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h4 className="text-xl font-black font-display uppercase tracking-tighter">
                      {selectedCard.name}
                    </h4>
                    <span className="py-1 px-2 rounded-lg bg-emerald-100 text-emerald-700 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 fill-current" />{" "}
                      {t.social_deck_verified}
                    </span>
                  </div>
                  <p className="text-xs text-brand-orange font-black uppercase tracking-widest mt-2">
                    {selectedCard.username}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-[2rem] border-2 w-full ${
                    theme === "dark"
                      ? "bg-slate-900 border-slate-900 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.5)]"
                      : "bg-slate-50 border-slate-900 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.05)]"
                  }`}
                >
                  <div className="w-40 h-40 flex items-center justify-center relative bg-white border-2 border-slate-900 p-3 rounded-2xl shadow-[6px_6px_0px_#0f172a] mx-auto">
                    <svg
                      className="w-full h-full text-slate-900"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <path d="M0 0h30v10H10v20H0V0zm10 10h10v10H10V10z" />
                      <path d="M70 0h30v30H90V10H70V0zm10 10h10v10H80V10z" />
                      <path d="M0 70h10v20h20v10H0V70zm10 20v-10h10v10H10z" />
                      <path d="M75 75h10v10H75v-10z" />
                      <path d="M35 15h5v5h-5zm10 0h5v10h-5zm10 5h5v5h-5zm0-10h5v5h-5zm10 15h10v5H65zm-15 10h15v5H50zm10 10h5v5h-5zm-20 5h5v5h-5zm10 5h10v5H40zm-15 10h5v5h-5zm10 0h10v5H35zm15 10h5v5H50zm10-5h5v5h-5zm10 5h5v5h-5zM20 35h5v5h-5zm15 10h10v5H35zm15-5h5v5H50zm10 5h10v5H60zm-35 10h5v5h-5zm15 5h5v5h-5zm20-10h5v10h-5z" />
                    </svg>
                    <div
                      className={`absolute inset-0 m-auto w-12 h-12 rounded-xl bg-gradient-to-tr ${selectedCard.color} border-2 border-slate-900 text-white flex items-center justify-center shadow-[3px_3px_0px_#0f172a] scale-95`}
                    >
                      <div className="scale-75">
                        {getBrandIcon(selectedCard.id)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center mt-4">
                    {t.social_deck_qr_desc}
                  </p>
                </div>

                <div className="space-y-2 px-4">
                  <p
                    className={`text-sm font-bold leading-relaxed ${
                      theme === "dark" ? "text-slate-300" : "text-slate-900"
                    }`}
                  >
                    {selectedCard
                      ? getTranslatedCardField(
                          selectedCard.id,
                          "desc",
                          locale,
                          selectedCard.desc,
                        )
                      : ""}
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-orange">
                    {selectedCard
                      ? getTranslatedCardField(
                          selectedCard.id,
                          "count",
                          locale,
                          selectedCard.count,
                        )
                      : ""}
                  </p>
                </div>

                <div className="w-full pt-4">
                  <a
                    href={selectedCard.url}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    onClick={() => playClickSound()}
                    className={`w-full py-4 px-5 rounded-xl text-white font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] bg-gradient-to-r ${selectedCard.color} transition-all transform hover:translate-y-1 hover:translate-x-1 hover:shadow-none active:scale-95`}
                  >
                    <span>{t.social_deck_visit_btn}</span>
                    <ExternalLink className="w-4 h-4" strokeWidth={3} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Popout Edit Form Modal (Edit/Add Mode) */}
      <AnimatePresence>
        {isEditingMode && editingLink && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLink(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-md p-6 rounded-[2rem] border-4 shadow-[12px_12px_0px_#0f172a] overflow-hidden z-50 ${
                theme === "dark"
                  ? "bg-slate-800 border-slate-900 text-white"
                  : "bg-white border-slate-900 text-slate-900"
              }`}
            >
              <div
                className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${formColor}`}
              />

              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-100 border-dashed">
                <span className="text-xs font-black uppercase tracking-widest text-brand-orange">
                  {isAddingNew ? "✨ 添加新社交卡片" : "🛠️ 配置社交卡片"}
                </span>
                <button
                  onClick={() => setEditingLink(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form content */}
              <div className="space-y-3 text-left">
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. Name */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      平台名称 (Platform)
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        // Auto select color gradient if matching known platforms
                        const lower = e.target.value.toLowerCase();
                        if (
                          lower.includes("bilibili") ||
                          lower.includes("哔哩")
                        ) {
                          setFormColor("from-pink-400 to-pink-500");
                        } else if (
                          lower.includes("weibo") ||
                          lower.includes("微博")
                        ) {
                          setFormColor("from-red-400 to-red-500");
                        } else if (lower.includes("github")) {
                          setFormColor("from-slate-700 to-slate-900");
                        } else if (lower.includes("youtube")) {
                          setFormColor("from-red-500 to-rose-600");
                        } else if (
                          lower.includes("twitter") ||
                          lower.includes("x")
                        ) {
                          setFormColor("from-sky-400 to-sky-500");
                        } else if (lower.includes("instagram")) {
                          setFormColor("from-purple-500 to-pink-500");
                        } else if (
                          lower.includes("tiktok") ||
                          lower.includes("抖音")
                        ) {
                          setFormColor("from-indigo-500 to-purple-600");
                        }
                      }}
                      placeholder="如 Bilibili, Weibo"
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 text-xs font-bold focus:outline-none focus:border-brand-orange text-slate-800 bg-white"
                    />
                  </div>

                  {/* 2. Username / Handle */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      账号 ID (Handle)
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="例如: @ANCOOX"
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 text-xs font-bold focus:outline-none focus:border-brand-orange text-slate-800 bg-white"
                    />
                  </div>
                </div>

                {/* 3. URL */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    主页直达 URL (Page Link)
                  </label>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://space.bilibili.com/..."
                    className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 text-[10px] text-slate-500 font-medium focus:outline-none focus:border-brand-orange bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 4. Description */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      简介描述 (Desc)
                    </label>
                    <input
                      type="text"
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="例如: 视频教程..."
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 text-xs font-bold focus:outline-none focus:border-brand-orange text-slate-800 bg-white"
                    />
                  </div>

                  {/* 5. Follower counts */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      关注数指标 (Stats)
                    </label>
                    <input
                      type="text"
                      value={formCount}
                      onChange={(e) => setFormCount(e.target.value)}
                      placeholder="例如: 12万 关注者"
                      className="w-full px-3 py-1.5 rounded-lg border-2 border-slate-900 text-xs font-bold focus:outline-none focus:border-brand-orange text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 6. Color Gradients Presets */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      卡片背景色 (Theme Gradient)
                    </label>
                    <div className="grid grid-cols-8 gap-1.5 bg-slate-50 p-2 rounded-xl border-2 border-slate-100">
                      {COLOR_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormColor(p.value)}
                          className={`py-2 rounded-lg text-[10px] font-black border-2 text-center text-white bg-gradient-to-tr ${p.value} transition ${
                            formColor === p.value
                              ? "border-slate-900 shadow-[2px_2px_0px_#000] scale-110 relative z-10"
                              : "border-transparent hover:border-slate-300"
                          }`}
                          title={p.name}
                        >
                          {p.name.substring(0, 1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 7. Active State Toggle */}
                  <div className="col-span-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border-2 border-slate-900 rounded-xl">
                      <div className="flex items-center gap-2">
                        {formActive ? (
                          <Eye className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-[11px] font-black text-slate-700">
                          在卡带显示 (Show on Deck)
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="w-4 h-4 text-brand-orange focus:ring-brand-orange rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-slate-100 border-dashed">
                  <div>
                    {!isAddingNew && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveLink(editingLink.id, formName)
                        }
                        className="px-4 py-2 bg-white text-red-500 border-2 border-slate-200 hover:border-red-500 hover:bg-red-50 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={3} />
                        <span>删除</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingLink(null)}
                      className="px-5 py-2 bg-white text-slate-600 border-2 border-slate-900 hover:bg-slate-50 font-black text-[11px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0f172a] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#0f172a]"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLink}
                      className="px-6 py-2 bg-brand-orange text-white border-2 border-slate-900 font-black text-[11px] uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_#0f172a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" strokeWidth={3} />
                      <span>保存</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 3D Custom Interactive Card
function SocialCard({
  link,
  theme,
  isEditingMode,
  onCardClick,
}: {
  link: SocialLink;
  theme: string;
  isEditingMode: boolean;
  onCardClick: (link: SocialLink) => void;
}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;

    // Normalize coordinates (-0.5 to 0.5)
    const normalizedX = x / box.width - 0.5;
    const normalizedY = y / box.height - 0.5;

    // Tilt degrees (max 20 degrees)
    setRotateX(-normalizedY * 20);
    setRotateY(normalizedX * 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div
      onClick={() => onCardClick(link)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-[80px] h-auto aspect-square mx-auto p-2 cursor-pointer transition-all duration-300 flex flex-col items-center justify-center text-center select-none ${
        isEditingMode && !link.active ? "opacity-40 grayscale-[40%]" : ""
      }`}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${isHovered ? "-4px" : "0px"})`,
        transition: isHovered
          ? "transform 0.05s ease-out"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Media Brand Icon (Circular badge) */}
      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 border-slate-900 bg-gradient-to-tr ${link.color} text-white flex items-center justify-center shadow-[2px_2px_0px_#0f172a] transition-transform duration-300 ${
          isHovered ? "scale-110 rotate-3" : "scale-100"
        }`}
      >
        <div className="scale-90 md:scale-100">{getBrandIcon(link.id)}</div>
      </div>
    </div>
  );
}
