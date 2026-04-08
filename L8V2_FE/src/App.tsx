import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Gallery from './pages/Gallery';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import Artists from './pages/Artists';
import BookingHome from './pages/BookingHome';
import BookingAbout from './pages/BookingAbout';
import BookingArtists from './pages/BookingArtists';
import ArtistPage from './pages/ArtistPage';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Header from './components/Header';
import PlatformRouter from './components/PlatformRouter';
import ScrollToTop from './components/ScrollToTop';
import { useAuth } from './hooks/useAuth';
import CookieSettingsButton from './components/CookieSettingsButton';
import CookieConsentBanner from './components/CookieConsentBanner';
import GoogleAnalyticsLoader from './components/GoogleAnalyticsLoader';
import { AuthProvider } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const isLoginPage = location.pathname === '/login';
  const isBookingPage = location.pathname.startsWith('/booking');

  return (
    <div className="relative min-h-screen">
      {!isAdminPage && !isLoginPage && (
        <div className={`fixed inset-0 bg-gradient-to-br -z-10 ${
          isBookingPage 
            ? 'from-booking-dark via-booking-dark to-booking-teal-dark'
            : 'from-l8-dark via-l8-blue-dark to-l8-blue'
        }`} />
      )}
      <div className="relative z-10">
        {!isAdminPage && !isLoginPage && <Header />}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:eventName" element={<EventDetails />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/booking" element={<BookingHome />} />
            <Route path="/booking/artists" element={<BookingArtists />} />
            <Route path="/booking/artists/:artistName" element={<ArtistPage />} />
            <Route path="/booking/about" element={<BookingAbout />} />
            <Route path="/booking/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <PlatformRouter>
          <ScrollToTop />
          <AppContent />
          <GoogleAnalyticsLoader />
          <CookieSettingsButton />
          <CookieConsentBanner />
        </PlatformRouter>
      </AuthProvider>
    </Router>
  );
};

export default App;