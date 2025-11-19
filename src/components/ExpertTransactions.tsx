import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  DollarSign,
  User,
  Video,
  MessageCircle,
  Users,
  MapPinned,
  Eye,
  Package,
  ArrowLeft,
  Banknote,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { projectId } from '../utils/supabase/info.tsx';

type Transaction = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  type: 'session' | 'product';
  itemName: string;
  itemCategory?: 'online-chat' | 'online-video' | 'online-event' | 'offline-event' | 'ebook' | 'course' | 'template' | 'guide' | 'other';
  date: string;
  time?: string;
  topic?: string;
  notes?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'waiting' | 'paid';
  meetingLink?: string;
  createdAt: string;
};

type ExpertTransactionsProps = {
  accessToken: string;
};

export function ExpertTransactions({ accessToken }: ExpertTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => {
    fetchTransactions();
    
    // Load saved bank account info from localStorage
    const savedBankName = localStorage.getItem('expert_bank_name');
    const savedAccountNumber = localStorage.getItem('expert_account_number');
    const savedAccountName = localStorage.getItem('expert_account_name');
    
    if (savedBankName) setWithdrawBankName(savedBankName);
    if (savedAccountNumber) setWithdrawAccountNumber(savedAccountNumber);
    if (savedAccountName) setWithdrawAccountName(savedAccountName);
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/transactions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions || []);
      
    } catch (err) {
      console.error('Error fetching transactions:', err);
      
      // Demo data for development
      const demoTransactions: Transaction[] = [
        {
          id: 'trx-1',
          userId: 'user-1',
          userName: 'Budi Santoso',
          userEmail: 'budi@example.com',
          userAvatar: 'https://i.pravatar.cc/150?u=budi',
          type: 'session',
          itemName: '1-on-1 Career Mentoring',
          itemCategory: 'online-video',
          date: '2024-12-20',
          time: '14:00',
          topic: 'Career transition to Product Manager',
          notes: 'Ingin belajar cara menjadi PM yang baik',
          price: 300000,
          status: 'confirmed',
          paymentStatus: 'paid',
          meetingLink: 'https://zoom.us/j/123456789',
          createdAt: '2024-12-15T10:00:00Z'
        },
        {
          id: 'trx-2',
          userId: 'user-2',
          userName: 'Siti Aminah',
          userEmail: 'siti@example.com',
          userAvatar: 'https://i.pravatar.cc/150?u=siti',
          type: 'session',
          itemName: 'Quick Chat',
          itemCategory: 'online-chat',
          date: '2024-12-18',
          time: '10:00',
          topic: 'Resume review',
          price: 150000,
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: '2024-12-14T08:00:00Z'
        },
        {
          id: 'trx-3',
          userId: 'user-3',
          userName: 'Ahmad Rizki',
          userEmail: 'ahmad@example.com',
          userAvatar: 'https://i.pravatar.cc/150?u=ahmad',
          type: 'product',
          itemName: 'Career Development E-Book',
          itemCategory: 'ebook',
          price: 99000,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: '2024-12-16T14:30:00Z'
        },
        {
          id: 'trx-4',
          userId: 'user-4',
          userName: 'Dewi Kartika',
          userEmail: 'dewi@example.com',
          userAvatar: 'https://i.pravatar.cc/150?u=dewi',
          type: 'session',
          itemName: 'Group Workshop',
          itemCategory: 'online-event',
          date: '2024-12-25',
          time: '13:00',
          topic: 'Product Management Workshop',
          price: 500000,
          status: 'pending',
          paymentStatus: 'waiting',
          createdAt: '2024-12-17T09:00:00Z'
        },
        {
          id: 'trx-5',
          userId: 'user-5',
          userName: 'Andi Wijaya',
          userEmail: 'andi@example.com',
          userAvatar: 'https://i.pravatar.cc/150?u=andi',
          type: 'session',
          itemName: 'Coffee Chat',
          itemCategory: 'offline-event',
          date: '2024-12-22',
          time: '15:00',
          topic: 'Networking & Career Advice',
          notes: 'Meet at Starbucks Central Park',
          price: 200000,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: '2024-12-16T11:00:00Z'
        }
      ];
      
      setTransactions(demoTransactions);
      setError('Demo mode: Menggunakan data transaksi demo');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (transaction: Transaction) => {
    // Produk digital yang sudah dibeli langsung completed
    if (transaction.type === 'product' && transaction.paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    // Jika sudah bayar dan statusnya confirmed, tampilkan "Menunggu Sesi" 
    if (transaction.status === 'confirmed' && transaction.paymentStatus === 'paid' && transaction.type === 'session') {
      return <Badge className="bg-blue-100 text-blue-800">Menunggu Sesi</Badge>;
    }
    
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
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

  const totalRevenue = transactions
    .filter(t => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.price, 0);

  const withdrawableAmount = transactions
    .filter(t => t.paymentStatus === 'paid')
    .reduce((sum, t) => sum + t.price, 0);

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

      if (!response.ok) {
        throw new Error('Failed to submit withdraw request');
      }

      alert('Request withdraw berhasil disubmit! Kami akan memproses dalam 1-3 hari kerja.');
      
      // Reset only amount and notes, keep bank info
      setWithdrawAmount('');
      setWithdrawNotes('');
      setShowWithdrawDialog(false);
      
    } catch (err) {
      console.error('Error submitting withdraw request:', err);
      alert('Demo mode: Request withdraw berhasil disubmit (simulasi)');
      setShowWithdrawDialog(false);
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Detail Transaction View
  if (selectedTransaction) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedTransaction(null)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke List
        </Button>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="mb-1">Detail Transaksi</h2>
              <p className="text-sm text-gray-500">ID: {selectedTransaction.id}</p>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(selectedTransaction)}
              {getPaymentBadge(selectedTransaction.paymentStatus)}
            </div>
          </div>

          <div className="space-y-6">
            {/* User Info */}
            <div>
              <h3 className="mb-3">Informasi Customer</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {selectedTransaction.userAvatar ? (
                  <img 
                    src={selectedTransaction.userAvatar} 
                    alt={selectedTransaction.userName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{selectedTransaction.userName}</p>
                  <p className="text-sm text-gray-600">{selectedTransaction.userEmail}</p>
                </div>
              </div>
            </div>

            {/* Item Info */}
            <div>
              <h3 className="mb-3">
                {selectedTransaction.type === 'session' ? 'Detail Sesi' : 'Detail Produk'}
              </h3>
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-purple-600">
                    {getCategoryIcon(selectedTransaction.itemCategory)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedTransaction.itemName}</p>
                    <p className="text-sm text-gray-600 capitalize">
                      {selectedTransaction.itemCategory?.replace(/-/g, ' ')}
                    </p>
                  </div>
                </div>

                {selectedTransaction.type === 'session' && (
                  <>
                    {selectedTransaction.date && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(selectedTransaction.date)}</span>
                      </div>
                    )}
                    {selectedTransaction.time && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Clock className="w-4 h-4" />
                        <span>{selectedTransaction.time} WIB</span>
                      </div>
                    )}
                    {selectedTransaction.topic && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Topik Diskusi:</p>
                        <p className="text-sm text-gray-600">{selectedTransaction.topic}</p>
                      </div>
                    )}
                    {selectedTransaction.notes && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Catatan:</p>
                        <p className="text-sm text-gray-600">{selectedTransaction.notes}</p>
                      </div>
                    )}
                    {selectedTransaction.meetingLink && selectedTransaction.paymentStatus === 'paid' && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-medium text-blue-900 mb-2">Meeting Link:</p>
                        <a 
                          href={selectedTransaction.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {selectedTransaction.meetingLink}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="mb-3">Informasi Pembayaran</h3>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Harga</span>
                  <span className="font-medium">{formatCurrency(selectedTransaction.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status Pembayaran</span>
                  {getPaymentBadge(selectedTransaction.paymentStatus)}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Tanggal Transaksi</span>
                  <span>{new Date(selectedTransaction.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // List Transaction View
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* Toggle Button untuk Statistics */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Statistik & Pendapatan</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newValue = !showStats;
            setShowStats(newValue);
            localStorage.setItem('expert_show_stats', newValue.toString());
          }}
          className="gap-2"
        >
          {showStats ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Sembunyikan
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Tampilkan
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards - Collapsible */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold">{transactions.filter(t => t.paymentStatus === 'paid').length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Withdraw</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(withdrawableAmount)}
                </p>
              </div>
              <Button 
                size="sm" 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setWithdrawAmount(withdrawableAmount.toString());
                  setShowWithdrawDialog(true);
                }}
                disabled={withdrawableAmount === 0}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Transactions List */}
      <Card className="p-6">
        <h2 className="mb-6">Riwayat Transaksi</h2>

        {transactions.filter(t => t.paymentStatus === 'paid').length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada transaksi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.filter(t => t.paymentStatus === 'paid').map((transaction) => (
              <div 
                key={transaction.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedTransaction(transaction)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* User Info Section */}
                  <div className="flex items-start gap-3 flex-1">
                    {transaction.userAvatar ? (
                      <img 
                        src={transaction.userAvatar} 
                        alt={transaction.userName}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-medium">{transaction.userName}</p>
                          <p className="text-sm text-gray-600">{transaction.userEmail}</p>
                        </div>
                        {/* Status badges - di kanan pada mobile */}
                        <div className="flex gap-2 flex-shrink-0 sm:hidden">
                          {getStatusBadge(transaction)}
                        </div>
                      </div>

                      {/* Item Info */}
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <div className="text-purple-600 flex-shrink-0">
                          {getCategoryIcon(transaction.itemCategory)}
                        </div>
                        <span className="font-medium truncate">{transaction.itemName}</span>
                        <span className="text-gray-400 hidden sm:inline">•</span>
                        <span className="capitalize text-gray-600 hidden sm:inline">
                          {transaction.itemCategory?.replace(/-/g, ' ')}
                        </span>
                      </div>

                      {/* Date & Time */}
                      {transaction.type === 'session' && transaction.date && (
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="text-xs sm:text-sm">{new Date(transaction.date).toLocaleDateString('id-ID')}</span>
                          </div>
                          {transaction.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{transaction.time}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Topic */}
                      {transaction.topic && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          <span className="font-medium">Topik:</span> {transaction.topic}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price and Badges for Desktop */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                    {/* Status badges - hanya tampil di desktop */}
                    <div className="hidden sm:flex gap-2 mb-2">
                      {getStatusBadge(transaction)}
                    </div>
                    
                    <p className="font-bold text-base sm:text-lg">{formatCurrency(transaction.price)}</p>
                    <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Detail</span>
                      <span className="sm:hidden">Lihat</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
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
              className="flex-1 bg-purple-600 hover:bg-purple-700"
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
    </div>
  );
}