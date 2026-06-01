// Service de vérification d'objets par IA
// Utilise l'API Google Vision pour analyser les images

// Configuration de l'API (à mettre dans .env)
const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Mapping catégories Troco vers labels Google Vision
const CATEGORY_MAPPINGS = {
  // Vêtements
  'vetements': ['Clothing', 'Shirt', 'Dress', 'Pants', 'Shoe', 'Hat', 'Bag', 'Jacket', 'Sweater'],
  'chaussures': ['Shoe', 'Boot', 'Sneakers', 'Sandal'],
  'accessoires': ['Bag', 'Hat', 'Sunglasses', 'Watch', 'Belt', 'Jewelry'],
  
  // Tech
  'tech': ['Mobile phone', 'Laptop', 'Computer', 'Tablet', 'Camera', 'Headphones', 'Speaker'],
  'smartphone': ['Mobile phone', 'Smartphone', 'Telephone'],
  'ordinateur': ['Laptop', 'Computer', 'Desktop computer', 'Monitor'],
  'appareil_photo': ['Camera', 'Digital camera', 'Lens'],
  
  // Maison
  'maison': ['Furniture', 'Chair', 'Table', 'Sofa', 'Lamp', 'Mirror', 'Plant'],
  'mobilier': ['Chair', 'Table', 'Sofa', 'Desk', 'Bed', 'Cabinet'],
  'deco': ['Plant', 'Vase', 'Mirror', 'Picture frame', 'Candle'],
  'luminaire': ['Lamp', 'Light fixture', 'Chandelier'],
  
  // Livres
  'livres': ['Book', 'Magazine', 'Notebook'],
  
  // Musique
  'musique': ['Guitar', 'Piano', 'Violin', 'Drum', 'Musical instrument', 'Microphone'],
  'instrument': ['Guitar', 'Piano', 'Violin', 'Drum', 'Musical instrument'],
  
  // Sport
  'sport': ['Bicycle', 'Ball', 'Racket', 'Skateboard', 'Sports equipment'],
  'velo': ['Bicycle', 'Bike'],
  
  // Jeux
  'jeux': ['Toy', 'Game', 'Puzzle', 'Board game', 'Video game console'],
  'jouet': ['Toy', 'Doll', 'Action figure'],
  
  // Autre
  'art': ['Sculpture', 'Painting', 'Art', 'Artwork'],
  'collection': ['Antique', 'Collectible']
};

// Fonction pour convertir une image en base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Retirer le préfixe data:image/...;base64,
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Analyser une image avec Google Vision
export async function analyzeImageWithVision(imageFile) {
  if (!GOOGLE_VISION_API_KEY) {
    console.warn('Google Vision API key not configured');
    return { success: false, error: 'API key not configured' };
  }

  try {
    console.log('🔍 Analyse IA en cours...');
    
    // Convertir l'image en base64
    const base64Image = await fileToBase64(imageFile);
    
    // Préparer la requête pour Google Vision
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 20
            },
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            },
            {
              type: 'SAFE_SEARCH_DETECTION'
            },
            {
              type: 'IMAGE_PROPERTIES'
            }
          ]
        }
      ]
    };

    // Appel à l'API Google Vision
    const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.responses[0];

    console.log('🤖 Résultats Vision API:', result);

    return {
      success: true,
      labels: result.labelAnnotations || [],
      objects: result.localizedObjectAnnotations || [],
      safeSearch: result.safeSearchAnnotation || {},
      imageProperties: result.imagePropertiesAnnotation || {}
    };

  } catch (error) {
    console.error('❌ Erreur analyse IA:', error);
    return { success: false, error: error.message };
  }
}

// Vérifier si l'objet correspond à la catégorie déclarée
export function verifyCategoryMatch(visionResults, declaredCategory, declaredType) {
  if (!visionResults.success) {
    return { match: false, confidence: 0, reason: 'Analyse IA échouée' };
  }

  const { labels, objects } = visionResults;
  const allDetections = [
    ...labels.map(l => ({ name: l.description, score: l.score })),
    ...objects.map(o => ({ name: o.name, score: o.score }))
  ];

  // Rechercher les correspondances avec la catégorie déclarée
  const categoryKeywords = CATEGORY_MAPPINGS[declaredCategory.toLowerCase()] || [];
  const typeKeywords = CATEGORY_MAPPINGS[declaredType?.toLowerCase()] || [];
  const allKeywords = [...categoryKeywords, ...typeKeywords];

  let bestMatch = { name: '', score: 0 };
  let matchCount = 0;
  let totalConfidence = 0;

  for (const detection of allDetections) {
    for (const keyword of allKeywords) {
      if (detection.name.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(detection.name.toLowerCase())) {
        matchCount++;
        totalConfidence += detection.score;
        if (detection.score > bestMatch.score) {
          bestMatch = detection;
        }
      }
    }
  }

  const avgConfidence = matchCount > 0 ? totalConfidence / matchCount : 0;
  const match = avgConfidence > 0.5; // Seuil de confiance

  return {
    match,
    confidence: Math.round(avgConfidence * 100),
    bestMatch: bestMatch.name,
    matchCount,
    detectedObjects: allDetections.slice(0, 5).map(d => d.name),
    reason: match 
      ? `Objet détecté: ${bestMatch.name} (${Math.round(bestMatch.score * 100)}% confiance)`
      : `Aucune correspondance trouvée. Détecté: ${allDetections.slice(0, 3).map(d => d.name).join(', ')}`
  };
}

// Vérifier la sécurité de l'image (contenu approprié)
export function verifySafeContent(visionResults) {
  if (!visionResults.success || !visionResults.safeSearch) {
    return { safe: true, confidence: 50, warnings: [] };
  }

  const { safeSearch } = visionResults;
  const warnings = [];
  let riskLevel = 0;

  // Vérifier les différents types de contenu
  const checks = [
    { type: 'adult', level: safeSearch.adult },
    { type: 'violence', level: safeSearch.violence },
    { type: 'racy', level: safeSearch.racy }
  ];

  for (const check of checks) {
    if (check.level === 'LIKELY' || check.level === 'VERY_LIKELY') {
      warnings.push(`Contenu ${check.type} détecté`);
      riskLevel += check.level === 'VERY_LIKELY' ? 2 : 1;
    }
  }

  const safe = riskLevel === 0;
  const confidence = Math.max(0, 100 - (riskLevel * 25));

  return { safe, confidence, warnings };
}

// Score global de vérification IA
export function calculateAIVerificationScore(categoryMatch, safeContent, imageQuality = {}) {
  const weights = {
    category: 0.5,    // 50% - Correspondance catégorie
    safety: 0.3,      // 30% - Sécurité du contenu
    quality: 0.2      // 20% - Qualité de l'image
  };

  let score = 0;
  const details = {};

  // Score de correspondance catégorie
  if (categoryMatch.match) {
    score += categoryMatch.confidence * weights.category / 100;
    details.categoryScore = categoryMatch.confidence;
  } else {
    details.categoryScore = 0;
  }

  // Score de sécurité
  if (safeContent.safe) {
    score += safeContent.confidence * weights.safety / 100;
    details.safetyScore = safeContent.confidence;
  } else {
    details.safetyScore = Math.max(0, safeContent.confidence - 50);
  }

  // Score de qualité (placeholder - peut être enrichi)
  const qualityScore = 75; // Score par défaut
  score += qualityScore * weights.quality / 100;
  details.qualityScore = qualityScore;

  return {
    overallScore: Math.round(score),
    details,
    verified: score >= 60, // Seuil de vérification
    badges: generateVerificationBadges(score, categoryMatch, safeContent)
  };
}

// Générer les badges de vérification
function generateVerificationBadges(score, categoryMatch, safeContent) {
  const badges = [];

  if (score >= 80) badges.push('ai_verified_gold');
  else if (score >= 60) badges.push('ai_verified_silver');
  
  if (categoryMatch.confidence >= 80) badges.push('category_confirmed');
  if (safeContent.safe && safeContent.confidence >= 90) badges.push('content_safe');
  
  return badges;
}

// Version simplifiée pour les tests (sans API externe)
export function mockAIVerification(imageFile, declaredCategory, declaredType) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulation d'analyse IA
      const mockResults = {
        success: true,
        labels: [
          { description: declaredType || 'Object', score: 0.85 + Math.random() * 0.1 },
          { description: 'Product', score: 0.75 + Math.random() * 0.15 },
          { description: 'Item', score: 0.65 + Math.random() * 0.2 }
        ],
        objects: [
          { name: declaredType || declaredCategory, score: 0.8 + Math.random() * 0.15 }
        ],
        safeSearch: {
          adult: 'VERY_UNLIKELY',
          violence: 'UNLIKELY',
          racy: 'VERY_UNLIKELY'
        }
      };

      const categoryMatch = verifyCategoryMatch(mockResults, declaredCategory, declaredType);
      const safeContent = verifySafeContent(mockResults);
      const aiScore = calculateAIVerificationScore(categoryMatch, safeContent);

      resolve({
        ...mockResults,
        verification: {
          categoryMatch,
          safeContent,
          aiScore
        }
      });
    }, 2000); // Simulation d'un délai d'API
  });
}