import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ExpertLoginPage } from './pages/ExpertLoginPage';
import { ExpertDetailPage } from './pages/ExpertDetailPage';
import { BookingPage } from './pages/BookingPage';
import { UserTransactionsPage } from './pages/UserTransactionsPage';
import { ExpertDashboardPage } from './pages/ExpertDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Log environment info for debugging
console.log('App loaded successfully with routing');

// Export types for use in components
export type SessionType = {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: 'online-event' | 'online-chat' | 'online-video' | 'offline-event';
  description: string;
};

export type DigitalProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  downloadLink?: string;
  thumbnail?: string;
  type: 'ebook' | 'course' | 'template' | 'guide' | 'other';
};

export type Expert = {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  expertise: string[];
  bio: string;
  experience: number;
  sessionTypes: SessionType[];
  location: {
    city: string;
    country: string;
  };
  availability: 'online' | 'offline';
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
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/expert/login" element={<ExpertLoginPage />} />
          <Route path="/expert/:expertId" element={<ExpertDetailPage />} />

          {/* Protected User Routes */}
          <Route 
            path="/expert/:expertId/booking" 
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

          {/* Protected Expert Routes */}
          <Route 
            path="/expert/dashboard" 
            element={
              <ProtectedRoute requireExpert>
                <ExpertDashboardPage />
              </ProtectedRoute>
            } 
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;