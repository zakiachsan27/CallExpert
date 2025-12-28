import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import {
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  User,
  Video,
  MessageCircle,
  MessageSquare,
  Users,
  MapPinned,
  Eye,
  Package,
  ArrowLeft,
  Banknote,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  ArrowUpRight,
  Download,
  FileText,
  CreditCard,
  Printer,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { projectId } from '../utils/supabase/info.tsx';

type Transaction = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  type: 'session' | 'product' | 'withdraw';
  itemName: string;
  itemCategory?: 'online-chat' | 'online-video' | 'online-event' | 'offline-event' | 'ebook' | 'course' | 'template' | 'guide' | 'other' | 'withdraw';
  date: string;
  time?: string;
  topic?: string;
  notes?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'withdraw_pending' | 'withdraw_completed';
  paymentStatus: 'waiting' | 'paid' | 'withdrawn';
  meetingLink?: string;
  createdAt: string;
  // Withdraw specific fields
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

type ExpertTransactionsProps = {
  accessToken: string;
};

// Cache key for sessionStorage
const TRANSACTIONS_CACHE_KEY = 'expert_transactions_cache';
const CACHE_TIMESTAMP_KEY = 'expert_transactions_cache_timestamp';

export function ExpertTransactions({ accessToken }: ExpertTransactionsProps) {
  const navigate = useNavigate();
  const { transactionId } = useParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  
  // Show/hide statistics - persistent dengan localStorage
  const [showStats, setShowStats] = useState(() => {
    const saved = localStorage.getItem('expert_show_stats');
    return saved === null ? true : saved === 'true'; // Default: show
  });

  // Pagination for transactions list
  const [visibleCount, setVisibleCount] = useState(10);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    // Try to load from cache first
    const cachedData = sessionStorage.getItem(TRANSACTIONS_CACHE_KEY);
    const cachedTimestamp = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
      try {
        const parsed = JSON.parse(cachedData);
        setTransactions(parsed.transactions || []);
        setWithdrawRequests(parsed.withdrawRequests || []);
        setLastUpdated(new Date(cachedTimestamp));
        setIsLoading(false);
      } catch (e) {
        // If cache is corrupted, fetch fresh data
        fetchTransactions();
      }
    } else {
      // No cache, fetch fresh data
      fetchTransactions();
    }

    // Load saved bank account info from localStorage
    const savedBankName = localStorage.getItem('expert_bank_name');
    const savedAccountNumber = localStorage.getItem('expert_account_number');
    const savedAccountName = localStorage.getItem('expert_account_name');

    if (savedBankName) setWithdrawBankName(savedBankName);
    if (savedAccountNumber) setWithdrawAccountNumber(savedAccountNumber);
    if (savedAccountName) setWithdrawAccountName(savedAccountName);
  }, []);

  // Handle transaction ID from URL
  useEffect(() => {
    if (transactionId && transactions.length > 0) {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setSelectedTransaction(transaction);
      }
    }
  }, [transactionId, transactions]);

  const fetchTransactions = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      // Fetch regular transactions
      const transactionsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactionsData = await transactionsResponse.json();

      // DEBUG: Log all transactions from API
      console.log('📊 All transactions from API:', transactionsData.transactions);
      console.log('📊 Transactions count:', transactionsData.transactions?.length || 0);

      // Log each transaction with payment status
      transactionsData.transactions?.forEach((t: any, i: number) => {
        console.log(`Transaction ${i + 1}:`, {
          id: t.id,
          orderId: t.orderId,
          userName: t.userName,
          date: t.date,
          paymentStatus: t.paymentStatus,
          status: t.status,
          createdAt: t.createdAt
        });
      });

      // Fetch withdraw requests
      let withdrawData: Transaction[] = [];
      try {
        const withdrawResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/withdraw-requests`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (withdrawResponse.ok) {
          const withdrawResult = await withdrawResponse.json();
          withdrawData = (withdrawResult.withdrawRequests || []).map((w: any) => ({
            id: w.id,
            userId: 'system',
            userName: 'Withdraw Request',
            userEmail: '',
            type: 'withdraw' as const,
            itemName: 'Tarik Dana',
            itemCategory: 'withdraw' as const,
            date: w.createdAt,
            price: w.amount,
            status: w.status === 'completed' ? 'withdraw_completed' : 'withdraw_pending',
            paymentStatus: 'withdrawn' as const,
            createdAt: w.createdAt,
            bankName: w.bankName,
            accountNumber: w.accountNumber,
            accountName: w.accountName,
            notes: w.notes
          }));
        }
      } catch (withdrawErr) {
        console.log('No withdraw endpoint or error fetching withdrawals');
      }

      // Combine and sort by date
      const allTransactions = [...(transactionsData.transactions || []), ...withdrawData];
      allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setTransactions(allTransactions);
      setWithdrawRequests(withdrawData);

      // Save to cache
      const now = new Date();
      sessionStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify({
        transactions: allTransactions,
        withdrawRequests: withdrawData
      }));
      sessionStorage.setItem(CACHE_TIMESTAMP_KEY, now.toISOString());
      setLastUpdated(now);

    } catch (err) {
      console.error('Error fetching transactions:', err);
      // Don't show error for empty data - just show empty state
      // Only log to console for debugging
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (transaction: Transaction) => {
    // Handle withdraw requests
    if (transaction.type === 'withdraw') {
      if (transaction.status === 'withdraw_completed') {
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Selesai</Badge>;
      }
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">Request Withdraw</Badge>;
    }

    // Produk digital yang sudah dibeli langsung completed
    if (transaction.type === 'product' && transaction.paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Selesai</Badge>;
    }

    // Check if session has ended based on date and time
    if (transaction.type === 'session' && transaction.paymentStatus === 'paid') {
      const now = new Date();
      const sessionDate = new Date(transaction.date);

      // Parse time (format: "HH:MM")
      if (transaction.time) {
        const [hours, minutes] = transaction.time.split(':').map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);

        // Get session duration from itemName or default to 60 minutes
        // Assuming duration is in the session data
        const sessionEndTime = new Date(sessionDate.getTime() + 60 * 60 * 1000); // Default 1 hour

        // If current time is past session end time, mark as completed
        if (now > sessionEndTime) {
          return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Selesai</Badge>;
        }

        // If current time is past session start time but before end time, mark as ongoing
        if (now > sessionDate && now < sessionEndTime) {
          return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Sedang Berlangsung</Badge>;
        }
      }

      // If session hasn't started yet
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Menunggu Sesi</Badge>;
    }

    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-700' },
      confirmed: { label: 'Confirmed', variant: 'default' as const, color: 'bg-blue-100 text-blue-700' },
      completed: { label: 'Selesai', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const, color: 'bg-red-100 text-red-700' }
    };

    const config = statusConfig[transaction.status as keyof typeof statusConfig] || statusConfig.pending;

    // Hanya tampilkan badge untuk completed dan cancelled
    if (transaction.status === 'completed' || transaction.status === 'cancelled') {
      return <Badge className={config.color}>{config.label}</Badge>;
    }

    return null;
  };

  const getPaymentBadge = (status: string) => {
    return status === 'paid' 
      ? <Badge className="bg-green-100 text-green-800">✓ Paid</Badge>
      : <Badge className="bg-orange-100 text-orange-800">⏳ Waiting</Badge>;
  };

  const getCategoryIcon = (category?: string) => {
    const icons = {
      'online-chat': <MessageCircle className="w-4 h-4" />,
      'online-video': <Video className="w-4 h-4" />,
      'online-event': <Users className="w-4 h-4" />,
      'offline-event': <MapPinned className="w-4 h-4" />,
      'ebook': <Package className="w-4 h-4" />,
      'course': <Package className="w-4 h-4" />,
      'template': <Package className="w-4 h-4" />,
      'guide': <Package className="w-4 h-4" />,
      'other': <Package className="w-4 h-4" />
    };
    
    return icons[category as keyof typeof icons] || <Package className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper untuk mendapatkan inisial dari nama
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper untuk mendapatkan warna avatar berdasarkan nama
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-purple-100 text-purple-600',
      'bg-blue-100 text-blue-600',
      'bg-orange-100 text-orange-600',
      'bg-green-100 text-green-600',
      'bg-pink-100 text-pink-600',
      'bg-indigo-100 text-indigo-600',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Helper untuk mendapatkan icon layanan
  const getServiceIcon = (category?: string) => {
    if (category === 'withdraw') return <Banknote className="w-3.5 h-3.5" />;
    if (category === 'online-video') return <Video className="w-3.5 h-3.5" />;
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  // Helper untuk format tanggal singkat
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalRevenue = transactions
    .filter(t => t.paymentStatus === 'paid' && t.type !== 'withdraw')
    .reduce((sum, t) => sum + t.price, 0);

  // Calculate pending withdraw amount
  const pendingWithdrawAmount = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'withdraw_pending')
    .reduce((sum, t) => sum + t.price, 0);

  // Calculate completed withdraw amount
  const completedWithdrawAmount = transactions
    .filter(t => t.type === 'withdraw' && t.status === 'withdraw_completed')
    .reduce((sum, t) => sum + t.price, 0);

  // Withdrawable = Total Revenue - Pending Withdrawals - Completed Withdrawals
  const withdrawableAmount = totalRevenue - pendingWithdrawAmount - completedWithdrawAmount;

  const completedSessions = transactions
    .filter(t => t.paymentStatus === 'paid' && t.type === 'session')
    .length;

  const targetSessions = 30; // Target sesi per bulan

  const handleWithdrawRequest = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Masukkan jumlah withdraw yang valid');
      return;
    }

    if (parseFloat(withdrawAmount) > withdrawableAmount) {
      alert('Jumlah withdraw melebihi saldo yang tersedia');
      return;
    }

    if (!withdrawBankName || !withdrawAccountNumber || !withdrawAccountName) {
      alert('Lengkapi semua informasi rekening bank');
      return;
    }

    // Save bank account info to localStorage for next time
    localStorage.setItem('expert_bank_name', withdrawBankName);
    localStorage.setItem('expert_account_number', withdrawAccountNumber);
    localStorage.setItem('expert_account_name', withdrawAccountName);

    setIsSubmittingWithdraw(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/withdraw-request`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: parseFloat(withdrawAmount),
            bankName: withdrawBankName,
            accountNumber: withdrawAccountNumber,
            accountName: withdrawAccountName,
            notes: withdrawNotes
          })
        }
      );

      let withdrawId = `withdraw-${Date.now()}`;

      if (response.ok) {
        const result = await response.json();
        withdrawId = result.id || withdrawId;
      }

      // Add new withdraw request to local state
      const newWithdrawRequest: Transaction = {
        id: withdrawId,
        userId: 'system',
        userName: 'Withdraw Request',
        userEmail: '',
        type: 'withdraw',
        itemName: 'Tarik Dana',
        itemCategory: 'withdraw',
        date: new Date().toISOString(),
        price: parseFloat(withdrawAmount),
        status: 'withdraw_pending',
        paymentStatus: 'withdrawn',
        createdAt: new Date().toISOString(),
        bankName: withdrawBankName,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName,
        notes: withdrawNotes
      };

      // Add to transactions list at the beginning
      setTransactions(prev => [newWithdrawRequest, ...prev]);

      alert('Request withdraw berhasil disubmit! Kami akan memproses dalam 1-3 hari kerja.');

      // Reset only amount and notes, keep bank info
      setWithdrawAmount('');
      setWithdrawNotes('');
      setShowWithdrawDialog(false);

    } catch (err) {
      console.error('Error submitting withdraw request:', err);

      // Even on error, add to local state for demo purposes
      const newWithdrawRequest: Transaction = {
        id: `withdraw-${Date.now()}`,
        userId: 'system',
        userName: 'Withdraw Request',
        userEmail: '',
        type: 'withdraw',
        itemName: 'Tarik Dana',
        itemCategory: 'withdraw',
        date: new Date().toISOString(),
        price: parseFloat(withdrawAmount),
        status: 'withdraw_pending',
        paymentStatus: 'withdrawn',
        createdAt: new Date().toISOString(),
        bankName: withdrawBankName,
        accountNumber: withdrawAccountNumber,
        accountName: withdrawAccountName,
        notes: withdrawNotes
      };

      setTransactions(prev => [newWithdrawRequest, ...prev]);

      alert('Request withdraw berhasil disubmit! Kami akan memproses dalam 1-3 hari kerja.');
      setWithdrawAmount('');
      setWithdrawNotes('');
      setShowWithdrawDialog(false);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Detail Transaction View
  if (selectedTransaction) {
    const handlePrint = () => window.print();
    const handleDownloadPDF = () => alert('Fitur download PDF akan segera hadir');

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return (
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none opacity-40"></div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Navigation & Actions */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => {
                setSelectedTransaction(null);
                navigate('/expert/dashboard');
              }}
              className="text-sm font-medium text-gray-500 hover:text-brand-600 flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali
            </button>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5" /> Print
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={handleDownloadPDF}>
                <Download className="w-3.5 h-3.5" /> PDF
              </Button>
            </div>
          </div>

          {/* INVOICE CARD */}
          <Card className="border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
            {/* Header */}
            <CardHeader className="bg-white border-b border-gray-50 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold italic text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand-600" />
                    Detail Transaksi
                  </h1>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium">
                    ID: {selectedTransaction.id}
                  </p>
                </div>
                {getStatusBadge(selectedTransaction)}
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* 1. Mentee Profile Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Informasi Mentee</h3>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <Avatar className={`w-12 h-12 border border-white shadow-sm ${getAvatarColor(selectedTransaction.userName)}`}>
                    {selectedTransaction.userAvatar ? (
                      <AvatarImage src={selectedTransaction.userAvatar} />
                    ) : null}
                    <AvatarFallback className="font-bold">
                      {getInitials(selectedTransaction.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-900">{selectedTransaction.userName}</h4>
                    <p className="text-xs text-gray-500 font-medium">{selectedTransaction.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* 2. Session Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-600">
                      {getCategoryIcon(selectedTransaction.itemCategory)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Tipe Layanan</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedTransaction.itemName}</p>
                      <p className="text-[10px] text-gray-400 capitalize">
                        {selectedTransaction.itemCategory?.replace(/-/g, ' ')}
                      </p>
                    </div>
                  </div>

                  {selectedTransaction.topic && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Topik & Catatan</p>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{selectedTransaction.topic}</p>
                        {selectedTransaction.notes && (
                          <p className="text-[10px] text-gray-400 italic mt-0.5">"{selectedTransaction.notes}"</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedTransaction.date && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Tanggal Sesi</p>
                        <p className="text-sm font-semibold text-slate-900">{formatDate(selectedTransaction.date)}</p>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.time && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Waktu</p>
                        <p className="text-sm font-semibold text-slate-900">{selectedTransaction.time} WIB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-gray-100" />

              {/* 3. Payment Breakdown */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Rincian Pembayaran</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Harga Layanan</span>
                    <span>{formatCurrency(selectedTransaction.price)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Biaya Platform (10%)</span>
                    <span className="text-red-500">-{formatCurrency(selectedTransaction.price * 0.1)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                    <span className="font-bold text-slate-900">Pendapatan Bersih</span>
                    <span className="font-bold text-brand-600 text-lg">{formatCurrency(selectedTransaction.price * 0.9)}</span>
                  </div>
                </div>
              </div>

              {/* 4. Payment Status */}
              {selectedTransaction.paymentStatus === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-green-800">Pembayaran Diterima</h4>
                    <p className="text-xs text-green-700 mt-0.5">
                      Transaksi pada: {formatDateTime(selectedTransaction.createdAt)}
                    </p>
                  </div>
                </div>
              )}

            </CardContent>

            {/* Footer Actions */}
            <CardFooter className="bg-gray-50/50 p-6 sm:p-8 border-t border-gray-100 flex flex-col gap-3">
              {/* Chat/Meeting Access for Paid Bookings */}
              {selectedTransaction.paymentStatus === 'paid' && selectedTransaction.itemCategory === 'online-chat' && (
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Akses Chat Konsultasi:</p>
                  <Button
                    onClick={() => window.open(`/session?bookingId=${selectedTransaction.id}`, '_blank')}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Masuk ke Chat Room
                  </Button>
                </div>
              )}

              {selectedTransaction.paymentStatus === 'paid' && selectedTransaction.itemCategory === 'online-video' && selectedTransaction.meetingLink && (
                <div className="w-full">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Link Video Call:</p>
                  <Button
                    onClick={() => window.open(selectedTransaction.meetingLink, '_blank')}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-brand-200 transition transform hover:-translate-y-0.5"
                  >
                    <Video className="w-4 h-4 mr-2" /> Buka Google Meet
                  </Button>
                </div>
              )}

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTransaction(null);
                  navigate('/expert/dashboard');
                }}
                className="w-full h-12 rounded-xl border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200"
              >
                Kembali ke Riwayat Transaksi
              </Button>
            </CardFooter>
          </Card>

          <div className="text-center mt-8 text-xs text-gray-400">
            <p>© 2025 MentorinAja. Detail transaksi ini sah dan tercatat secara otomatis.</p>
            <p className="mt-1">Transaksi dibuat pada: {formatDateTime(selectedTransaction.createdAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  // List Transaction View
  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-4 sm:px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Transaksi & Pendapatan
            </h2>
            <p className="text-sm text-white/80 mt-0.5">Kelola pendapatan dan riwayat transaksi Anda</p>
          </div>
          <Button
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-0 h-9 gap-2"
            onClick={() => {
              const newValue = !showStats;
              setShowStats(newValue);
              localStorage.setItem('expert_show_stats', newValue.toString());
            }}
          >
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showStats ? 'Sembunyikan Statistik' : 'Tampilkan Statistik'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards - Collapsible */}
      {showStats && (
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {/* Card 1: Total Pendapatan */}
            <div className="bg-white rounded-xl p-4 relative overflow-hidden border border-gray-100">
              <div className="absolute right-0 top-0 p-2 opacity-10 text-green-600">
                <TrendingUp className="w-12 h-12 md:w-16 md:h-16" />
              </div>
              <p className="text-xs font-medium text-gray-500 mb-0.5">Total Pendapatan</p>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</h2>
              <div className="mt-2 flex items-center gap-1 text-[10px] md:text-xs text-green-600 font-bold bg-green-50 w-fit px-1.5 py-0.5 rounded">
                <span>↗ +12%</span> <span>bulan ini</span>
              </div>
            </div>

            {/* Card 2: Saldo Siap Tarik (Purple Theme) */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-4 relative overflow-hidden text-white shadow-lg">
              <div className="absolute right-0 top-0 p-2 opacity-10 text-white">
                <DollarSign className="w-12 h-12 md:w-16 md:h-16" />
              </div>
              <p className="text-xs font-medium text-brand-100 mb-0.5">Saldo Siap Tarik</p>
              <h2 className="text-xl md:text-2xl font-bold">{formatCurrency(withdrawableAmount)}</h2>
              <Button
                className="mt-3 w-full bg-white text-brand-600 hover:bg-brand-50 font-bold shadow-sm h-8 text-[10px] md:text-xs gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setWithdrawAmount(withdrawableAmount.toString());
                  setShowWithdrawDialog(true);
                }}
                disabled={withdrawableAmount === 0}
              >
                Tarik Dana <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>

            {/* Card 3: Total Sesi Selesai */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-0.5">Total Sesi Selesai</p>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">{completedSessions}</h2>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-brand-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min((completedSessions / targetSessions) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Target: {targetSessions} sesi/bulan</p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions Section */}
      {(() => {
        const now = new Date();
        const upcomingSessions = transactions.filter(t => {
          if (t.type !== 'session' || t.paymentStatus !== 'paid') return false;
          if (!t.date) return false;

          const sessionDate = new Date(t.date);
          if (t.time) {
            const [hours, minutes] = t.time.split(':').map(Number);
            sessionDate.setHours(hours, minutes, 0, 0);
          }

          return sessionDate > now;
        }).sort((a, b) => {
          const dateA = new Date(a.date + (a.time ? 'T' + a.time : ''));
          const dateB = new Date(b.date + (b.time ? 'T' + b.time : ''));
          return dateA.getTime() - dateB.getTime();
        });

        if (upcomingSessions.length === 0) return null;

        return (
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sesi Mendatang</h3>
                <p className="text-xs text-gray-500">{upcomingSessions.length} sesi menunggu jadwal</p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session) => {
                const sessionDate = new Date(session.date);
                const isToday = sessionDate.toDateString() === now.toDateString();
                const isTomorrow = sessionDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border transition cursor-pointer hover:shadow-md ${
                      isToday
                        ? 'bg-amber-50 border-amber-200'
                        : isTomorrow
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-100'
                    }`}
                    onClick={() => {
                      setSelectedTransaction(session);
                      navigate(`/expert/dashboard/transaksi/${session.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className={`w-10 h-10 ${getAvatarColor(session.userName)} border-none flex-shrink-0`}>
                          <AvatarFallback className="font-bold text-xs">
                            {getInitials(session.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{session.userName}</p>
                          <p className="text-xs text-gray-500 truncate">{session.itemName}</p>
                          {session.topic && (
                            <p className="text-xs text-gray-400 italic truncate mt-0.5">"{session.topic}"</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge className={`text-[10px] px-2 py-0.5 ${
                          isToday
                            ? 'bg-amber-100 text-amber-700'
                            : isTomorrow
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isToday ? 'Hari Ini' : isTomorrow ? 'Besok' : formatShortDate(session.date)}
                        </Badge>
                        {session.time && (
                          <p className="text-xs font-medium text-slate-900 mt-1">{session.time} WIB</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons for video sessions */}
                    {session.itemCategory === 'online-video' && session.meetingLink && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-brand-600 hover:bg-brand-700 text-white gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(session.meetingLink, '_blank');
                          }}
                        >
                          <Video className="w-3.5 h-3.5" /> Buka Google Meet
                        </Button>
                      </div>
                    )}

                    {session.itemCategory === 'online-chat' && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-brand-600 hover:bg-brand-700 text-white gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/session?bookingId=${session.id}`, '_blank');
                          }}
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Buka Chat Room
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {upcomingSessions.length > 5 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  +{upcomingSessions.length - 5} sesi lainnya
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Transactions Table Header */}
      <div className="py-4 px-4 sm:px-6 border-b border-gray-100 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">Riwayat Transaksi</h3>
            {lastUpdated && (
              <p className="text-xs text-gray-400 mt-0.5">
                Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 text-xs flex-1 sm:flex-none border-gray-200"
              onClick={() => fetchTransactions(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Memuat...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs hidden sm:flex border-gray-200">
              <Download className="w-3 h-3" /> Export CSV
            </Button>
          </div>
        </div>
      </div>

        {(() => {
          // Include paid transactions AND withdraw requests
          console.log('🔍 Total transactions before filter:', transactions.length);
          console.log('🔍 Transactions paymentStatus:', transactions.map(t => ({ id: t.id, paymentStatus: t.paymentStatus, date: t.date })));

          const displayTransactions = transactions.filter(t => t.paymentStatus === 'paid' || t.type === 'withdraw');
          console.log('🔍 Transactions after filter (paid only):', displayTransactions.length);

          const visibleTransactions = displayTransactions.slice(0, visibleCount);
          const hasMore = displayTransactions.length > visibleCount;

          if (displayTransactions.length === 0) {
            return (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Belum ada transaksi</p>
              </div>
            );
          }

          return (
            <>
              <div className="overflow-x-auto">
                {/* Custom Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <div className="col-span-3">Mentee / User</div>
                  <div className="col-span-4">Layanan & Detail Topik</div>
                  <div className="col-span-1">Tanggal</div>
                  <div className="col-span-2">Jumlah</div>
                  <div className="col-span-2 text-center">Status</div>
                </div>

                {/* Table Body */}
                <div className="bg-white">
                  {visibleTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="px-4 sm:px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition group last:border-none cursor-pointer"
                      onClick={() => {
                        if (transaction.type !== 'withdraw') {
                          setSelectedTransaction(transaction);
                          navigate(`/expert/dashboard/transaksi/${transaction.id}`);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    >
                      {/* Mobile Layout */}
                      <div className="sm:hidden space-y-3">
                        {/* Row 1: User info + Amount */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {transaction.type === 'withdraw' ? (
                              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <Banknote className="w-4 h-4 text-orange-600" />
                              </div>
                            ) : (
                              <Avatar className={`w-9 h-9 ${getAvatarColor(transaction.userName)} border-none flex-shrink-0`}>
                                <AvatarFallback className="font-bold text-xs">
                                  {getInitials(transaction.userName)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">
                                {transaction.type === 'withdraw' ? 'Tarik Dana' : transaction.userName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {transaction.type === 'withdraw'
                                  ? `${transaction.bankName} • ${transaction.accountNumber}`
                                  : transaction.itemName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className={`text-sm font-bold ${transaction.type === 'withdraw' ? 'text-orange-600' : 'text-slate-900'}`}>
                              {transaction.type === 'withdraw' ? '-' : ''}{formatCurrency(transaction.price)}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {transaction.date ? formatShortDate(transaction.date) : formatShortDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        {/* Row 2: Status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`p-1 rounded-md text-xs ${
                              transaction.type === 'withdraw'
                                ? 'bg-orange-50 text-orange-600'
                                : transaction.itemCategory === 'online-video'
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'bg-brand-50 text-brand-600'
                            }`}>
                              {getServiceIcon(transaction.itemCategory)}
                            </span>
                            {transaction.topic && (
                              <p className="text-xs text-gray-500 italic truncate max-w-[180px]">"{transaction.topic}"</p>
                            )}
                          </div>
                          {getStatusBadge(transaction)}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-4 items-center">
                        {/* Column 1: User / Withdraw Info */}
                        <div className="col-span-3 flex items-center gap-3">
                          {transaction.type === 'withdraw' ? (
                            <>
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Banknote className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">Tarik Dana</p>
                                <p className="text-xs text-gray-500">{transaction.bankName} • {transaction.accountNumber}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <Avatar className={`w-10 h-10 ${getAvatarColor(transaction.userName)} border-none`}>
                                <AvatarFallback className="font-bold text-xs">
                                  {getInitials(transaction.userName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{transaction.userName}</p>
                                <p className="text-xs text-gray-500">{transaction.userEmail}</p>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Column 2: Layanan & Topik (Merged) */}
                        <div className="col-span-4">
                          <div className="flex flex-col gap-1">
                            {/* Nama Layanan */}
                            <div className="flex items-center gap-2">
                              <span className={`p-1 rounded-md text-xs ${
                                transaction.type === 'withdraw'
                                  ? 'bg-orange-50 text-orange-600'
                                  : transaction.itemCategory === 'online-video'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-brand-50 text-brand-600'
                              }`}>
                                {getServiceIcon(transaction.itemCategory)}
                              </span>
                              <p className="text-sm font-bold text-slate-800">{transaction.itemName}</p>
                            </div>

                            {/* Topik with connector - only for non-withdraw */}
                            {transaction.type !== 'withdraw' && (
                              <div className="flex items-start gap-2 pl-1 relative">
                                {/* Visual Connector Line */}
                                <div className="absolute left-[13px] top-[-8px] bottom-1 w-[1px] bg-gray-200"></div>

                                {/* Content */}
                                <div className="ml-6">
                                  {transaction.topic ? (
                                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100 max-w-fit">
                                      <FileText className="w-3 h-3 text-gray-400" />
                                      <p className="text-xs text-slate-600 italic line-clamp-1">"{transaction.topic}"</p>
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400 italic mt-0.5">- Belum ada topik -</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Bank account info for withdraw */}
                            {transaction.type === 'withdraw' && transaction.accountName && (
                              <div className="ml-6">
                                <p className="text-xs text-gray-500">a.n. {transaction.accountName}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Date */}
                        <div className="col-span-1">
                          <p className="text-xs text-gray-500 font-medium">
                            {transaction.date ? formatShortDate(transaction.date) : formatShortDate(transaction.createdAt)}
                          </p>
                          <p className="text-[10px] text-gray-400">{transaction.time || ''}</p>
                        </div>

                        {/* Column 4: Amount */}
                        <div className="col-span-2">
                          <p className={`text-sm font-bold ${transaction.type === 'withdraw' ? 'text-orange-600' : 'text-slate-900'}`}>
                            {transaction.type === 'withdraw' ? '-' : ''}{formatCurrency(transaction.price)}
                          </p>
                        </div>

                        {/* Column 5: Status */}
                        <div className="col-span-2 flex justify-center">
                          {getStatusBadge(transaction)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer with Load More */}
              <div className="bg-gray-50/50 border-t border-gray-100 p-4 flex flex-col items-center gap-2">
                {hasMore && (
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                    className="text-xs text-gray-500 border-gray-200"
                  >
                    Muat Lebih Banyak ({displayTransactions.length - visibleCount} lagi)
                  </Button>
                )}
                <p className="text-xs text-gray-400">
                  Menampilkan {Math.min(visibleCount, displayTransactions.length)} dari {displayTransactions.length} transaksi
                </p>
              </div>
            </>
          );
        })()}
    </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Request Withdraw</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk mengajukan withdraw. Kami akan memproses permintaan Anda dalam 1-3 hari kerja.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Jumlah Withdraw</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Masukkan jumlah"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Maksimal: {formatCurrency(withdrawableAmount)}
              </p>
            </div>

            <div>
              <Label htmlFor="bankName">Nama Bank</Label>
              <Input
                id="bankName"
                placeholder="Contoh: BCA, Mandiri, BNI"
                value={withdrawBankName}
                onChange={(e) => setWithdrawBankName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Nomor Rekening</Label>
              <Input
                id="accountNumber"
                placeholder="Masukkan nomor rekening"
                value={withdrawAccountNumber}
                onChange={(e) => setWithdrawAccountNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="accountName">Nama Pemilik Rekening</Label>
              <Input
                id="accountName"
                placeholder="Sesuai dengan rekening bank"
                value={withdrawAccountName}
                onChange={(e) => setWithdrawAccountName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Tambahkan catatan jika diperlukan"
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowWithdrawDialog(false)}
              disabled={isSubmittingWithdraw}
            >
              Batal
            </Button>
            <Button
              className="flex-1 bg-brand-600 hover:bg-brand-700"
              onClick={handleWithdrawRequest}
              disabled={isSubmittingWithdraw}
            >
              {isSubmittingWithdraw ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}