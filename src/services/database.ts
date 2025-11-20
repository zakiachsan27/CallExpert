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

    // Fetch related data for each expert
    const expertsWithRelations = await Promise.all(
      experts.map(async (expert) => {
        const [expertise, skills, achievements, education, workExperience, sessionTypes, digitalProducts] = await Promise.all([
          supabase.from('expert_expertise').select('*').eq('expert_id', expert.id),
          supabase.from('expert_skills').select('*').eq('expert_id', expert.id),
          supabase.from('expert_achievements').select('*').eq('expert_id', expert.id),
          supabase.from('expert_education').select('*').eq('expert_id', expert.id),
          supabase.from('expert_work_experience').select('*').eq('expert_id', expert.id),
          supabase.from('session_types').select('*').eq('expert_id', expert.id).eq('is_active', true),
          supabase.from('digital_products').select('*').eq('expert_id', expert.id).eq('is_active', true)
        ]);

        return {
          ...expert,
          expertise: expertise.data || [],
          skills: skills.data || [],
          achievements: achievements.data || [],
          education: education.data || [],
          work_experience: workExperience.data || [],
          session_types: sessionTypes.data || [],
          digital_products: digitalProducts.data || []
        } as ExpertWithRelations;
      })
    );

    return expertsWithRelations.map(convertToAppExpert);
  } catch (error) {
    console.error('Error fetching experts:', error);
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
  meeting_link?: string;
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

// =============================================
// USER OPERATIONS
// =============================================

export async function createUser(data: { id: string; email: string; name: string }): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .insert(data);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
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

