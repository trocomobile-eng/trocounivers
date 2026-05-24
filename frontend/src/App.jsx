import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./i18n";

import SplashScreen from "./components/SplashScreen";
import AppShell from "./layouts/AppShell";

import LandingPage from "./pages/LandingPage";
import OnboardingPage from "./pages/OnboardingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

import FeedPage from "./pages/FeedPage";
import DesktopFeedPage from "./pages/feed/DesktopFeedPage";

import UniversPage from "./pages/UniversPage";
import UniversDetailPage from "./pages/UniversDetailPage";

import ItemDetailPage from "./pages/ItemDetailPage";
import AddItemPage from "./pages/AddItemPage";
import EditItemPage from "./pages/EditItemPage";
import ProposeExchangePage from "./pages/ProposeExchangePage";
import ExchangesPage from "./pages/ExchangesPage";
import ExchangeDetailPage from "./pages/ExchangeDetailPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import ChatPage from "./pages/ChatPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import UserItemsPage from "./pages/UserItemsPage";
import FavoritesPage from "./pages/FavoritesPage";
import InfoPage from "./pages/InfoPage";
import TrocoDossierPage from "./pages/TrocoDossierPage";
import ChoosePlacePage from "./pages/ChoosePlacePage";
import MeetingSummaryPage from "./pages/MeetingSummaryPage";
import MeetingConfirmedPage from "./pages/MeetingConfirmedPage";
import PostMeetingPage from "./pages/PostMeetingPage";
import PostMeetingProblemPage from "./pages/PostMeetingProblemPage";
import AdminPage from "./pages/AdminPage";
import ExchangeShowcasePage from "./pages/ExchangeShowcasePage";

import { useAuth } from "./context/AuthContext";
import { usePushNotifications } from "./hooks/usePushNotifications";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  usePushNotifications(user?.uid);

  if (loading) return null;

  return user ? <AppShell>{children}</AppShell> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return !user ? children : <Navigate to="/feed" replace />;
}

function ResponsiveFeedRoute() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    function update() {
      setIsDesktop(window.innerWidth >= 1024);
    }

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  return isDesktop ? <DesktopFeedPage /> : <FeedPage />;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen duration={2200} onDone={() => setShowSplash(false)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/about" element={<InfoPage type="about" />} />
      <Route path="/contact" element={<InfoPage type="contact" />} />
      <Route path="/safety" element={<InfoPage type="safety" />} />
      <Route path="/privacy" element={<InfoPage type="privacy" />} />
      <Route path="/terms" element={<InfoPage type="terms" />} />
      <Route path="/troco-dossier" element={<TrocoDossierPage />} />

      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />

      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route
        path="/feed"
        element={
          <PrivateRoute>
            <ResponsiveFeedRoute />
          </PrivateRoute>
        }
      />

      <Route
        path="/feed/all"
        element={
          <PrivateRoute>
            <ResponsiveFeedRoute />
          </PrivateRoute>
        }
      />

      <Route path="/explore" element={<Navigate to="/feed" replace />} />

      <Route
        path="/univers"
        element={
          <PrivateRoute>
            <UniversPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/univers/:id"
        element={
          <PrivateRoute>
            <UniversDetailPage />
          </PrivateRoute>
        }
      />

      <Route path="/items/:id" element={<ItemDetailPage />} />
      <Route path="/items/:itemId" element={<ItemDetailPage />} />

      <Route
        path="/items/:id/edit"
        element={
          <PrivateRoute>
            <EditItemPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/items/:itemId/edit"
        element={
          <PrivateRoute>
            <EditItemPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/add"
        element={
          <PrivateRoute>
            <AddItemPage />
          </PrivateRoute>
        }
      />

      <Route path="/add-item" element={<Navigate to="/add" replace />} />

      <Route
        path="/library"
        element={
          <PrivateRoute>
            <UserItemsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/favorites"
        element={
          <PrivateRoute>
            <FavoritesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/propose/:itemId"
        element={
          <PrivateRoute>
            <ProposeExchangePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/items/:itemId/propose"
        element={
          <PrivateRoute>
            <ProposeExchangePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges"
        element={
          <PrivateRoute>
            <ExchangesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:id"
        element={
          <PrivateRoute>
            <ExchangeDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchange/:id"
        element={
          <PrivateRoute>
            <ExchangeDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:exchangeId"
        element={
          <PrivateRoute>
            <ExchangeDetailPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/availability/:id"
        element={
          <PrivateRoute>
            <AvailabilityPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/choose-place"
        element={
          <PrivateRoute>
            <ChoosePlacePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/choose-place/:exchangeId"
        element={
          <PrivateRoute>
            <ChoosePlacePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:exchangeId/choose-place"
        element={
          <PrivateRoute>
            <ChoosePlacePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/meeting-summary"
        element={
          <PrivateRoute>
            <MeetingSummaryPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:exchangeId/meeting"
        element={
          <PrivateRoute>
            <MeetingConfirmedPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/post-meeting"
        element={
          <PrivateRoute>
            <PostMeetingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/post-meeting/:exchangeId"
        element={
          <PrivateRoute>
            <PostMeetingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/meeting/:exchangeId/post-meeting"
        element={
          <PrivateRoute>
            <PostMeetingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:exchangeId/post-meeting"
        element={
          <PrivateRoute>
            <PostMeetingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:exchangeId/problem"
        element={
          <PrivateRoute>
            <PostMeetingProblemPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <PrivateRoute>
            <MessagesPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchanges/:id/chat"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/exchange/:id/chat"
        element={
          <PrivateRoute>
            <ChatPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile/edit"
        element={
          <PrivateRoute>
            <EditProfilePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/users/:userId"
        element={
          <PrivateRoute>
            <UserProfilePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile/:userId"
        element={
          <PrivateRoute>
            <UserProfilePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/u/:userId"
        element={
          <PrivateRoute>
            <UserProfilePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/user/:id"
        element={
          <PrivateRoute>
            <UserItemsPage />
          </PrivateRoute>
        }
      />

      <Route path="/troc/:id" element={<ExchangeShowcasePage />} />

      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/feedback" element={<AdminPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}