// firebase-messaging-sw.js
// À placer dans /frontend/public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Copie exacte de ta config Firebase (même valeurs que firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyC35vkEGuN04IAW-gnuW-NTEVAIm1CYU6s",
  authDomain: "troco-6c56c.firebaseapp.com",
  projectId: "troco-6c56c",
  storageBucket: "troco-6c56c.firebasestorage.app",
  messagingSenderId: "89375482940",
  appId: "1:89375482940:web:96680ec31c5d7c3892cf39",
});

const messaging = firebase.messaging();

// Gérer les notifications reçues quand l'app est en arrière-plan
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};

  self.registration.showNotification(title || "Troco", {
    body: body || "Tu as une action en attente.",
    icon: "/logo.png",
    badge: "/logo.png",
    data: payload.data,
  });
});

// Clic sur la notification → ouvrir l'app sur la bonne page
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/exchanges";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
