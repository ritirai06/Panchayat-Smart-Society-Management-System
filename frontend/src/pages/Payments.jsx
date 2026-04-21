import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import { FiDollarSign, FiBell, FiCheckCircle, FiX, FiSearch, FiSettings } from 'react-icons/fi'

const statusBadge = (s) => {
  const map = {
    Paid: 'badge-paid',
    Pending: 'badge-pending',
    Overdue: 'badge-overdue',
    Waived: 'bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium'
  }
  return map[s] || 'badge-pending'
}

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl w-full max-w-md">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="font-semibold text-lg">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FiX size={20} /></button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
)

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ month: '', status: '' })
  const [modal, setModal] = useState(null) // 'generate'|'pay'|'status'
  const [selectedPayment, setSelectedPayment] = useState(null)
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

  const totalCollected = stats.find(s => s._id === 'Paid')?.total || 0
  const totalPending = stats.find(s => s._id === 'Pending')?.total || 0
  const totalOverdue = stats.find(s => s._id === 'Overdue')?.total || 0
  const pendingCount = stats.find(s => s._id === 'Pending')?.count || 0

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
          <p className="text-sm text-gray-500">{pendingCount} pending payment{pendingCount !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={sendReminders} className="btn-secondary flex items-center gap-2 text-sm">
              <FiBell /> Send Reminders
            </button>
            <button onClick={() => setModal('generate')} className="btn-primary flex items-center gap-2 text-sm">
              <FiDollarSign /> Generate Bills
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-emerald-500">
          <p className="text-sm text-emerald-700 font-medium">Collected</p>
          <p className="text-2xl font-bold text-emerald-800">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-indigo-400 mt-1">{stats.find(s => s._id === 'Paid')?.count || 0} payments</p>
        </div>
        <div className="card border-l-4 border-l-amber-400">
          <p className="text-sm text-amber-600 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-700">₹{totalPending.toLocaleString('en-IN')}</p>
          <p className="text-xs text-amber-500 mt-1">{pendingCount} payments</p>
        </div>
        <div className="card border-l-4 border-l-red-400">
          <p className="text-sm text-red-500 font-medium">Overdue</p>
          <p className="text-2xl font-bold text-red-600">₹{totalOverdue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-red-400 mt-1">{stats.find(s => s._id === 'Overdue')?.count || 0} payments</p>
        </div>
        <div className="card border-l-4 border-l-zinc-300">
          <p className="text-sm text-zinc-500 font-medium">Total Records</p>
          <p className="text-2xl font-bold text-zinc-700">{payments.length}</p>
          <p className="text-xs text-slate-400 mt-1">All time</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input type="month" className="input w-auto text-sm" value={filter.month}
          onChange={e => setFilter({ ...filter, month: e.target.value })} />
        <select className="input w-auto text-sm" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          {['Pending', 'Paid', 'Overdue', 'Waived'].map(s => <option key={s}>{s}</option>)}
        </select>
        {(filter.month || filter.status) && (
          <button onClick={() => setFilter({ month: '', status: '' })} className="btn-secondary text-sm flex items-center gap-1">
            <FiX size={14} /> Clear
          </button>
        )}
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50/50 border-b border-indigo-100">
              <tr>
                <th className="table-head">Resident</th>
                <th className="table-head">Flat</th>
                <th className="table-head">Month</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Status</th>
                <th className="table-head">Due Date</th>
                <th className="table-head">Paid On</th>
                {isAdmin && <th className="table-head">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {payments.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No payment records found</td></tr>
              )}
              {payments.map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-cell font-medium text-slate-900">{p.resident?.name || 'N/A'}</td>
                  <td className="table-cell">Flat {p.flat?.flatNumber || 'N/A'}</td>
                  <td className="table-cell">{p.month}</td>
                  <td className="table-cell font-semibold text-indigo-700">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="table-cell"><span className={statusBadge(p.status)}>{p.status}</span></td>
                  <td className="table-cell">{new Date(p.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="table-cell">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}
                    {p.transactionId && <p className="text-xs text-slate-400">{p.transactionId}</p>}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {(p.status === 'Pending' || p.status === 'Overdue') && (
                          <button onClick={() => openPayModal(p)}
                            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-xs font-semibold hover:bg-emerald-50 px-2 py-1.5 rounded-lg transition-colors">
                            <FiCheckCircle size={12} /> Mark Paid
                          </button>
                        )}
                        <button onClick={() => openStatusModal(p)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-medium hover:bg-indigo-50 px-2 py-1.5 rounded-lg transition-colors">
                          <FiSettings size={12} /> Change Status
                        </button>
                      </div>
                    </td>
                  ) : (
                    <td className="px-4 py-3">
                      {(p.status === 'Pending' || p.status === 'Overdue') && (
                        <button 
                          onClick={() => handlePayment(p)}
                          disabled={submitting}
                          className="flex items-center gap-1 text-white bg-emerald-600 hover:bg-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                          <FiDollarSign size={12} /> Pay Now
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Bills Modal */}
      {modal === 'generate' && (
        <Modal title="Generate Monthly Bills" onClose={() => setModal(null)}>
          <form onSubmit={generateBills} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
              <input type="month" className="input" value={generateMonth}
                onChange={e => setGenerateMonth(e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1">Bills will be generated for all active residents</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700">
              <p className="font-medium">This will create maintenance bills for all active residents.</p>
              <p className="mt-1 text-indigo-500">Duplicate bills for the same month will be skipped.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Generating...' : 'Generate Bills'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark Paid Modal */}
      {modal === 'pay' && selectedPayment && (
        <Modal title="Record Payment" onClose={() => { setModal(null); setSelectedPayment(null) }}>
          <form onSubmit={markPaid} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{selectedPayment.resident?.name}</p>
              <p className="text-gray-500">Flat {selectedPayment.flat?.flatNumber} • {selectedPayment.month}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">₹{selectedPayment.amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="input" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                {['Online', 'Cash', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (optional)</label>
              <input className="input" placeholder="TXN123456 / Cheque No." value={payForm.transactionId}
                onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setModal(null); setSelectedPayment(null) }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Saving...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* Change Status Modal */}
      {modal === 'status' && selectedPayment && (
        <Modal title="Update Payment Status" onClose={() => { setModal(null); setSelectedPayment(null) }}>
          <form onSubmit={markPaid} className="space-y-4">
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100">
              <p className="font-bold text-slate-900">{selectedPayment.resident?.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">Flat {selectedPayment.flat?.flatNumber} · {selectedPayment.month}</p>
              <p className="text-lg font-black text-indigo-700 mt-2">₹{selectedPayment.amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <label className="input-label">Select New Status</label>
              <select className="input" value={payForm.status} onChange={e => setPayForm({ ...payForm, status: e.target.value })}>
                {['Pending', 'Paid', 'Overdue', 'Waived'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {payForm.status === 'Paid' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="input-label">Payment Method</label>
                  <select className="input" value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                    {['Online', 'Cash', 'Cheque', 'UPI'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Transaction ID / Reference</label>
                  <input className="input" placeholder="e.g. TXN123456" value={payForm.transactionId}
                    onChange={e => setPayForm({ ...payForm, transactionId: e.target.value })} />
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setModal(null); setSelectedPayment(null) }} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
