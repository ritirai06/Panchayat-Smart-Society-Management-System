import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── Page Header ───────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="text-xl font-bold text-text-primary">{title}</h1>
      {subtitle && <p className="section-sub">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
)

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, trend, trendUp, color = 'brand' }) => {
  const colorMap = {
    brand:   'bg-brand/10    text-brand         ring-brand/20',
    success: 'bg-status-success/10 text-status-success ring-status-success/20',
    warning: 'bg-status-warning/10 text-status-warning ring-status-warning/20',
    danger:  'bg-status-danger/10  text-status-danger  ring-status-danger/20',
    info:    'bg-status-info/10    text-status-info    ring-status-info/20',
    muted:   'bg-surface text-text-muted ring-surface-border',
  }
  const TrendIcon = trendUp === true ? TrendingUp : trendUp === false ? TrendingDown : Minus
  const trendColor = trendUp === true ? 'text-status-success' : trendUp === false ? 'text-status-danger' : 'text-text-muted'

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="stat-card"
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${colorMap[color] || colorMap.brand}`}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold text-text-primary leading-none mb-1">{value ?? '—'}</p>
        <p className="text-xs text-text-muted">{label}</p>
        {(sub || trend) && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {trend && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
                <TrendIcon size={11} />{trend}
              </span>
            )}
            {sub && <span className="text-xs text-text-disabled">{sub}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-md', footer }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/15 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          className={`relative z-10 w-full ${maxWidth} rounded-2xl border border-surface-border bg-bg-secondary shadow-modal`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h3 className="text-base font-semibold text-text-primary">{title}</h3>
            <button onClick={onClose} className="btn-icon"><X size={16} /></button>
          </div>
          <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-surface-border px-5 py-4">{footer}</div>}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
)

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon = AlertCircle, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface ring-1 ring-surface-border">
      <Icon size={22} className="text-text-disabled" />
    </div>
    <p className="text-sm font-semibold text-text-secondary">{title}</p>
    {subtitle && <p className="mt-1 text-xs text-text-muted max-w-xs">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

// ── Loading Spinner ───────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-surface-border border-t-brand`} />
    </div>
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', hover = false, onClick }) => (
  <motion.div
    whileHover={hover ? { y: -2 } : undefined}
    transition={{ duration: 0.15 }}
    onClick={onClick}
    className={`card ${hover ? 'cursor-pointer hover:border-brand/20 hover:shadow-card-lg' : ''} ${className}`}
  >
    {children}
  </motion.div>
)

// ── Section Card ──────────────────────────────────────────────────────────────
export const SectionCard = ({ title, subtitle, icon: Icon, actions, children }) => (
  <div className="card">
    <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface ring-1 ring-surface-border">
            <Icon size={14} className="text-text-muted" />
          </div>
        )}
        <div>
          <p className="section-title">{title}</p>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    {children}
  </div>
)

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const SkeletonCard = ({ lines = 3 }) => (
  <div className="card space-y-3">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-16 rounded" />
    {lines > 2 && <div className="skeleton h-3 w-32 rounded" />}
  </div>
)

// ── Table Wrapper ─────────────────────────────────────────────────────────────
export const Table = ({ headers, children, empty }) => (
  <div className="table-wrap">
    <table className="w-full">
      <thead>
        <tr className="border-b border-surface-border">
          {headers.map(h => <th key={h} className="table-head">{h}</th>)}
        </tr>
      </thead>
      <tbody>{empty ? (
        <tr><td colSpan={headers.length} className="py-12 text-center text-sm text-text-muted">{empty}</td></tr>
      ) : children}</tbody>
    </table>
  </div>
)
