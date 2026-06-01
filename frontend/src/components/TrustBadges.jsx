import { Shield, Star, CheckCircle, Clock, Users, Award, Zap, Heart } from "lucide-react";

// Configuration des badges
const BADGE_CONFIG = {
  trusted_trader: {
    icon: Shield,
    label: "Marchand de confiance",
    description: "Score de confiance élevé (80+)",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50"
  },
  excellent_rating: {
    icon: Star,
    label: "Excellentes notes",
    description: "Que des notes 4-5 étoiles",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50"
  },
  experienced: {
    icon: CheckCircle,
    label: "Expérimenté",
    description: "5+ échanges réalisés",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50"
  },
  veteran: {
    icon: Award,
    label: "Vétéran",
    description: "20+ échanges réalisés",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50"
  },
  fast_responder: {
    icon: Zap,
    label: "Réactif",
    description: "Répond rapidement",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50"
  },
  reliable: {
    icon: Clock,
    label: "Fiable",
    description: "Ponctuel et soigneux",
    color: "bg-teal-500",
    textColor: "text-teal-700",
    bgColor: "bg-teal-50"
  },
  active_trader: {
    icon: Users,
    label: "Actif",
    description: "10+ échanges réalisés",
    color: "bg-indigo-500",
    textColor: "text-indigo-700",
    bgColor: "bg-indigo-50"
  },
  verified: {
    icon: CheckCircle,
    label: "Vérifié",
    description: "Identité vérifiée",
    color: "bg-green-600",
    textColor: "text-green-800",
    bgColor: "bg-green-100"
  }
};

// Badge individuel
export function TrustBadge({ badgeType, size = "sm", showTooltip = false, className = "" }) {
  const config = BADGE_CONFIG[badgeType];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    xs: "p-1",
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3"
  };
  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20
  };

  return (
    <div 
      className={`
        inline-flex items-center justify-center rounded-full 
        ${config.bgColor} ${sizeClasses[size]} ${className}
        ${showTooltip ? 'cursor-help' : ''}
      `}
      title={showTooltip ? `${config.label}: ${config.description}` : undefined}
    >
      <Icon 
        size={iconSizes[size]} 
        className={config.textColor}
      />
    </div>
  );
}

// Affichage multiple de badges
export function TrustBadgeList({ badges = [], maxDisplay = 3, size = "sm", showLabels = false }) {
  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {displayBadges.map(badgeType => {
        const config = BADGE_CONFIG[badgeType];
        if (!config) return null;

        return (
          <div key={badgeType} className="flex items-center gap-1">
            <TrustBadge 
              badgeType={badgeType} 
              size={size} 
              showTooltip={!showLabels}
            />
            {showLabels && (
              <span className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
              </span>
            )}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <span className="text-xs text-gray-500 ml-1">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

// Indicateur de score de confiance
export function TrustScore({ score, size = "md", showLabel = true }) {
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    if (score >= 40) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreText = (score) => {
    if (score >= 80) return "Très fiable";
    if (score >= 60) return "Fiable";
    if (score >= 40) return "Correct";
    return "Nouveau";
  };

  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-1.5",
    lg: "text-lg px-4 py-2"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`
        inline-flex items-center gap-1 rounded-full font-bold
        ${getScoreColor(score)} ${sizeClasses[size]}
      `}>
        <Shield size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
        <span>{score}</span>
      </div>
      
      {showLabel && (
        <span className="text-sm text-gray-600">
          {getScoreText(score)}
        </span>
      )}
    </div>
  );
}

// Composant complet de réputation
export function ReputationDisplay({ reputation, compact = false }) {
  if (!reputation) return null;

  const { averageRating, totalReviews, trustScore, badges } = reputation;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {trustScore > 0 && <TrustScore score={trustScore} size="sm" showLabel={false} />}
        {averageRating > 0 && (
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{averageRating}</span>
            <span className="text-xs text-gray-500">({totalReviews})</span>
          </div>
        )}
        {badges.length > 0 && <TrustBadgeList badges={badges} maxDisplay={2} size="xs" />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score et note */}
      <div className="flex items-center gap-4">
        {trustScore > 0 && <TrustScore score={trustScore} />}
        
        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star 
                  key={i}
                  size={16} 
                  className={
                    i <= averageRating 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-300"
                  } 
                />
              ))}
            </div>
            <span className="font-medium">{averageRating}</span>
            <span className="text-sm text-gray-500">
              ({totalReviews} avis)
            </span>
          </div>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Qualités reconnues</h4>
          <TrustBadgeList badges={badges} maxDisplay={6} showLabels />
        </div>
      )}
    </div>
  );
}

export default TrustBadge;