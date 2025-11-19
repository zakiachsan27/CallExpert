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
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
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

// Expert Profile
app.get("/make-server-92eeba71/expert/profile", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    // Get expert data from KV
    const expertData = await kv.get(`expert:${user.id}`);

    if (!expertData) {
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    return c.json({ expert: expertData });
  } catch (error) {
    console.error('Get expert profile error:', error);
    return c.json({ error: 'Internal server error while fetching expert profile' }, 500);
  }
});

// Update Expert Profile
app.put("/make-server-92eeba71/expert/profile", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();

    // Get current expert data
    const currentData = await kv.get(`expert:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    // Merge updates with current data
    const updatedData = {
      ...currentData,
      ...updates,
      id: user.id, // Ensure ID doesn't change
      role: 'expert', // Ensure role doesn't change
      updatedAt: new Date().toISOString()
    };

    // Save updated data
    await kv.set(`expert:${user.id}`, updatedData);

    return c.json({ expert: updatedData });
  } catch (error) {
    console.error('Update expert profile error:', error);
    return c.json({ error: 'Internal server error while updating expert profile' }, 500);
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

    // Get current expert data
    const currentData = await kv.get(`expert:${user.id}`);
    
    if (!currentData) {
      return c.json({ error: 'Expert profile not found' }, 404);
    }

    // Update only availability
    const updatedData = {
      ...currentData,
      availability,
      updatedAt: new Date().toISOString()
    };

    await kv.set(`expert:${user.id}`, updatedData);

    return c.json({ success: true, availability });
  } catch (error) {
    console.error('Update availability error:', error);
    return c.json({ error: 'Internal server error while updating availability' }, 500);
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

    // Get all transactions for this expert
    const transactions = await kv.getByPrefix(`transaction:expert:${user.id}:`);

    return c.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Get expert transactions error:', error);
    return c.json({ error: 'Internal server error while fetching transactions' }, 500);
  }
});

// Expert Withdraw Request
app.post("/make-server-92eeba71/expert/withdraw-request", async (c) => {
  try {
    const { error, user } = await verifyAuth(c.req.header('Authorization'));
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const withdrawData = await c.req.json();
    const withdrawId = `withdraw:expert:${user.id}:${Date.now()}`;

    const withdraw = {
      ...withdrawData,
      id: withdrawId,
      expertId: user.id,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(withdrawId, withdraw);

    return c.json({ withdraw });
  } catch (error) {
    console.error('Expert withdraw request error:', error);
    return c.json({ error: 'Internal server error while submitting withdraw request' }, 500);
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