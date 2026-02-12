import { supabase } from './supabase';
import type { Expert, SessionType, DigitalProduct, Booking } from '../App';

// =============================================
// EXPERT OPERATIONS
// =============================================

export interface ExpertProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  slug?: string;
  avatar_url?: string;
  bio?: string;
  program_highlight?: string;
  company?: string;
  role?: string;
  experience?: number;
  rating: number;
  review_count: number;
  location_city?: string;
  location_country?: string;
  location_address?: string;
  availability: 'online' | 'offline';
  available_now?: boolean;
  available_now_until?: string | null;
}

export interface ExpertWithRelations extends ExpertProfile {
  expertise: Array<{ id: string; name: string }>;
  skills: Array<{ id: string; name: string }>;
  achievements: Array<{ id: string; description: string }>;
  education: Array<{ id: string; description: string }>;
  work_experience: Array<{
    id: string;
    title: string;
    company: string;
    period: string;
    description?: string;
  }>;
  session_types: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    category: 'online-chat' | 'online-video' | 'online-event' | 'offline-event';
    description?: string;
  }>;
  digital_products: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    type: 'ebook' | 'course' | 'template' | 'guide' | 'other';
    download_link?: string;
    thumbnail_url?: string;
  }>;
}

// Convert database expert to App Expert type
function convertToAppExpert(dbExpert: ExpertWithRelations): Expert {
  // Check if availableNow has expired
  let availableNow = dbExpert.available_now || false;
  let availableNowUntil = dbExpert.available_now_until || null;

  if (availableNow && availableNowUntil) {
    const expiresAt = new Date(availableNowUntil);
    if (expiresAt < new Date()) {
      // Expired - show as not available
      availableNow = false;
      availableNowUntil = null;
    }
  }

  return {
    id: dbExpert.id,
    slug: dbExpert.slug,
    name: dbExpert.name,
    role: dbExpert.role || '',
    company: dbExpert.company || '',
    avatar: dbExpert.avatar_url || '',
    rating: dbExpert.rating,
    reviewCount: dbExpert.review_count,
    expertise: dbExpert.expertise.map(e => e.name),
    bio: dbExpert.bio || '',
    programHighlight: dbExpert.program_highlight,
    experience: dbExpert.experience || 0,
    location: {
      city: dbExpert.location_city || '',
      country: dbExpert.location_country || ''
    },
    availability: dbExpert.availability,
    availableNow,
    availableNowUntil,
    sessionTypes: dbExpert.session_types.map(st => ({
      id: st.id,
      name: st.name,
      duration: st.duration,
      price: st.price,
      category: st.category,
      description: st.description || ''
    })),
    digitalProducts: dbExpert.digital_products.map(dp => ({
      id: dp.id,
      name: dp.name,
      description: dp.description || '',
      price: dp.price,
      type: dp.type,
      downloadLink: dp.download_link,
      thumbnail: dp.thumbnail_url
    })),
    achievements: dbExpert.achievements.map(a => a.description),
    education: dbExpert.education.map(e => e.description),
    workExperience: dbExpert.work_experience.map(we => ({
      title: we.title,
      company: we.company,
      period: we.period,
      description: we.description || ''
    })),
    skills: dbExpert.skills.map(s => s.name)
  };
}

// Get all active experts
export async function getExperts(): Promise<Expert[]> {
  try {
    // Fetch experts - include those with is_active = true or NULL (for newly created experts)
    const { data: experts, error } = await supabase
      .from('experts')
      .select('*')
      .or('is_active.eq.true,is_active.is.null')
      .order('rating', { ascending: false });

    if (error) throw error;
    if (!experts || experts.length === 0) return [];

    // Get all expert IDs for batch queries
    const expertIds = experts.map(e => e.id);

    // Fetch ALL related data in batch queries (only 7 queries instead of N*7)
    const [
      allExpertise,
      allSkills,
      allAchievements,
      allEducation,
      allWorkExperience,
      allSessionTypes,
      allDigitalProducts
    ] = await Promise.all([
      supabase.from('expert_expertise').select('*').in('expert_id', expertIds),
      supabase.from('expert_skills').select('*').in('expert_id', expertIds),
      supabase.from('expert_achievements').select('*').in('expert_id', expertIds),
      supabase.from('expert_education').select('*').in('expert_id', expertIds),
      supabase.from('expert_work_experience').select('*').in('expert_id', expertIds),
      supabase.from('session_types').select('*').in('expert_id', expertIds).eq('is_active', true),
      supabase.from('digital_products').select('*').in('expert_id', expertIds).eq('is_active', true)
    ]);

    // Map related data back to each expert
    const expertsWithRelations = experts.map(expert => {
      return {
        ...expert,
        expertise: (allExpertise.data || []).filter(e => e.expert_id === expert.id),
        skills: (allSkills.data || []).filter(s => s.expert_id === expert.id),
        achievements: (allAchievements.data || []).filter(a => a.expert_id === expert.id),
        education: (allEducation.data || []).filter(e => e.expert_id === expert.id),
        work_experience: (allWorkExperience.data || []).filter(w => w.expert_id === expert.id),
        session_types: (allSessionTypes.data || []).filter(s => s.expert_id === expert.id),
        digital_products: (allDigitalProducts.data || []).filter(d => d.expert_id === expert.id)
      } as ExpertWithRelations;
    });

    return expertsWithRelations.map(convertToAppExpert);
  } catch (error) {
    console.error('Error fetching experts:', error);
    throw error;
  }
}

// Get featured experts with limit (optimized for homepage)
export async function getFeaturedExperts(limit: number = 6): Promise<Expert[]> {
  try {
    // Fetch limited experts - only what we need for homepage
    const { data: experts, error } = await supabase
      .from('experts')
      .select('*')
      .or('is_active.eq.true,is_active.is.null')
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!experts || experts.length === 0) return [];

    // Get expert IDs for batch queries
    const expertIds = experts.map(e => e.id);

    // Fetch only essential data (skip achievements, education, work_experience for homepage cards)
    const [
      allExpertise,
      allSkills,
      allSessionTypes
    ] = await Promise.all([
      supabase.from('expert_expertise').select('*').in('expert_id', expertIds),
      supabase.from('expert_skills').select('*').in('expert_id', expertIds),
      supabase.from('session_types').select('*').in('expert_id', expertIds).eq('is_active', true)
    ]);

    // Map related data back to each expert
    const expertsWithRelations = experts.map(expert => {
      return {
        ...expert,
        expertise: (allExpertise.data || []).filter(e => e.expert_id === expert.id),
        skills: (allSkills.data || []).filter(s => s.expert_id === expert.id),
        achievements: [],
        education: [],
        work_experience: [],
        session_types: (allSessionTypes.data || []).filter(s => s.expert_id === expert.id),
        digital_products: []
      } as ExpertWithRelations;
    });

    return expertsWithRelations.map(convertToAppExpert);
  } catch (error) {
    console.error('Error fetching featured experts:', error);
    throw error;
  }
}

// Get single expert by ID
export async function getExpertById(expertId: string): Promise<Expert | null> {
  try {
    const { data: expert, error } = await supabase
      .from('experts')
      .select('*')
      .eq('id', expertId)
      .or('is_active.eq.true,is_active.is.null')
      .single();

    if (error) throw error;
    if (!expert) return null;

    // Fetch related data
    const [expertise, skills, achievements, education, workExperience, sessionTypes, digitalProducts] = await Promise.all([
      supabase.from('expert_expertise').select('*').eq('expert_id', expert.id),
      supabase.from('expert_skills').select('*').eq('expert_id', expert.id),
      supabase.from('expert_achievements').select('*').eq('expert_id', expert.id),
      supabase.from('expert_education').select('*').eq('expert_id', expert.id),
      supabase.from('expert_work_experience').select('*').eq('expert_id', expert.id),
      supabase.from('session_types').select('*').eq('expert_id', expert.id).eq('is_active', true),
      supabase.from('digital_products').select('*').eq('expert_id', expert.id).eq('is_active', true)
    ]);

    const expertWithRelations: ExpertWithRelations = {
      ...expert,
      expertise: expertise.data || [],
      skills: skills.data || [],
      achievements: achievements.data || [],
      education: education.data || [],
      work_experience: workExperience.data || [],
      session_types: sessionTypes.data || [],
      digital_products: digitalProducts.data || []
    };

    return convertToAppExpert(expertWithRelations);
  } catch (error) {
    console.error('Error fetching expert:', error);
    throw error;
  }
}

// Get expert by slug
export async function getExpertBySlug(slug: string): Promise<Expert | null> {
  try {
    const { data: expert, error } = await supabase
      .from('experts')
      .select('*')
      .eq('slug', slug)
      .or('is_active.eq.true,is_active.is.null')
      .single();

    if (error) throw error;
    if (!expert) return null;

    // Fetch related data
    const [expertise, skills, achievements, education, workExperience, sessionTypes, digitalProducts] = await Promise.all([
      supabase.from('expert_expertise').select('*').eq('expert_id', expert.id),
      supabase.from('expert_skills').select('*').eq('expert_id', expert.id),
      supabase.from('expert_achievements').select('*').eq('expert_id', expert.id),
      supabase.from('expert_education').select('*').eq('expert_id', expert.id),
      supabase.from('expert_work_experience').select('*').eq('expert_id', expert.id),
      supabase.from('session_types').select('*').eq('expert_id', expert.id).eq('is_active', true),
      supabase.from('digital_products').select('*').eq('expert_id', expert.id).eq('is_active', true)
    ]);

    // Debug logging to verify database queries
    // console.log('📊 Database Query Results for expert:', expert.name, {
    //   expertId: expert.id,
    //   slug: expert.slug,
    //   sessionTypesFromDB: sessionTypes.data?.length || 0,
    //   sessionTypesData: sessionTypes.data,
    //   digitalProductsFromDB: digitalProducts.data?.length || 0,
    //   digitalProductsData: digitalProducts.data,
    //   sessionTypesError: sessionTypes.error,
    //   digitalProductsError: digitalProducts.error
    // });

    const expertWithRelations: ExpertWithRelations = {
      ...expert,
      expertise: expertise.data || [],
      skills: skills.data || [],
      achievements: achievements.data || [],
      education: education.data || [],
      work_experience: workExperience.data || [],
      session_types: sessionTypes.data || [],
      digital_products: digitalProducts.data || []
    };

    return convertToAppExpert(expertWithRelations);
  } catch (error) {
    console.error('Error fetching expert by slug:', error);
    throw error;
  }
}

// Get expert by user_id
export async function getExpertByUserId(userId: string): Promise<Expert | null> {
  // Validate input to prevent undefined/null queries
  if (!userId) {
    console.warn('getExpertByUserId called with undefined/null userId');
    return null;
  }

  try {
    const { data: expert, error } = await supabase
      .from('experts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    if (!expert) return null;

    return getExpertById(expert.id);
  } catch (error) {
    console.error('Error fetching expert by user_id:', error);
    return null;
  }
}

// Check if slug is available
export async function isSlugAvailable(slug: string, expertId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('experts')
      .select('id')
      .eq('slug', slug);

    // If expertId is provided, exclude it from the check (for updates)
    if (expertId) {
      query = query.neq('id', expertId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    throw error;
  }
}

// Update expert profile
export async function updateExpertProfile(
  expertId: string,
  data: Partial<ExpertProfile>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('experts')
      .update(data)
      .eq('id', expertId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating expert profile:', error);
    throw error;
  }
}

// Update expert "Available Now" status
export async function updateExpertAvailableNow(
  expertId: string,
  availableNow: boolean,
  durationMinutes?: number
): Promise<void> {
  try {
    const updateData: { available_now: boolean; available_now_until?: string | null } = {
      available_now: availableNow,
    };

    // If turning on and duration is provided, set expiration time
    if (availableNow && durationMinutes) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      updateData.available_now_until = expiresAt.toISOString();
    } else if (!availableNow) {
      // If turning off, clear the expiration
      updateData.available_now_until = null;
    }

    const { error } = await supabase
      .from('experts')
      .update(updateData)
      .eq('id', expertId);

    if (error) throw error;
    // console.log(`Expert ${expertId} available_now set to ${availableNow}`);
  } catch (error) {
    console.error('Error updating expert available_now status:', error);
    throw error;
  }
}

// Get expert "Available Now" status
export async function getExpertAvailableNow(expertId: string): Promise<{ availableNow: boolean; availableNowUntil: string | null }> {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('available_now, available_now_until')
      .eq('id', expertId)
      .single();

    if (error) throw error;

    // Check if availableNow has expired
    if (data.available_now && data.available_now_until) {
      const expiresAt = new Date(data.available_now_until);
      if (expiresAt < new Date()) {
        // Expired, automatically turn off
        await updateExpertAvailableNow(expertId, false);
        return { availableNow: false, availableNowUntil: null };
      }
    }

    return {
      availableNow: data.available_now || false,
      availableNowUntil: data.available_now_until
    };
  } catch (error) {
    console.error('Error getting expert available_now status:', error);
    return { availableNow: false, availableNowUntil: null };
  }
}

// =============================================
// EXPERT RELATED DATA OPERATIONS
// =============================================

// Expertise
export async function addExpertise(expertId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('expert_expertise')
    .insert({ expert_id: expertId, name })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteExpertise(id: string): Promise<void> {
  const { error } = await supabase
    .from('expert_expertise')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Skills
export async function addSkill(expertId: string, name: string): Promise<string> {
  const { data, error } = await supabase
    .from('expert_skills')
    .insert({ expert_id: expertId, name })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteSkill(id: string): Promise<void> {
  const { error } = await supabase
    .from('expert_skills')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Achievements
export async function addAchievement(expertId: string, description: string): Promise<string> {
  const { data, error } = await supabase
    .from('expert_achievements')
    .insert({ expert_id: expertId, description })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteAchievement(id: string): Promise<void> {
  const { error } = await supabase
    .from('expert_achievements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Education
export async function addEducation(expertId: string, description: string): Promise<string> {
  const { data, error } = await supabase
    .from('expert_education')
    .insert({ expert_id: expertId, description })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteEducation(id: string): Promise<void> {
  const { error } = await supabase
    .from('expert_education')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Work Experience
export async function addWorkExperience(
  expertId: string,
  data: { title: string; company: string; period: string; description?: string }
): Promise<string> {
  const { data: result, error } = await supabase
    .from('expert_work_experience')
    .insert({ expert_id: expertId, ...data })
    .select()
    .single();

  if (error) throw error;
  return result.id;
}

export async function deleteWorkExperience(id: string): Promise<void> {
  const { error } = await supabase
    .from('expert_work_experience')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =============================================
// SESSION TYPE OPERATIONS
// =============================================

export async function createSessionType(
  expertId: string,
  data: {
    name: string;
    duration: number;
    price: number;
    category: 'online-chat' | 'online-video' | 'online-event' | 'offline-event';
    description?: string;
  }
): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from('session_types')
      .insert({
        expert_id: expertId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error creating session type:', error);
    throw error;
  }
}

export async function updateSessionType(
  id: string,
  data: Partial<{
    name: string;
    duration: number;
    price: number;
    category: 'online-chat' | 'online-video' | 'online-event' | 'offline-event';
    description: string;
  }>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('session_types')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating session type:', error);
    throw error;
  }
}

export async function deleteSessionType(id: string): Promise<void> {
  try {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('session_types')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting session type:', error);
    throw error;
  }
}

// =============================================
// DIGITAL PRODUCT OPERATIONS
// =============================================

export async function createDigitalProduct(
  expertId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    type: 'ebook' | 'course' | 'template' | 'guide' | 'other';
    download_link?: string;
    thumbnail_url?: string;
  }
): Promise<string> {
  try {
    const { data: result, error } = await supabase
      .from('digital_products')
      .insert({
        expert_id: expertId,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result.id;
  } catch (error) {
    console.error('Error creating digital product:', error);
    throw error;
  }
}

export async function updateDigitalProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    type: 'ebook' | 'course' | 'template' | 'guide' | 'other';
    download_link: string;
    thumbnail_url: string;
  }>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('digital_products')
      .update(data)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating digital product:', error);
    throw error;
  }
}

export async function deleteDigitalProduct(id: string): Promise<void> {
  try {
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('digital_products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting digital product:', error);
    throw error;
  }
}

// =============================================
// BOOKING OPERATIONS
// =============================================

export interface BookingData {
  user_id: string;
  expert_id: string;
  session_type_id: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string;
  topic: string;
  notes?: string;
  total_price: number;
  order_id?: string;
  payment_method?: 'credit-card' | 'bank-transfer' | 'e-wallet';
  meeting_link?: string | null;
  is_instant?: boolean; // True if this is an instant booking (Konsultasi Sekarang)
}

/**
 * Get available meeting link from the pool for a given time slot
 * Uses the SQL function find_available_meeting_link to find a link with no time conflict
 */
export async function getAvailableMeetingLink(
  bookingDate: string,
  bookingTime: string,
  duration: number
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('find_available_meeting_link', {
      p_booking_date: bookingDate,
      p_booking_time: bookingTime,
      p_duration: duration
    });

    if (error) {
      console.error('Error finding available meeting link:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0].meeting_link;
    }

    return null;
  } catch (error) {
    console.error('Error in getAvailableMeetingLink:', error);
    return null;
  }
}

export async function createBooking(data: BookingData): Promise<{ id: string; order_id: string }> {
  try {
    const { data: result, error } = await supabase
      .from('bookings')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return { id: result.id, order_id: result.order_id };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

export async function getBookingsByUser(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        expert:experts(*),
        session_type:session_types(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}

export async function getBookingsByExpert(expertId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(*),
        session_type:session_types(*)
      `)
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching expert bookings:', error);
    throw error;
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

export async function updateBookingPaymentStatus(
  bookingId: string,
  paymentStatus: 'waiting' | 'paid' | 'refunded'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: paymentStatus })
      .eq('id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

export async function getBookingByOrderId(orderId: string): Promise<any | null> {
  try {
    // First, get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (bookingError) {
      if (bookingError.code === 'PGRST116') return null; // Not found
      throw bookingError;
    }

    if (!booking) return null;

    // Then fetch related data separately to avoid RLS issues
    const [expertData, sessionTypeData, userData] = await Promise.all([
      supabase.from('experts').select('*').eq('id', booking.expert_id).single(),
      supabase.from('session_types').select('*').eq('id', booking.session_type_id).single(),
      booking.user_id ? supabase.from('users').select('*').eq('id', booking.user_id).single() : Promise.resolve({ data: null, error: null })
    ]);

    // Combine the data
    return {
      ...booking,
      expert: expertData.data,
      session_type: sessionTypeData.data,
      user: userData.data
    };
  } catch (error) {
    console.error('Error fetching booking by order_id:', error);
    throw error;
  }
}

export async function getBookingById(bookingId: string): Promise<any | null> {
  try {
    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      if (bookingError.code === 'PGRST116') return null; // Not found
      throw bookingError;
    }

    if (!booking) return null;

    // Fetch related data separately to avoid RLS issues
    const [expertData, sessionTypeData, userData] = await Promise.all([
      supabase.from('experts').select('*').eq('id', booking.expert_id).single(),
      supabase.from('session_types').select('*').eq('id', booking.session_type_id).single(),
      booking.user_id ? supabase.from('users').select('*').eq('id', booking.user_id).single() : Promise.resolve({ data: null, error: null })
    ]);

    // Combine the data
    return {
      ...booking,
      expert: expertData.data,
      session_type: sessionTypeData.data,
      user: userData.data
    };
  } catch (error) {
    console.error('Error fetching booking by id:', error);
    throw error;
  }
}

// =============================================
// USER OPERATIONS
// =============================================

export async function createUser(data: { id: string; email: string; name: string }): Promise<void> {
  try {
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.id)
      .single();

    if (existingUser) {
      // User exists, optionally update name
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: data.name })
        .eq('id', data.id);

      if (updateError) {
        console.warn('Could not update user name:', updateError.message);
        // Don't throw - user exists, that's fine
      }
      return;
    }

    // User doesn't exist, create new
    const { error } = await supabase
      .from('users')
      .insert(data);

    if (error) {
      // If it's a duplicate key error, ignore it - user already exists
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('conflict')) {
        // console.log('User already exists, skipping create');
        return;
      }
      throw error;
    }
  } catch (error: any) {
    // Don't throw for "user exists" scenarios
    if (error?.code === '23505' || error?.code === 'PGRST116') {
      // console.log('User already exists or not found scenario, continuing...');
      return;
    }
    console.error('Error creating user:', error);
    // Don't throw - we don't want to break login just because user creation failed
    // The user is already authenticated via Supabase Auth
  }
}

export async function getUserById(userId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// =============================================
// CHAT OPERATIONS
// =============================================

export interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: 'user' | 'expert';
  message_text: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  booking_id: string;
  user_joined_at?: string;
  expert_joined_at?: string;
  ended_at?: string;
  ended_by?: 'user' | 'expert' | 'timeout';
  status: 'waiting_expert' | 'active' | 'ended';
  created_at: string;
  updated_at: string;
}

export async function sendMessage(
  bookingId: string,
  senderId: string,
  senderType: 'user' | 'expert',
  messageText: string
): Promise<ChatMessage> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        booking_id: bookingId,
        sender_id: senderId,
        sender_type: senderType,
        message_text: messageText
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('not found') || error.code === 'PGRST116') {
        throw new Error('Chat table does not exist. Please ensure database migrations have been applied.');
      }
      throw error;
    }

    // Trigger push notification in background (don't await to avoid slowing down chat)
    notifyChatMessage(bookingId, senderId, senderType, messageText).catch(err => {
      console.warn('Failed to send chat notification:', err);
    });

    return data as ChatMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Send push notification for new chat message
 * This is called in background after message is sent
 */
async function notifyChatMessage(
  bookingId: string,
  senderId: string,
  senderType: 'user' | 'expert',
  messageText: string
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const response = await supabase.functions.invoke('notify-chat-message', {
      body: {
        bookingId,
        senderId,
        senderType,
        messagePreview: messageText
      }
    });

    if (response.error) {
      console.warn('Chat notification error:', response.error);
    }
  } catch (error) {
    console.warn('Failed to notify chat message:', error);
  }
}

export async function getSessionMessages(bookingId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      // If table doesn't exist (404 or not found), return empty array
      if (error.code === 'PGRST116' || error.message?.includes('not found')) {
        console.warn('Chat messages table may not exist yet:', error.message);
        return [];
      }
      throw error;
    }
    return (data as ChatMessage[]) || [];
  } catch (error) {
    console.error('Error fetching session messages:', error);
    // Return empty array instead of throwing to allow UI to work
    return [];
  }
}

export async function getActiveSession(bookingId: string): Promise<ActiveSession | null> {
  try {
    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      if (error.message?.includes('not found')) return null;
      throw error;
    }

    return data as ActiveSession;
  } catch (error) {
    console.warn('Error fetching active session:', error);
    return null;
  }
}

export async function startSession(bookingId: string, byType: 'user' | 'expert'): Promise<ActiveSession> {
  try {
    // First, try to get existing session
    let existingSession = null;
    try {
      existingSession = await getActiveSession(bookingId);
    } catch (err) {
      console.warn('Could not fetch existing session:', err);
    }

    if (existingSession) {
      // If session is already ended, just return it without updating
      if (existingSession.status === 'ended' || existingSession.ended_at) {
        // console.log('Session already ended, returning as-is');
        return existingSession;
      }

      // Update the session with participant join time
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (byType === 'user') {
        updateData.user_joined_at = new Date().toISOString();
      } else {
        updateData.expert_joined_at = new Date().toISOString();
      }

      // Change status to active if both have joined
      if (
        (byType === 'user' && existingSession.expert_joined_at) ||
        (byType === 'expert' && existingSession.user_joined_at)
      ) {
        updateData.status = 'active';
      }

      const { data, error } = await supabase
        .from('active_sessions')
        .update(updateData)
        .eq('booking_id', bookingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        throw error;
      }
      return data as ActiveSession;
    } else {
      // Create new session
      const joinData: any = {
        booking_id: bookingId,
        status: byType === 'user' ? 'waiting_expert' : 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (byType === 'user') {
        joinData.user_joined_at = new Date().toISOString();
      } else {
        joinData.expert_joined_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('active_sessions')
        .insert(joinData)
        .select()
        .single();

      if (error) {
        // If UNIQUE constraint error, try to fetch and update instead
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          console.warn('Session already exists, trying to fetch and update...');
          const existing = await getActiveSession(bookingId);
          if (existing) {
            return await startSession(bookingId, byType);
          }
        }
        console.error('Error creating session:', error);
        throw error;
      }
      return data as ActiveSession;
    }
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

export async function endSession(bookingId: string, endedBy: 'user' | 'expert' | 'timeout'): Promise<void> {
  try {
    const { error } = await supabase
      .from('active_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        ended_by: endedBy
      })
      .eq('booking_id', bookingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

export function subscribeToMessages(
  bookingId: string,
  onNewMessage: (message: ChatMessage) => void
): ReturnType<typeof supabase.channel> {
  // console.log('🔔 Creating realtime subscription for booking:', bookingId);

  const channelName = `chat-${bookingId}`;

  // Remove any existing channel with the same name first to avoid duplicates
  const existingChannels = supabase.getChannels();
  const existingChannel = existingChannels.find(ch => ch.topic === `realtime:${channelName}`);
  if (existingChannel) {
    // console.log('🔄 Removing existing channel:', channelName);
    supabase.removeChannel(existingChannel);
  }

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        // console.log('📨 New message received via realtime:', payload);
        // console.log('📨 Message data:', payload.new);
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe((status, err) => {
      // console.log('💬 Chat subscription status:', status);
      if (err) {
        console.error('❌ Subscription error:', err);
      }
      if (status === 'SUBSCRIBED') {
        // console.log('✅ Successfully subscribed to chat messages for booking:', bookingId);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error - realtime subscription failed');
      } else if (status === 'TIMED_OUT') {
        console.error('❌ Subscription timed out');
      } else if (status === 'CLOSED') {
        // console.log('🔒 Channel closed');
      }
    });

  return channel;
}

export function subscribeToSessionStatus(
  bookingId: string,
  onStatusChange: (session: ActiveSession) => void
): ReturnType<typeof supabase.channel> {
  const channel = supabase
    .channel(`session-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'active_sessions',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        // console.log('🔄 Session status changed via realtime:', payload.new);
        onStatusChange(payload.new as ActiveSession);
      }
    )
    .subscribe((status) => {
      // console.log('📡 Session subscription status:', status);
      if (status === 'SUBSCRIBED') {
        // console.log('✅ Successfully subscribed to session status for booking:', bookingId);
      }
    });

  return channel;
}

