import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import CrocoAvatar from "./CrocoAvatar";
import { DEFAULT_CROCO_AVATAR } from "../../utils/crocoAvatarOptions";

export default function CrocoAvatarDisplay({ size = 72, className = "", fallbackToPhoto = false }) {
  const { user } = useAuth();
  const [avatar, setAvatar] = useState(DEFAULT_CROCO_AVATAR);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        const saved = snapshot.data()?.crocoAvatar;
        if (saved) setAvatar({ ...DEFAULT_CROCO_AVATAR, ...saved });
      },
      () => {}
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (fallbackToPhoto && user?.photoURL) {
    return <img src={user.photoURL} alt="Profil" className={["h-full w-full object-cover", className].join(" ")} />;
  }

  return <CrocoAvatar avatar={avatar} size={size} className={className} />;
}
