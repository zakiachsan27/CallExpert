import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Initialize Supabase clients
const getServiceClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const getAnonClient = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Helper to verify auth
const verifyAuth = async (authHeader: string | null) => {
  if (!authHeader) {
    return { error: 'Missing authorization header', user: null };
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return { error: 'Invalid authorization header', user: null };
  }

  const supabase = getServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { error: 'Unauthorized', user: null };
  }
  
  return { error: null, user };
};

// Health check endpoint
app.get("/make-server-92eeba71/health", (c) => {
  return c.json({ status: "ok" });
});

// ============================================
// USER AUTH ROUTES
// ============================================

// User Signup
app.post("/make-server-92eeba71/user/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabase = getServiceClient();
    
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'user' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('User signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store additional user data in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      user: {
        id: data.user.id,
        email,
        name,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('User signup error:', error);
    return c.json({ error: 'Internal server error during user signup' }, 500);
  }
});

// User Login (handled by Supabase on frontend, but we provide profile endpoint)
app.get("/make-server-92eeba71/user/profile", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    // Get user data from KV
    const userData = await kv.get(`user:${user.id}`);

    if (!userData) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    return c.json({ user: userData });
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.json({ error: 'Internal server error while fetching user profile' }, 500);
  }
});

// ============================================
// EXPERT AUTH ROUTES
// ============================================

// Expert Signup
app.post("/make-server-92eeba71/expert/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabase = getServiceClient();
    
    // Create expert with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'expert' },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Expert signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store expert profile skeleton in KV
    await kv.set(`expert:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: 'expert',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      bio: '',
      company: '',
      jobTitle: '',
      experience: 0,
      rating: 5.0,
      reviewCount: 0,
      expertise: [],
      skills: [],
      location: {
        city: '',
        country: '',
        address: ''
      },
      availability: 'offline',
      sessionTypes: [],
      workExperience: [],
      education: [],
      achievements: [],
      digitalProducts: [],
      availableDays: [],
      availableHours: { start: '09:00', end: '17:00' },
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      expert: {
        id: data.user.id,
        email,
        name,
        role: 'expert'
      }
    });
  } catch (error) {
    console.error('Expert signup error:', error);
    return c.json({ error: 'Internal server error during expert signup' }, 500);
  }
});

// Expert Profile - OPTIMIZED: Single query + parallel fetches, no blocking KV write
app.get("/make-server-92eeba71/expert/profile", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();

    // OPTIMIZED: Single query to get expert data by user_id
    const { data: dbData, error: dbError } = await supabase
      .from('experts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!dbData || dbError) {
      console.error('Expert record not found for user_id:', user.id);
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    const expertId = dbData.id;

    // Fetch related data from all tables in PARALLEL
    const [
      expertiseResult,
      skillsResult,
      achievementsResult,
      educationResult,
      workExpResult,
      sessionTypesResult,
      digitalProductsResult
    ] = await Promise.all([
      supabase.from('expert_expertise').select('name').eq('expert_id', expertId),
      supabase.from('expert_skills').select('name').eq('expert_id', expertId),
      supabase.from('expert_achievements').select('description').eq('expert_id', expertId),
      supabase.from('expert_education').select('description').eq('expert_id', expertId),
      supabase.from('expert_work_experience').select('title, company, period, description').eq('expert_id', expertId),
      supabase.from('session_types').select('id, name, duration, price, category, description').eq('expert_id', expertId).eq('is_active', true),
      supabase.from('digital_products').select('id, name, description, price, type, download_link, thumbnail_url').eq('expert_id', expertId).eq('is_active', true)
    ]);

    // Map database columns to API response format
    const expertData = {
      id: dbData.id,
      email: dbData.email,
      name: dbData.name,
      slug: dbData.slug,
      avatar: dbData.avatar_url,
      bio: dbData.bio,
      programHighlight: dbData.program_highlight,
      company: dbData.company,
      jobTitle: dbData.role,
      role: dbData.role,
      experience: dbData.experience,
      rating: dbData.rating || 5.0,
      reviewCount: dbData.review_count || 0,
      expertise: expertiseResult.data?.map(e => e.name) || [],
      skills: skillsResult.data?.map(s => s.name) || [],
      location: {
        city: dbData.location_city || '',
        country: dbData.location_country || '',
        address: dbData.location_address || ''
      },
      availability: dbData.availability || 'offline',
      sessionTypes: sessionTypesResult.data?.map(st => ({
        id: st.id,
        name: st.name,
        duration: st.duration,
        price: st.price,
        category: st.category,
        description: st.description || ''
      })) || [],
      workExperience: workExpResult.data?.map(we => ({
        title: we.title,
        company: we.company,
        period: we.period,
        description: we.description
      })) || [],
      education: educationResult.data?.map(e => e.description) || [],
      achievements: achievementsResult.data?.map(a => a.description) || [],
      digitalProducts: digitalProductsResult.data?.map(dp => ({
        id: dp.id,
        name: dp.name,
        description: dp.description || '',
        price: dp.price,
        type: dp.type,
        downloadLink: dp.download_link,
        thumbnail: dp.thumbnail_url
      })) || [],
      availableDays: [],
      availableHours: { start: '09:00', end: '17:00' }
    };

    // Update KV cache in background (non-blocking) - fire and forget
    kv.set(`expert:${user.id}`, expertData).catch(() => {});

    return c.json({ expert: expertData });
  } catch (error) {
    console.error('Get expert profile error:', error);
    return c.json({ error: 'Internal server error while fetching expert profile', details: String(error) }, 500);
  }
});

// Update Expert Profile - OPTIMIZED: All table updates run in PARALLEL
app.put("/make-server-92eeba71/expert/profile", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const supabase = getServiceClient();

    // Get expert record by user_id
    const { data: expertRecord, error: expertError } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (expertError || !expertRecord) {
      console.error('Expert record not found for user_id:', user.id);
      return c.json({ error: 'Expert profile not found. Please create expert profile first.' }, 404);
    }

    const expertId = expertRecord.id;

    // Build basic profile update data
    const expertDataForDB: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) expertDataForDB.name = updates.name;
    if (updates.email !== undefined) expertDataForDB.email = updates.email;
    if (updates.slug !== undefined) expertDataForDB.slug = updates.slug;
    if (updates.avatar !== undefined) expertDataForDB.avatar_url = updates.avatar;
    if (updates.bio !== undefined) expertDataForDB.bio = updates.bio;
    if (updates.programHighlight !== undefined) expertDataForDB.program_highlight = updates.programHighlight;
    if (updates.company !== undefined) expertDataForDB.company = updates.company;
    if (updates.jobTitle !== undefined) expertDataForDB.role = updates.jobTitle;
    if (updates.role !== undefined) expertDataForDB.role = updates.role;
    if (updates.experience !== undefined) expertDataForDB.experience = updates.experience;
    if (updates.location?.city !== undefined) expertDataForDB.location_city = updates.location.city;
    if (updates.location?.country !== undefined) expertDataForDB.location_country = updates.location.country;
    if (updates.location?.address !== undefined) expertDataForDB.location_address = updates.location.address;
    if (updates.availability !== undefined) expertDataForDB.availability = updates.availability;

    // Helper function: delete + insert in single operation
    const upsertRelatedData = async (
      tableName: string,
      data: any[] | undefined,
      mapFn: (item: any) => Record<string, any>
    ) => {
      if (!data || !Array.isArray(data)) return;

      // Delete old records
      await supabase.from(tableName).delete().eq('expert_id', expertId);

      // Insert new records if any
      if (data.length > 0) {
        const mappedData = data.map(mapFn);
        await supabase.from(tableName).insert(mappedData);
      }
    };

    // Run ALL updates in PARALLEL for maximum speed
    await Promise.all([
      // 1. Update basic profile
      supabase.from('experts').update(expertDataForDB).eq('id', expertId),

      // 2. Update expertise
      upsertRelatedData('expert_expertise', updates.expertise, (item: string) => ({
        expert_id: expertId,
        name: item
      })),

      // 3. Update skills
      upsertRelatedData('expert_skills', updates.skills, (item: string) => ({
        expert_id: expertId,
        name: item
      })),

      // 4. Update education
      upsertRelatedData('expert_education', updates.education, (item: string) => ({
        expert_id: expertId,
        description: item
      })),

      // 5. Update achievements
      upsertRelatedData('expert_achievements', updates.achievements, (item: string) => ({
        expert_id: expertId,
        description: item
      })),

      // 6. Update work experience
      upsertRelatedData('expert_work_experience', updates.workExperience, (item: any) => ({
        expert_id: expertId,
        title: item.title || '',
        company: item.company || '',
        period: item.period || '',
        description: item.description || ''
      })),

      // 7. Update session types
      upsertRelatedData('session_types', updates.sessionTypes, (item: any) => ({
        expert_id: expertId,
        name: item.name || '',
        duration: item.duration || 0,
        price: item.price || 0,
        category: item.category || 'online-video',
        description: item.description || '',
        is_active: true
      })),

      // 8. Update digital products
      upsertRelatedData('digital_products', updates.digitalProducts, (item: any) => ({
        expert_id: expertId,
        name: item.name || '',
        description: item.description || '',
        price: item.price || 0,
        type: item.type || 'ebook',
        download_link: item.downloadLink || null,
        thumbnail_url: item.thumbnail || null,
        is_active: true
      }))
    ]);

    // Build response data
    const updatedData = {
      ...updates,
      id: expertId,
      user_id: user.id,
      role: 'expert',
      updatedAt: new Date().toISOString()
    };

    // Update KV cache in background (non-blocking)
    kv.set(`expert:${user.id}`, updatedData).catch(() => {});

    return c.json({
      expert: updatedData,
      expertId: expertId,
      userId: user.id,
      message: 'Profile saved successfully to database'
    });
  } catch (error) {
    console.error('Update expert profile error:', error);
    return c.json({ error: 'Internal server error while updating expert profile', details: String(error) }, 500);
  }
});

// Update Expert Availability Status
app.patch("/make-server-92eeba71/expert/availability", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const { availability } = await c.req.json();

    if (!availability || !['online', 'offline'].includes(availability)) {
      return c.json({ error: 'Invalid availability status' }, 400);
    }

    const supabase = getServiceClient();

    // FIRST: Get expert record by user_id
    const { data: expertRecord, error: expertError } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user.id);

    if (expertError || !expertRecord || expertRecord.length === 0) {
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    const expertId = expertRecord[0].id;

    // Update availability in Supabase database using expertId
    const { error: dbError } = await supabase
      .from('experts')
      .update({
        availability,
        updated_at: new Date().toISOString()
      })
      .eq('id', expertId);

    if (dbError) {
      console.error('Database update error:', dbError);
      return c.json({ error: `Failed to update database: ${dbError.message}` }, 400);
    }

    // Also update KV cache
    const currentData = await kv.get(`expert:${user.id}`);
    if (currentData) {
      const updatedData = {
        ...currentData,
        availability,
        updatedAt: new Date().toISOString()
      };
      await kv.set(`expert:${user.id}`, updatedData);
    }

    return c.json({ success: true, availability, expertId, userId: user.id });
  } catch (error) {
    console.error('Update availability error:', error);
    return c.json({ error: 'Internal server error while updating availability', details: String(error) }, 500);
  }
});

// ============================================
// BOOKING ROUTES
// ============================================

// Get user bookings
app.get("/make-server-92eeba71/user/bookings", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    // Get all bookings for this user
    const bookings = await kv.getByPrefix(`booking:user:${user.id}:`);

    return c.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return c.json({ error: 'Internal server error while fetching bookings' }, 500);
  }
});

// Create booking
app.post("/make-server-92eeba71/bookings", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const bookingData = await c.req.json();
    const bookingId = `booking:user:${user.id}:${Date.now()}`;

    const booking = {
      ...bookingData,
      id: bookingId,
      userId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(bookingId, booking);

    return c.json({ booking });
  } catch (error) {
    console.error('Create booking error:', error);
    return c.json({ error: 'Internal server error while creating booking' }, 500);
  }
});

// ============================================
// EXPERT TRANSACTIONS ROUTES
// ============================================

// Get expert transactions
app.get("/make-server-92eeba71/expert/transactions", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    // Get expert data from KV store
    const expertData = await kv.get(`expert:${user.id}`);

    if (!expertData || !expertData.id) {
      console.error('Expert data not found in KV for user:', user.id);
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    const expertId = expertData.id;
    console.log('Fetching transactions for expert:', expertId);

    // Get all bookings for this expert
    const supabase = getServiceClient();
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return c.json({ error: 'Failed to fetch transactions', details: bookingsError.message }, 500);
    }

    console.log(`Found ${bookings?.length || 0} bookings`);

    // For each booking, fetch related data
    const transactions = await Promise.all((bookings || []).map(async (booking) => {
      // Get user data
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('id', booking.user_id)
        .single();

      // Get session type data
      const { data: sessionType, error: sessionTypeError } = await supabase
        .from('session_types')
        .select('id, name, duration, price, category')
        .eq('id', booking.session_type_id)
        .single();

      // Log if session type not found
      if (!sessionType) {
        console.log(`Session type not found for booking ${booking.id}, session_type_id: ${booking.session_type_id}`);
      }

      return {
        id: booking.id,
        orderId: booking.order_id,
        userId: booking.user_id,
        userName: userData?.name || 'Unknown',
        userEmail: userData?.email || '',
        userAvatar: null,
        type: 'session' as const,
        itemName: sessionType?.name || '',
        itemCategory: sessionType?.category,
        date: booking.booking_date,
        time: booking.booking_time,
        topic: booking.topic,
        notes: booking.notes,
        price: sessionType?.price || booking.total_price || 0,
        status: booking.status,
        paymentStatus: booking.payment_status,
        meetingLink: booking.meeting_link,
        createdAt: booking.created_at
      };
    }));

    console.log(`Returning ${transactions.length} transactions`);
    return c.json({ transactions });
  } catch (error) {
    console.error('Get expert transactions error:', error);
    return c.json({ error: 'Internal server error while fetching transactions' }, 500);
  }
});

// Expert Withdraw Request - Create
app.post("/make-server-92eeba71/expert/withdraw-request", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const withdrawData = await c.req.json();
    const supabase = getServiceClient();

    // Get expert ID from user ID
    const { data: expertRecord, error: expertError } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (expertError || !expertRecord) {
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    const expertId = expertRecord.id;

    // Validate required fields
    if (!withdrawData.amount || withdrawData.amount <= 0) {
      return c.json({ error: 'Invalid withdraw amount' }, 400);
    }

    if (!withdrawData.bankName || !withdrawData.accountNumber || !withdrawData.accountName) {
      return c.json({ error: 'Bank account information is required' }, 400);
    }

    // Insert withdraw request to database
    const { data: withdrawRecord, error: insertError } = await supabase
      .from('withdraw_requests')
      .insert({
        expert_id: expertId,
        amount: withdrawData.amount,
        bank_name: withdrawData.bankName,
        account_number: withdrawData.accountNumber,
        account_name: withdrawData.accountName,
        notes: withdrawData.notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating withdraw request:', insertError);
      return c.json({ error: 'Failed to create withdraw request', details: insertError.message }, 500);
    }

    console.log('Withdraw request created:', withdrawRecord.id);

    return c.json({
      id: withdrawRecord.id,
      withdraw: {
        id: withdrawRecord.id,
        expertId: expertId,
        amount: withdrawRecord.amount,
        bankName: withdrawRecord.bank_name,
        accountNumber: withdrawRecord.account_number,
        accountName: withdrawRecord.account_name,
        notes: withdrawRecord.notes,
        status: withdrawRecord.status,
        createdAt: withdrawRecord.created_at
      }
    });
  } catch (error) {
    console.error('Expert withdraw request error:', error);
    return c.json({ error: 'Internal server error while submitting withdraw request' }, 500);
  }
});

// Expert Withdraw Requests - Get All
app.get("/make-server-92eeba71/expert/withdraw-requests", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));

    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();

    // Get expert ID from user ID
    const { data: expertRecord, error: expertError } = await supabase
      .from('experts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (expertError || !expertRecord) {
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    const expertId = expertRecord.id;

    // Fetch all withdraw requests for this expert
    const { data: withdrawRequests, error: fetchError } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching withdraw requests:', fetchError);
      return c.json({ error: 'Failed to fetch withdraw requests', details: fetchError.message }, 500);
    }

    // Map to API response format
    const formattedRequests = (withdrawRequests || []).map(wr => ({
      id: wr.id,
      expertId: wr.expert_id,
      amount: wr.amount,
      bankName: wr.bank_name,
      accountNumber: wr.account_number,
      accountName: wr.account_name,
      notes: wr.notes,
      status: wr.status,
      processedAt: wr.processed_at,
      rejectionReason: wr.rejection_reason,
      createdAt: wr.created_at
    }));

    console.log(`Found ${formattedRequests.length} withdraw requests for expert ${expertId}`);

    return c.json({ withdrawRequests: formattedRequests });
  } catch (error) {
    console.error('Get withdraw requests error:', error);
    return c.json({ error: 'Internal server error while fetching withdraw requests' }, 500);
  }
});

// ============================================
// PUBLIC EXPERT ROUTES
// ============================================

// Get all experts (public)
app.get("/make-server-92eeba71/experts", async (c) => {
  try {
    // Get all experts from KV
    const experts = await kv.getByPrefix('expert:');
    
    // Filter out sensitive data and return only public info
    const publicExperts = (experts || []).map((expert: any) => ({
      id: expert.id,
      name: expert.name,
      email: expert.email,
      avatar: expert.avatar,
      bio: expert.bio,
      company: expert.company,
      jobTitle: expert.jobTitle,
      experience: expert.experience,
      rating: expert.rating,
      reviewCount: expert.reviewCount,
      expertise: expert.expertise,
      skills: expert.skills,
      location: expert.location,
      availability: expert.availability,
      sessionTypes: expert.sessionTypes,
      workExperience: expert.workExperience,
      education: expert.education,
      achievements: expert.achievements,
      digitalProducts: expert.digitalProducts,
      availableDays: expert.availableDays,
      availableHours: expert.availableHours
    }));

    return c.json({ experts: publicExperts });
  } catch (error) {
    console.error('Get experts error:', error);
    return c.json({ error: 'Internal server error while fetching experts' }, 500);
  }
});

// Get single expert (public)
app.get("/make-server-92eeba71/experts/:expertId", async (c) => {
  try {
    const expertId = c.req.param('expertId');
    
    const expertData = await kv.get(`expert:${expertId}`);
    
    if (!expertData) {
      return c.json({ error: 'Expert not found' }, 404);
    }

    // Return public info only
    const publicExpert = {
      id: expertData.id,
      name: expertData.name,
      email: expertData.email,
      avatar: expertData.avatar,
      bio: expertData.bio,
      company: expertData.company,
      jobTitle: expertData.jobTitle,
      experience: expertData.experience,
      rating: expertData.rating,
      reviewCount: expertData.reviewCount,
      expertise: expertData.expertise,
      skills: expertData.skills,
      location: expertData.location,
      availability: expertData.availability,
      sessionTypes: expertData.sessionTypes,
      workExperience: expertData.workExperience,
      education: expertData.education,
      achievements: expertData.achievements,
      digitalProducts: expertData.digitalProducts,
      availableDays: expertData.availableDays,
      availableHours: expertData.availableHours
    };

    return c.json({ expert: publicExpert });
  } catch (error) {
    console.error('Get expert error:', error);
    return c.json({ error: 'Internal server error while fetching expert' }, 500);
  }
});

Deno.serve(app.fetch);