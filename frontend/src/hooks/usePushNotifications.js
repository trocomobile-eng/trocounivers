import { useCallback, useEffect, useState } from "react";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const VAPID_KEY =
  "BDW_LcvKpHNXwc5smcuSIx8EPMY8RBoPXnYkacJyxN0pijdep7L7_QQGt3g7L5iYid3dZtbeKghHV9XeIgs8Zgs";

function getInitialPermissionStatus() {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";

  return Notification.permission || "default";
}

export function usePushNotifications(userId) {
  const [pushStatus, setPushStatus] = useState(
    getInitialPermissionStatus
  );

  const enablePushNotifications = useCallback(async () => {
    if (!userId) {
      return false;
    }

    try {
      if (typeof window === "undefined") {
        return false;
      }

      if (!("Notification" in window)) {
        setPushStatus("unsupported");
        return false;
      }

      if (!("serviceWorker" in navigator)) {
        setPushStatus("unsupported");
        return false;
      }

      const supported = await isSupported();

      if (!supported) {
        setPushStatus("unsupported");
        return false;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );

      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();

      setPushStatus(permission);

      if (permission !== "granted") {
        return false;
      }

      const messaging = getMessaging();

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) return false;

      await setDoc(
        doc(db, "users", userId),
        {
          fcmTokens: {
            [token]: true,
          },
          fcmUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.warn("Push notification setup failed:", error);

      return false;
    }
  }, [userId]);

  useEffect(() => {
    let unsubscribe = () => {};

    async function setupForegroundListener() {
      try {
        if (!userId) return;
        if (typeof window === "undefined") return;
        if (!("Notification" in window)) return;
        if (!("serviceWorker" in navigator)) return;

        const supported = await isSupported();

        if (!supported) return;

        const messaging = getMessaging();

        unsubscribe = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};

          if (Notification.permission === "granted") {
            new Notification(title || "Troco", {
              body:
                body || "Tu as une action en attente.",
              icon: "/logo.png",
            });
          }
        });
      } catch (error) {
        console.warn(
          "Push foreground listener failed:",
          error
        );
      }
    }

    setupForegroundListener();

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return {
    pushStatus,
    enablePushNotifications,
  };
}