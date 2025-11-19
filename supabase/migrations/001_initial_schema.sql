-- CallExpert Database Schema
-- Migration 001: Initial Schema Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPERTS TABLE
-- =============================================
CREATE TABLE experts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  company TEXT,
  role TEXT,
  experience INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  location_city TEXT,
  location_country TEXT,
  location_address TEXT,
  availability TEXT CHECK (availability IN ('online', 'offline')) DEFAULT 'online',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPERT EXPERTISE
-- =============================================
CREATE TABLE expert_expertise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPERT SKILLS
-- =============================================
CREATE TABLE expert_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPERT ACHIEVEMENTS
-- =============================================
CREATE TABLE expert_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPERT EDUCATION
-- =============================================
CREATE TABLE expert_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPERT WORK EXPERIENCE
-- =============================================
CREATE TABLE expert_work_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SESSION TYPES
-- =============================================
CREATE TABLE session_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(12,2) NOT NULL,
  category TEXT CHECK (category IN ('online-chat', 'online-video', 'online-event', 'offline-event')) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DIGITAL PRODUCTS
-- =============================================
CREATE TABLE digital_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('ebook', 'course', 'template', 'guide', 'other')) NOT NULL,
  download_link TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKINGS
-- =============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  session_type_id UUID REFERENCES session_types(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT,
  total_price DECIMAL(12,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('waiting', 'paid', 'refunded')) DEFAULT 'waiting',
  payment_method TEXT CHECK (payment_method IN ('credit-card', 'bank-transfer', 'e-wallet')),
  meeting_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS
-- =============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES for Performance
-- =============================================
CREATE INDEX idx_experts_user_id ON experts(user_id);
CREATE INDEX idx_experts_is_active ON experts(is_active);
CREATE INDEX idx_experts_rating ON experts(rating DESC);
CREATE INDEX idx_expert_expertise_expert_id ON expert_expertise(expert_id);
CREATE INDEX idx_expert_skills_expert_id ON expert_skills(expert_id);
CREATE INDEX idx_session_types_expert_id ON session_types(expert_id);
CREATE INDEX idx_session_types_is_active ON session_types(is_active);
CREATE INDEX idx_digital_products_expert_id ON digital_products(expert_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_expert_id ON bookings(expert_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_reviews_expert_id ON reviews(expert_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- =============================================
-- TRIGGERS for updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experts_updated_at BEFORE UPDATE ON experts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_types_updated_at BEFORE UPDATE ON session_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digital_products_updated_at BEFORE UPDATE ON digital_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TRIGGER to update expert rating
-- =============================================
CREATE OR REPLACE FUNCTION update_expert_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE experts
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE expert_id = NEW.expert_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE expert_id = NEW.expert_id)
  WHERE id = NEW.expert_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expert_rating_on_review AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_expert_rating();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users: Can read own data, service role can do everything
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Experts: Public read for active experts, experts can update own profile
CREATE POLICY "Anyone can read active experts" ON experts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Experts can update own profile" ON experts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage experts" ON experts
  FOR ALL USING (auth.role() = 'service_role');

-- Expert related tables: Public read, expert can update own
CREATE POLICY "Anyone can read expert expertise" ON expert_expertise
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage own expertise" ON expert_expertise
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = expert_expertise.expert_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can read expert skills" ON expert_skills
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage own skills" ON expert_skills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = expert_skills.expert_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can read expert achievements" ON expert_achievements
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage own achievements" ON expert_achievements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = expert_achievements.expert_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can read expert education" ON expert_education
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage own education" ON expert_education
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = expert_education.expert_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can read expert work experience" ON expert_work_experience
  FOR SELECT USING (true);

CREATE POLICY "Experts can manage own work experience" ON expert_work_experience
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = expert_work_experience.expert_id AND user_id = auth.uid())
  );

-- Session Types: Public read active, expert can manage own
CREATE POLICY "Anyone can read active session types" ON session_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Experts can manage own session types" ON session_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = session_types.expert_id AND user_id = auth.uid())
  );

-- Digital Products: Public read active, expert can manage own
CREATE POLICY "Anyone can read active digital products" ON digital_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Experts can manage own digital products" ON digital_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM experts WHERE id = digital_products.expert_id AND user_id = auth.uid())
  );

-- Bookings: Users can read/create own bookings, experts can read bookings for them
CREATE POLICY "Users can read own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Experts can read their bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM experts WHERE id = bookings.expert_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experts can update their booking status" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM experts WHERE id = bookings.expert_id AND user_id = auth.uid())
  );

-- Reviews: Anyone can read, users can create review for own booking
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create review for own booking" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM bookings WHERE id = reviews.booking_id AND user_id = auth.uid() AND status = 'completed')
  );

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================
-- Uncomment to add sample data after migration

-- Sample User
-- INSERT INTO users (id, email, name) VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'user@demo.com', 'Demo User');

-- Sample Expert
-- INSERT INTO experts (id, user_id, name, email, bio, company, role, experience, rating, review_count, location_city, location_country, availability) VALUES
--   ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', 'Sarah Anderson', 'sarah@demo.com', 'Product leader with 8+ years driving innovation', 'Google', 'Senior Product Manager', 8, 4.9, 127, 'Jakarta', 'Indonesia', 'online');

