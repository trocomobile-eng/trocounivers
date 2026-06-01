import { useEffect, useState, Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./i18n";

import SplashScreen from "./components/SplashScreen";
import PageLayout from "./layouts/PageLayout";

// Pages critiques (chargées immédiatement)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Pages lazy (chargées à la demande)
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const FeedPage = lazy(() => import("./pages/FeedPage"));

// Pages lazy (chargées à la demande)
const UniversPage = lazy(() => import("./pages/UniversPage"));
const UniversDetailPage = lazy(() => import("./pages/UniversDetailPage"));
const ItemDetailPage = lazy(() => import("./pages/ItemDetailPage"));
const AddItemPage = lazy(() => import("./pages/AddItemPage"));
const EditItemPage = lazy(() => import("./pages/EditItemPage"));
const ProposeExchangePage = lazy(() => import("./pages/ProposeExchangePage"));
const ExchangesPage = lazy(() => import("./pages/ExchangesPage"));
const ExchangeDetailPage = lazy(() => import("./pages/ExchangeDetailPage"));
const AvailabilityPage = lazy(() => import("./pages/AvailabilityPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const UserItemsPage = lazy(() => import("./pages/UserItemsPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const TrocoDossierPage = lazy(() => import("./pages/TrocoDossierPage"));
const ChoosePlacePage = lazy(() => import("./pages/ChoosePlacePage"));
const MeetingSummaryPage = lazy(() => import("./pages/MeetingSummaryPage"));
const MeetingConfirmedPage = lazy(() => import("./pages/MeetingConfirmedPage"));
const PostMeetingPage = lazy(() => import("./pages/PostMeetingPage"));
const PostMeetingProblemPage = lazy(() => import("./pages/PostMeetingProblemPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ExchangeShowcasePage = lazy(() => import("./pages/ExchangeShowcasePage"));
const TestReviewsPage = lazy(() => import("./pages/TestReviewsPage"));

import { useAuth } from "./context/AuthContext";
import { usePushNotifications } from "./hooks/usePushNotifications";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  usePushNotifications(user?.uid);

  if (loading) return null;

  return user ? <PageLayout>{children}</PageLayout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  return !user ? children : <Navigate to="/feed" replace />;
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#18A98E] border-t-transparent"></div>
    </div>}>
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
            <FeedPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/feed/all"
        element={
          <PrivateRoute>
            <FeedPage />
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

      <Route path="/items/:id" element={<PageLayout><ItemDetailPage /></PageLayout>} />

      <Route
        path="/items/:id/edit"
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
            <LibraryPage />
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
        path="/exchanges/:id"
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
      
      <Route path="/test-reviews" element={<TestReviewsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}