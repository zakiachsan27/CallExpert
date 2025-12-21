-- Seed Expert: Kiki Rahmawati dan Dhanes Pratama
--
-- PENTING: Sebelum menjalankan migration ini, buat auth user terlebih dahulu di Supabase Dashboard:
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add user" > "Create new user"
-- 3. Buat user dengan email dan password berikut:
--
--    Kiki:
--    - Email: kiki@mentorinaja.com
--    - Password: Kiki@Expert123
--
--    Dhanes:
--    - Email: dhanes@mentorinaja.com
--    - Password: Dhanes@Expert123
--
-- 4. Catat User ID yang dihasilkan dan ganti pada script di bawah ini

-- ============================================================
-- GANTI USER ID INI DENGAN ID DARI AUTH USERS YANG SUDAH DIBUAT
-- ============================================================
DO $$
DECLARE
  kiki_user_id UUID := '6032d9bc-2b3a-4f62-8887-eebdf5c9bb18'; -- GANTI DENGAN ID KIKI
  dhanes_user_id UUID := '25e0ee46-1bdf-4bed-a87f-157681f03ba6'; -- GANTI DENGAN ID DHANES
  kiki_expert_id UUID;
  dhanes_expert_id UUID;
BEGIN

-- ============================================================
-- INSERT USER RECORDS
-- ============================================================
INSERT INTO users (id, email, name) VALUES
  (kiki_user_id, 'kiki@gmail.com', 'Kiki Rahmawati'),
  (dhanes_user_id, 'dhanes@gmail.com', 'Dhanes Pratama')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INSERT KIKI EXPERT
-- ============================================================
INSERT INTO experts (
  user_id, name, email, slug, role, company, bio,
  location_city, location_country, experience, rating, review_count,
  program_highlight, availability, is_active
) VALUES (
  kiki_user_id,
  'Kiki Rahmawati',
  'kiki@mentorinaja.com',
  'kiki-rahmawati',
  'Senior UX Designer',
  'Tokopedia',
  'UX Designer berpengalaman dengan passion dalam menciptakan pengalaman digital yang intuitive dan user-centric. Sudah membantu lebih dari 50+ startup dan enterprise dalam merancang produk digital mereka. Spesialisasi di mobile app design, design system, dan user research.',
  'Jakarta',
  'Indonesia',
  7,
  4.85,
  89,
  E'🎯 Paket Mentoring UX Design\n\nProgram intensif 4 minggu untuk membantu kamu:\n• Memahami fundamental UX research\n• Membuat wireframe & prototype\n• Membangun portfolio UX yang menarik\n• Tips interview di top tech company',
  'online',
  true
) RETURNING id INTO kiki_expert_id;

-- Kiki Expertise
INSERT INTO expert_expertise (expert_id, name) VALUES
  (kiki_expert_id, 'UX Design'),
  (kiki_expert_id, 'UI Design'),
  (kiki_expert_id, 'User Research'),
  (kiki_expert_id, 'Design System'),
  (kiki_expert_id, 'Figma');

-- Kiki Skills
INSERT INTO expert_skills (expert_id, name) VALUES
  (kiki_expert_id, 'Figma'),
  (kiki_expert_id, 'Adobe XD'),
  (kiki_expert_id, 'Sketch'),
  (kiki_expert_id, 'InVision'),
  (kiki_expert_id, 'Miro'),
  (kiki_expert_id, 'UserTesting');

-- Kiki Achievements
INSERT INTO expert_achievements (expert_id, description) VALUES
  (kiki_expert_id, 'Google UX Design Professional Certificate'),
  (kiki_expert_id, 'Speaker di UX Indonesia Conference 2023'),
  (kiki_expert_id, 'Redesign app yang meningkatkan conversion 40%'),
  (kiki_expert_id, 'Mentor di ADPList dengan 100+ sessions');

-- Kiki Education
INSERT INTO expert_education (expert_id, description) VALUES
  (kiki_expert_id, 'S1 Desain Komunikasi Visual - Institut Teknologi Bandung'),
  (kiki_expert_id, 'Google UX Design Certificate - Coursera'),
  (kiki_expert_id, 'Interaction Design Foundation - UX Management');

-- Kiki Work Experience
INSERT INTO expert_work_experience (expert_id, title, company, period, description) VALUES
  (kiki_expert_id, 'Senior UX Designer', 'Tokopedia', '2021 - Sekarang', 'Lead design untuk fitur Tokopedia Play dan Seller Center. Memimpin tim 5 designer.'),
  (kiki_expert_id, 'UX Designer', 'Bukalapak', '2019 - 2021', 'Redesign checkout flow yang meningkatkan conversion rate sebesar 25%.'),
  (kiki_expert_id, 'UI/UX Designer', 'Moka POS', '2017 - 2019', 'Design aplikasi POS untuk UMKM Indonesia.');

-- Kiki Session Types
INSERT INTO session_types (expert_id, name, duration, price, category, description, is_active) VALUES
  (kiki_expert_id, 'Portfolio Review', 45, 175000, 'online-video', 'Review mendalam portfolio UX/UI kamu dengan feedback actionable untuk improvement.', true),
  (kiki_expert_id, 'Career Consultation', 60, 250000, 'online-video', 'Konsultasi karir di bidang UX Design, tips interview, dan career path planning.', true),
  (kiki_expert_id, 'Quick Chat - Design Feedback', 30, 100000, 'online-chat', 'Diskusi cepat via chat untuk feedback design atau pertanyaan seputar UX.', true);

-- Kiki Digital Products
INSERT INTO digital_products (expert_id, name, description, price, type, is_active) VALUES
  (kiki_expert_id, 'UX Research Template Bundle', 'Koleksi 15+ template untuk user research: interview guide, usability testing script, persona template, journey map, dan lainnya.', 149000, 'template', true),
  (kiki_expert_id, 'E-Book: From Junior to Senior UX Designer', 'Panduan lengkap untuk naik level dari Junior ke Senior UX Designer dalam 2 tahun.', 89000, 'ebook', true);

-- ============================================================
-- INSERT DHANES EXPERT
-- ============================================================
INSERT INTO experts (
  user_id, name, email, slug, role, company, bio,
  location_city, location_country, experience, rating, review_count,
  program_highlight, availability, is_active
) VALUES (
  dhanes_user_id,
  'Dhanes Pratama',
  'dhanes@mentorinaja.com',
  'dhanes-pratama',
  'Tech Lead',
  'Gojek',
  'Software Engineer dengan pengalaman 9 tahun di industri teknologi. Expert dalam system design, backend development, dan engineering leadership. Passionate dalam membantu developer untuk level up skill teknis dan soft skill mereka.',
  'Bandung',
  'Indonesia',
  9,
  4.92,
  156,
  E'💻 System Design Mastery\n\nProgram untuk persiapan interview System Design:\n• Fundamental distributed systems\n• Database scaling & caching\n• Real-world case studies (design Gojek, Tokopedia)\n• Mock interview dengan feedback detail',
  'online',
  true
) RETURNING id INTO dhanes_expert_id;

-- Dhanes Expertise
INSERT INTO expert_expertise (expert_id, name) VALUES
  (dhanes_expert_id, 'System Design'),
  (dhanes_expert_id, 'Backend Development'),
  (dhanes_expert_id, 'Engineering Leadership'),
  (dhanes_expert_id, 'Go'),
  (dhanes_expert_id, 'Microservices');

-- Dhanes Skills
INSERT INTO expert_skills (expert_id, name) VALUES
  (dhanes_expert_id, 'Go'),
  (dhanes_expert_id, 'Python'),
  (dhanes_expert_id, 'Java'),
  (dhanes_expert_id, 'Kubernetes'),
  (dhanes_expert_id, 'AWS'),
  (dhanes_expert_id, 'PostgreSQL'),
  (dhanes_expert_id, 'Redis'),
  (dhanes_expert_id, 'Kafka');

-- Dhanes Achievements
INSERT INTO expert_achievements (expert_id, description) VALUES
  (dhanes_expert_id, 'AWS Certified Solutions Architect'),
  (dhanes_expert_id, 'Speaker di GopherCon Indonesia 2023'),
  (dhanes_expert_id, 'Kontributor open source Kubernetes'),
  (dhanes_expert_id, 'Built system handling 1M+ requests/second');

-- Dhanes Education
INSERT INTO expert_education (expert_id, description) VALUES
  (dhanes_expert_id, 'S1 Teknik Informatika - Universitas Indonesia'),
  (dhanes_expert_id, 'AWS Solutions Architect Professional'),
  (dhanes_expert_id, 'Google Cloud Professional Cloud Architect');

-- Dhanes Work Experience
INSERT INTO expert_work_experience (expert_id, title, company, period, description) VALUES
  (dhanes_expert_id, 'Tech Lead', 'Gojek', '2021 - Sekarang', 'Memimpin tim 12 engineer untuk membangun platform payment yang memproses jutaan transaksi per hari.'),
  (dhanes_expert_id, 'Senior Software Engineer', 'Traveloka', '2018 - 2021', 'Membangun booking system dengan high availability (99.99% uptime).'),
  (dhanes_expert_id, 'Software Engineer', 'Bukalapak', '2015 - 2018', 'Backend developer untuk fitur marketplace dan payment.');

-- Dhanes Session Types
INSERT INTO session_types (expert_id, name, duration, price, category, description, is_active) VALUES
  (dhanes_expert_id, 'System Design Interview Prep', 90, 350000, 'online-video', 'Mock interview system design dengan pembahasan mendalam dan feedback untuk persiapan interview di FAANG/unicorn.', true),
  (dhanes_expert_id, 'Code Review & Architecture', 60, 275000, 'online-video', 'Review arsitektur dan kode project kamu dengan rekomendasi improvement.', true),
  (dhanes_expert_id, 'Career Path Consultation', 45, 200000, 'online-video', 'Diskusi career path: IC vs Management track, skill yang perlu dikembangkan.', true),
  (dhanes_expert_id, 'Quick Technical Q&A', 30, 125000, 'online-chat', 'Tanya jawab teknis via chat seputar backend, system design, atau engineering practices.', true);

-- Dhanes Digital Products
INSERT INTO digital_products (expert_id, name, description, price, type, is_active) VALUES
  (dhanes_expert_id, 'System Design Interview Handbook', 'E-book 200+ halaman berisi framework, pattern, dan 20 real case study untuk system design interview.', 199000, 'ebook', true),
  (dhanes_expert_id, 'Go Backend Starter Template', 'Production-ready Go backend template dengan clean architecture, testing, CI/CD, dan dokumentasi lengkap.', 249000, 'template', true),
  (dhanes_expert_id, 'Video Course: Microservices with Go', 'Video course 8 jam tentang membangun microservices dengan Go, gRPC, dan Kubernetes.', 449000, 'course', true);

RAISE NOTICE 'Successfully created experts: Kiki Rahmawati and Dhanes Pratama';

END $$;
