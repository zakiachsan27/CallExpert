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
  RefreshCw,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Save,
  Users,
  Mail,
  Phone,
  ExternalLink,
  Mail as MailIcon
} from 'lucide-react';
import { getAdminArticles, createArticle, updateArticle, deleteArticle, getCategories } from '../services/articleService';
import { uploadArticleImage } from '../services/storage';
import { createUser } from '../services/database';
import type { Article, ArticleCategory, ArticleFormData } from '../types/article';
import { RichTextEditor } from '../components/admin/article/RichTextEditor';
import { SEOPanel } from '../components/admin/article/SEOPanel';
import { ImageUploader } from '../components/admin/article/ImageUploader';
import { CategorySelect } from '../components/admin/article/CategorySelect';
import { TagInput } from '../components/admin/article/TagInput';
import { SlugInput } from '../components/admin/article/SlugInput';
import { analyzeSEO } from '../utils/seoAnalyzer';
import { analyzeReadability } from '../utils/readabilityAnalyzer';

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

type MentorApplication = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  expertise: string;
  portfolio_link: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  threads_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdraw' | 'artikel' | 'pendaftar' | 'newsletter'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [mentorApplications, setMentorApplications] = useState<MentorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWithdrawId, setSelectedWithdrawId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Pagination - server-side for transactions
  const [transactionOffset, setTransactionOffset] = useState(0);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Article state
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState<string>('');
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isSavingArticle, setIsSavingArticle] = useState(false);

  // Article form state
  const [articleForm, setArticleForm] = useState<ArticleFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImageUrl: '',
    featuredImageAlt: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    canonicalUrl: '',
    categoryId: '',
    tagIds: [],
    status: 'draft',
  });

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
    // Reset pagination state on initial fetch
    setTransactionOffset(0);
    setHasMoreTransactions(true);

    try {
      // Fetch transactions (bookings with related data) - PAGINATED: first 10 only
      const { data: bookingsData, error: bookingsError, count } = await supabase
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
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, ITEMS_PER_PAGE - 1);

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
      setTransactionOffset(ITEMS_PER_PAGE);
      // Check if there are more items
      setHasMoreTransactions((count || 0) > ITEMS_PER_PAGE);

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

  // Load more transactions from server (pagination)
  const loadMoreTransactions = async () => {
    if (isLoadingMore || !hasMoreTransactions) return;

    setIsLoadingMore(true);

    try {
      const { data: bookingsData, error: bookingsError, count } = await supabase
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
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(transactionOffset, transactionOffset + ITEMS_PER_PAGE - 1);

      if (bookingsError) throw bookingsError;

      const newTransactions: Transaction[] = (bookingsData || []).map((b: any) => ({
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

      // Append new transactions to existing list
      setTransactions(prev => [...prev, ...newTransactions]);
      const newOffset = transactionOffset + ITEMS_PER_PAGE;
      setTransactionOffset(newOffset);
      // Check if there are more items
      setHasMoreTransactions((count || 0) > newOffset);
    } catch (err) {
      console.error('Error loading more transactions:', err);
    } finally {
      setIsLoadingMore(false);
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

  const getArticleStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">
            Published
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold border border-gray-200">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold border border-yellow-200">
            Draft
          </span>
        );
    }
  };

  // Fetch articles when artikel tab is active
  useEffect(() => {
    if (activeTab === 'artikel') {
      fetchArticles();
    }
  }, [activeTab]);

  // Fetch mentor applications when pendaftar tab is active
  useEffect(() => {
    if (activeTab === 'pendaftar') {
      fetchMentorApplications();
    }
  }, [activeTab]);

  const fetchMentorApplications = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('mentor_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Error fetching mentor applications:', fetchError);
        return;
      }

      setMentorApplications(data || []);
    } catch (err) {
      console.error('Error fetching mentor applications:', err);
    }
  };

  const getMentorStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
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
      case 'reviewed':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200 flex items-center gap-1">
            <Eye className="w-3 h-3" /> Reviewed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold border border-orange-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const handleUpdateMentorStatus = async (id: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('mentor_applications')
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setMentorApplications(prev =>
        prev.map(app =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error('Error updating mentor status:', err);
      alert('Gagal mengupdate status. Silakan coba lagi.');
    }
  };

  const fetchArticles = async () => {
    try {
      const data = await getAdminArticles({
        status: articleStatusFilter as 'draft' | 'published' | 'archived' | undefined,
        search: articleSearchQuery || undefined,
        orderBy: 'created_at',
        orderDir: 'desc',
      });
      setArticles(data);
    } catch (err) {
      console.error('Error fetching articles:', err);
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImageUrl: '',
      featuredImageAlt: '',
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      canonicalUrl: '',
      categoryId: '',
      tagIds: [],
      status: 'draft',
    });
    setEditingArticle(null);
  };

  const handleCreateArticle = () => {
    resetArticleForm();
    setIsArticleEditorOpen(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content,
      featuredImageUrl: article.featuredImageUrl || '',
      featuredImageAlt: article.featuredImageAlt || '',
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      focusKeyword: article.focusKeyword || '',
      canonicalUrl: article.canonicalUrl || '',
      categoryId: article.categoryId || '',
      tagIds: article.tags.map(t => t.id),
      status: article.status,
    });
    setIsArticleEditorOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!articleForm.title || !articleForm.content) {
      alert('Judul dan konten harus diisi');
      return;
    }

    setIsSavingArticle(true);

    try {
      // Calculate SEO scores
      const seoResult = analyzeSEO({
        title: articleForm.title,
        metaTitle: articleForm.metaTitle,
        metaDescription: articleForm.metaDescription,
        focusKeyword: articleForm.focusKeyword,
        content: articleForm.content,
        featuredImageUrl: articleForm.featuredImageUrl,
        featuredImageAlt: articleForm.featuredImageAlt,
        slug: articleForm.slug,
      });

      const readabilityResult = analyzeReadability(articleForm.content);

      const adminUserId = localStorage.getItem('admin_user_id');

      if (editingArticle) {
        // Update existing article
        await updateArticle(editingArticle.id, {
          ...articleForm,
        });
      } else {
        // Ensure admin user exists in public.users table before creating article
        if (adminUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await createUser({
              id: user.id,
              email: user.email || 'admin@mentorinaja.com',
              name: 'Admin',
            });
          }
        }
        // Create new article
        await createArticle(articleForm, adminUserId || '');
      }

      // Refresh articles list
      await fetchArticles();

      // Close editor
      setIsArticleEditorOpen(false);
      resetArticleForm();
    } catch (err) {
      console.error('Error saving article:', err);
      alert('Gagal menyimpan artikel. Silakan coba lagi.');
    } finally {
      setIsSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;

    try {
      await deleteArticle(articleId);
      await fetchArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Gagal menghapus artikel.');
    }
  };

  const handleArticleImageUpload = async (file: File): Promise<string> => {
    const articleId = editingArticle?.id || 'new-' + Date.now();
    return uploadArticleImage(file, articleId);
  };

  // Filter articles
  const filteredArticles = articles.filter(a => {
    const matchesSearch = articleSearchQuery === '' ||
      a.title.toLowerCase().includes(articleSearchQuery.toLowerCase());
    const matchesStatus = articleStatusFilter === '' || a.status === articleStatusFilter;
    return matchesSearch && matchesStatus;
  });


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

          <button
            onClick={() => setActiveTab('artikel')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition text-left ${activeTab === 'artikel'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
          >
            <FileText className="w-5 h-5" />
            Artikel
          </button>

          <button
            onClick={() => setActiveTab('pendaftar')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition text-left relative ${activeTab === 'pendaftar'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
          >
            <Users className="w-5 h-5" />
            Pendaftar Mentor
            {mentorApplications.filter(a => a.status === 'pending').length > 0 && (
              <span className="absolute right-3 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {mentorApplications.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/admin/newsletter')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition text-left ${activeTab === 'newsletter'
                ? 'bg-purple-50 text-purple-700 font-bold border border-purple-100 shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
          >
            <MailIcon className="w-5 h-5" />
            Newsletter
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
            {activeTab === 'transactions' ? 'Daftar Transaksi' : activeTab === 'withdraw' ? 'Request Withdraw' : activeTab === 'artikel' ? 'Manajemen Artikel' : 'Pendaftar Mentor'}
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
                        filteredTransactions.map((trx) => (
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
                  {hasMoreTransactions && !searchQuery && !dateFilter && (
                    <button
                      onClick={loadMoreTransactions}
                      disabled={isLoadingMore}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memuat...
                        </>
                      ) : (
                        'Muat Lebih Banyak'
                      )}
                    </button>
                  )}
                  <p className="text-xs text-gray-500">
                    Menampilkan {filteredTransactions.length} transaksi
                    {(searchQuery || dateFilter) && ' (hasil filter)'}
                    {hasMoreTransactions && !searchQuery && !dateFilter && ' • Scroll atau klik untuk muat lebih banyak'}
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

          {/* VIEW: ARTIKEL */}
          {activeTab === 'artikel' && !isArticleEditorOpen && (
            <div>
              {/* Filter Bar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari artikel..."
                      value={articleSearchQuery}
                      onChange={(e) => setArticleSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                    />
                  </div>
                  <select
                    value={articleStatusFilter}
                    onChange={(e) => setArticleStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                  >
                    <option value="">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateArticle}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm shadow-purple-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Buat Artikel
                </button>
              </div>

              {/* Article List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Judul</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Kategori</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">SEO Score</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Views</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredArticles.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                            <p>Belum ada artikel</p>
                          </td>
                        </tr>
                      ) : (
                        filteredArticles.map(article => (
                          <tr key={article.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {article.featuredImageUrl ? (
                                  <img
                                    src={article.featuredImageUrl}
                                    alt=""
                                    className="w-12 h-8 rounded object-cover bg-gray-100"
                                  />
                                ) : (
                                  <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-slate-900 line-clamp-1">{article.title}</div>
                                  <div className="text-xs text-gray-500">{formatDate(article.createdAt)}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {article.category?.name || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                                article.seoScore >= 80 ? 'bg-green-100 text-green-700' :
                                article.seoScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                article.seoScore >= 40 ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {article.seoScore}/100
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getArticleStatusBadge(article.status)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {article.viewCount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`/artikel/${article.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleEditArticle(article)}
                                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteArticle(article.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
                  Total {filteredArticles.length} artikel
                </div>
              </div>
            </div>
          )}

          {/* VIEW: ARTIKEL EDITOR */}
          {activeTab === 'artikel' && isArticleEditorOpen && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Editor Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsArticleEditorOpen(false);
                      resetArticleForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="font-bold text-lg text-slate-900">
                    {editingArticle ? 'Edit Artikel' : 'Buat Artikel Baru'}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={articleForm.status}
                    onChange={(e) => setArticleForm({ ...articleForm, status: e.target.value as 'draft' | 'published' | 'archived' })}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={handleSaveArticle}
                    disabled={isSavingArticle}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {isSavingArticle ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Simpan
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Left Column - Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul Artikel</label>
                    <input
                      type="text"
                      value={articleForm.title}
                      onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                      placeholder="Masukkan judul artikel..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{articleForm.title.length} karakter</p>
                  </div>

                  {/* Slug */}
                  <SlugInput
                    value={articleForm.slug}
                    title={articleForm.title}
                    articleId={editingArticle?.id}
                    onChange={(slug) => setArticleForm({ ...articleForm, slug })}
                  />

                  {/* Excerpt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ringkasan (Excerpt)</label>
                    <textarea
                      value={articleForm.excerpt}
                      onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                      placeholder="Ringkasan singkat artikel untuk preview..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Content Editor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konten</label>
                    <RichTextEditor
                      content={articleForm.content}
                      onChange={(content) => setArticleForm({ ...articleForm, content })}
                      onImageUpload={handleArticleImageUpload}
                    />
                  </div>
                </div>

                {/* Right Column - Settings & SEO */}
                <div className="space-y-6">
                  {/* Featured Image */}
                  <ImageUploader
                    imageUrl={articleForm.featuredImageUrl}
                    imageAlt={articleForm.featuredImageAlt}
                    onImageChange={(url) => setArticleForm({ ...articleForm, featuredImageUrl: url })}
                    onAltChange={(alt) => setArticleForm({ ...articleForm, featuredImageAlt: alt })}
                    onUpload={handleArticleImageUpload}
                  />

                  {/* Category */}
                  <CategorySelect
                    value={articleForm.categoryId}
                    onChange={(categoryId) => setArticleForm({ ...articleForm, categoryId })}
                  />

                  {/* Tags */}
                  <TagInput
                    selectedTagIds={articleForm.tagIds}
                    onChange={(tagIds) => setArticleForm({ ...articleForm, tagIds })}
                  />

                  {/* SEO Fields */}
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Pengaturan SEO</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Focus Keyword</label>
                        <input
                          type="text"
                          value={articleForm.focusKeyword}
                          onChange={(e) => setArticleForm({ ...articleForm, focusKeyword: e.target.value })}
                          placeholder="Kata kunci utama..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Title
                          <span className="text-gray-400 ml-1">({articleForm.metaTitle.length}/60)</span>
                        </label>
                        <input
                          type="text"
                          value={articleForm.metaTitle}
                          onChange={(e) => setArticleForm({ ...articleForm, metaTitle: e.target.value })}
                          placeholder="Judul untuk search engine..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Description
                          <span className="text-gray-400 ml-1">({articleForm.metaDescription.length}/160)</span>
                        </label>
                        <textarea
                          value={articleForm.metaDescription}
                          onChange={(e) => setArticleForm({ ...articleForm, metaDescription: e.target.value })}
                          placeholder="Deskripsi untuk search engine..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO Panel */}
                  <SEOPanel
                    title={articleForm.title}
                    metaTitle={articleForm.metaTitle}
                    metaDescription={articleForm.metaDescription}
                    focusKeyword={articleForm.focusKeyword}
                    content={articleForm.content}
                    featuredImageUrl={articleForm.featuredImageUrl}
                    featuredImageAlt={articleForm.featuredImageAlt}
                    slug={articleForm.slug}
                  />
                </div>
              </div>
            </div>
          )}

          {/* VIEW: PENDAFTAR MENTOR */}
          {activeTab === 'pendaftar' && (
            <div>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">{mentorApplications.length}</div>
                  <div className="text-sm text-gray-500">Total Pendaftar</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-orange-600">{mentorApplications.filter(a => a.status === 'pending').length}</div>
                  <div className="text-sm text-gray-500">Pending</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">{mentorApplications.filter(a => a.status === 'approved').length}</div>
                  <div className="text-sm text-gray-500">Approved</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">{mentorApplications.filter(a => a.status === 'rejected').length}</div>
                  <div className="text-sm text-gray-500">Rejected</div>
                </div>
              </div>

              {/* Applications List */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {mentorApplications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">Belum ada pendaftar mentor.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kontak</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Keahlian</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Links</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {mentorApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50 transition">
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-900">{app.name}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  <a href={`mailto:${app.email}`} className="hover:text-brand-600">{app.email}</a>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  <a href={`https://wa.me/${app.whatsapp.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="hover:text-green-600">
                                    {app.whatsapp}
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-700 max-w-xs truncate" title={app.expertise}>
                                {app.expertise}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-1">
                                {app.portfolio_link && (
                                  <a
                                    href={app.portfolio_link.startsWith('http') ? app.portfolio_link : `https://${app.portfolio_link}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-2 py-0.5 rounded"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Portfolio
                                  </a>
                                )}
                                {app.instagram_url && (
                                  <a
                                    href={app.instagram_url.startsWith('http') ? app.instagram_url : `https://${app.instagram_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-pink-50 px-2 py-0.5 rounded"
                                  >
                                    IG
                                  </a>
                                )}
                                {app.threads_url && (
                                  <a
                                    href={app.threads_url.startsWith('http') ? app.threads_url : `https://${app.threads_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-700 hover:text-gray-900 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"
                                  >
                                    Threads
                                  </a>
                                )}
                                {app.tiktok_url && (
                                  <a
                                    href={app.tiktok_url.startsWith('http') ? app.tiktok_url : `https://${app.tiktok_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-black hover:text-gray-800 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded"
                                  >
                                    TikTok
                                  </a>
                                )}
                                {app.youtube_url && (
                                  <a
                                    href={app.youtube_url.startsWith('http') ? app.youtube_url : `https://${app.youtube_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded"
                                  >
                                    YT
                                  </a>
                                )}
                                {app.linkedin_url && (
                                  <a
                                    href={app.linkedin_url.startsWith('http') ? app.linkedin_url : `https://${app.linkedin_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded"
                                  >
                                    LI
                                  </a>
                                )}
                                {!app.portfolio_link && !app.instagram_url && !app.threads_url && !app.tiktok_url && !app.youtube_url && !app.linkedin_url && (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {formatDate(app.created_at)}
                            </td>
                            <td className="px-4 py-4">
                              {getMentorStatusBadge(app.status)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                {app.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateMentorStatus(app.id, 'approved')}
                                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                                      title="Approve"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleUpdateMentorStatus(app.id, 'rejected')}
                                      className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                      title="Reject"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {app.status !== 'pending' && (
                                  <button
                                    onClick={() => handleUpdateMentorStatus(app.id, 'pending')}
                                    className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition text-xs"
                                    title="Reset to Pending"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
