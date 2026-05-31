import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import PublicProfileHeader from "../components/profile/PublicProfileHeader";
import ProfilePreferenceSection from "../components/profile/ProfilePreferenceSection";
import ProfileLibraryGrid from "../components/profile/ProfileLibraryGrid";
import ProfileAboutSection from "../components/profile/ProfileAboutSection";
import {
  belongsToUser,
} from "../components/profile/profileUtils";

export default function UserProfilePage() {
  const { userId, id } = useParams();
  const resolvedUserId = userId || id;
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!resolvedUserId) return;

      setLoading(true);

      try {
        const profileSnapshot = await getDoc(doc(db, "users", resolvedUserId));
        const loadedProfile = profileSnapshot.exists()
          ? { id: profileSnapshot.id, ...profileSnapshot.data() }
          : null;

        setProfile(loadedProfile);

        const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
        const itemsSnapshot = await getDocs(q);

        const allItems = itemsSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setItems(
          allItems
            .filter((item) => item.status !== "deleted")
            .filter((item) => belongsToUser(item, resolvedUserId, loadedProfile?.email))
        );

        // Charger les feedbacks reçus sur cet utilisateur
        try {
          const feedbackQuery = query(
            collection(db, "feedback"),
            where("otherUserId", "==", resolvedUserId)
          );
          const feedbackSnapshot = await getDocs(feedbackQuery);
          setFeedbacks(feedbackSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch {
          // feedback collection peut ne pas exister encore
          setFeedbacks([]);
        }
      } catch (error) {
        console.error("Erreur chargement profil public :", error);
        setProfile(null);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [resolvedUserId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-slate-400">
        Chargement du profil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-[20px] bg-white p-10 text-center shadow-[0_2px_12px_rgba(15,23,42,0.07)]">
        <p className="text-[17px] font-extrabold text-[#0d1b2a]">Profil introuvable.</p>
        <button type="button" onClick={() => navigate("/feed")} className="troco-primary-btn mt-5 rounded-full">
          Retour à Explorer
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
          <PublicProfileHeader profile={profile} userId={resolvedUserId} feedbacks={feedbacks} />

          <ProfileLibraryGrid profile={profile} items={items} />

          <ProfilePreferenceSection
            profile={profile}
            onPropose={() => {
              const firstItem = items[0];
              if (firstItem?.id) navigate(`/items/${firstItem.id}/propose`);
              else navigate("/feed");
            }}
          />

          <ProfileAboutSection profile={profile} />
      </div>
    </>
  );
}
