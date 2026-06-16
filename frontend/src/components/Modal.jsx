import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, size = 'md' }) {
  const [visible, setVisible] = useState(true);
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];

  function close() { setVisible(false); }

  return createPortal(
    <AnimatePresence onExitComplete={onClose}>
      {visible && (
        <div className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`relative w-full ${sizeClass} bg-cream rounded-t-3xl lg:rounded-3xl overflow-hidden flex flex-col max-h-[92dvh] lg:max-h-[92vh]`}
            style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-playfair text-lg font-bold text-ink">{title}</h2>
              <button onClick={close}
                className="w-8 h-8 rounded-full bg-parchment hover:bg-border flex items-center justify-center transition text-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
