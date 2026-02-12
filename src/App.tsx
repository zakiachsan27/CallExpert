import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ExpertsPage = lazy(() => import('./pages/ExpertsPage').then(m => ({ default: m.ExpertsPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ExpertLoginPage = lazy(() => import('./pages/ExpertLoginPage').then(m => ({ default: m.ExpertLoginPage })));
const ExpertDetailPage = lazy(() => import('./pages/ExpertDetailPage').then(m => ({ default: m.ExpertDetailPage })));
const BookingPage = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const UserTransactionsPage = lazy(() => import('./pages/UserTransactionsPage').then(m => ({ default: m.UserTransactionsPage })));
const ExpertDashboardPage = lazy(() => import('./pages/ExpertDashboardPage').then(m => ({ default: m.ExpertDashboardPage })));
const InvoicePage = lazy(() => import('./pages/InvoicePage').then(m => ({ default: m.InvoicePage })));
const SessionPage = lazy(() => import('./pages/SessionPage').then(m => ({ default: m.SessionPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));
const NewsletterAdminPage = lazy(() => import('./pages/NewsletterAdminPage').then(m => ({ default: m.NewsletterAdminPage })));
const ArticleListPage = lazy(() => import('./pages/ArticleListPage').then(m => ({ default: m.ArticleListPage })));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const DaftarMentorPage = lazy(() => import('./pages/DaftarMentorPage').then(m => ({ default: m.DaftarMentorPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
  </div>
);

// Check if running on native mobile platform (Android/iOS)
const isNativePlatform = Capacitor.isNativePlatform();

// Log environment info for debugging
// console.log('App loaded successfully with routing');
// console.log('Platform:', Capacitor.getPlatform(), '| Native:', isNativePlatform);

// Export types for use in components
export type SessionType = {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: 'online-event' | 'online-chat' | 'online-video' | 'offline-event';
  description: string;
  enabled?: boolean; // Whether this session type is active/visible to mentees
};

export type DigitalProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  downloadLink?: string;
  thumbnail?: string;
  type: 'ebook' | 'course' | 'template' | 'guide' | 'other';
  enabled?: boolean;
};

export type Expert = {
  id: string;
  slug?: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  expertise: string[];
  bio: string;
  programHighlight?: string;
  experience: number;
  sessionTypes: SessionType[];
  location: {
    city: string;
    country: string;
  };
  availability: 'online' | 'offline';
  availableNow?: boolean;
  availableNowUntil?: string;
  digitalProducts?: DigitalProduct[];
  achievements?: string[];
  education?: string[];
  workExperience?: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>;
  skills?: string[];
};

export type Booking = {
  id?: string;
  orderId?: string;
  expert: Expert;
  sessionType: SessionType;
  date: Date | string;
  time: string;
  topic: string;
  notes?: string;
  totalPrice: number;
  meetingLink?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus?: 'waiting' | 'paid';
  paymentMethod?: 'credit-card' | 'bank-transfer' | 'e-wallet';
};

function App() {
  // Native Mobile App (Expert/Mentor Only)
  if (isNativePlatform) {
    return (
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Redirect root to expert login */}
              <Route path="/" element={<Navigate to="/expert/login" replace />} />

              {/* Expert Login */}
              <Route path="/expert/login" element={<ExpertLoginPage />} />

              {/* Protected Expert Dashboard Routes */}
              <Route
                path="/expert/dashboard"
                element={
                  <ProtectedRoute requireExpert>
                    <ExpertDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expert/dashboard/*"
                element={
                  <ProtectedRoute requireExpert>
                    <ExpertDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Session/Chat Route for Expert */}
              <Route
                path="/session"
                element={
                  <ProtectedRoute requireExpert>
                    <SessionPage />
                  </ProtectedRoute>
                }
              />

              {/* Invoice Route */}
              <Route path="/invoice/:orderId" element={<InvoicePage />} />

              {/* Catch all - redirect to expert login */}
              <Route path="*" element={<Navigate to="/expert/login" replace />} />
            </Routes>
            </Suspense>
            <Toaster position="top-center" richColors closeButton />
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  // Web App (Full Features)
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/experts" element={<ExpertsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/daftar-mentor" element={<DaftarMentorPage />} />
            <Route path="/expert/login" element={<ExpertLoginPage />} />
            <Route path="/expert/:slug" element={<ExpertDetailPage />} />
            <Route path="/invoice/:orderId" element={<InvoicePage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />

            {/* Article Routes */}
            <Route path="/artikel" element={<ArticleListPage />} />
            <Route path="/artikel/:slug" element={<ArticleDetailPage />} />

            {/* Protected User Routes */}
            <Route
              path="/expert/:slug/booking"
              element={
                <ProtectedRoute requireUser>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/transactions"
              element={
                <ProtectedRoute requireUser>
                  <UserTransactionsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Session Route (Chat) */}
            <Route
              path="/session"
              element={
                <ProtectedRoute>
                  <SessionPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Expert Routes */}
            <Route
              path="/expert/dashboard"
              element={
                <ProtectedRoute requireExpert>
                  <ExpertDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expert/dashboard/layanan"
              element={
                <ProtectedRoute requireExpert>
                  <ExpertDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expert/dashboard/profil"
              element={
                <ProtectedRoute requireExpert>
                  <ExpertDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expert/dashboard/transaksi"
              element={
                <ProtectedRoute requireExpert>
                  <ExpertDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expert/dashboard/transaksi/:transactionId"
              element={
                <ProtectedRoute requireExpert>
                  <ExpertDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/newsletter" element={<NewsletterAdminPage />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
            <Toaster position="top-center" richColors closeButton />
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;