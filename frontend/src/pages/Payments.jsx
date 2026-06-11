import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { DollarSign, Bell, CheckCircle, X, Search, Settings, Download, Eye, FileText, Printer } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const statusBadge = (s) => {
  const map = {
    Paid: 'badge-paid',
    Pending: 'badge-pending',
    Overdue: 'badge-overdue',
    Waived: 'bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-xs font-semibold'
  }
  return map[s] || 'badge-pending'
}

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-modal w-full max-w-md p-6 animate-scale-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h3 className="font-bold text-base text-slate-900">{title}</h3>
        <button onClick={onClose} className="btn-icon"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
)

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ month: '', status: '' })
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'generate'|'pay'|'status'
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [invoicePreview, setInvoicePreview] = useState(null)
  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payForm, setPayForm] = useState({ transactionId: '', paymentMethod: 'Online', status: 'Paid' })
  const [submitting, setSubmitting] = useState(false)
  
  const societyId = user?.society?._id || user?.society
  const isAdmin = user?.role === 'admin'

  const handlePayment = async (payment) => {
    try {
      setSubmitting(true)
      // 1. Create order on backend
      const { data: orderData } = await api.post(`/payments/${payment._id}/create-order`)
      if (!orderData.success) throw new Error(orderData.message)

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YOUR_KEY_ID", // Use env or fallback for testing
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Panchayat App",
        description: `Maintenance Payment - ${payment.month}`,
        order_id: orderData.order.id,
        handler: async (response) => {
          try {
            // 2. Verify payment on backend
            const { data: verifyData } = await api.post('/payments/verify', {
              ...response,
              paymentId: payment._id
            })
            if (verifyData.success) {
              toast.success("Payment Successful!")
              fetchPayments()
            } else {
              toast.error("Verification Failed")
            }
          } catch (err) {
            toast.error("Verification Error")
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: {
          color: "#10b981"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || "Payment initiation failed")
    } finally {
      setSubmitting(false)
    }
  }

  const fetchPayments = useCallback(async () => {
    if (!societyId) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.month) params.append('month', filter.month)
      if (filter.status) params.append('status', filter.status)
      const [p, s] = await Promise.all([
        api.get(`/payments/society/${societyId}?${params}`),
        api.get(`/payments/stats/${societyId}`)
      ])
      setPayments(p.data.payments)
      setStats(s.data.stats)
    } catch { toast.error('Failed to load payments') }
    finally { setLoading(false) }
  }, [societyId, filter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  // Auto-mark overdue payments (past due date, still pending)
  useEffect(() => {
    const today = new Date()
    payments.forEach(async (p) => {
      if (p.status === 'Pending' && new Date(p.dueDate) < today) {
        await api.put(`/payments/${p._id}/pay`, { status: 'Overdue' }).catch(() => {})
      }
    })
  }, [payments])

  const generateBills = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { data } = await api.post('/payments/generate', { societyId, month: generateMonth })
      toast.success(data.message)
      setModal(null); fetchPayments()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSubmitting(false) }
  }

  const openPayModal = (payment) => {
    setSelectedPayment(payment)
    setPayForm({ transactionId: '', paymentMethod: 'Online' })
    setModal('pay')
  }

  const openStatusModal = (payment) => {
    setSelectedPayment(payment)
    setPayForm({ transactionId: '', paymentMethod: 'Admin', status: payment.status })
    setModal('status')
  }

  const markPaid = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.put(`/payments/${selectedPayment._id}/pay`, payForm)
      toast.success(`Payment updated to ${payForm.status}!`)
      setModal(null); setSelectedPayment(null); fetchPayments()
    } catch { toast.error('Failed') }
    finally { setSubmitting(false) }
  }

  const sendReminders = async () => {
    try {
      const { data } = await api.post(`/payments/reminders/${societyId}`)
      toast.success(data.message)
    } catch { toast.error('Failed to send reminders') }
  }

  const exportPayments = () => {
    if (payments.length === 0) {
      toast.error('No payments to export')
      return
    }
    const headers = 'Resident,Flat,Month,Amount,Status,Due Date,Paid At,Reference No\n'
    const rows = payments.map(p => `"${p.resident?.name || 'N/A'}","Flat ${p.flat?.flatNumber || 'N/A'}","${p.month}",${p.amount},"${p.status}","${new Date(p.dueDate).toLocaleDateString('en-IN')}","${p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}","${p.transactionId || ''}"`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `panchayat_finance_report.csv`
    link.click()
    toast.success('CSV report exported!')
  }

  const printInvoice = () => {
    window.print()
  }

  const totalCollected = stats.find(s => s._id === 'Paid')?.total || 0
  const totalPending = stats.find(s => s._id === 'Pending')?.total || 0
  const totalOverdue = stats.find(s => s._id === 'Overdue')?.total || 0
  const pendingCount = stats.find(s => s._id === 'Pending')?.count || 0
  const totalDuesExpected = totalCollected + totalPending + totalOverdue
  const collectionRate = totalDuesExpected ? Math.round((totalCollected / totalDuesExpected) * 100) : 0

  const filteredPayments = payments.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.resident?.name || '').toLowerCase().includes(q) || 
           (p.flat?.flatNumber || '').toLowerCase().includes(q) ||
           (p.month || '').toLowerCase().includes(q)
  })

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Finance Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">{pendingCount} pending payment invoices</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportPayments} className="btn-secondary text-sm">
            <Download size={14} /> Export CSV
          </button>
          {isAdmin && (
            <>
              <button onClick={sendReminders} className="btn-secondary text-sm">
                <Bell size={14} /> Send Reminders
              </button>
              <button onClick={() => setModal('generate')} className="btn-primary text-sm">
                <DollarSign size={14} /> Generate Bills
              </button>
            </>
          )}
        </div>
      </div>

      {/* Finance KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card border-l-[3px] border-l-brand flex flex-col justify-between h-28 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Collected</p>
          <p className="text-xl font-black text-slate-900">₹{totalCollected.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{collectionRate}% collection efficiency</span>
        </div>
        <div className="card border-l-[3px] border-l-amber-400 flex flex-col justify-between h-28 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Amount</p>
          <p className="text-xl font-black text-slate-900">₹{totalPending.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-400 font-semibold">{pendingCount} active bills</span>
        </div>
        <div className="card border-l-[3px] border-l-rose-500 flex flex-col justify-between h-28 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Total</p>
          <p className="text-xl font-black text-slate-900">₹{totalOverdue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-rose-500 font-semibold">Exceeded due dates</span>
        </div>
        <div className="card border-l-[3px] border-l-slate-300 flex flex-col justify-between h-28 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Statements</p>
          <p className="text-xl font-black text-slate-900">{payments.length}</p>
          <span className="text-[10px] text-slate-400 font-semibold">Ledger entries</span>
        </div>
      </div>

      {/* Analytics Graph Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 lg:col-span-2 space-y-4">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Revenue Breakdown</p>
          <div className="h-44">
            <Bar 
              data={{
                labels: ['Collected', 'Pending', 'Overdue'],
                datasets: [{
                  data: [totalCollected, totalPending, totalOverdue],
                  backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                  borderRadius: 8,
                  maxBarThickness: 50,
                }]
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, border: { display: false } },
                  y: { grid: { color: '#f1f5f9' }, border: { display: false } },
                }
              }}
            />
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="card p-5 space-y-4">
          <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Collection Channels</p>
          <div className="space-y-3 pt-2 text-xs font-semibold text-slate-600">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Razorpay Gateway (UPI/Card)</span>
                <span>65%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand rounded-full" style={{ width: '65%' }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Cheque Clearing</span>
                <span>20%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Cash Payments</span>
                <span>15%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-450 bg-amber-500 rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
          <input className="input pl-9 text-xs py-2" placeholder="Search by name, flat, month..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input type="month" className="input w-auto text-xs py-2" value={filter.month}
          onChange={e => setFilter({ ...filter, month: e.target.value })} />
        <select className="input w-auto text-xs py-2" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          {['Pending', 'Paid', 'Overdue', 'Waived'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(filter.month || filter.status || search) && (
          <button onClick={() => { setFilter({ month: '', status: '' }); setSearch('') }} className="btn-secondary text-xs py-2 flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Invoices List Table */}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-head">Resident details</th>
              <th className="table-head">Allocated Unit</th>
              <th className="table-head">Billing Cycle</th>
              <th className="table-head">Amount Due</th>
              <th className="table-head">Billing Status</th>
              <th className="table-head">Due Date</th>
              <th className="table-head">Settled On</th>
              <th className="table-head text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-medium">No invoice transactions logged.</td></tr>
            ) : (
              filteredPayments.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-cell font-bold text-slate-800">{p.resident?.name || 'N/A'}</td>
                  <td className="table-cell font-semibold">Flat {p.flat?.flatNumber || 'N/A'}</td>
                  <td className="table-cell text-xs font-mono">{p.month}</td>
                  <td className="table-cell font-bold text-brand">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="table-cell"><span className={statusBadge(p.status)}>{p.status}</span></td>
                  <td className="table-cell text-xs">{new Date(p.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell text-xs text-slate-500 font-medium">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                    {p.transactionId && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.transactionId}</p>}
                  </td>
                  <td className="table-cell text-right">
                    <div className="inline-flex gap-1 items-center justify-end">
                      <button onClick={() => setInvoicePreview(p)} title="Preview Digital Invoice"
                        className="p-1.5 text-slate-400 hover:text-brand hover:bg-slate-50 rounded-lg transition-colors">
                        <Eye size={14} />
                      </button>
                      {isAdmin ? (
                        <>
                          {(p.status === 'Pending' || p.status === 'Overdue') && (
                            <button onClick={() => openPayModal(p)}
                              className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded text-xs font-bold transition-all">
                              Mark Paid
                            </button>
                          )}
                          <button onClick={() => openStatusModal(p)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors" title="Change Invoice Status">
                            <Settings size={13} />
                          </button>
                        </>
                      ) : (
                        (p.status === 'Pending' || p.status === 'Overdue') && (
                          <button 
                            onClick={() => handlePayment(p)}
                            disabled={submitting}
                            className="text-white bg-brand hover:bg-brand-dark px-3 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50">
                            Pay Now
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Preview Slide Drawer */}
      {invoicePreview && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-xs print:bg-white print:p-0">
          <div className="w-full max-w-lg bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl animate-slide-in-r print:border-none print:w-full print:h-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText size={14} className="text-brand" /> Digital Invoice Breakdown
              </h3>
              <button onClick={() => setInvoicePreview(null)} className="btn-icon"><X size={18} /></button>
            </div>

            {/* Printable Invoice Page */}
            <div id="printable-invoice" className="flex-1 overflow-y-auto p-8 space-y-6 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Panchayat Society</h2>
                  <p className="text-[10px] text-slate-400 mt-1">Maintenance & Utilities Ledger</p>
                </div>
                <div className="text-right">
                  <span className={statusBadge(invoicePreview.status)}>{invoicePreview.status}</span>
                  <p className="text-[10px] text-slate-400 font-mono mt-2">Invoice #{invoicePreview._id?.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                <div>
                  <p className="text-slate-400 text-[9px] uppercase font-bold mb-1">Billing To</p>
                  <p className="font-bold text-slate-800">{invoicePreview.resident?.name || 'Resident Name'}</p>
                  <p className="mt-0.5">Flat {invoicePreview.flat?.flatNumber || 'N/A'}</p>
                  <p className="text-slate-400 font-mono font-medium text-[10px]">{invoicePreview.resident?.phone || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-[9px] uppercase font-bold mb-1">Details</p>
                  <p>Billing month: <span className="font-bold text-slate-800 font-mono">{invoicePreview.month}</span></p>
                  <p>Issue Date: {new Date(invoicePreview.dueDate).toLocaleDateString('en-IN')}</p>
                  <p className="text-rose-500 font-bold">Due Date: {new Date(invoicePreview.dueDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-inner bg-slate-50/50">
                <div className="grid grid-cols-3 bg-slate-100/60 p-3 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Description</span>
                  <span className="text-center">Rate / Cycle</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="divide-y divide-slate-100 p-3 space-y-2">
                  <div className="grid grid-cols-3 text-slate-700 font-medium">
                    <span>Society Maintenance Charge</span>
                    <span className="text-center">Monthly recurring</span>
                    <span className="text-right">₹{invoicePreview.amount}</span>
                  </div>
                  <div className="grid grid-cols-3 text-slate-700 font-medium pt-2">
                    <span>Shared Lift/Cleaning Maintenance</span>
                    <span className="text-center">Included</span>
                    <span className="text-right">₹0</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <div className="text-right space-y-1.5 min-w-[150px]">
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{invoicePreview.amount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-500">
                    <span>Tax (0% GST)</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-2 text-sm">
                    <span>Total Amount</span>
                    <span>₹{invoicePreview.amount}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 italic text-center pt-8 border-t border-slate-100/80">
                Thank you for contributing to your society wellness and maintenance.
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-2 print:hidden">
              <button onClick={printInvoice} className="btn-secondary flex-1 justify-center py-2 text-xs font-semibold">
                <Printer size={14} /> Print Invoice
              </button>
              <button onClick={() => setInvoicePreview(null)} className="btn-primary flex-1 justify-center py-2 text-xs font-bold">
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Bills Modal */}
      {modal === 'generate' && (
        <Modal title="Generate Monthly Maintenance" onClose={() => setModal(null)}>
          <form onSubmit={generateBills} className="space-y-4">
            <div>
              <label className="input-label">Select Billing Month</label>
              <input type="month" className="input" value={generateMonth}
                onChange={e => setGenerateMonth(e.target.value)} required />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Invoices will be auto-generated for all mapped residents</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-semibold text-emerald-800 space-y-1">
              <p>This triggers recurring maintenance bills for all units.</p>
              <p className="text-indigo-500 font-medium">Any double invoices raised for the same cycle will be skipped.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center text-xs font-bold animate-pulse" disabled={submitting}>
                {submitting ? 'Generating...' : 'Confirm Generation'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record Cash Payment Modal */}
      {modal === 'pay' && selectedPayment && (
        <Modal title="Record Cash Ledger" onClose={() => { setModal(null); setSelectedPayment(null) }}>
          <form onSubmit={markPaid} className="space-y-4 font-sans text-xs">
            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="font-bold text-slate-900">{selectedPayment.resident?.name}</p>
              <p className="text-slate-400 font-semibold mt-0.5">Flat {selectedPayment.flat?.flatNumber} • Month: {selectedPayment.month}</p>
              <p className="text-base font-black text-brand mt-2">₹{selectedPayment.amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="input-label">Payment Mode</label>
              <select className="input text-xs" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                {['Cash', 'Cheque', 'UPI', 'NetBanking'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Reference / Slip ID (optional)</label>
              <input className="input" placeholder="e.g. CHQ00123 / UPI_REF" value={payForm.transactionId}
                onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setModal(null); setSelectedPayment(null) }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center text-xs font-bold" disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Receipt'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Status Modal */}
      {modal === 'status' && selectedPayment && (
        <Modal title="Adjust Billing Status" onClose={() => { setModal(null); setSelectedPayment(null) }}>
          <form onSubmit={markPaid} className="space-y-4 font-sans text-xs">
            <div className="bg-slate-50 border rounded-2xl p-4">
              <p className="font-bold text-slate-900">{selectedPayment.resident?.name}</p>
              <p className="text-slate-400 font-semibold mt-0.5">Flat {selectedPayment.flat?.flatNumber} · Month: {selectedPayment.month}</p>
              <p className="text-base font-black text-brand mt-2">₹{selectedPayment.amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="input-label">Change Status</label>
              <select className="input text-xs" value={payForm.status} onChange={e => setPayForm({ ...payForm, status: e.target.value })}>
                {['Pending', 'Paid', 'Overdue', 'Waived'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {payForm.status === 'Paid' && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="input-label">Adjustment Mode</label>
                  <select className="input text-xs" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                    {['Online', 'Cash', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Adjustment Reference ID</label>
                  <input className="input" placeholder="Slip or TXN reference" value={payForm.transactionId}
                    onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} />
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setModal(null); setSelectedPayment(null) }} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" className="btn-primary flex-1 justify-center text-xs font-bold" disabled={submitting}>
                {submitting ? 'Updating...' : 'Save Adjustments'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
