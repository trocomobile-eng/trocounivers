const MAX_SIZE = 1200;   // px max côté long
const QUALITY  = 0.82;  // qualité JPEG

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width >= height) {
          height = Math.round((height * MAX_SIZE) / width);
          width  = MAX_SIZE;
        } else {
          width  = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Compression échouée")); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image invalide")); };
    img.src = url;
  });
}
