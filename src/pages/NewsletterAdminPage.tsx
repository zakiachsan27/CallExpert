import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
  LogOut,
  Mail,
  Send,
  Save,
  Eye,
  Users,
  UserCheck,
  Loader2,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Clock,
  CheckCircle,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

type Newsletter = {
  id: string;
  subject: string;
  content: string;
  target_audience: 'all' | 'mentors' | 'users';
  status: 'draft' | 'sent' | 'scheduled';
  scheduled_at: string | null;
  sent_by: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

type NewsletterStats = {
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  opened_count: number;
};

export function NewsletterAdminPage() {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  
  // Form states
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'mentors' | 'users'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchNewsletters();
  }, []);

  const checkAuth = () => {
    const adminToken = localStorage.getItem('admin_access_token');
    if (!adminToken) {
      navigate('/admin', { replace: true });
    }
  };

  const fetchNewsletters = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNewsletters(data || []);
    } catch (err: any) {
      console.error('Error fetching newsletters:', err);
      setError('Gagal memuat data newsletter');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async (newsletterId: string) => {
    try {
      const { data, error: statsError } = await supabase
        .rpc('get_newsletter_stats', { newsletter_id: newsletterId });

      if (statsError) throw statsError;
      setStats(data?.[0] || null);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSaveDraft = async () => {
    if (!subject || !content) {
      alert('Subject dan konten harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      const adminUserId = localStorage.getItem('admin_user_id');
      
      if (selectedNewsletter) {
        // Update existing
        const { error: updateError } = await supabase
          .from('newsletters')
          .update({
            subject,
            content,
            target_audience: targetAudience,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedNewsletter.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('newsletters')
          .insert({
            subject,
            content,
            target_audience: targetAudience,
            status: 'draft',
            sent_by: adminUserId
          });

        if (insertError) throw insertError;
      }

      closeEditor();
      fetchNewsletters();
    } catch (err: any) {
      console.error('Error saving newsletter:', err);
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!subject || !content) {
      alert('Subject dan konten harus diisi');
      return;
    }

    if (!confirm('Yakin ingin mengirim newsletter ini?')) return;

    setIsSending(true);
    try {
      // First save the newsletter
      const adminUserId = localStorage.getItem('admin_user_id');
      let newsletterId = selectedNewsletter?.id;

      if (!newsletterId) {
        const { data, error: insertError } = await supabase
          .from('newsletters')
          .insert({
            subject,
            content,
            target_audience: targetAudience,
            status: 'sent',
            sent_by: adminUserId,
            sent_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        newsletterId = data.id;
      } else {
        const { error: updateError } = await supabase
          .from('newsletters')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', newsletterId);

        if (updateError) throw updateError;
      }

      // Call edge function to send emails
      const { error: sendError } = await supabase.functions.invoke('send-newsletter', {
        body: { newsletterId }
      });

      if (sendError) throw sendError;

      alert('Newsletter berhasil dikirim!');
      closeEditor();
      fetchNewsletters();
    } catch (err: any) {
      console.error('Error sending newsletter:', err);
      alert('Gagal mengirim: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus newsletter ini?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      fetchNewsletters();
    } catch (err: any) {
      console.error('Error deleting newsletter:', err);
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const openEditor = (newsletter?: Newsletter) => {
    if (newsletter) {
      setSelectedNewsletter(newsletter);
      setSubject(newsletter.subject);
      setContent(newsletter.content);
      setTargetAudience(newsletter.target_audience);
    } else {
      setSelectedNewsletter(null);
      setSubject('');
      setContent('');
      setTargetAudience('all');
    }
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedNewsletter(null);
    setSubject('');
    setContent('');
    setTargetAudience('all');
  };

  const openStats = async (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setIsStatsOpen(true);
    await fetchStats(newsletter.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Terkirim
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Terjadwal
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold border border-yellow-200 flex items-center gap-1">
            <Save className="w-3 h-3" /> Draft
          </span>
        );
    }
  };

  const getTargetBadge = (target: string) => {
    switch (target) {
      case 'all':
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold border border-purple-200 flex items-center gap-1">
            <Users className="w-3 h-3" /> Semua
          </span>
        );
      case 'mentors':
        return (
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold border border-indigo-200 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Mentor
          </span>
        );
      case 'users':
        return (
          <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-bold border border-pink-200 flex items-center gap-1">
            <Users className="w-3 h-3" /> User
          </span>
        );
    }
  };

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Newsletter</h1>
            <p className="text-sm text-gray-500">Kirim email ke mentor dan user terdaftar</p>
          </div>
        </div>
        <button
          onClick={() => openEditor()}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm shadow-purple-200 transition w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Buat Newsletter
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Newsletter List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Subject</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Target</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Dibuat</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Dikirim</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {newsletters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Mail className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Belum ada newsletter</p>
                  </td>
                </tr>
              ) : (
                newsletters.map((newsletter) => (
                  <tr key={newsletter.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{newsletter.subject}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {newsletter.content.replace(/<[^>]*>/g, '').slice(0, 50)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getTargetBadge(newsletter.target_audience)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(newsletter.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(newsletter.created_at), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {newsletter.sent_at
                        ? format(new Date(newsletter.sent_at), 'dd MMM yyyy HH:mm', { locale: id })
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {newsletter.status === 'sent' && (
                          <button
                            onClick={() => openStats(newsletter)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Statistik"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        )}
                        {newsletter.status === 'draft' && (
                          <>
                            <button
                              onClick={() => openEditor(newsletter)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(newsletter.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {newsletters.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <Mail className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Belum ada newsletter</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {newsletters.map((newsletter) => (
                <div key={newsletter.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{newsletter.subject}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                        {newsletter.content.replace(/<[^>]*>/g, '').slice(0, 60)}...
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getTargetBadge(newsletter.target_audience)}
                        {getStatusBadge(newsletter.status)}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Dibuat: {format(new Date(newsletter.created_at), 'dd MMM yyyy', { locale: id })}
                        {newsletter.sent_at && (
                          <span> • Dikirim: {format(new Date(newsletter.sent_at), 'dd MMM yyyy', { locale: id })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {newsletter.status === 'sent' && (
                        <button
                          onClick={() => openStats(newsletter)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Statistik"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      )}
                      {newsletter.status === 'draft' && (
                        <>
                          <button
                            onClick={() => openEditor(newsletter)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(newsletter.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-lg text-slate-900">
                {selectedNewsletter ? 'Edit Newsletter' : 'Buat Newsletter Baru'}
              </h2>
              <button
                onClick={closeEditor}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTargetAudience('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      targetAudience === 'all'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setTargetAudience('mentors')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      targetAudience === 'mentors'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Mentor Saja
                  </button>
                  <button
                    onClick={() => setTargetAudience('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      targetAudience === 'users'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    User Saja
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Masukkan subject email..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konten (HTML)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="<p>Halo {{name}},</p><p>...</p>"
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Gunakan {'{{name}}'} untuk menyisipkan nama recipient
                </p>
              </div>

              {/* Preview */}
              {content && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                  <div
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: content.replace(/{{name}}/g, 'John Doe') }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
              <button
                onClick={closeEditor}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || isSending}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Draft
              </button>
              <button
                onClick={handleSend}
                disabled={isSaving || isSending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {isStatsOpen && selectedNewsletter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4 sm:p-6 mx-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-slate-900">Statistik Newsletter</h2>
              <button
                onClick={() => setIsStatsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600">Subject</p>
                <p className="font-medium text-slate-900">{selectedNewsletter.subject}</p>
              </div>

              {stats ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-900">{stats.total_recipients}</p>
                      <p className="text-sm text-gray-500">Total Penerima</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{stats.delivered_count}</p>
                      <p className="text-sm text-green-600">Terdeliver</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{stats.failed_count}</p>
                      <p className="text-sm text-red-600">Gagal</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{stats.opened_count}</p>
                      <p className="text-sm text-blue-600">Dibuka</p>
                    </div>
                  </div>

                  {stats.total_recipients > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Open Rate</p>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{
                            width: `${(stats.opened_count / stats.total_recipients) * 100}%`
                          }}
                        />
                      </div>
                      <p className="text-right text-sm font-medium text-slate-900 mt-1">
                        {((stats.opened_count / stats.total_recipients) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-500">Memuat statistik...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
