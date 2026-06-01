import { useState } from "react";
import { Star, StarHalf, Check, X, MessageSquare } from "lucide-react";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// Composant d'affichage des étoiles
export function StarRating({ rating, size = 16, interactive = false, onRatingChange }) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = (hoverRating || rating) >= i;
    const half = (hoverRating || rating) >= i - 0.5 && (hoverRating || rating) < i;
    
    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition`}
        onClick={() => interactive && onRatingChange?.(i)}
        onMouseEnter={() => interactive && setHoverRating(i)}
        onMouseLeave={() => interactive && setHoverRating(0)}
      >
        {filled ? (
          <Star 
            size={size} 
            className="fill-yellow-400 text-yellow-400" 
          />
        ) : half ? (
          <StarHalf 
            size={size} 
            className="fill-yellow-400 text-yellow-400" 
          />
        ) : (
          <Star 
            size={size} 
            className="text-gray-300" 
          />
        )}
      </button>
    );
  }
  
  return <div className="flex gap-0.5">{stars}</div>;
}

// Composant pour laisser un avis
export function ReviewForm({ toUserId, exchangeId, onClose, onSuccess }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    "ponctuel", "sympathique", "objet_conforme", "bon_communicant",
    "flexible", "soigneux", "rapide", "professionnel"
  ];

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      // Créer l'avis
      const reviewData = {
        fromUserId: user.uid,
        toUserId,
        exchangeId,
        rating,
        comment: comment.trim(),
        tags: selectedTags,
        createdAt: serverTimestamp(),
        isVisible: true
      };
      
      await addDoc(collection(db, "reviews"), reviewData);
      
      // Mettre à jour le statut de l'échange
      if (exchangeId) {
        await updateDoc(doc(db, "exchanges", exchangeId), {
          [`reviewStatus.${user.uid}`]: "completed"
        });
      }
      
      onSuccess?.();
      onClose?.();
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'avis:", error);
      alert("Impossible d'envoyer l'avis. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[20px] p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#102033]">Laisser un avis</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note générale
            </label>
            <StarRating 
              rating={rating} 
              size={24} 
              interactive 
              onRatingChange={setRating} 
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualités (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    selectedTags.includes(tag)
                      ? 'bg-[#18A98E] text-white border-[#18A98E]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tag.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience d'échange..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#18A98E] focus:border-transparent"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1 py-3 bg-[#18A98E] text-white font-medium rounded-lg hover:bg-[#16967C] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi..." : "Envoyer l'avis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant d'affichage d'un avis
export function ReviewCard({ review, compact = false }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-100 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <StarRating rating={review.rating} size={compact ? 14 : 16} />
          <span className="text-sm text-gray-500">
            {formatDate(review.createdAt)}
          </span>
        </div>
      </div>

      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {review.tags.map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {review.comment && (
        <p className={`text-gray-700 ${compact ? 'text-sm' : ''}`}>
          {review.comment}
        </p>
      )}
    </div>
  );
}

export default ReviewForm;