-- =============================================
-- Articles System Migration (SAFE VERSION)
-- Can be re-run without errors
-- =============================================

-- 1. Article Categories Table
CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_article_categories_slug ON article_categories(slug);
CREATE INDEX IF NOT EXISTS idx_article_categories_active ON article_categories(is_active);

-- Slug format constraint (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'category_slug_format') THEN
    ALTER TABLE article_categories ADD CONSTRAINT category_slug_format CHECK (slug ~* '^[a-z0-9-]+$');
  END IF;
END $$;

-- 2. Article Tags Table
CREATE TABLE IF NOT EXISTS article_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tags
CREATE INDEX IF NOT EXISTS idx_article_tags_slug ON article_tags(slug);

-- Tag slug format constraint (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tag_slug_format') THEN
    ALTER TABLE article_tags ADD CONSTRAINT tag_slug_format CHECK (slug ~* '^[a-z0-9-]+$');
  END IF;
END $$;

-- 3. Articles Table (Main)
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  featured_image_alt VARCHAR(200),
  meta_title VARCHAR(70),
  meta_description VARCHAR(170),
  focus_keyword VARCHAR(100),
  canonical_url TEXT,
  seo_score INTEGER DEFAULT 0,
  readability_score DECIMAL(3,1) DEFAULT 0,
  category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for articles
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_seo_score ON articles(seo_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_articles_search ON articles
USING GIN (to_tsvector('indonesian', title || ' ' || COALESCE(excerpt, '') || ' ' || content));

-- Article slug format constraint (safe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'article_slug_format') THEN
    ALTER TABLE articles ADD CONSTRAINT article_slug_format CHECK (slug ~* '^[a-z0-9-]+$');
  END IF;
END $$;

-- 4. Article Tag Relations Table
CREATE TABLE IF NOT EXISTS article_tag_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_article_tag_article ON article_tag_relations(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tag_tag ON article_tag_relations(tag_id);

-- =============================================
-- Triggers (using CREATE OR REPLACE)
-- =============================================

CREATE OR REPLACE FUNCTION update_article_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_article_categories_updated_at ON article_categories;
CREATE TRIGGER trigger_article_categories_updated_at
  BEFORE UPDATE ON article_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_article_categories_updated_at();

CREATE OR REPLACE FUNCTION update_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_articles_updated_at ON articles;
CREATE TRIGGER trigger_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_articles_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tag_relations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Anyone can read published articles" ON articles;
DROP POLICY IF EXISTS "Admin can manage articles" ON articles;
DROP POLICY IF EXISTS "Anyone can read active categories" ON article_categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON article_categories;
DROP POLICY IF EXISTS "Anyone can read tags" ON article_tags;
DROP POLICY IF EXISTS "Admin can manage tags" ON article_tags;
DROP POLICY IF EXISTS "Anyone can read tag relations for published articles" ON article_tag_relations;
DROP POLICY IF EXISTS "Admin can manage tag relations" ON article_tag_relations;

CREATE POLICY "Anyone can read published articles" ON articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin can manage articles" ON articles
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mentorinaja.com');

CREATE POLICY "Anyone can read active categories" ON article_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage categories" ON article_categories
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mentorinaja.com');

CREATE POLICY "Anyone can read tags" ON article_tags
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage tags" ON article_tags
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mentorinaja.com');

CREATE POLICY "Anyone can read tag relations for published articles" ON article_tag_relations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM articles WHERE id = article_tag_relations.article_id AND status = 'published')
  );

CREATE POLICY "Admin can manage tag relations" ON article_tag_relations
  FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mentorinaja.com');

-- =============================================
-- Storage Bucket for Article Images
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop first then create)
DROP POLICY IF EXISTS "Public read article images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload article images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update article images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete article images" ON storage.objects;

CREATE POLICY "Public read article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Admin can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images' AND
  auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
);

CREATE POLICY "Admin can update article images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-images' AND
  auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
);

CREATE POLICY "Admin can delete article images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images' AND
  auth.jwt() ->> 'email' = 'admin@mentorinaja.com'
);

-- =============================================
-- Seed Data: Default Categories
-- =============================================

INSERT INTO article_categories (name, slug, description, sort_order) VALUES
  ('Karir', 'karir', 'Tips dan panduan seputar pengembangan karir', 1),
  ('Interview', 'interview', 'Persiapan dan tips interview kerja', 2),
  ('CV & Resume', 'cv-resume', 'Panduan membuat CV dan resume yang menarik', 3),
  ('Mentoring', 'mentoring', 'Insight seputar mentoring dan pengembangan diri', 4),
  ('Industri', 'industri', 'Berita dan tren industri terkini', 5)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Function to increment view count
-- =============================================

CREATE OR REPLACE FUNCTION increment_article_view(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
