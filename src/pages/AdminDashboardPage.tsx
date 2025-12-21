import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
  LogOut,
  ClipboardList,
  Wallet,
  Search,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';

type Transaction = {
  id: string;
  order_id: string;
  expert_name: string;
  user_name: string;
  user_email: string;
  service_name: string;
  service_category: string;
  booking_date: string;
  booking_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
};

type WithdrawRequest = {
  id: string;
  expert_id: string;
  expert_name: string;
  expert_role: string;
  expert_avatar: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  notes: string;
  status: string;
  created_at: string;
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdraw'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWithdrawId, setSelectedWithdrawId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(10);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('admin_access_token');
    if (!adminToken) {
      navigate('/admin', { replace: true });
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch transactions (bookings with related data)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          order_id,
          booking_date,
          booking_time,
          total_price,
          status,
          payment_status,
          created_at,
          expert:experts(id, name, role, avatar_url),
          user:users(id, name, email),
          session_type:session_types(id, name, category)
        `)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      const formattedTransactions: Transaction[] = (bookingsData || []).map((b: any) => ({
        id: b.id,
        order_id: b.order_id || b.id.slice(0, 8).toUpperCase(),
        expert_name: b.expert?.name || 'Unknown Expert',
        user_name: b.user?.name || 'Unknown User',
        user_email: b.user?.email || '',
        service_name: b.session_type?.name || 'Unknown Service',
        service_category: b.session_type?.category || 'online-chat',
        booking_date: b.booking_date,
        booking_time: b.booking_time,
        total_price: b.total_price,
        status: b.status,
        payment_status: b.payment_status,
        created_at: b.created_at
      }));

      setTransactions(formattedTransactions);

      // Fetch withdraw requests with expert info
      const { data: withdrawData, error: withdrawError } = await supabase
        .from('withdraw_requests')
        .select(`
          id,
          expert_id,
          amount,
          bank_name,
          account_number,
          account_name,
          notes,
          status,
          created_at,
          expert:experts(id, name, role, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (withdrawError) {
        console.warn('Error fetching withdraw requests:', withdrawError);
        // Don't throw - table might not exist yet
      }

      const formattedWithdraws: WithdrawRequest[] = (withdrawData || []).map((w: any) => ({
        id: w.id,
        expert_id: w.expert_id,
        expert_name: w.expert?.name || 'Unknown Expert',
        expert_role: w.expert?.role || '',
        expert_avatar: w.expert?.avatar_url || '',
        amount: w.amount,
        bank_name: w.bank_name,
        account_number: w.account_number,
        account_name: w.account_name,
        notes: w.notes || '',
        status: w.status,
        created_at: w.created_at
      }));

      setWithdrawRequests(formattedWithdraws);

    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError('Gagal memuat data. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_user_id');
    navigate('/admin', { replace: true });
  };

  const handleApproveClick = (id: string) => {
    setSelectedWithdrawId(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedWithdrawId(null);
  };

  const confirmApprove = async () => {
    if (!selectedWithdrawId) return;

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('withdraw_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawId);

      if (error) throw error;

      // Update local state
      setWithdrawRequests(prev =>
        prev.map(item =>
          item.id === selectedWithdrawId
            ? { ...item, status: 'completed' }
            : item
        )
      );

      closeModal();
    } catch (err) {
      console.error('Error approving withdraw:', err);
      alert('Gagal menyetujui withdraw. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'paid') {
      return (
        <span className="px-2 py-1 rounded text-xs font-bold border bg-green-100 text-green-700 border-green-200">
          Success
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="px-2 py-1 rounded text-xs font-bold border bg-red-100 text-red-700 border-red-200">
          Cancelled
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded text-xs font-bold border bg-yellow-100 text-yellow-700 border-yellow-200">
        Pending
      </span>
    );
  };

  const getWithdrawStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold border border-orange-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Request
          </span>
        );
    }
  };

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(10);
  }, [searchQuery, dateFilter]);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.expert_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.order_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = dateFilter === '' ||
      t.booking_date === dateFilter ||
      t.created_at.startsWith(dateFilter);

    return matchesSearch && matchesDate;
  });

  // Count pending withdraws
  const pendingWithdrawCount = withdrawRequests.filter(w => w.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">

      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex z-20">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <span className="text-xl font-bold italic text-purple-600">MentorinAja</span>
          <span className="ml-2 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition text-left ${activeTab === 'transactions'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
          >
            <ClipboardList className="w-5 h-5" />
            Transaction
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition text-left relative ${activeTab === 'withdraw'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
          >
            <Wallet className="w-5 h-5" />
            Withdraw
            {pendingWithdrawCount > 0 && (
              <span className="absolute right-3 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingWithdrawCount}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-red-600 transition"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">

        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-slate-800">
            {activeTab === 'transactions' ? 'Daftar Transaksi' : 'Request Withdraw'}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            <span className="text-sm font-medium text-slate-600">Super Admin</span>
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">A</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* VIEW: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div>
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari Expert atau User..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                    />
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:border-purple-500 outline-none"
                  />
                </div>
                <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-sm w-full sm:w-auto flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Expert</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Layanan</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada transaksi</p>
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.slice(0, visibleCount).map((trx) => (
                          <tr key={trx.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                              #{trx.order_id?.slice(0, 8) || trx.id.slice(0, 8)}
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{trx.expert_name}</td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-slate-900">{trx.user_name}</div>
                                <div className="text-xs text-gray-500">{trx.user_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{trx.service_name}</td>
                            <td className="px-6 py-4 text-gray-500">
                              {formatDate(trx.booking_date || trx.created_at)}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(trx.total_price)}</td>
                            <td className="px-6 py-4">
                              {getStatusBadge(trx.status, trx.payment_status)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex flex-col items-center gap-3">
                  {filteredTransactions.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
                    >
                      Tampilkan Lebih Banyak ({filteredTransactions.length - visibleCount} lagi)
                    </button>
                  )}
                  <p className="text-xs text-gray-500">
                    Menampilkan {Math.min(visibleCount, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: WITHDRAW */}
          {activeTab === 'withdraw' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Request Withdraw Pending</h2>
                  <p className="text-sm text-gray-500">Segera proses permintaan pencairan dana expert.</p>
                </div>
                {pendingWithdrawCount > 0 && (
                  <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                    {pendingWithdrawCount} Menunggu Approval
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-purple-50 border-b border-purple-100 text-xs font-bold text-purple-800 uppercase tracking-wider">
                        <th className="px-6 py-4">Tanggal Request</th>
                        <th className="px-6 py-4">Info Expert</th>
                        <th className="px-6 py-4">Rekening Tujuan</th>
                        <th className="px-6 py-4">Nominal</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {withdrawRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>Belum ada request withdraw</p>
                          </td>
                        </tr>
                      ) : (
                        withdrawRequests.map((wd) => (
                          <tr key={wd.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-gray-500">
                              {formatDate(wd.created_at)}<br />
                              <span className="text-xs">{formatTime(wd.created_at)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={wd.expert_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${wd.expert_name}`}
                                  alt={wd.expert_name}
                                  className="w-8 h-8 rounded-full bg-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{wd.expert_name}</div>
                                  <div className="text-xs text-gray-500">{wd.expert_role}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              <div className="font-medium">{wd.bank_name}</div>
                              <div className="text-xs">{wd.account_number}</div>
                              <div className="text-xs text-gray-400">a.n. {wd.account_name}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 text-base">{formatCurrency(wd.amount)}</td>
                            <td className="px-6 py-4">
                              {getWithdrawStatusBadge(wd.status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {wd.status === 'pending' ? (
                                <button
                                  onClick={() => handleApproveClick(wd.id)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shadow-purple-200 transition active:scale-95"
                                >
                                  Approve
                                </button>
                              ) : (
                                <button disabled className="bg-gray-100 text-gray-400 text-xs font-bold px-4 py-2 rounded-lg cursor-not-allowed">
                                  Selesai
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
                  Total {withdrawRequests.length} request withdraw
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- CONFIRMATION MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-100">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Wallet className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-bold leading-6 text-slate-900">Konfirmasi Pencairan</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Apakah Anda yakin ingin menyetujui request withdraw ini? Dana akan ditransfer ke rekening expert terkait.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={confirmApprove}
                  disabled={isProcessing}
                  className="inline-flex w-full justify-center rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Ya, Setujui'
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isProcessing}
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
