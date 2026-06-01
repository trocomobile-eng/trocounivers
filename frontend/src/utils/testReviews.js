// Utilitaire pour créer des données de test du système de confiance
import { collection, addDoc, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Créer un utilisateur test avec réputation
export async function createTestUser(userId, userData) {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      uid: userId,
      userId: userId,
      createdAt: serverTimestamp(),
      reputation: {
        averageRating: 0,
        totalReviews: 0,
        totalExchanges: 0,
        badges: [],
        trustScore: 0
      }
    }, { merge: true });
    console.log(`✅ Utilisateur test ${userId} créé`);
    return true;
  } catch (error) {
    console.error("❌ Erreur création utilisateur:", error);
    throw error;
  }
}

// Créer des avis test
export async function createTestReviews() {
  const testReviews = [
    {
      fromUserId: "testuser1",
      toUserId: "testuser2", 
      rating: 5,
      comment: "Échange parfait ! Personne très sympa et ponctuelle. L'objet était en excellent état comme décrit.",
      tags: ["ponctuel", "sympathique", "objet_conforme"],
      exchangeId: "exchange1",
      createdAt: serverTimestamp(),
      isVisible: true
    },
    {
      fromUserId: "testuser3",
      toUserId: "testuser2",
      rating: 4,
      comment: "Très bon échange, communication fluide et rapide.",
      tags: ["bon_communicant", "rapide"],
      exchangeId: "exchange2", 
      createdAt: serverTimestamp(),
      isVisible: true
    },
    {
      fromUserId: "testuser4",
      toUserId: "testuser2",
      rating: 5,
      comment: "Super expérience ! Je recommande vivement.",
      tags: ["sympathique", "professionnel", "objet_conforme"],
      exchangeId: "exchange3",
      createdAt: serverTimestamp(), 
      isVisible: true
    },
    {
      fromUserId: "testuser5",
      toUserId: "testuser2",
      rating: 4,
      comment: "Échange correct, rien à redire.",
      tags: ["soigneux"],
      exchangeId: "exchange4",
      createdAt: serverTimestamp(),
      isVisible: true
    },
    {
      fromUserId: "testuser6",
      toUserId: "testuser2",
      rating: 5,
      comment: "Excellent ! Très flexible sur les horaires et très arrangeant.",
      tags: ["flexible", "sympathique", "ponctuel"],
      exchangeId: "exchange5",
      createdAt: serverTimestamp(),
      isVisible: true
    }
  ];

  try {
    for (const review of testReviews) {
      await addDoc(collection(db, "reviews"), review);
    }
    console.log("Avis test créés avec succès");
  } catch (error) {
    console.error("Erreur création avis:", error);
  }
}

// Créer des avis fictifs pour un utilisateur spécifique
async function createTestReviewsForUser(userId, currentUser) {
  console.log("📝 Création des avis fictifs...");
  
  // Simuler la réputation directement dans le profil utilisateur
  // au lieu de créer de vrais avis (problème de permissions)
  
  const mockReputation = {
    averageRating: 4.6,
    totalReviews: 5,
    totalExchanges: 6,
    badges: ["trusted_trader", "experienced", "fast_responder", "reliable"],
    trustScore: 87,
    lastUpdated: new Date()
  };

  const mockReviews = [
    {
      id: "mock-1",
      rating: 5,
      comment: "Échange parfait ! Personne très sympa et ponctuelle. L'objet était en excellent état comme décrit.",
      tags: ["ponctuel", "sympathique", "objet_conforme"],
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 semaine
      fromUserName: "Alice Martin"
    },
    {
      id: "mock-2",
      rating: 4,
      comment: "Très bon échange, communication fluide et rapide.",
      tags: ["bon_communicant", "rapide"],
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 semaines
      fromUserName: "Claire Dubois"
    },
    {
      id: "mock-3",
      rating: 5,
      comment: "Super expérience ! Je recommande vivement.",
      tags: ["sympathique", "professionnel", "objet_conforme"],
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 semaines
      fromUserName: "David Moreau"
    },
    {
      id: "mock-4",
      rating: 4,
      comment: "Échange correct, rien à redire.",
      tags: ["soigneux"],
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 4 semaines
      fromUserName: "Emma Rousseau"
    },
    {
      id: "mock-5",
      rating: 5,
      comment: "Excellent ! Très flexible sur les horaires et très arrangeant.",
      tags: ["flexible", "sympathique", "ponctuel"],
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 5 semaines
      fromUserName: "Frank Laurent"
    }
  ];

  try {
    // Mettre à jour le profil utilisateur avec la réputation et les avis fictifs
    await setDoc(doc(db, "users", userId), {
      reputation: mockReputation,
      mockReviews: mockReviews, // Stockage temporaire des avis fictifs
      testDataCreated: new Date()
    }, { merge: true });
    
    console.log("⭐ Réputation fictive créée pour l'utilisateur");
  } catch (error) {
    console.error("❌ Erreur création réputation:", error);
    throw error;
  }
}

// Créer des données de test avec l'utilisateur connecté
export async function setupTestDataWithCurrentUser(currentUser) {
  console.log("🚀 Création des données de test pour:", currentUser.uid);
  console.log("📋 User info:", { 
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName 
  });
  
  try {
    console.log("📝 Étape 1: Mise à jour du profil utilisateur...");
    
    // Mettre à jour le profil de l'utilisateur connecté
    await setDoc(doc(db, "users", currentUser.uid), {
      displayName: currentUser.displayName || "Utilisateur Test",
      email: currentUser.email,
      photoURL: currentUser.photoURL,
      bio: "Profil de test pour le système de réputation",
      location: "Paris 10e",
      uid: currentUser.uid,
      userId: currentUser.uid,
      reputation: {
        averageRating: 0,
        totalReviews: 0,
        totalExchanges: 0,
        badges: [],
        trustScore: 0
      }
    }, { merge: true });

    console.log("✅ Profil utilisateur mis à jour");

    console.log("⭐ Étape 2: Création des avis fictifs...");
    
    // Créer des avis fictifs pour cet utilisateur
    await createTestReviewsForUser(currentUser.uid, currentUser);
    
    console.log("🎉 Données de test créées ! Visitez votre profil pour voir le système de réputation");
    return currentUser.uid;
    
  } catch (error) {
    console.error("❌ Erreur détaillée:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

// Créer des utilisateurs de test
export async function setupTestData() {
  console.log("🚀 Création des données de test...");
  
  const testUsers = [
    {
      id: "testuser1",
      data: {
        displayName: "Alice Martin",
        email: "alice@test.com",
        photoURL: null,
        bio: "Amatrice de vintage et objets uniques",
        location: "Paris 11e"
      }
    },
    {
      id: "testuser2", 
      data: {
        displayName: "Bob Dupont",
        email: "bob@test.com",
        photoURL: null,
        bio: "Passionné de tech et gadgets électroniques",
        location: "Paris 10e"
      }
    },
    {
      id: "testuser3",
      data: {
        displayName: "Claire Dubois",
        email: "claire@test.com", 
        photoURL: null,
        bio: "Fan de livres et objets déco",
        location: "Paris 17e"
      }
    },
    {
      id: "testuser4",
      data: {
        displayName: "David Moreau",
        email: "david@test.com",
        photoURL: null,
        bio: "Collectionneur de vinyls",
        location: "Paris 18e"
      }
    },
    {
      id: "testuser5",
      data: {
        displayName: "Emma Rousseau", 
        email: "emma@test.com",
        photoURL: null,
        bio: "Créatrice artisanale",
        location: "Paris 3e"
      }
    },
    {
      id: "testuser6",
      data: {
        displayName: "Frank Laurent",
        email: "frank@test.com",
        photoURL: null,
        bio: "Amateur de sport et équipements outdoor",
        location: "Paris 15e"
      }
    }
  ];

  try {
    // Créer les utilisateurs un par un
    console.log("📝 Création des utilisateurs...");
    for (const user of testUsers) {
      await createTestUser(user.id, user.data);
      // Petite pause pour éviter les conflits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("⭐ Création des avis...");
    // Créer les avis
    await createTestReviews();
    
    console.log("✅ Données de test créées ! Visitez /users/testuser2 pour voir le système de réputation");
    
    // Vérification
    console.log("🔍 Vérification: testuser2 devrait être accessible sur /users/testuser2");
    
  } catch (error) {
    console.error("❌ Erreur lors de la création:", error);
    throw error;
  }
}

// Nettoyer les données de test
export async function cleanupTestData() {
  // Cette fonction nécessiterait d'implémenter la suppression
  // Pour l'instant, on peut supprimer manuellement depuis la console Firebase
  console.log("Nettoyage manuel requis depuis la console Firebase");
}