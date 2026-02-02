import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  CheckCircle,
  Camera
} from "lucide-react";
import { uploadAvatar } from "../services/storage";
import { parseResumeWithAI, type AIParsedResume } from "../services/resumeParser";
import { updateExpertProfile } from "../services/database";

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

// Helper function to format period from AI-parsed dates
function formatPeriod(startDate: string | null, endDate: string | null, isCurrent: boolean): string {
  const formatDate = (date: string | null): string => {
    if (!date) return '';
    const [year, month] = date.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = parseInt(month, 10) - 1;
    return `${months[monthIdx] || ''} ${year}`;
  };

  const start = formatDate(startDate);
  const end = isCurrent ? 'Present' : formatDate(endDate);

  if (start && end) {
    return `${start} - ${end}`;
  } else if (start) {
    return start;
  } else if (end) {
    return end;
  }
  return 'Present';
}

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

  // Dialog states for Sessions
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newSession, setNewSession] = useState({
    name: '',
    category: 'online-video' as const,
    duration: 30,
    price: 0,
    description: ''
  });

  // Dialog states for Digital Products
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'ebook' as const,
    price: 0,
    description: '',
    downloadLink: ''
  });

  // Dialog state for Schedule
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  // Profile fields state
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileRole, setProfileRole] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Avatar state
  const [profileAvatar, setProfileAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Work Experience state
  const [workExperiences, setWorkExperiences] = useState<Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>>([]);
  const [isAddWorkExpDialogOpen, setIsAddWorkExpDialogOpen] = useState(false);
  const [editingWorkExpIndex, setEditingWorkExpIndex] = useState<number | null>(null);
  const [newWorkExp, setNewWorkExp] = useState({
    title: '',
    company: '',
    period: '',
    description: ''
  });

  // Education state
  const [educations, setEducations] = useState<string[]>([]);
  const [isAddEducationDialogOpen, setIsAddEducationDialogOpen] = useState(false);
  const [newEducation, setNewEducation] = useState('');

  // Resume upload state
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('');
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Lazy load data per tab
  useEffect(() => {
    if (expertAccessToken && (activeTab === 'layanan' || activeTab === 'profil') && !layananLoaded) {
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
      profileName,
      profileCompany,
      profileRole,
      profileBio,
      profileSkills: JSON.stringify(profileSkills),
      profileAvatar,
      workExperiences: JSON.stringify(workExperiences),
      educations: JSON.stringify(educations),
    };

    const servicesChanged =
      currentData.sessionTypes !== originalData.sessionTypes ||
      currentData.digitalProducts !== originalData.digitalProducts ||
      currentData.availableDays !== originalData.availableDays ||
      currentData.availableTimeSlots !== originalData.availableTimeSlots;

    const profileChanged =
      currentData.profileName !== originalData.profileName ||
      currentData.profileCompany !== originalData.profileCompany ||
      currentData.profileRole !== originalData.profileRole ||
      currentData.profileBio !== originalData.profileBio ||
      currentData.profileSkills !== originalData.profileSkills ||
      currentData.profileAvatar !== originalData.profileAvatar ||
      currentData.workExperiences !== originalData.workExperiences ||
      currentData.educations !== originalData.educations ||
      avatarFile !== null;

    setHasChanges(servicesChanged || profileChanged);
  }, [sessionTypes, digitalProducts, availableDays, availableTimeSlots, originalData, profileName, profileCompany, profileRole, profileBio, profileSkills, profileAvatar, workExperiences, educations, avatarFile]);

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

      // Set profile fields
      setProfileName(expert.name || '');
      setProfileEmail(expert.email || '');
      setProfileCompany(expert.company || '');
      setProfileRole(expert.role || '');
      setProfileBio(expert.bio || '');
      setProfileSkills(expert.skills || []);
      setProfileAvatar(expert.avatar || '');
      setAvatarPreview(expert.avatar || '');
      setWorkExperiences(expert.workExperience || []);
      setEducations(expert.education || []);

      setOriginalData({
        sessionTypes: JSON.stringify(expert.sessionTypes || []),
        digitalProducts: JSON.stringify(expert.digitalProducts || []),
        availableDays: JSON.stringify(expert.availableDays || []),
        availableTimeSlots: JSON.stringify(expert.availableTimeSlots || []),
        profileName: expert.name || '',
        profileCompany: expert.company || '',
        profileRole: expert.role || '',
        profileBio: expert.bio || '',
        profileSkills: JSON.stringify(expert.skills || []),
        profileAvatar: expert.avatar || '',
        workExperiences: JSON.stringify(expert.workExperience || []),
        educations: JSON.stringify(expert.education || []),
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
      // Upload avatar if new file selected
      let avatarUrl = profileAvatar;
      if (avatarFile && expertId) {
        try {
          toast.loading('Mengupload foto...', { id: 'upload-avatar' });
          avatarUrl = await uploadAvatar(avatarFile, expertId);
          console.log('Avatar uploaded successfully:', avatarUrl);
          setProfileAvatar(avatarUrl);
          setAvatarFile(null);
          toast.dismiss('upload-avatar');

          // Also update avatar_url in Supabase database for consistency
          await updateExpertProfile(expertId, { avatar_url: avatarUrl });
          console.log('Avatar URL saved to database');
        } catch (uploadErr: any) {
          toast.dismiss('upload-avatar');
          console.error('Error uploading avatar:', uploadErr);
          const errorMsg = uploadErr?.message || 'Gagal upload foto profil';
          throw new Error(`Upload gagal: ${errorMsg}`);
        }
      }

      const updatedProfile = {
        sessionTypes,
        digitalProducts,
        availableDays,
        availableTimeSlots,
        name: profileName,
        company: profileCompany,
        role: profileRole,
        bio: profileBio,
        skills: profileSkills,
        avatar: avatarUrl,
        workExperience: workExperiences,
        education: educations
      };

      toast.loading('Menyimpan perubahan...', { id: 'save-profile' });

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

      toast.dismiss('save-profile');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server response error:', response.status, errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Profile saved successfully:', responseData);

      // Also sync basic profile data to Supabase database
      if (expertId) {
        try {
          await updateExpertProfile(expertId, {
            name: profileName,
            company: profileCompany,
            role: profileRole,
            bio: profileBio,
            avatar_url: avatarUrl
          });
        } catch (dbErr) {
          console.warn('Warning: Could not sync to database:', dbErr);
          // Don't throw - KV save was successful
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Perubahan berhasil disimpan!', {
        description: avatarFile ? 'Foto profil dan data telah diperbarui.' : 'Data profil telah diperbarui.'
      });

      setOriginalData({
        sessionTypes: JSON.stringify(sessionTypes),
        digitalProducts: JSON.stringify(digitalProducts),
        availableDays: JSON.stringify(availableDays),
        availableTimeSlots: JSON.stringify(availableTimeSlots),
        profileName,
        profileCompany,
        profileRole,
        profileBio,
        profileSkills: JSON.stringify(profileSkills),
        profileAvatar: avatarUrl,
        workExperiences: JSON.stringify(workExperiences),
        educations: JSON.stringify(educations),
      });

    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan profil';
      setError(errorMessage);
      toast.error('Gagal menyimpan perubahan', {
        description: errorMessage
      });
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

  const handleAddProduct = () => {
    const product: DigitalProduct = {
      id: `product-${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      type: newProduct.type,
      downloadLink: newProduct.downloadLink,
      enabled: true
    };
    setDigitalProducts([...digitalProducts, product]);
    setNewProduct({
      name: '',
      type: 'ebook',
      price: 0,
      description: '',
      downloadLink: ''
    });
    setIsAddProductDialogOpen(false);
  };

  const handleEditProduct = (index: number) => {
    setEditingProductIndex(index);
    const product = digitalProducts[index];
    setNewProduct({
      name: product.name,
      type: product.type,
      price: product.price,
      description: product.description,
      downloadLink: product.downloadLink || ''
    });
  };

  const handleUpdateProduct = () => {
    if (editingProductIndex !== null) {
      const updated = [...digitalProducts];
      updated[editingProductIndex] = {
        ...updated[editingProductIndex],
        name: newProduct.name,
        type: newProduct.type,
        price: newProduct.price,
        description: newProduct.description,
        downloadLink: newProduct.downloadLink
      };
      setDigitalProducts(updated);
      setEditingProductIndex(null);
      setNewProduct({
        name: '',
        type: 'ebook',
        price: 0,
        description: '',
        downloadLink: ''
      });
    }
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

  // Avatar handlers
  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar', { description: 'Maksimal 5MB' });
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Format file tidak didukung', { description: 'Gunakan format JPG, PNG, atau WebP' });
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      toast.info('Foto dipilih', { description: 'Klik "Simpan Perubahan" untuk mengupload.' });
    }
  };

  // Work Experience handlers
  const handleAddWorkExp = () => {
    if (!newWorkExp.title || !newWorkExp.company) return;

    setWorkExperiences([...workExperiences, { ...newWorkExp }]);
    setNewWorkExp({ title: '', company: '', period: '', description: '' });
    setIsAddWorkExpDialogOpen(false);
  };

  const handleEditWorkExp = (index: number) => {
    setEditingWorkExpIndex(index);
    setNewWorkExp({ ...workExperiences[index] });
  };

  const handleUpdateWorkExp = () => {
    if (editingWorkExpIndex !== null) {
      const updated = [...workExperiences];
      updated[editingWorkExpIndex] = { ...newWorkExp };
      setWorkExperiences(updated);
      setEditingWorkExpIndex(null);
      setNewWorkExp({ title: '', company: '', period: '', description: '' });
    }
  };

  const handleRemoveWorkExp = (index: number) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!newEducation.trim()) return;
    setEducations([...educations, newEducation.trim()]);
    setNewEducation('');
    setIsAddEducationDialogOpen(false);
  };

  const handleRemoveEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  // Resume upload handler
  const handleResumeClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Hanya file PDF yang didukung');
      return;
    }

    setIsParsingResume(true);
    setError('');

    try {
      const parsedData = await parseResumeWithAI(file);
      setResumeFileName(file.name);

      // Auto-fill form fields with AI-parsed data
      if (parsedData.name) setProfileName(parsedData.name);
      if (parsedData.summary) setProfileBio(parsedData.summary);
      if (parsedData.skills && parsedData.skills.length > 0) {
        setProfileSkills(prev => [...new Set([...prev, ...parsedData.skills])]);
      }

      // Convert AI experiences to form format
      if (parsedData.experiences && parsedData.experiences.length > 0) {
        // Set company and role from first (current) experience
        const currentExp = parsedData.experiences[0];
        if (currentExp.company) setProfileCompany(currentExp.company);
        if (currentExp.title) setProfileRole(currentExp.title);

        // Convert experiences to form format
        const formExperiences = parsedData.experiences.map(exp => ({
          title: exp.title,
          company: exp.location ? `${exp.company}, ${exp.location}` : exp.company,
          period: formatPeriod(exp.start_date, exp.end_date, exp.is_current),
          description: exp.description || ''
        }));
        setWorkExperiences(formExperiences);
      }

      // Convert education to string format
      if (parsedData.education && parsedData.education.length > 0) {
        const formEducation = parsedData.education.map(edu => {
          let eduStr = edu.institution;
          if (edu.degree) eduStr = `${edu.degree} - ${eduStr}`;
          if (edu.field_of_study) eduStr += `, ${edu.field_of_study}`;
          return eduStr;
        });
        setEducations(formEducation);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error parsing resume:', err);
      setError('Gagal membaca file resume. Pastikan file PDF valid.');
    } finally {
      setIsParsingResume(false);
      // Reset input
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
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
      <main className="max-w-5xl mx-auto py-6 sm:py-8 px-4">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Expert Dashboard</h1>
            <p className="text-gray-500 text-sm sm:text-base mt-1">Kelola profil, layanan, dan pantau transaksi Anda.</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-md gap-2 h-10"
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

        {/* TABS NAVIGATION - Clean Design */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-gray-100/80 p-1 h-auto rounded-lg w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="transaksi" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-3 sm:px-6 py-2.5 rounded-md gap-2 text-xs sm:text-sm font-medium text-gray-600">
              <CreditCard className="w-4 h-4" /> <span>Transaksi</span>
            </TabsTrigger>
            <TabsTrigger value="layanan" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-3 sm:px-6 py-2.5 rounded-md gap-2 text-xs sm:text-sm font-medium text-gray-600">
              <LayoutDashboard className="w-4 h-4" /> <span>Layanan</span>
            </TabsTrigger>
            <TabsTrigger value="profil" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm px-3 sm:px-6 py-2.5 rounded-md gap-2 text-xs sm:text-sm font-medium text-gray-600">
              <User className="w-4 h-4" /> <span>Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* ================= TAB 1: PROFIL ================= */}
          <TabsContent value="profil" className="animate-in fade-in-50 duration-300">
            {/* Unified White Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Banner Auto-Fill */}
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Malas isi manual?</h3>
                    <p className="text-brand-100 text-sm">
                      {resumeFileName ? `✓ ${resumeFileName}` : 'Upload CV/LinkedIn PDF kamu, biar AI yang isiin.'}
                    </p>
                  </div>
                </div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  className="bg-white text-brand-700 hover:bg-brand-50 border-none font-semibold shadow-none whitespace-nowrap"
                  onClick={handleResumeClick}
                  disabled={isParsingResume}
                >
                  {isParsingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" /> Upload Resume
                    </>
                  )}
                </Button>
              </div>

              {/* Content Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                  {/* LEFT COLUMN: Photo & Skills */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Photo Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-4">Foto Profil</h4>
                      <div className="flex flex-col items-center">
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <div
                          className="relative group cursor-pointer mb-3"
                          onClick={handleAvatarClick}
                        >
                          <Avatar className="w-28 h-28 border-4 border-gray-100 shadow-md">
                            <AvatarImage src={avatarPreview || profileAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileName || 'Expert'}`} />
                            <AvatarFallback>{profileName?.charAt(0) || 'EX'}</AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                          {avatarFile && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 text-center">
                          {avatarFile ? 'Klik Simpan untuk mengupload' : 'JPG, PNG. Max 5MB. Rasio 1:1'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      {/* Skills Section */}
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">Keahlian</h4>
                      <p className="text-xs text-gray-500 mb-3">Tag untuk pencarian</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {profileSkills.map((skill, index) => (
                          <Badge
                            key={index}
                            className="bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1 cursor-pointer text-xs font-medium"
                            onClick={() => setProfileSkills(profileSkills.filter((_, i) => i !== index))}
                          >
                            {skill} <X className="w-3 h-3 ml-1.5" />
                          </Badge>
                        ))}
                        {profileSkills.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Belum ada skill. Tambahkan skill Anda.</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Tambah skill..."
                          className="h-9 text-sm"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newSkill.trim()) {
                              e.preventDefault();
                              setProfileSkills([...profileSkills, newSkill.trim()]);
                              setNewSkill('');
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-3"
                          onClick={() => {
                            if (newSkill.trim()) {
                              setProfileSkills([...profileSkills, newSkill.trim()]);
                              setNewSkill('');
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Form Details */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-4 h-4 text-brand-600" />
                        <h4 className="text-sm font-semibold text-slate-900">Informasi Dasar</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-600">Nama Lengkap</Label>
                            <Input
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              placeholder="Nama lengkap"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-600">Email</Label>
                            <Input value={profileEmail} disabled className="h-10 bg-gray-50 text-gray-500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-600">Perusahaan</Label>
                            <Input
                              value={profileCompany}
                              onChange={(e) => setProfileCompany(e.target.value)}
                              placeholder="Nama perusahaan"
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-gray-600">Role / Posisi</Label>
                            <Input
                              value={profileRole}
                              onChange={(e) => setProfileRole(e.target.value)}
                              placeholder="Posisi atau jabatan"
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-gray-600">Bio Singkat</Label>
                          <Textarea
                            className="h-24 resize-none"
                            value={profileBio}
                            onChange={(e) => setProfileBio(e.target.value)}
                            placeholder="Ceritakan tentang diri Anda, pengalaman, dan keahlian..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      {/* Work Experience */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-brand-600" />
                          <h4 className="text-sm font-semibold text-slate-900">Pengalaman Kerja</h4>
                        </div>
                        <Dialog open={isAddWorkExpDialogOpen} onOpenChange={setIsAddWorkExpDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50">
                              <Plus className="w-3 h-3" /> Tambah
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px] bg-white">
                            <DialogHeader>
                              <DialogTitle>Tambah Pengalaman Kerja</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Jabatan</Label>
                                <Input
                                  value={newWorkExp.title}
                                  onChange={(e) => setNewWorkExp({...newWorkExp, title: e.target.value})}
                                  placeholder="Senior Product Manager"
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Perusahaan</Label>
                                <Input
                                  value={newWorkExp.company}
                                  onChange={(e) => setNewWorkExp({...newWorkExp, company: e.target.value})}
                                  placeholder="Google Indonesia"
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Periode</Label>
                                <Input
                                  value={newWorkExp.period}
                                  onChange={(e) => setNewWorkExp({...newWorkExp, period: e.target.value})}
                                  placeholder="2020 - Sekarang"
                                  className="col-span-3"
                                />
                              </div>
                              <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Deskripsi</Label>
                                <Textarea
                                  value={newWorkExp.description}
                                  onChange={(e) => setNewWorkExp({...newWorkExp, description: e.target.value})}
                                  placeholder="Deskripsi pekerjaan (opsional)"
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAddWorkExp} className="bg-brand-600 hover:bg-brand-700 text-white">Simpan</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {workExperiences.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Belum ada pengalaman kerja. Klik Tambah untuk menambahkan.</p>
                      ) : (
                        <div className="pl-4 border-l-2 border-brand-200 space-y-4">
                          {workExperiences.map((exp, index) => (
                            <div key={index} className="relative group">
                              <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-brand-100 border-2 border-brand-500"></div>
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-semibold text-sm text-slate-900">{exp.title}</h5>
                                  <p className="text-xs text-gray-500">{exp.company} • {exp.period}</p>
                                  {exp.description && <p className="text-xs text-gray-400 mt-1">{exp.description}</p>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <Dialog open={editingWorkExpIndex === index} onOpenChange={(open) => !open && setEditingWorkExpIndex(null)}>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditWorkExp(index)}>
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[500px] bg-white">
                                      <DialogHeader>
                                        <DialogTitle>Edit Pengalaman Kerja</DialogTitle>
                                      </DialogHeader>
                                      <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label className="text-right">Jabatan</Label>
                                          <Input
                                            value={newWorkExp.title}
                                            onChange={(e) => setNewWorkExp({...newWorkExp, title: e.target.value})}
                                            className="col-span-3"
                                          />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label className="text-right">Perusahaan</Label>
                                          <Input
                                            value={newWorkExp.company}
                                            onChange={(e) => setNewWorkExp({...newWorkExp, company: e.target.value})}
                                            className="col-span-3"
                                          />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label className="text-right">Periode</Label>
                                          <Input
                                            value={newWorkExp.period}
                                            onChange={(e) => setNewWorkExp({...newWorkExp, period: e.target.value})}
                                            className="col-span-3"
                                          />
                                        </div>
                                        <div className="grid grid-cols-4 items-start gap-4">
                                          <Label className="text-right pt-2">Deskripsi</Label>
                                          <Textarea
                                            value={newWorkExp.description}
                                            onChange={(e) => setNewWorkExp({...newWorkExp, description: e.target.value})}
                                            className="col-span-3"
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button onClick={handleUpdateWorkExp} className="bg-brand-600 hover:bg-brand-700 text-white">Update</Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleRemoveWorkExp(index)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      {/* Education */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-brand-600" />
                          <h4 className="text-sm font-semibold text-slate-900">Pendidikan</h4>
                        </div>
                        <Dialog open={isAddEducationDialogOpen} onOpenChange={setIsAddEducationDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50">
                              <Plus className="w-3 h-3" /> Tambah
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px] bg-white">
                            <DialogHeader>
                              <DialogTitle>Tambah Pendidikan</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              <Label className="text-sm">Pendidikan</Label>
                              <Input
                                value={newEducation}
                                onChange={(e) => setNewEducation(e.target.value)}
                                placeholder="S1 Teknik Informatika - Universitas Indonesia (2020)"
                                className="mt-2"
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAddEducation} className="bg-brand-600 hover:bg-brand-700 text-white">Simpan</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {educations.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Belum ada pendidikan. Klik Tambah untuk menambahkan.</p>
                      ) : (
                        <div className="space-y-2">
                          {educations.map((edu, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group">
                              <p className="text-sm text-slate-900">{edu}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                onClick={() => handleRemoveEducation(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ================= TAB 2: LAYANAN ================= */}
          <TabsContent value="layanan" className="animate-in fade-in-50 duration-300">
            {/* Unified White Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Loading State */}
              {isLoadingLayanan && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                </div>
              )}

              {/* Success/Error Messages */}
              {!isLoadingLayanan && saveSuccess && (
                <div className="mx-6 mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 text-sm">Perubahan berhasil disimpan!</p>
                </div>
              )}
              {!isLoadingLayanan && error && (
                <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* SECTION 1: SESI KONSULTASI */}
              {!isLoadingLayanan && (
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-brand-600" />
                        <h3 className="text-sm font-semibold text-slate-900">Sesi Konsultasi</h3>
                      </div>
                      <p className="text-xs text-gray-500">Atur harga dan durasi mentoring 1-on-1.</p>
                    </div>

                    <div className="flex gap-2">
                      {/* BUTTON JADWAL */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 h-9 border-brand-200 text-brand-600 hover:bg-brand-50"
                        onClick={() => setIsScheduleDialogOpen(true)}
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Atur Jadwal</span>
                        <span className="sm:hidden">Jadwal</span>
                        {availableDays.length > 0 && (
                          <Badge className="ml-1 bg-brand-100 text-brand-700 text-[10px] px-1.5">{availableDays.length} hari</Badge>
                        )}
                      </Button>

                      {/* MODAL TAMBAH SESI */}
                      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-2 bg-brand-600 hover:bg-brand-700 text-white h-9">
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sessionTypes.map((session, index) => (
                      <div key={session.id} className="bg-gray-50 rounded-lg p-4 relative group hover:bg-gray-100/80 transition">
                        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${session.category === 'online-chat' ? 'bg-brand-500' : 'bg-blue-500'}`}></div>
                        <div className="pl-2">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(session.category)}`}>
                                {getCategoryIcon(session.category)}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900">{session.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500">{session.duration} menit</span>
                                  <span className="text-xs text-gray-300">•</span>
                                  <span className="text-sm font-semibold text-brand-600">{formatPrice(session.price)}</span>
                                </div>
                                {session.description && (
                                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{session.description}</p>
                                )}
                              </div>
                            </div>
                            <Switch
                              id={`session-${index}`}
                              checked={session.enabled !== false}
                              onCheckedChange={(checked) => {
                                const updated = [...sessionTypes];
                                updated[index] = { ...updated[index], enabled: checked };
                                setSessionTypes(updated);
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200/50">
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
                          </div>
                        </div>
                      </div>
                    ))}

                    {sessionTypes.length === 0 && (
                      <div className="col-span-2 text-center py-8">
                        <p className="text-gray-500 text-sm">Belum ada tipe sesi. Klik "Tambah Sesi" untuk menambahkan.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DIALOG JADWAL KETERSEDIAAN */}
              <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-600" />
                      Jadwal Ketersediaan
                    </DialogTitle>
                    <DialogDescription>
                      Aktifkan hari dan tambah sesi waktu untuk menerima booking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
                    {(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] as const).map((day) => {
                      const isActive = availableDays.includes(day);
                      const daySlots = availableTimeSlots.filter(slot => slot.day === day);

                      return (
                        <div key={day} className={`p-3 rounded-lg transition-all ${isActive ? 'bg-brand-50/50 border border-brand-100' : 'bg-gray-50 border border-transparent'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold text-sm capitalize ${isActive ? 'text-slate-900' : 'text-gray-400'}`}>{day}</span>
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => {
                                toggleDay(day);
                                if (!isActive && daySlots.length === 0) {
                                  addTimeSlot(day);
                                }
                              }}
                            />
                          </div>

                          {isActive && (
                            <div className="space-y-2">
                              {daySlots.map((slot, slotIdx) => {
                                const globalIndex = availableTimeSlots.findIndex(s => s === slot);
                                return (
                                  <div key={slotIdx} className="flex items-center gap-1.5 bg-white p-2 rounded border border-gray-200">
                                    <Input
                                      type="time"
                                      value={slot.start}
                                      onChange={(e) => updateTimeSlot(globalIndex, 'start', e.target.value)}
                                      className="flex-1 h-7 text-xs px-2"
                                    />
                                    <span className="text-gray-400 text-xs">-</span>
                                    <Input
                                      type="time"
                                      value={slot.end}
                                      onChange={(e) => updateTimeSlot(globalIndex, 'end', e.target.value)}
                                      className="flex-1 h-7 text-xs px-2"
                                    />
                                    <button onClick={() => removeTimeSlot(globalIndex)} className="text-gray-400 hover:text-red-500 p-0.5">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="w-full h-7 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                                onClick={() => addTimeSlot(day)}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Tambah Slot
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsScheduleDialogOpen(false)} className="bg-brand-600 hover:bg-brand-700 text-white">
                      Selesai
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* SECTION 3: PRODUK DIGITAL */}
              {!isLoadingLayanan && (
                <div className="border-t border-gray-100 p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-brand-600" />
                        <h3 className="text-sm font-semibold text-slate-900">Produk Digital</h3>
                      </div>
                      <p className="text-xs text-gray-500">Jual e-book, template, course, atau materi digital lainnya.</p>
                    </div>

                    {/* Add Product Dialog */}
                    <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 bg-brand-600 hover:bg-brand-700 text-white h-9">
                          <Plus className="w-4 h-4" /> Tambah Produk
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] bg-white">
                        <DialogHeader>
                          <DialogTitle>Tambah Produk Digital</DialogTitle>
                          <DialogDescription>Tambahkan produk digital untuk dijual kepada mentee.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="product-name" className="text-right">Nama</Label>
                            <Input
                              id="product-name"
                              placeholder="Contoh: Template CV ATS-Friendly"
                              className="col-span-3"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="product-type" className="text-right">Tipe</Label>
                            <div className="col-span-3">
                              <Select value={newProduct.type} onValueChange={(value: any) => setNewProduct({...newProduct, type: value})}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Pilih Tipe Produk" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  <SelectItem value="ebook">E-Book</SelectItem>
                                  <SelectItem value="course">Course</SelectItem>
                                  <SelectItem value="template">Template</SelectItem>
                                  <SelectItem value="guide">Guide</SelectItem>
                                  <SelectItem value="other">Lainnya</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="product-price" className="text-right">Harga (Rp)</Label>
                            <Input
                              id="product-price"
                              type="number"
                              placeholder="50000"
                              className="col-span-3"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="product-desc" className="text-right pt-2">Deskripsi</Label>
                            <Textarea
                              id="product-desc"
                              placeholder="Jelaskan isi produk digital Anda..."
                              className="col-span-3"
                              value={newProduct.description}
                              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="product-link" className="text-right">Link Download</Label>
                            <Input
                              id="product-link"
                              placeholder="https://drive.google.com/..."
                              className="col-span-3"
                              value={newProduct.downloadLink}
                              onChange={(e) => setNewProduct({...newProduct, downloadLink: e.target.value})}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" onClick={handleAddProduct} className="bg-brand-600 hover:bg-brand-700 text-white">Simpan Produk</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {digitalProducts.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Belum ada produk digital.</p>
                      <p className="text-gray-400 text-xs mt-1">Klik "Tambah Produk" untuk mulai menjual.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {digitalProducts.map((product, index) => (
                        <div key={product.id} className="bg-gray-50 rounded-lg p-4 relative group hover:bg-gray-100/80 transition">
                          <div className={`absolute top-0 left-0 w-1 h-full rounded-l-lg ${
                            product.type === 'ebook' ? 'bg-emerald-500' :
                            product.type === 'course' ? 'bg-purple-500' :
                            product.type === 'template' ? 'bg-orange-500' :
                            product.type === 'guide' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></div>
                          <div className="pl-2">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  product.type === 'ebook' ? 'bg-emerald-100' :
                                  product.type === 'course' ? 'bg-purple-100' :
                                  product.type === 'template' ? 'bg-orange-100' :
                                  product.type === 'guide' ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  <FileText className={`w-4 h-4 ${
                                    product.type === 'ebook' ? 'text-emerald-600' :
                                    product.type === 'course' ? 'text-purple-600' :
                                    product.type === 'template' ? 'text-orange-600' :
                                    product.type === 'guide' ? 'text-blue-600' : 'text-gray-600'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900">{product.name || 'Produk Tanpa Nama'}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-[10px] px-2 py-0.5 ${
                                      product.type === 'ebook' ? 'bg-emerald-100 text-emerald-700' :
                                      product.type === 'course' ? 'bg-purple-100 text-purple-700' :
                                      product.type === 'template' ? 'bg-orange-100 text-orange-700' :
                                      product.type === 'guide' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {product.type === 'ebook' ? 'E-Book' :
                                       product.type === 'course' ? 'Course' :
                                       product.type === 'template' ? 'Template' :
                                       product.type === 'guide' ? 'Guide' : 'Lainnya'}
                                    </Badge>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className="text-sm font-semibold text-brand-600">{formatPrice(product.price)}</span>
                                  </div>
                                  {product.description && (
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                                  )}
                                </div>
                              </div>
                              <Switch
                                id={`product-${index}`}
                                checked={product.enabled !== false}
                                onCheckedChange={(checked) => {
                                  const updated = [...digitalProducts];
                                  updated[index] = { ...updated[index], enabled: checked };
                                  setDigitalProducts(updated);
                                }}
                              />
                            </div>
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200/50">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={() => removeDigitalProduct(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>

                              {/* Modal Edit Product */}
                              <Dialog open={editingProductIndex === index} onOpenChange={(open) => !open && setEditingProductIndex(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={() => handleEditProduct(index)}>
                                    <Edit2 className="w-3 h-3" /> Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px] bg-white">
                                  <DialogHeader>
                                    <DialogTitle>Edit Produk Digital</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label className="text-right">Nama</Label>
                                      <Input
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label className="text-right">Tipe</Label>
                                      <div className="col-span-3">
                                        <Select value={newProduct.type} onValueChange={(value: any) => setNewProduct({...newProduct, type: value})}>
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-white">
                                            <SelectItem value="ebook">E-Book</SelectItem>
                                            <SelectItem value="course">Course</SelectItem>
                                            <SelectItem value="template">Template</SelectItem>
                                            <SelectItem value="guide">Guide</SelectItem>
                                            <SelectItem value="other">Lainnya</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label className="text-right">Harga</Label>
                                      <Input
                                        type="number"
                                        value={newProduct.price}
                                        onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-start gap-4">
                                      <Label className="text-right pt-2">Deskripsi</Label>
                                      <Textarea
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label className="text-right">Link Download</Label>
                                      <Input
                                        value={newProduct.downloadLink}
                                        onChange={(e) => setNewProduct({...newProduct, downloadLink: e.target.value})}
                                        className="col-span-3"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={handleUpdateProduct} className="bg-brand-600 hover:bg-brand-700 text-white">Update</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ================= TAB 3: TRANSAKSI ================= */}
          <TabsContent value="transaksi">
            <ExpertTransactions accessToken={expertAccessToken || ''} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Sticky Save Button */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 pb-safe">
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
