import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setupTestData, setupTestDataWithCurrentUser, cleanupTestData } from "../utils/testReviews";
import { ReviewForm, StarRating } from "../components/ReviewSystem";
import { TrustBadge, TrustScore, ReputationDisplay } from "../components/TrustBadges";
import { useAuth } from "../context/AuthContext";

export default function TestReviewsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [testUserId, setTestUserId] = useState(null);

  const handleSetupTestData = async () => {
    if (!user) {
      alert("Vous devez être connecté pour créer des données de test");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const userId = await setupTestDataWithCurrentUser(user);
      setTestUserId(userId);
      alert("Données de test créées ! Vous pouvez maintenant voir votre profil avec le système de réputation.");
    } catch (error) {
      alert("Erreur lors de la création des données de test");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const mockReputation = {
    averageRating: 4.6,
    totalReviews: 12,
    totalExchanges: 15,
    badges: ["trusted_trader", "experienced", "fast_responder", "reliable"],
    trustScore: 87,
    reviews: [
      {
        id: "1",
        rating: 5,
        comment: "Échange parfait ! Personne très sympa et ponctuelle.",
        tags: ["ponctuel", "sympathique"],
        createdAt: new Date()
      },
      {
        id: "2", 
        rating: 4,
        comment: "Très bon échange, communication fluide.",
        tags: ["bon_communicant"],
        createdAt: new Date()
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F6FAF8] p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <h1 className="text-2xl font-bold text-[#102033] mb-2">
            🛡️ Test du système de confiance
          </h1>
          <p className="text-gray-600">
            Testez les fonctionnalités d'avis et de réputation
          </p>
        </div>

        {/* Actions */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <h2 className="text-lg font-semibold text-[#102033] mb-4">Actions de test</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleSetupTestData}
              disabled={loading}
              className="w-full py-3 bg-[#18A98E] text-white font-medium rounded-lg hover:bg-[#16967C] transition disabled:opacity-50"
            >
              {loading ? "Création en cours..." : "Créer des données de test"}
            </button>

            <button
              onClick={() => {
                if (user) {
                  navigate(`/users/${user.uid}`);
                } else if (testUserId) {
                  navigate(`/users/${testUserId}`);
                } else {
                  navigate("/profile");
                }
              }}
              className="w-full py-3 border border-[#18A98E] text-[#18A98E] font-medium rounded-lg hover:bg-[#18A98E] hover:text-white transition"
              disabled={!user}
            >
              {user ? "Voir mon profil avec réputation" : "Connectez-vous d'abord"}
            </button>

            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Tester le formulaire d'avis
            </button>
          </div>
        </div>

        {/* Preview des composants */}
        <div className="rounded-[20px] bg-white p-6 shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
          <h2 className="text-lg font-semibold text-[#102033] mb-4">Aperçu des composants</h2>
          
          <div className="space-y-6">
            {/* Étoiles */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Notation par étoiles</h3>
              <StarRating rating={4.5} size={20} />
            </div>

            {/* Score de confiance */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Score de confiance</h3>
              <div className="flex gap-4">
                <TrustScore score={87} />
                <TrustScore score={65} />
                <TrustScore score={42} />
              </div>
            </div>

            {/* Badges */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Badges de confiance</h3>
              <div className="flex gap-2 flex-wrap">
                <TrustBadge badgeType="trusted_trader" showTooltip />
                <TrustBadge badgeType="experienced" showTooltip />
                <TrustBadge badgeType="fast_responder" showTooltip />
                <TrustBadge badgeType="reliable" showTooltip />
                <TrustBadge badgeType="excellent_rating" showTooltip />
              </div>
            </div>

            {/* Réputation complète */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Affichage complet de réputation</h3>
              <div className="border rounded-lg p-4 bg-gray-50">
                <ReputationDisplay reputation={mockReputation} />
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-[20px] bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            📋 Instructions de test
          </h2>
          <ol className="text-blue-800 space-y-2 list-decimal list-inside">
            <li>Cliquez sur "Créer des données de test" pour générer des utilisateurs et avis</li>
            <li>Visitez le profil testuser2 pour voir la section réputation</li>
            <li>Testez le formulaire d'avis avec différentes notes et tags</li>
            <li>Observez le calcul automatique des badges et scores</li>
            <li>Vérifiez l'affichage responsive sur mobile/desktop</li>
          </ol>
        </div>

        {/* Formulaire d'avis modal */}
        {showReviewForm && user && (
          <ReviewForm
            toUserId={user.uid}
            exchangeId="test-exchange"
            onClose={() => setShowReviewForm(false)}
            onSuccess={() => {
              setShowReviewForm(false);
              alert("Avis envoyé ! (test mode)");
            }}
          />
        )}
      </div>
    </div>
  );
}