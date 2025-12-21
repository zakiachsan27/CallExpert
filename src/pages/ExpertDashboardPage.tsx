import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Briefcase,
  GraduationCap,
  Upload,
  Plus,
  X,
  Save,
  LayoutDashboard,
  CreditCard,
  LogOut,
  FileText,
  Video,
  Package,
  Calendar,
  Clock,
  MessageCircle,
  Loader2,
  CheckCircle
} from "lucide-react";

// Import komponen Shadcn
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import type { SessionType, DigitalProduct } from '../App';
import { projectId } from '../utils/supabase/info.tsx';
import { Edit2, Trash2, Copy } from "lucide-react";
import { ExpertTransactions } from '../components/ExpertTransactions';

export function ExpertDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { expertAccessToken, expertId, logoutExpert } = useAuth();

  // Get active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/layanan')) return 'layanan';
    if (path.includes('/profil')) return 'profil';
    // Default to transaksi (first tab)
    return 'transaksi';
  };

  const activeTab = getActiveTabFromPath();

  const handleTabChange = (value: string) => {
    const paths: Record<string, string> = {
      transaksi: '/expert/dashboard',
      layanan: '/expert/dashboard/layanan',
      profil: '/expert/dashboard/profil'
    };
    navigate(paths[value] || '/expert/dashboard');
  };

  // State management for services (Layanan tab)
  const [isLoadingLayanan, setIsLoadingLayanan] = useState(false);
  const [layananLoaded, setLayananLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [availableDays, setAvailableDays] = useState<Array<'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'>>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{
    day: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
    start: string;
    end: string;
  }>>([]);

  const [originalData, setOriginalData] = useState<any>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newSession, setNewSession] = useState({
    name: '',
    category: 'online-video' as const,
    duration: 30,
    price: 0,
    description: ''
  });

  // Lazy load data per tab
  useEffect(() => {
    if (expertAccessToken && activeTab === 'layanan' && !layananLoaded) {
      fetchExpertProfile();
    }
  }, [expertAccessToken, activeTab, layananLoaded]);

  // Detect changes
  useEffect(() => {
    if (!originalData) return;

    const currentData = {
      sessionTypes: JSON.stringify(sessionTypes),
      digitalProducts: JSON.stringify(digitalProducts),
      availableDays: JSON.stringify(availableDays),
      availableTimeSlots: JSON.stringify(availableTimeSlots),
    };

    const servicesChanged =
      currentData.sessionTypes !== originalData.sessionTypes ||
      currentData.digitalProducts !== originalData.digitalProducts ||
      currentData.availableDays !== originalData.availableDays ||
      currentData.availableTimeSlots !== originalData.availableTimeSlots;

    setHasChanges(servicesChanged);
  }, [sessionTypes, digitalProducts, availableDays, availableTimeSlots, originalData]);

  const fetchExpertProfile = async () => {
    setIsLoadingLayanan(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/profile`,
        {
          headers: {
            'Authorization': `Bearer ${expertAccessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      const expert = data.expert;

      setSessionTypes(expert.sessionTypes || []);
      setDigitalProducts(expert.digitalProducts || []);
      setAvailableDays(expert.availableDays || []);
      setAvailableTimeSlots(expert.availableTimeSlots || []);

      setOriginalData({
        sessionTypes: JSON.stringify(expert.sessionTypes || []),
        digitalProducts: JSON.stringify(expert.digitalProducts || []),
        availableDays: JSON.stringify(expert.availableDays || []),
        availableTimeSlots: JSON.stringify(expert.availableTimeSlots || []),
      });
      setLayananLoaded(true);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Gagal memuat profil');
    } finally {
      setIsLoadingLayanan(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      const updatedProfile = {
        sessionTypes,
        digitalProducts,
        availableDays,
        availableTimeSlots
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${expertAccessToken}`
          },
          body: JSON.stringify(updatedProfile)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      setOriginalData({
        sessionTypes: JSON.stringify(sessionTypes),
        digitalProducts: JSON.stringify(digitalProducts),
        availableDays: JSON.stringify(availableDays),
        availableTimeSlots: JSON.stringify(availableTimeSlots),
      });

    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan profil';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSession = () => {
    const session: SessionType = {
      id: `session-${Date.now()}`,
      ...newSession
    };
    setSessionTypes([...sessionTypes, session]);
    setNewSession({
      name: '',
      category: 'online-video',
      duration: 30,
      price: 0,
      description: ''
    });
    setIsAddDialogOpen(false);
  };

  const handleEditSession = (index: number) => {
    setEditingIndex(index);
    const session = sessionTypes[index];
    setNewSession({
      name: session.name,
      category: session.category,
      duration: session.duration,
      price: session.price,
      description: session.description
    });
  };

  const handleUpdateSession = () => {
    if (editingIndex !== null) {
      const updated = [...sessionTypes];
      updated[editingIndex] = {
        ...updated[editingIndex],
        ...newSession
      };
      setSessionTypes(updated);
      setEditingIndex(null);
      setNewSession({
        name: '',
        category: 'online-video',
        duration: 30,
        price: 0,
        description: ''
      });
    }
  };

  const updateSessionType = (index: number, field: string, value: any) => {
    const updated = [...sessionTypes];
    updated[index] = { ...updated[index], [field]: value };
    setSessionTypes(updated);
  };

  const removeSessionType = (index: number) => {
    setSessionTypes(sessionTypes.filter((_, i) => i !== index));
  };

  const addDigitalProduct = () => {
    const newProduct: DigitalProduct = {
      id: `product-${Date.now()}`,
      name: '',
      description: '',
      price: 0,
      type: 'ebook'
    };
    setDigitalProducts([...digitalProducts, newProduct]);
  };

  const updateDigitalProduct = (index: number, field: string, value: any) => {
    const updated = [...digitalProducts];
    updated[index] = { ...updated[index], [field]: value };
    setDigitalProducts(updated);
  };

  const removeDigitalProduct = (index: number) => {
    setDigitalProducts(digitalProducts.filter((_, i) => i !== index));
  };

  const toggleDay = (day: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu') => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const addTimeSlot = (day: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu') => {
    setAvailableTimeSlots([...availableTimeSlots, {
      day,
      start: '09:00',
      end: '17:00'
    }]);
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updated = [...availableTimeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setAvailableTimeSlots(updated);
  };

  const removeTimeSlot = (index: number) => {
    setAvailableTimeSlots(availableTimeSlots.filter((_, i) => i !== index));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'online-chat':
        return <MessageCircle className="w-5 h-5" />;
      case 'online-video':
        return <Video className="w-5 h-5" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'online-chat':
        return 'bg-brand-50 text-brand-600 border-brand-500';
      case 'online-video':
        return 'bg-blue-50 text-blue-600 border-blue-500';
      default:
        return 'bg-brand-50 text-brand-600 border-brand-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleLogout = () => {
    logoutExpert();
    navigate('/expert/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* 1. Navbar Dashboard */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold italic text-brand-600 tracking-tight">MentorinAja</Link>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider">Expert Area</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 gap-2 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
            <Avatar className="w-8 h-8 border border-gray-200">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Expert" />
              <AvatarFallback>EX</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="max-w-5xl mx-auto py-8 px-4">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Expert Dashboard</h1>
            <p className="text-gray-500 mt-1">Kelola profil, layanan, dan pantau transaksi Anda.</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-200 gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>

        {/* TABS NAVIGATION */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
          <TabsList className="bg-white border border-gray-200 p-1 h-auto rounded-xl inline-flex shadow-sm w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="transaksi" className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 px-4 sm:px-6 py-2.5 rounded-lg gap-2">
              <CreditCard className="w-4 h-4" /> <span className="hidden sm:inline">Transaksi</span>
            </TabsTrigger>
            <TabsTrigger value="layanan" className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 px-4 sm:px-6 py-2.5 rounded-lg gap-2">
              <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">Layanan</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 px-4 sm:px-6 py-2.5 rounded-lg gap-2">
              <User className="w-4 h-4" /> <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* ================= TAB 1: PROFIL (LENGKAP) ================= */}
          <TabsContent value="profil" className="space-y-6 animate-in fade-in-50 duration-500">

            {/* Banner Auto-Fill */}
            <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Malas isi manual?</h3>
                  <p className="text-brand-100 text-sm opacity-90">Upload CV/LinkedIn PDF kamu, biar AI yang isiin semuanya.</p>
                </div>
              </div>
              <Button variant="secondary" className="bg-white text-brand-700 hover:bg-brand-50 border-none font-bold shadow-none whitespace-nowrap w-full sm:w-auto">
                <Upload className="w-4 h-4 mr-2" /> Upload Resume
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* KOLOM KIRI: FOTO & SKILL */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">Foto Profil</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="relative group cursor-pointer">
                      <Avatar className="w-32 h-32 border-4 border-white shadow-xl mb-4">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Expert" />
                        <AvatarFallback>EX</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full">
                        <span className="text-white text-xs font-bold">Ubah</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      Format: JPG, PNG. Max 5MB.<br/>Disarankan rasio 1:1.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">Keahlian (Skills)</CardTitle>
                    <CardDescription>Tag untuk pencarian.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1 cursor-pointer border border-brand-100">
                        Product Mgmt <X className="w-3 h-3 ml-1" />
                      </Badge>
                      <Badge variant="secondary" className="bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1 cursor-pointer border border-brand-100">
                        Agile <X className="w-3 h-3 ml-1" />
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Tambah skill..." className="h-9 text-sm" />
                      <Button size="sm" variant="outline" className="h-9"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* KOLOM KANAN: FORM DETAIL */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-brand-600" /> Informasi Dasar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nama Lengkap</Label>
                        <Input defaultValue="Muhammad Zaki Achsan" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input defaultValue="zaki@bapenda.go.id" disabled className="bg-gray-50 text-gray-500" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Perusahaan</Label>
                        <Input defaultValue="Bapenda" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role / Posisi</Label>
                        <Input defaultValue="Lead Project Manager" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bio Singkat</Label>
                      <Textarea className="h-24" defaultValue="Senior Project Manager dengan pengalaman 8+ tahun di sektor publik dan startup teknologi." />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-brand-600" /> Pengalaman Kerja
                    </CardTitle>
                    <Button variant="outline" size="sm" className="h-8 gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="group relative pl-4 border-l-2 border-brand-200">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-100 border-2 border-brand-600"></div>
                      <div className="space-y-2">
                        <h4 className="font-bold text-sm">Senior Product Manager</h4>
                        <p className="text-xs text-gray-500">Google Indonesia • 2020 - Sekarang</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-brand-600" /> Pendidikan
                    </CardTitle>
                    <Button variant="outline" size="sm" className="h-8 gap-1"><Plus className="w-3 h-3" /> Tambah</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-slate-900 text-sm">Master of Business Administration</h4>
                      <p className="text-xs text-gray-500">Universitas Gadjah Mada • 2022</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ================= TAB 2: LAYANAN (REDESIGNED) ================= */}
          <TabsContent value="layanan" className="space-y-8 animate-in fade-in-50 duration-500">

            {/* Loading State */}
            {isLoadingLayanan && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            )}

            {/* Success Message */}
            {!isLoadingLayanan && saveSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700">Perubahan berhasil disimpan!</p>
              </div>
            )}

            {/* Error Message */}
            {!isLoadingLayanan && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* SECTION 1: KONSULTASI */}
            {!isLoadingLayanan && <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-brand-600" /> Sesi Konsultasi
                  </h3>
                  <p className="text-sm text-gray-500">Atur harga dan durasi mentoring 1-on-1.</p>
                </div>

                {/* MODAL TAMBAH SESI */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-gray-50">
                      <Plus className="w-4 h-4" /> Tambah Sesi
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-white">
                    <DialogHeader>
                      <DialogTitle>Buat Layanan Baru</DialogTitle>
                      <DialogDescription>Tambahkan opsi mentoring baru untuk dilihat mentee.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Judul</Label>
                        <Input
                          id="name"
                          placeholder="Contoh: Mock Interview"
                          className="col-span-3"
                          value={newSession.name}
                          onChange={(e) => setNewSession({...newSession, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Tipe</Label>
                        <div className="col-span-3">
                          <Select value={newSession.category} onValueChange={(value: any) => setNewSession({...newSession, category: value})}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih Tipe Sesi">
                                {newSession.category === 'online-chat' ? 'Chat Konsultasi' : 'Video Call (GMeet/Zoom)'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="online-chat">Chat Konsultasi</SelectItem>
                              <SelectItem value="online-video">Video Call (GMeet/Zoom)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Harga (Rp)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="100000"
                          className="col-span-3"
                          value={newSession.price}
                          onChange={(e) => setNewSession({...newSession, price: Number(e.target.value)})}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">Durasi</Label>
                        <div className="col-span-3">
                          <Select value={String(newSession.duration)} onValueChange={(value) => setNewSession({...newSession, duration: Number(value)})}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Pilih Durasi" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="30">30 Menit</SelectItem>
                              <SelectItem value="45">45 Menit</SelectItem>
                              <SelectItem value="60">60 Menit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="desc" className="text-right pt-2">Deskripsi</Label>
                        <Textarea
                          id="desc"
                          placeholder="Jelaskan apa yang didapat mentee..."
                          className="col-span-3"
                          value={newSession.description}
                          onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleAddSession} className="bg-brand-600 hover:bg-brand-700 text-white">Simpan Layanan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sessionTypes.map((session, index) => (
                  <Card key={session.id} className="border-gray-200 shadow-sm relative overflow-hidden group hover:border-brand-200 transition">
                    <div className={`absolute top-0 left-0 w-1 h-full ${session.category === 'online-chat' ? 'bg-brand-500' : 'bg-blue-500'}`}></div>
                    <CardHeader className="flex flex-row items-start justify-between pb-2 pl-6">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mt-1 ${getCategoryColor(session.category)}`}>
                          {getCategoryIcon(session.category)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{session.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                              {session.duration} Menit
                            </Badge>
                            <span className="text-sm font-bold text-slate-900">{formatPrice(session.price)}</span>
                          </div>
                        </div>
                      </div>
                      <Switch id={`session-${index}`} defaultChecked />
                    </CardHeader>
                    <CardContent className="pl-6 pb-4">
                      <p className="text-xs text-gray-500 line-clamp-2">{session.description}</p>
                    </CardContent>
                    <CardFooter className="bg-gray-50/50 px-6 py-3 flex justify-end gap-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={() => removeSessionType(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      {/* Modal Edit */}
                      <Dialog open={editingIndex === index} onOpenChange={(open) => !open && setEditingIndex(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={() => handleEditSession(index)}>
                            <Edit2 className="w-3 h-3" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] bg-white">
                          <DialogHeader>
                            <DialogTitle>Edit Layanan</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Judul</Label>
                              <Input
                                value={newSession.name}
                                onChange={(e) => setNewSession({...newSession, name: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Tipe</Label>
                              <div className="col-span-3">
                                <Select value={newSession.category} onValueChange={(value: any) => setNewSession({...newSession, category: value})}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue>
                                      {newSession.category === 'online-chat' ? 'Chat Konsultasi' : 'Video Call (GMeet/Zoom)'}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="online-chat">Chat Konsultasi</SelectItem>
                                    <SelectItem value="online-video">Video Call (GMeet/Zoom)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Harga</Label>
                              <Input
                                type="number"
                                value={newSession.price}
                                onChange={(e) => setNewSession({...newSession, price: Number(e.target.value)})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Durasi</Label>
                              <div className="col-span-3">
                                <Select value={String(newSession.duration)} onValueChange={(value) => setNewSession({...newSession, duration: Number(value)})}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="30">30 Menit</SelectItem>
                                    <SelectItem value="45">45 Menit</SelectItem>
                                    <SelectItem value="60">60 Menit</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label className="text-right pt-2">Deskripsi</Label>
                              <Textarea
                                value={newSession.description}
                                onChange={(e) => setNewSession({...newSession, description: e.target.value})}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleUpdateSession} className="bg-brand-600 hover:bg-brand-700 text-white">Update</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}

                {sessionTypes.length === 0 && (
                  <div className="col-span-2">
                    <p className="text-gray-500 text-center py-8">
                      Belum ada tipe sesi. Klik "Tambah Sesi" untuk menambahkan.
                    </p>
                  </div>
                )}
              </div>
            </div>}

            {!isLoadingLayanan && <Separator />}

            {/* SECTION 2: JADWAL KETERSEDIAAN */}
            {!isLoadingLayanan && <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-gray-500" /> Atur Jadwal Ketersediaan
                </CardTitle>
                <CardDescription>Aktifkan hari dan atur jam spesifik dimana kamu bisa menerima booking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Header Table */}
                <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                  <div className="col-span-3">Hari</div>
                  <div className="col-span-4">Jam Mulai</div>
                  <div className="col-span-4">Jam Selesai</div>
                  <div className="col-span-1 text-center">Status</div>
                </div>

                {/* Day Rows */}
                {(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] as const).map((day) => {
                  const isActive = availableDays.includes(day);
                  const daySlot = availableTimeSlots.find(slot => slot.day === day);

                  return (
                    <div key={day} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center p-3 rounded-lg border transition-all ${isActive ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-transparent opacity-60'}`}>
                      {/* Day Name & Toggle */}
                      <div className="col-span-3 flex items-center justify-between sm:justify-start gap-3">
                        <span className={`font-bold text-sm capitalize ${isActive ? 'text-slate-900' : 'text-gray-400'}`}>{day}</span>
                        {/* Mobile Only Toggle */}
                        <div className="sm:hidden">
                          <Switch checked={isActive} onCheckedChange={() => {
                            toggleDay(day);
                            if (!isActive && !daySlot) {
                              addTimeSlot(day);
                            }
                          }} />
                        </div>
                      </div>

                      {/* Time Inputs */}
                      <div className="col-span-4">
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            type="time"
                            value={daySlot?.start || '09:00'}
                            onChange={(e) => {
                              const slotIndex = availableTimeSlots.findIndex(s => s.day === day);
                              if (slotIndex !== -1) {
                                updateTimeSlot(slotIndex, 'start', e.target.value);
                              }
                            }}
                            disabled={!isActive}
                            className="pl-9 h-9 text-sm bg-white"
                          />
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                          <Input
                            type="time"
                            value={daySlot?.end || '17:00'}
                            onChange={(e) => {
                              const slotIndex = availableTimeSlots.findIndex(s => s.day === day);
                              if (slotIndex !== -1) {
                                updateTimeSlot(slotIndex, 'end', e.target.value);
                              }
                            }}
                            disabled={!isActive}
                            className="pl-9 h-9 text-sm bg-white"
                          />
                        </div>
                      </div>

                      {/* Desktop Toggle Switch */}
                      <div className="hidden sm:flex col-span-1 justify-center">
                        <Switch checked={isActive} onCheckedChange={() => {
                          toggleDay(day);
                          if (!isActive && !daySlot) {
                            addTimeSlot(day);
                          }
                        }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>}
          </TabsContent>

          {/* ================= TAB 3: TRANSAKSI ================= */}
          <TabsContent value="transaksi">
            <ExpertTransactions accessToken={expertAccessToken || ''} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Sticky Save Button */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex justify-end gap-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-600 hover:bg-brand-700 shadow-md text-white"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
