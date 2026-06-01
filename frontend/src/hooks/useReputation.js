import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

// Calcul du score de confiance
function calculateTrustScore(reviews, totalExchanges) {
  if (!reviews || reviews.length === 0) return 0;
  
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const reviewCount = reviews.length;
  const exchangeCompletionRate = totalExchanges > 0 ? (reviewCount / totalExchanges) : 0;
  
  // Score basé sur la note moyenne (0-60), nombre d'avis (0-25), taux de completion (0-15)
  const ratingScore = (avgRating - 1) * 15; // 1-5 → 0-60
  const countScore = Math.min(reviewCount * 2.5, 25); // Cap à 25 points
  const completionScore = exchangeCompletionRate * 15;
  
  return Math.round(ratingScore + countScore + completionScore);
}

// Attribution des badges
function calculateBadges(reviews, trustScore, totalExchanges) {
  const badges = [];
  
  if (reviews.length >= 5) badges.push("experienced");
  if (reviews.length >= 20) badges.push("veteran");
  if (trustScore >= 80) badges.push("trusted_trader");
  if (reviews.length > 0 && reviews.every(r => r.rating >= 4)) badges.push("excellent_rating");
  if (totalExchanges >= 10) badges.push("active_trader");
  
  // Badge pour réactivité (basé sur les tags)
  const responsiveTags = reviews.filter(r => 
    r.tags?.includes("rapide") || r.tags?.includes("bon_communicant")
  );
  if (responsiveTags.length >= 3) badges.push("fast_responder");
  
  // Badge pour fiabilité
  const reliableTags = reviews.filter(r => 
    r.tags?.includes("ponctuel") || r.tags?.includes("objet_conforme")
  );
  if (reliableTags.length >= 3) badges.push("reliable");
  
  return badges;
}

// Hook principal pour la réputation
export function useReputation(userId) {
  const [reputation, setReputation] = useState({
    averageRating: 0,
    totalReviews: 0,
    totalExchanges: 0,
    badges: [],
    trustScore: 0,
    reviews: [],
    loading: true
  });

  useEffect(() => {
    if (!userId) {
      setReputation(prev => ({ ...prev, loading: false }));
      return;
    }

    // Écouter les avis reçus par l'utilisateur
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("toUserId", "==", userId),
      where("isVisible", "==", true)
    );

    const unsubReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      // Pour l'instant, on utilise totalReviews comme approximation pour totalExchanges
      // Dans une vraie app, il faudrait une collection séparée pour les échanges
      const totalExchanges = Math.max(totalReviews, totalReviews * 1.2);
      
      const trustScore = calculateTrustScore(reviews, totalExchanges);
      const badges = calculateBadges(reviews, trustScore, totalExchanges);

      const newReputation = {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        totalExchanges: Math.round(totalExchanges),
        badges,
        trustScore,
        reviews: reviews.slice(0, 5), // Derniers 5 avis pour affichage
        loading: false
      };

      setReputation(newReputation);

      // Mettre à jour le profil utilisateur avec les nouvelles stats
      updateUserReputation(userId, newReputation);
    });

    return () => unsubReviews();
  }, [userId]);

  return reputation;
}

// Mettre à jour la réputation dans le profil utilisateur
async function updateUserReputation(userId, reputation) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      reputation: {
        averageRating: reputation.averageRating,
        totalReviews: reputation.totalReviews,
        totalExchanges: reputation.totalExchanges,
        badges: reputation.badges,
        trustScore: reputation.trustScore,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error("Erreur mise à jour réputation:", error);
  }
}

// Hook pour obtenir la réputation depuis le cache utilisateur
export function useUserReputation(userId) {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubUser = onSnapshot(doc(db, "users", userId), (doc) => {
      const userData = doc.data();
      setReputation(userData?.reputation || null);
      setLoading(false);
    });

    return () => unsubUser();
  }, [userId]);

  return { reputation, loading };
}

export default useReputation;