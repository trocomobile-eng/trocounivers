import { useCallback, useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export function useGeolocation(uid) {
  const [status, setStatus] = useState("unknown"); // 'granted' | 'denied' | 'prompt' | 'unknown'
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // navigator.permissions.query for geolocation not supported on iOS Safari
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    if (!navigator.permissions || isIOS) return;
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      setStatus(result.state);
      result.onchange = () => setStatus(result.state);
    }).catch(() => {});
  }, []);

  const request = useCallback(() => {
    if (!navigator.geolocation) return Promise.resolve(false);
    setRequesting(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (uid) {
            try {
              await setDoc(
                doc(db, "users", uid),
                { locationEnabled: true, location: loc, locationUpdatedAt: new Date() },
                { merge: true }
              );
            } catch {}
          }
          setStatus("granted");
          setRequesting(false);
          resolve(true);
        },
        (err) => {
          setStatus(err.code === 1 ? "denied" : "prompt");
          setRequesting(false);
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    });
  }, [uid]);

  return { status, requesting, request };
}
