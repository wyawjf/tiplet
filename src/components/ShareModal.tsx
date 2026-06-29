import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, X, Twitter, Facebook, MessageCircle, Instagram, Youtube, Linkedin } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  t: any;
  showToast: (msg: string) => void;
}

export default function ShareModal({ isOpen, onClose, url, t, showToast }: ShareModalProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    showToast('Link copied!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border-2 border-slate-900 rounded-[2rem] shadow-[8px_8px_0px_#0f172a] p-6 md:p-8 w-full max-w-lg relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition">
              <X className="w-5 h-5 text-slate-900" />
            </button>

            <h2 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight mb-2">Share your page</h2>
            <p className="text-sm text-slate-600 font-bold mb-6">Earn more by sharing your page regularly.</p>
            
            <div className="bg-slate-100 p-2 rounded-2xl border-2 border-slate-900 flex items-center gap-2 mb-6">
              <input 
                type="text" 
                value={url} 
                readOnly 
                className="flex-1 bg-transparent px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none"
              />
              <button 
                onClick={handleCopy}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 mb-6">
              {[Twitter, MessageCircle, Linkedin, Instagram, MessageCircle, Youtube].map((Icon, i) => (
                <div key={i} className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer">
                  <Icon className="w-5 h-5" />
                </div>
              ))}
            </div>

            <button className="w-full py-3 mb-2 bg-slate-200 rounded-2xl text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
              <Twitter className="w-4 h-4" /> Share on X
            </button>
            <button className="w-full py-3 bg-slate-200 rounded-2xl text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
              <Facebook className="w-4 h-4" /> Share on Facebook
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
