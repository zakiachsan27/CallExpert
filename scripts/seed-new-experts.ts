#!/usr/bin/env ts-node

/**
 * Seed Script: Create Kiki and Dhanes Expert Accounts
 *
 * Usage: npx ts-node scripts/seed-new-experts.ts
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xnnlpwaodduqqiffeyxw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Set it with: set SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// New experts data
const newExperts = [
  {
    email: 'kiki@mentorinaja.com',
    password: 'Kiki@Expert123',
    name: 'Kiki Rahmawati',
    slug: 'kiki-rahmawati',
    role: 'Senior UX Designer',
    company: 'Tokopedia',
    bio: 'UX Designer berpengalaman dengan passion dalam menciptakan pengalaman digital yang intuitive dan user-centric. Sudah membantu lebih dari 50+ startup dan enterprise dalam merancang produk digital mereka. Spesialisasi di mobile app design, design system, dan user research.',
    city: 'Jakarta',
    country: 'Indonesia',
    experience: 7,
    rating: 4.85,
    reviewCount: 89,
    programHighlight: '🎯 Paket Mentoring UX Design\n\nProgram intensif 4 minggu untuk membantu kamu:\n• Memahami fundamental UX research\n• Membuat wireframe & prototype\n• Membangun portfolio UX yang menarik\n• Tips interview di top tech company',
    expertise: ['UX Design', 'UI Design', 'User Research', 'Design System', 'Figma'],
    skills: ['Figma', 'Adobe XD', 'Sketch', 'InVision', 'Miro', 'UserTesting'],
    achievements: [
      'Google UX Design Professional Certificate',
      'Speaker di UX Indonesia Conference 2023',
      'Redesign app yang meningkatkan conversion 40%',
      'Mentor di ADPList dengan 100+ sessions'
    ],
    education: [
      'S1 Desain Komunikasi Visual - Institut Teknologi Bandung',
      'Google UX Design Certificate - Coursera',
      'Interaction Design Foundation - UX Management'
    ],
    workExperience: [
      {
        title: 'Senior UX Designer',
        company: 'Tokopedia',
        period: '2021 - Sekarang',
        description: 'Lead design untuk fitur Tokopedia Play dan Seller Center. Memimpin tim 5 designer.'
      },
      {
        title: 'UX Designer',
        company: 'Bukalapak',
        period: '2019 - 2021',
        description: 'Redesign checkout flow yang meningkatkan conversion rate sebesar 25%.'
      },
      {
        title: 'UI/UX Designer',
        company: 'Moka POS',
        period: '2017 - 2019',
        description: 'Design aplikasi POS untuk UMKM Indonesia.'
      }
    ],
    sessionTypes: [
      {
        name: 'Portfolio Review',
        duration: 45,
        price: 175000,
        category: 'online-video',
        description: 'Review mendalam portfolio UX/UI kamu dengan feedback actionable untuk improvement.'
      },
      {
        name: 'Career Consultation',
        duration: 60,
        price: 250000,
        category: 'online-video',
        description: 'Konsultasi karir di bidang UX Design, tips interview, dan career path planning.'
      },
      {
        name: 'Quick Chat - Design Feedback',
        duration: 30,
        price: 100000,
        category: 'online-chat',
        description: 'Diskusi cepat via chat untuk feedback design atau pertanyaan seputar UX.'
      }
    ],
    digitalProducts: [
      {
        name: 'UX Research Template Bundle',
        description: 'Koleksi 15+ template untuk user research: interview guide, usability testing script, persona template, journey map, dan lainnya.',
        price: 149000,
        type: 'template'
      },
      {
        name: 'E-Book: From Junior to Senior UX Designer',
        description: 'Panduan lengkap untuk naik level dari Junior ke Senior UX Designer dalam 2 tahun.',
        price: 89000,
        type: 'ebook'
      }
    ]
  },
  {
    email: 'dhanes@mentorinaja.com',
    password: 'Dhanes@Expert123',
    name: 'Dhanes Pratama',
    slug: 'dhanes-pratama',
    role: 'Tech Lead',
    company: 'Gojek',
    bio: 'Software Engineer dengan pengalaman 9 tahun di industri teknologi. Expert dalam system design, backend development, dan engineering leadership. Passionate dalam membantu developer untuk level up skill teknis dan soft skill mereka.',
    city: 'Bandung',
    country: 'Indonesia',
    experience: 9,
    rating: 4.92,
    reviewCount: 156,
    programHighlight: '💻 System Design Mastery\n\nProgram untuk persiapan interview System Design:\n• Fundamental distributed systems\n• Database scaling & caching\n• Real-world case studies (design Gojek, Tokopedia)\n• Mock interview dengan feedback detail',
    expertise: ['System Design', 'Backend Development', 'Engineering Leadership', 'Go', 'Microservices'],
    skills: ['Go', 'Python', 'Java', 'Kubernetes', 'AWS', 'PostgreSQL', 'Redis', 'Kafka'],
    achievements: [
      'AWS Certified Solutions Architect',
      'Speaker di GopherCon Indonesia 2023',
      'Kontributor open source Kubernetes',
      'Built system handling 1M+ requests/second'
    ],
    education: [
      'S1 Teknik Informatika - Universitas Indonesia',
      'AWS Solutions Architect Professional',
      'Google Cloud Professional Cloud Architect'
    ],
    workExperience: [
      {
        title: 'Tech Lead',
        company: 'Gojek',
        period: '2021 - Sekarang',
        description: 'Memimpin tim 12 engineer untuk membangun platform payment yang memproses jutaan transaksi per hari.'
      },
      {
        title: 'Senior Software Engineer',
        company: 'Traveloka',
        period: '2018 - 2021',
        description: 'Membangun booking system dengan high availability (99.99% uptime).'
      },
      {
        title: 'Software Engineer',
        company: 'Bukalapak',
        period: '2015 - 2018',
        description: 'Backend developer untuk fitur marketplace dan payment.'
      }
    ],
    sessionTypes: [
      {
        name: 'System Design Interview Prep',
        duration: 90,
        price: 350000,
        category: 'online-video',
        description: 'Mock interview system design dengan pembahasan mendalam dan feedback untuk persiapan interview di FAANG/unicorn.'
      },
      {
        name: 'Code Review & Architecture',
        duration: 60,
        price: 275000,
        category: 'online-video',
        description: 'Review arsitektur dan kode project kamu dengan rekomendasi improvement.'
      },
      {
        name: 'Career Path Consultation',
        duration: 45,
        price: 200000,
        category: 'online-video',
        description: 'Diskusi career path: IC vs Management track, skill yang perlu dikembangkan.'
      },
      {
        name: 'Quick Technical Q&A',
        duration: 30,
        price: 125000,
        category: 'online-chat',
        description: 'Tanya jawab teknis via chat seputar backend, system design, atau engineering practices.'
      }
    ],
    digitalProducts: [
      {
        name: 'System Design Interview Handbook',
        description: 'E-book 200+ halaman berisi framework, pattern, dan 20 real case study untuk system design interview.',
        price: 199000,
        type: 'ebook'
      },
      {
        name: 'Go Backend Starter Template',
        description: 'Production-ready Go backend template dengan clean architecture, testing, CI/CD, dan dokumentasi lengkap.',
        price: 249000,
        type: 'template'
      },
      {
        name: 'Video Course: Microservices with Go',
        description: 'Video course 8 jam tentang membangun microservices dengan Go, gRPC, dan Kubernetes.',
        price: 449000,
        type: 'course'
      }
    ]
  }
];

async function createExpert(expertData: typeof newExperts[0]) {
  console.log(`\n📝 Creating expert: ${expertData.name}...`);

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: expertData.email,
      password: expertData.password,
      email_confirm: true,
      user_metadata: {
        name: expertData.name,
        role: 'expert'
      }
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    const userId = authData.user.id;
    console.log(`   ✅ Auth user created: ${userId}`);

    // 2. Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: expertData.email,
        name: expertData.name
      });

    if (userError) {
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`User record error: ${userError.message}`);
    }
    console.log('   ✅ User record created');

    // 3. Create expert profile
    const { data: expert, error: expertError } = await supabase
      .from('experts')
      .insert({
        user_id: userId,
        name: expertData.name,
        email: expertData.email,
        slug: expertData.slug,
        role: expertData.role,
        company: expertData.company,
        bio: expertData.bio,
        location_city: expertData.city,
        location_country: expertData.country,
        experience: expertData.experience,
        rating: expertData.rating,
        review_count: expertData.reviewCount,
        program_highlight: expertData.programHighlight,
        availability: 'online',
        is_active: true
      })
      .select()
      .single();

    if (expertError) {
      await supabase.from('users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Expert profile error: ${expertError.message}`);
    }

    const expertId = expert.id;
    console.log(`   ✅ Expert profile created: ${expertId}`);

    // 4. Add expertise
    const expertiseInserts = expertData.expertise.map(name => ({
      expert_id: expertId,
      name
    }));
    await supabase.from('expert_expertise').insert(expertiseInserts);
    console.log(`   ✅ Added ${expertData.expertise.length} expertise`);

    // 5. Add skills
    const skillsInserts = expertData.skills.map(name => ({
      expert_id: expertId,
      name
    }));
    await supabase.from('expert_skills').insert(skillsInserts);
    console.log(`   ✅ Added ${expertData.skills.length} skills`);

    // 6. Add achievements
    const achievementInserts = expertData.achievements.map(description => ({
      expert_id: expertId,
      description
    }));
    await supabase.from('expert_achievements').insert(achievementInserts);
    console.log(`   ✅ Added ${expertData.achievements.length} achievements`);

    // 7. Add education
    const educationInserts = expertData.education.map(description => ({
      expert_id: expertId,
      description
    }));
    await supabase.from('expert_education').insert(educationInserts);
    console.log(`   ✅ Added ${expertData.education.length} education`);

    // 8. Add work experience
    const workExpInserts = expertData.workExperience.map(exp => ({
      expert_id: expertId,
      title: exp.title,
      company: exp.company,
      period: exp.period,
      description: exp.description
    }));
    await supabase.from('expert_work_experience').insert(workExpInserts);
    console.log(`   ✅ Added ${expertData.workExperience.length} work experiences`);

    // 9. Add session types
    const sessionInserts = expertData.sessionTypes.map(session => ({
      expert_id: expertId,
      name: session.name,
      duration: session.duration,
      price: session.price,
      category: session.category,
      description: session.description,
      is_active: true
    }));
    await supabase.from('session_types').insert(sessionInserts);
    console.log(`   ✅ Added ${expertData.sessionTypes.length} session types`);

    // 10. Add digital products
    const productInserts = expertData.digitalProducts.map(product => ({
      expert_id: expertId,
      name: product.name,
      description: product.description,
      price: product.price,
      type: product.type,
      is_active: true
    }));
    await supabase.from('digital_products').insert(productInserts);
    console.log(`   ✅ Added ${expertData.digitalProducts.length} digital products`);

    return { success: true, expertData };

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 CallExpert - Seed New Experts\n');
  console.log('Creating Kiki and Dhanes expert accounts...');

  const results = [];

  for (const expert of newExperts) {
    const result = await createExpert(expert);
    results.push({ name: expert.name, email: expert.email, password: expert.password, ...result });
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY\n');

  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.name}`);
      console.log(`   Email: ${result.email}`);
      console.log(`   Password: ${result.password}`);
      console.log('');
    } else {
      console.log(`❌ ${result.name} - Failed: ${result.error}`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n💡 Experts can login at /login with their credentials\n');
}

main().catch(console.error);
