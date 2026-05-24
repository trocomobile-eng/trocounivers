import { useEffect, useMemo, useState } from "react";
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
import BottomNav from "../components/BottomNav";
import { TrocoButton, TrocoCard } from "../components/ui";
import PublicProfileHeader from "../components/profile/PublicProfileHeader";
import ProfilePreferenceSection from "../components/profile/ProfilePreferenceSection";
import ProfileLibraryGrid from "../components/profile/ProfileLibraryGrid";
import ProfileAboutSection from "../components/profile/ProfileAboutSection";
import ProfileActivitySection from "../components/profile/ProfileActivitySection";
import {
  belongsToUser,
  formatRelativeTime,
} from "../components/profile/profileUtils";
import { getDisplayItemType } from "../utils/format";

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

  const activities = useMemo(() => {
    const recentItems = items.slice(0, 2).map((item) => ({
      label: `A ajouté ${getDisplayItemType(item) || item.title || "un objet"}`,
      time: formatRelativeTime(item.createdAt || item.updatedAt),
    }));

    return [
      ...recentItems,
      {
        label: "Répond rapidement aux messages",
        time: "aujourd’hui",
      },
    ].slice(0, 3);
  }, [items]);

  if (loading) {
    return (
      <div className="min-h-screen pb-28 text-[#081225]">
        <main className="troco-desktop-page">
          <TrocoCard variant="plain" className="troco-panel p-8 text-center text-sm font-bold text-slate-500">
            Chargement du profil...
          </TrocoCard>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pb-28 text-[#081225]">
        <main className="troco-desktop-page">
          <TrocoCard variant="plain" className="troco-panel p-8 text-center">
            <p className="text-xl font-black text-[#081225]">Profil introuvable.</p>
            <TrocoButton
              variant="primary"
              onClick={() => navigate("/feed")}
              className="mt-5"
            >
              Retour à Explorer
            </TrocoButton>
          </TrocoCard>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 text-[#081225] lg:pb-14">
      <main className="troco-desktop-page">
        <div className="space-y-5">
          <PublicProfileHeader profile={profile} userId={resolvedUserId} feedbacks={feedbacks} />

          <ProfileLibraryGrid profile={profile} items={items} />

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <ProfileActivitySection activities={activities} />
            <ProfileAboutSection profile={profile} />
          </div>

          <ProfilePreferenceSection
            profile={profile}
            onPropose={() => {
              const firstItem = items[0];
              if (firstItem?.id) navigate(`/items/${firstItem.id}/propose`);
              else navigate("/feed");
            }}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
