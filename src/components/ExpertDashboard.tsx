import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ExpertTransactions } from './ExpertTransactions';
import {
  ArrowLeft,
  Save,
  User,
  Briefcase,
  GraduationCap,
  Award,
  MapPin,
  Calendar,
  Clock,
  Plus,
  X,
  Loader2,
  CheckCircle,
  Video,
  MessageCircle,
  Users,
  MapPinned,
  DollarSign,
  Package,
  Receipt,
  FileText,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Expert, SessionType, DigitalProduct } from '../App';
import { projectId } from '../utils/supabase/info.tsx';
import { isSlugAvailable, updateExpertAvailableNow, getExpertAvailableNow } from '../services/database';

// Cache keys for sessionStorage
const PROFILE_CACHE_KEY = 'expert_profile_cache';
const PROFILE_CACHE_TIMESTAMP_KEY = 'expert_profile_cache_timestamp';

type ExpertDashboardProps = {
  accessToken: string;
  expertId: string;
  onBack: () => void;
  hideHeaderAndNav?: boolean;
  showOnlyServices?: boolean;
};

export function ExpertDashboard({ accessToken, expertId, onBack, hideHeaderAndNav, showOnlyServices }: ExpertDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Basic Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bio, setBio] = useState('');
  const [programHighlight, setProgramHighlight] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState(0);
  const [availability, setAvailability] = useState<'online' | 'offline'>('offline');

  // Resume upload for auto-fill
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Location
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  // Skills & Expertise
  const [expertise, setExpertise] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Work Experience
  const [workExperience, setWorkExperience] = useState<Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>>([]);

  // Education
  const [education, setEducation] = useState<string[]>([]);
  const [newEducation, setNewEducation] = useState('');

  // Achievements
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState('');

  // Session Types
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);

  // Digital Products
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);

  // Availability Schedule - Updated to support multiple time slots
  const [availableDays, setAvailableDays] = useState<Array<'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu'>>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{
    day: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
    start: string;
    end: string;
  }>>([]);

  // Available Now feature
  const [availableNow, setAvailableNow] = useState(false);
  const [availableNowUntil, setAvailableNowUntil] = useState<string | null>(null);
  const [isTogglingAvailableNow, setIsTogglingAvailableNow] = useState(false);

  // Original data for comparison
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    // Try to load from cache first
    const cachedData = sessionStorage.getItem(PROFILE_CACHE_KEY);
    const cachedTimestamp = sessionStorage.getItem(PROFILE_CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
      try {
        const expert = JSON.parse(cachedData);
        populateFormWithData(expert);
        setLastUpdated(new Date(cachedTimestamp));
        setIsLoading(false);
      } catch (e) {
        // If cache is corrupted, fetch fresh data
        fetchExpertProfile();
      }
    } else {
      // No cache, fetch fresh data
      fetchExpertProfile();
    }

    // Auto set availability to online when dashboard opens
    updateAvailabilityStatus('online');

    // Set to offline when component unmounts (user leaves dashboard)
    return () => {
      updateAvailabilityStatus('offline');
    };
  }, []);

  // Fetch available now status
  useEffect(() => {
    const fetchAvailableNowStatus = async () => {
      try {
        const status = await getExpertAvailableNow(expertId);
        setAvailableNow(status.availableNow);
        setAvailableNowUntil(status.availableNowUntil);
      } catch (error) {
        console.error('Error fetching available now status:', error);
      }
    };
    fetchAvailableNowStatus();
  }, [expertId]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!slug || slug === originalData?.slug) {
      setSlugAvailable(null);
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setSlugAvailable(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const available = await isSlugAvailable(slug, expertId);
        setSlugAvailable(available);
      } catch (error) {
        console.error('Error checking slug availability:', error);
        setSlugAvailable(false);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [slug, expertId, originalData?.slug]);

  // Detect changes
  useEffect(() => {
    if (!originalData) {
      console.log('originalData is null, skipping change detection');
      return;
    }

    const currentData = {
      name,
      email,
      slug,
      bio,
      programHighlight,
      company,
      role,
      experience: String(experience),
      locationCity,
      locationCountry,
      locationAddress,
      expertise: JSON.stringify(expertise),
      skills: JSON.stringify(skills),
      workExperience: JSON.stringify(workExperience),
      education: JSON.stringify(education),
      achievements: JSON.stringify(achievements),
      sessionTypes: JSON.stringify(sessionTypes),
      digitalProducts: JSON.stringify(digitalProducts),
      availableDays: JSON.stringify(availableDays),
      availableTimeSlots: JSON.stringify(availableTimeSlots),
    };

    console.log('Current data:', currentData);
    console.log('Original data:', originalData);
    console.log('showOnlyServices:', showOnlyServices);

    // Compare based on current view (profile or services)
    if (showOnlyServices) {
      // Only check services data
      const servicesChanged = 
        currentData.sessionTypes !== originalData.sessionTypes ||
        currentData.digitalProducts !== originalData.digitalProducts ||
        currentData.availableDays !== originalData.availableDays ||
        currentData.availableTimeSlots !== originalData.availableTimeSlots;
      
      console.log('Services change detected:', servicesChanged);
      setHasChanges(servicesChanged);
    } else {
      // Check profile data
      const profileChanged =
        currentData.name !== originalData.name ||
        currentData.email !== originalData.email ||
        currentData.slug !== originalData.slug ||
        currentData.bio !== originalData.bio ||
        currentData.programHighlight !== originalData.programHighlight ||
        currentData.company !== originalData.company ||
        currentData.role !== originalData.role ||
        currentData.experience !== originalData.experience ||
        currentData.locationCity !== originalData.locationCity ||
        currentData.locationCountry !== originalData.locationCountry ||
        currentData.locationAddress !== originalData.locationAddress ||
        currentData.expertise !== originalData.expertise ||
        currentData.skills !== originalData.skills ||
        currentData.workExperience !== originalData.workExperience ||
        currentData.education !== originalData.education ||
        currentData.achievements !== originalData.achievements ||
        avatarFile !== null;
      
      console.log('Profile change detected:', profileChanged);
      console.log('hasChanges will be set to:', profileChanged);
      setHasChanges(profileChanged);
    }
  }, [
    name, email, slug, bio, programHighlight, company, role, experience,
    locationCity, locationCountry, locationAddress,
    expertise, skills, workExperience, education, achievements,
    sessionTypes, digitalProducts, availableDays, availableTimeSlots,
    avatarFile, originalData, showOnlyServices
  ]);

  // Helper function to populate form with data
  const populateFormWithData = (expert: any) => {
    setName(expert.name || '');
    setEmail(expert.email || '');
    setSlug(expert.slug || '');
    setAvatar(expert.avatar || '');
    setBio(expert.bio || '');
    setProgramHighlight(expert.programHighlight || '');
    setCompany(expert.company || '');
    setRole(expert.jobTitle || expert.role || '');
    setExperience(expert.experience || 0);
    setAvailability(expert.availability || 'offline');

    setLocationCity(expert.location?.city || '');
    setLocationCountry(expert.location?.country || '');
    setLocationAddress(expert.location?.address || '');

    setExpertise(expert.expertise || []);
    setSkills(expert.skills || []);
    setWorkExperience(expert.workExperience || []);
    setEducation(expert.education || []);
    setAchievements(expert.achievements || []);
    setSessionTypes(expert.sessionTypes || []);
    setDigitalProducts(expert.digitalProducts || []);
    setAvailableDays(expert.availableDays || []);
    setAvailableTimeSlots(expert.availableTimeSlots || []);

    // Store original data for comparison
    setOriginalData({
      name: expert.name || '',
      email: expert.email || '',
      slug: expert.slug || '',
      bio: expert.bio || '',
      programHighlight: expert.programHighlight || '',
      company: expert.company || '',
      role: expert.jobTitle || expert.role || '',
      experience: String(expert.experience || 0),
      locationCity: expert.location?.city || '',
      locationCountry: expert.location?.country || '',
      locationAddress: expert.location?.address || '',
      expertise: JSON.stringify(expert.expertise || []),
      skills: JSON.stringify(expert.skills || []),
      workExperience: JSON.stringify(expert.workExperience || []),
      education: JSON.stringify(expert.education || []),
      achievements: JSON.stringify(expert.achievements || []),
      sessionTypes: JSON.stringify(expert.sessionTypes || []),
      digitalProducts: JSON.stringify(expert.digitalProducts || []),
      availableDays: JSON.stringify(expert.availableDays || []),
      availableTimeSlots: JSON.stringify(expert.availableTimeSlots || []),
    });
  };

  const fetchExpertProfile = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      const expert = data.expert;

      // Populate form with existing data
      populateFormWithData(expert);

      // Save to cache
      const now = new Date();
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(expert));
      sessionStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, now.toISOString());
      setLastUpdated(now);

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Gagal memuat profil');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      // Validate slug if changed
      if (slug !== originalData?.slug) {
        if (!slug) {
          setError('Slug tidak boleh kosong');
          setIsSaving(false);
          return;
        }
        if (slugAvailable === false) {
          setError('Slug sudah digunakan atau format tidak valid');
          setIsSaving(false);
          return;
        }
      }

      const updatedProfile = {
        name,
        email,
        slug,
        avatar,
        bio,
        programHighlight,
        company,
        jobTitle: role,
        experience,
        availability,
        location: {
          city: locationCity,
          country: locationCountry,
          address: locationAddress
        },
        expertise,
        skills,
        workExperience,
        education,
        achievements,
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
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updatedProfile)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        throw new Error(errorData.error || 'Failed to save profile');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Update originalData to reflect saved state
      setOriginalData({
        name,
        email,
        slug,
        bio,
        programHighlight,
        company,
        role,
        experience: String(experience),
        locationCity,
        locationCountry,
        locationAddress,
        expertise: JSON.stringify(expertise),
        skills: JSON.stringify(skills),
        workExperience: JSON.stringify(workExperience),
        education: JSON.stringify(education),
        achievements: JSON.stringify(achievements),
        sessionTypes: JSON.stringify(sessionTypes),
        digitalProducts: JSON.stringify(digitalProducts),
        availableDays: JSON.stringify(availableDays),
        availableTimeSlots: JSON.stringify(availableTimeSlots),
      });

      // Update cache with saved data
      const cachedExpert = {
        name,
        email,
        slug,
        avatar,
        bio,
        programHighlight,
        company,
        jobTitle: role,
        role,
        experience,
        availability,
        location: {
          city: locationCity,
          country: locationCountry,
          address: locationAddress
        },
        expertise,
        skills,
        workExperience,
        education,
        achievements,
        sessionTypes,
        digitalProducts,
        availableDays,
        availableTimeSlots
      };
      const now = new Date();
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cachedExpert));
      sessionStorage.setItem(PROFILE_CACHE_TIMESTAMP_KEY, now.toISOString());
      setLastUpdated(now);

      // Reset avatar file after save
      setAvatarFile(null);
      
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan profil';
      setError(errorMessage);
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      title: '',
      company: '',
      period: '',
      description: ''
    }]);
  };

  const updateWorkExperience = (index: number, field: string, value: string) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const addSessionType = () => {
    const newSession: SessionType = {
      id: `session-${Date.now()}`,
      name: '',
      description: '',
      duration: 30,
      price: 0,
      category: 'online-video'
    };
    setSessionTypes([...sessionTypes, newSession]);
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

  // Toggle "Tersedia Sekarang" status
  const toggleAvailableNow = async (enabled: boolean) => {
    setIsTogglingAvailableNow(true);
    try {
      // Set duration to 2 hours by default when enabling
      await updateExpertAvailableNow(expertId, enabled, enabled ? 120 : undefined);
      setAvailableNow(enabled);

      if (enabled) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 120);
        setAvailableNowUntil(expiresAt.toISOString());
      } else {
        setAvailableNowUntil(null);
      }
    } catch (error) {
      console.error('Error toggling available now:', error);
      setError('Gagal mengubah status ketersediaan');
    } finally {
      setIsTogglingAvailableNow(false);
    }
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

  const updateAvailabilityStatus = async (status: 'online' | 'offline') => {
    try {
      const updatedProfile = {
        availability: status
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-92eeba71/expert/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updatedProfile)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update availability status');
      }
      
    } catch (err) {
      console.error('Error updating availability status:', err);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.pdf')) {
      setError('Saat ini hanya file PDF yang didukung. File DOCX akan segera tersedia.');
      return;
    }

    setResumeFile(file);
    setIsParsingResume(true);
    setError('');

    try {
      // Import parser dynamically
      const { parseResume } = await import('../services/resumeParser');

      // Parse resume and extract data
      const parsedData = await parseResume(file);

      // Auto-fill form fields with parsed data
      if (parsedData.name) setName(parsedData.name);
      if (parsedData.email) setEmail(parsedData.email);
      if (parsedData.company) setCompany(parsedData.company);
      if (parsedData.role) setRole(parsedData.role);
      if (parsedData.experience > 0) setExperience(parsedData.experience);
      if (parsedData.bio) setBio(parsedData.bio);

      if (parsedData.location.city) setLocationCity(parsedData.location.city);
      if (parsedData.location.country) setLocationCountry(parsedData.location.country);

      if (parsedData.expertise.length > 0) setExpertise(parsedData.expertise);
      if (parsedData.skills.length > 0) setSkills(parsedData.skills);

      if (parsedData.workExperience.length > 0) setWorkExperience(parsedData.workExperience);
      if (parsedData.education.length > 0) setEducation(parsedData.education);
      if (parsedData.achievements.length > 0) setAchievements(parsedData.achievements);

      setIsParsingResume(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      console.log('Resume parsed successfully:', parsedData);
    } catch (err: any) {
      console.error('Error parsing resume:', err);
      setError(err.message || 'Gagal memproses resume. Pastikan file PDF valid dan dapat dibaca.');
      setIsParsingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!hideHeaderAndNav && (
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Profil
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 md:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm md:text-base">Profil berhasil disimpan!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
            <p className="text-red-600 text-sm md:text-base">{error}</p>
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          {/* Basic Information */}
          {!showOnlyServices && (
            <>
              {/* Resume Upload untuk Auto-Fill */}
              <Card className="p-4 md:p-6 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-200">
                <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                  <FileText className="w-8 h-8 md:w-10 md:h-10 text-brand-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="mb-1 md:mb-2 text-sm md:text-base font-semibold">Upload Resume untuk Auto-Fill</h3>
                    <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                      Upload file resume Anda (PDF/DOCX) dan sistem akan otomatis mengisi seluruh informasi profil.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc"
                          onChange={handleResumeUpload}
                          className="hidden"
                          disabled={isParsingResume}
                        />
                        <Button
                          variant="default"
                          className="bg-brand-600 hover:bg-brand-700 w-full sm:w-auto text-sm"
                          disabled={isParsingResume}
                          asChild
                        >
                          <span>
                            {isParsingResume ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Memproses...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Resume
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      {resumeFile && !isParsingResume && (
                        <span className="text-xs md:text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{resumeFile.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <User className="w-5 h-5 text-brand-600" />
                  <h2 className="text-base md:text-lg font-semibold">Informasi Dasar</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      disabled
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="slug">Custom URL Slug *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => {
                              // Auto-convert to lowercase and replace spaces with dashes
                              const newSlug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                              setSlug(newSlug);
                            }}
                            placeholder="your-custom-url"
                            className={slugAvailable === false ? 'border-red-500' : slugAvailable === true ? 'border-green-500' : ''}
                          />
                          {isCheckingSlug && (
                            <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="flex-1">
                          <p className="text-gray-500">
                            URL profil Anda: <span className="text-blue-600">/expert/{slug || 'your-slug'}</span>
                          </p>
                          {slugAvailable === true && slug !== originalData?.slug && (
                            <p className="text-green-600 flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3" />
                              Slug tersedia!
                            </p>
                          )}
                          {slugAvailable === false && (
                            <p className="text-red-600 mt-1">
                              Slug sudah digunakan atau format tidak valid. Gunakan huruf kecil, angka, dan tanda hubung (-) saja.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Perusahaan *</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Nama perusahaan"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Posisi/Role *</Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Senior Product Manager"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Pengalaman (tahun) *</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={experience}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="avatar">Foto Profil</Label>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2"
                            type="button"
                            asChild
                          >
                            <span>
                              <ImageIcon className="w-4 h-4" />
                              {avatarFile ? avatarFile.name : 'Pilih foto...'}
                            </span>
                          </Button>
                        </label>
                      </div>
                      {(avatarPreview || avatar) && (
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-brand-200 flex-shrink-0">
                          <img 
                            src={avatarPreview || avatar} 
                            alt="Avatar preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG (max 5MB)</p>
                  </div>

                  <div>
                    <Label htmlFor="city">Kota *</Label>
                    <Input
                      id="city"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      placeholder="Jakarta"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Negara *</Label>
                    <Input
                      id="country"
                      value={locationCountry}
                      onChange={(e) => setLocationCountry(e.target.value)}
                      placeholder="Indonesia"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="bio">Bio *</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Ceritakan tentang diri Anda, pengalaman, dan keahlian..."
                      rows={4}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="program-highlight">Program Highlight</Label>
                    <Textarea
                      id="program-highlight"
                      value={programHighlight}
                      onChange={(e) => setProgramHighlight(e.target.value)}
                      placeholder="Tuliskan highlight program Anda untuk menarik calon client..."
                      rows={5}
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {programHighlight.length}/1000 karakter - Deskripsikan program unggulan Anda
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Expertise */}
          {!showOnlyServices && (
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Award className="w-5 h-5 text-brand-600" />
                <h2 className="text-base md:text-lg font-semibold">Keahlian & Expertise</h2>
              </div>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <Label className="text-sm">Expertise (akan muncul sebagai tags utama)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="Contoh: Product Management"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newExpertise.trim()) {
                            setExpertise([...expertise, newExpertise.trim()]);
                            setNewExpertise('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newExpertise.trim()) {
                          setExpertise([...expertise, newExpertise.trim()]);
                          setNewExpertise('');
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {expertise.map((item, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {item}
                        <button
                          onClick={() => setExpertise(expertise.filter((_, i) => i !== index))}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Skills (keahlian teknis lainnya)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Contoh: Figma, Jira, SQL"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newSkill.trim()) {
                            setSkills([...skills, newSkill.trim()]);
                            setNewSkill('');
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (newSkill.trim()) {
                          setSkills([...skills, newSkill.trim()]);
                          setNewSkill('');
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((item, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {item}
                        <button
                          onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Work Experience */}
          {!showOnlyServices && (
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-600" />
                  <h2>Pengalaman Kerja</h2>
                </div>
                <Button onClick={addWorkExperience} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-6">
                {workExperience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 pr-12 relative">
                    <button
                      onClick={() => removeWorkExperience(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600 z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Posisi</Label>
                        <Input
                          value={exp.title}
                          onChange={(e) => updateWorkExperience(index, 'title', e.target.value)}
                          placeholder="Senior Product Manager"
                        />
                      </div>
                      <div>
                        <Label>Perusahaan</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                          placeholder="Google"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Periode</Label>
                        <Input
                          value={exp.period}
                          onChange={(e) => updateWorkExperience(index, 'period', e.target.value)}
                          placeholder="2020 - Present"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Deskripsi</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                          placeholder="Jelaskan tanggung jawab dan pencapaian..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {workExperience.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Belum ada pengalaman kerja. Klik "Tambah" untuk menambahkan.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Education */}
          {!showOnlyServices && (
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <GraduationCap className="w-5 h-5 text-brand-600" />
                <h2 className="text-base md:text-lg font-semibold">Pendidikan</h2>
              </div>

              <div>
                <div className="flex gap-2 mb-3 md:mb-4">
                  <Input
                    value={newEducation}
                    onChange={(e) => setNewEducation(e.target.value)}
                    placeholder="Contoh: MBA from Stanford University"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newEducation.trim()) {
                          setEducation([...education, newEducation.trim()]);
                          setNewEducation('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newEducation.trim()) {
                        setEducation([...education, newEducation.trim()]);
                        setNewEducation('');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {education.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{item}</span>
                      <button
                        onClick={() => setEducation(education.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Achievements */}
          {!showOnlyServices && (
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Award className="w-5 h-5 text-brand-600" />
                <h2 className="text-base md:text-lg font-semibold">Pencapaian & Sertifikasi</h2>
              </div>

              <div>
                <div className="flex gap-2 mb-3 md:mb-4">
                  <Input
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    placeholder="Contoh: Certified Scrum Master (CSM)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAchievement.trim()) {
                          setAchievements([...achievements, newAchievement.trim()]);
                          setNewAchievement('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newAchievement.trim()) {
                        setAchievements([...achievements, newAchievement.trim()]);
                        setNewAchievement('');
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {achievements.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{item}</span>
                      <button
                        onClick={() => setAchievements(achievements.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Session Types */}
          {showOnlyServices && (
            <Card className="p-4 md:p-6">
              {/* Refresh Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  {lastUpdated && (
                    <p className="text-xs text-gray-400">
                      Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-xs"
                  onClick={() => fetchExpertProfile(true)}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Memuat...' : 'Refresh'}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-brand-600" />
                  <h2>Tipe Sesi Konsultasi</h2>
                </div>
                <Button onClick={addSessionType} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-6">
                {sessionTypes.map((session, index) => (
                  <div key={session.id} className="border rounded-lg p-4 pr-12 relative">
                    <button
                      onClick={() => removeSessionType(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600 z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nama Sesi</Label>
                        <Input
                          value={session.name}
                          onChange={(e) => updateSessionType(index, 'name', e.target.value)}
                          placeholder="Quick Chat"
                        />
                      </div>
                      <div>
                        <Label>Kategori</Label>
                        <Select 
                          value={session.category}
                          onValueChange={(value) => updateSessionType(index, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online-chat">💬 Online Chat</SelectItem>
                            <SelectItem value="online-video">📹 Video Call</SelectItem>
                            <SelectItem value="online-event">🎯 Group Event</SelectItem>
                            <SelectItem value="offline-event">☕ Offline Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Durasi (menit)</Label>
                        <Input
                          type="number"
                          value={session.duration}
                          onChange={(e) => updateSessionType(index, 'duration', Number(e.target.value))}
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <Label>Harga (Rp)</Label>
                        <Input
                          type="number"
                          value={session.price}
                          onChange={(e) => updateSessionType(index, 'price', Number(e.target.value))}
                          placeholder="150000"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Deskripsi</Label>
                        <Textarea
                          value={session.description}
                          onChange={(e) => updateSessionType(index, 'description', e.target.value)}
                          placeholder="Jelaskan apa yang akan didapat dari sesi ini..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {sessionTypes.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Belum ada tipe sesi. Klik "Tambah" untuk menambahkan.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Digital Products */}
          {showOnlyServices && (
            <Card className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-600" />
                  <h2>Produk Digital</h2>
                </div>
                <Button onClick={addDigitalProduct} variant="outline" size="sm" className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>

              <div className="space-y-6">
                {digitalProducts.map((product, index) => (
                  <div key={product.id} className="border rounded-lg p-4 pr-12 relative">
                    <button
                      onClick={() => removeDigitalProduct(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-600 z-10"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nama Produk</Label>
                        <Input
                          value={product.name}
                          onChange={(e) => updateDigitalProduct(index, 'name', e.target.value)}
                          placeholder="Career Guide E-Book"
                        />
                      </div>
                      <div>
                        <Label>Tipe Produk</Label>
                        <Select 
                          value={product.type}
                          onValueChange={(value) => updateDigitalProduct(index, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ebook">📚 E-Book</SelectItem>
                            <SelectItem value="course">🎓 Course</SelectItem>
                            <SelectItem value="template">📋 Template</SelectItem>
                            <SelectItem value="guide">📖 Guide</SelectItem>
                            <SelectItem value="other">📦 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2">
                        <Label>Harga (Rp)</Label>
                        <Input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateDigitalProduct(index, 'price', Number(e.target.value))}
                          placeholder="99000"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Deskripsi</Label>
                        <Textarea
                          value={product.description}
                          onChange={(e) => updateDigitalProduct(index, 'description', e.target.value)}
                          placeholder="Jelaskan manfaat produk digital ini..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {digitalProducts.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    Belum ada produk digital. Klik "Tambah" untuk menambahkan.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Availability Schedule */}
          {showOnlyServices && (
            <Card className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h2 className="text-base md:text-lg font-semibold">Jadwal Ketersediaan</h2>
              </div>

              <div className="space-y-4 md:space-y-6">
                {/* Tersedia Sekarang Toggle */}
                <div className={`p-4 rounded-xl border-2 transition-all ${availableNow ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${availableNow ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm md:text-base">Tersedia Sekarang</h3>
                        <p className="text-xs text-gray-500">
                          {availableNow
                            ? `Aktif hingga ${availableNowUntil ? new Date(availableNowUntil).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '2 jam ke depan'}`
                            : 'Aktifkan untuk menerima konsultasi langsung'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={availableNow}
                      onCheckedChange={toggleAvailableNow}
                      disabled={isTogglingAvailableNow}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>
                  {availableNow && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Mentee dapat melihat Anda tersedia untuk konsultasi langsung
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Days Selection */}
                <div>
                  <Label className="mb-2 md:mb-3 block text-sm">Hari Tersedia (Jadwal Reguler)</Label>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {(['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'] as const).map((day) => (
                      <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={availableDays.includes(day) ? 'default' : 'outline'}
                        onClick={() => toggleDay(day)}
                        className="capitalize text-xs md:text-sm px-2.5 md:px-3 h-8 md:h-9"
                      >
                        {day.slice(0, 3)}
                        <span className="hidden sm:inline">{day.slice(3)}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Time Slots Per Day */}
                <div>
                  <div className="mb-3 md:mb-4">
                    <Label className="text-sm md:text-base">Jam Ketersediaan</Label>
                  </div>

                  {/* Show time slots per day */}
                  <div className="space-y-3 md:space-y-4">
                    {availableDays.map((day) => {
                      const daySlots = availableTimeSlots.filter(slot => slot.day === day);

                      return (
                        <div key={day} className="border rounded-lg p-3 md:p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-2 md:mb-3">
                            <h4 className="capitalize text-sm md:text-base font-medium">{day}</h4>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addTimeSlot(day)}
                              className="text-xs h-7 md:h-8 px-2 md:px-3"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Tambah </span>Sesi
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {daySlots.length === 0 && (
                              <p className="text-xs md:text-sm text-gray-500 text-center py-2">
                                Belum ada sesi waktu.
                              </p>
                            )}

                            {availableTimeSlots.map((slot, index) => {
                              if (slot.day !== day) return null;

                              return (
                                <div key={index} className="flex items-center gap-1.5 md:gap-2 bg-white p-2 md:p-3 rounded border">
                                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-600 flex-shrink-0" />
                                  <Input
                                    type="time"
                                    value={slot.start}
                                    onChange={(e) => updateTimeSlot(index, 'start', e.target.value)}
                                    className="flex-1 h-8 md:h-9 text-xs md:text-sm px-2"
                                  />
                                  <span className="text-gray-400 text-xs">-</span>
                                  <Input
                                    type="time"
                                    value={slot.end}
                                    onChange={(e) => updateTimeSlot(index, 'end', e.target.value)}
                                    className="flex-1 h-8 md:h-9 text-xs md:text-sm px-2"
                                  />
                                  <button
                                    onClick={() => removeTimeSlot(index)}
                                    className="text-gray-400 hover:text-red-600 flex-shrink-0 p-1"
                                  >
                                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {availableDays.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        Pilih hari tersedia terlebih dahulu untuk menambahkan jam ketersediaan.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Save Button */}
          {!hideHeaderAndNav && (
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={onBack}>
                Batal
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !hasChanges}
                className="bg-brand-600 hover:bg-brand-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Semua Perubahan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Save Button untuk Tab Mode */}
      {hideHeaderAndNav && hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 pb-safe">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-end gap-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-brand-600 hover:bg-brand-700 shadow-md"
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