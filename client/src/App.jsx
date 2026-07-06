import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/layout/NotificationToast";
import SiteLayout from "./components/layout/SiteLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import PublicOnlyRoute from "./components/layout/PublicOnlyRoute";

import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/AboutPage";
import FeaturesPage from "./pages/FeaturesPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SearchRidePage from "./pages/SearchRidePage";
import OfferRidePage from "./pages/OfferRidePage";
import RideDetailsPage from "./pages/RideDetailsPage";
import NotFoundPage from "./pages/NotFoundPage";

import PassengerDashboard from "./pages/dashboard/PassengerDashboard";
import DriverDashboard from "./pages/dashboard/DriverDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import MyBookingsPage from "./pages/MyBookingsPage";
import RideHistoryPage from "./pages/RideHistoryPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <NotificationToast />
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
              <Route path="/about" element={<PublicOnlyRoute><AboutPage /></PublicOnlyRoute>} />
              <Route path="/features" element={<PublicOnlyRoute><FeaturesPage /></PublicOnlyRoute>} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/search-ride" element={<SearchRidePage />} />
              <Route path="/offer-ride" element={<OfferRidePage />} />
              <Route path="/ride/:id" element={<RideDetailsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard/passenger" element={<PassengerDashboard />} />
              <Route path="/dashboard/driver" element={<DriverDashboard />} />
              <Route path="/bookings" element={<MyBookingsPage />} />
              <Route path="/ride-history" element={<RideHistoryPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute requireRole="admin">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
