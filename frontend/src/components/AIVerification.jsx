import { useState } from 'react';
import { analyzeImageWithVision, verifyCategoryMatch, verifySafeContent, calculateAIVerificationScore, mockAIVerification } from '../services/aiVerification';

// Composant principal de vérification IA
export function AIVerificationBox({ imageFile, category, type, onVerificationComplete }) {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runVerification = async () => {
    if (!imageFile) {
      setError('Aucune image sélectionnée');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      // Utiliser la version mock pour les tests (changez pour analyzeImageWithVision en production)
      const visionResult = await mockAIVerification(imageFile, category, type);
      
      if (!visionResult.success) {
        setError(visionResult.error);
        return;
      }

      const categoryMatch = verifyCategoryMatch(visionResult, category, type);
      const safeContent = verifySafeContent(visionResult);
      const aiScore = calculateAIVerificationScore(categoryMatch, safeContent);

      const verificationResult = {
        ...visionResult,
        verification: {
          categoryMatch,
          safeContent,
          aiScore
        }
      };

      setResult(verificationResult);
      
      // Notifier le parent du résultat
      if (onVerificationComplete) {
        onVerificationComplete(verificationResult);
      }

    } catch (err) {
      console.error('Erreur vérification IA:', err);
      setError(`Erreur lors de l'analyse: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          🤖
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Vérification IA</h3>
          <p className="text-sm text-gray-600">Analyser l'image pour valider l'objet</p>
        </div>
      </div>

      {!result && !verifying && (
        <button
          onClick={runVerification}
          disabled={!imageFile}
          className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {imageFile ? 'Lancer la vérification' : 'Ajoutez une image d\'abord'}
        </button>
      )}

      {verifying && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">Analyse IA en cours...</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={runVerification}
            className="mt-2 text-red-600 text-sm underline hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {result && (
        <AIVerificationResult result={result} />
      )}
    </div>
  );
}

// Composant d'affichage des résultats
function AIVerificationResult({ result }) {
  const { verification } = result;
  const { categoryMatch, safeContent, aiScore } = verification;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return '✅';
    if (score >= 60) return '⚠️';
    return '❌';
  };

  return (
    <div className="space-y-4">
      {/* Score global */}
      <div className={`border rounded-lg p-4 ${getScoreColor(aiScore.overallScore)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getScoreIcon(aiScore.overallScore)}</span>
            <div>
              <h4 className="font-semibold">
                {aiScore.verified ? 'Objet vérifié' : 'Vérification incomplète'}
              </h4>
              <p className="text-sm opacity-80">
                Score de confiance: {aiScore.overallScore}/100
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{aiScore.overallScore}%</div>
          </div>
        </div>
      </div>

      {/* Détails de correspondance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>{categoryMatch.match ? '✅' : '❌'}</span>
            <span className="font-medium">Catégorie</span>
          </div>
          <p className="text-gray-600">{categoryMatch.confidence}% confiance</p>
          {categoryMatch.bestMatch && (
            <p className="text-xs text-gray-500 mt-1">Détecté: {categoryMatch.bestMatch}</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>{safeContent.safe ? '✅' : '⚠️'}</span>
            <span className="font-medium">Sécurité</span>
          </div>
          <p className="text-gray-600">{safeContent.confidence}% sûr</p>
          {safeContent.warnings.length > 0 && (
            <p className="text-xs text-red-500 mt-1">{safeContent.warnings.join(', ')}</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span>📊</span>
            <span className="font-medium">Qualité</span>
          </div>
          <p className="text-gray-600">{aiScore.details.qualityScore}% qualité</p>
        </div>
      </div>

      {/* Badges obtenus */}
      {aiScore.badges && aiScore.badges.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-700 mb-2">Badges obtenus</h5>
          <div className="flex flex-wrap gap-2">
            {aiScore.badges.map((badge, index) => (
              <AIVerificationBadge key={index} badge={badge} />
            ))}
          </div>
        </div>
      )}

      {/* Objets détectés */}
      {categoryMatch.detectedObjects && categoryMatch.detectedObjects.length > 0 && (
        <div className="text-xs text-gray-500">
          <p className="font-medium mb-1">Objets détectés:</p>
          <p>{categoryMatch.detectedObjects.slice(0, 5).join(', ')}</p>
        </div>
      )}
    </div>
  );
}

// Composant de badge de vérification
function AIVerificationBadge({ badge }) {
  const badgeInfo = {
    'ai_verified_gold': { label: 'Vérifié IA Or', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' },
    'ai_verified_silver': { label: 'Vérifié IA Argent', color: 'bg-gray-100 text-gray-700', icon: '🥈' },
    'category_confirmed': { label: 'Catégorie Confirmée', color: 'bg-green-100 text-green-700', icon: '✅' },
    'content_safe': { label: 'Contenu Sûr', color: 'bg-blue-100 text-blue-700', icon: '🛡️' }
  };

  const info = badgeInfo[badge] || { label: badge, color: 'bg-gray-100 text-gray-600', icon: '🏷️' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
}

// Composant compact pour l'affichage dans les listes d'objets
export function AIVerificationStatus({ verificationData, compact = false }) {
  if (!verificationData || !verificationData.verification) {
    return null;
  }

  const { aiScore } = verificationData.verification;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-xs">
        <span>{aiScore.verified ? '🤖✅' : '🤖⚠️'}</span>
        <span className={aiScore.verified ? 'text-green-600' : 'text-yellow-600'}>
          {aiScore.overallScore}%
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <span className="text-lg">{aiScore.verified ? '🤖✅' : '🤖⚠️'}</span>
      <div className="text-sm">
        <p className="font-medium text-gray-700">
          {aiScore.verified ? 'Vérifié par IA' : 'Vérification partielle'}
        </p>
        <p className="text-gray-500">Score: {aiScore.overallScore}%</p>
      </div>
    </div>
  );
}

export default AIVerificationBox;