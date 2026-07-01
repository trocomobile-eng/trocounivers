import { useEffect } from "react";

export default function SEOMeta({ title, description }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    return () => {
      document.title = "Troco — l'application de troc local pour échanger des objets sans argent";
    };
  }, [title, description]);

  return null;
}
