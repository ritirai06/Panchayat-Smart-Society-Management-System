import { useEffect } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * AppModal — universal responsive modal
 *
 * Props:
 *  open        boolean
 *  onClose     () => void
 *  title       string          (shown in plain header)
 *  maxWidth    string          e.g. 'max-w-md' (default) | 'max-w-lg' | 'max-w-2xl'
 *  hero        ReactNode       optional hero/image section rendered above the header
 *  footer      ReactNode       optional sticky footer
 *  children    ReactNode       scrollable body content
 *  noPadding   boolean         skip body padding (useful when hero fills top)
 */
export default function AppModal({
  open,
  onClose,
  title,
  maxWidth = 'max-w-md',
  hero,
  footer,
  children,
  noPadding = false,
}) {
  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center px-3 pb-3 sm:pb-0"
        >
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`
              relative z-10 flex flex-col w-full ${maxWidth}
              bg-white shadow-2xl overflow-hidden
              rounded-t-3xl sm:rounded-3xl
              max-h-[90vh]
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Optional hero */}
            {hero}

            {/* Header (skip when hero already has its own close/title) */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <h3 className="text-base font-bold text-slate-900 truncate pr-4">{title}</h3>
                <button
                  onClick={onClose}
                  className="btn-icon flex-shrink-0"
                  aria-label="Close"
                  style={{ outline: 'none' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Scrollable body */}
            <div className={`flex-1 overflow-y-auto ${noPadding ? '' : 'px-5 py-4'}`}>
              {children}
            </div>

            {/* Optional footer */}
            {footer && (
              <div className="border-t border-slate-100 px-5 py-4 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
