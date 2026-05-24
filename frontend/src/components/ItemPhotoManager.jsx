import { useRef } from "react";

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export default function ItemPhotoManager({ images = [], mainImageIndex = 0, onAddFiles, onRemoveImage, onSetMainImage }) {
  const inputRef = useRef(null);
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const safeMainIndex = safeImages[mainImageIndex] ? mainImageIndex : 0;

  return (
    <section className="rounded-[34px] border border-white/80 bg-white/78 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.07)] backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Photos</p>
        <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-slate-950">Photos de l’objet</h2>
        <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500">
          Ajoute plusieurs photos, supprime celles que tu veux et choisis la photo principale.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          onAddFiles?.(files);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-[24px] border border-dashed border-emerald-200 bg-emerald-50/65 px-4 py-5 text-[15px] font-black text-emerald-700 transition active:scale-[0.98]"
      >
        <CameraIcon />
        Ajouter des photos
      </button>

      {safeImages.length === 0 ? (
        <div className="rounded-[26px] bg-slate-50/80 p-6 text-center text-sm font-semibold text-slate-500">Aucune photo pour l’instant.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {safeImages.map((image, index) => {
            const isMain = index === safeMainIndex;

            return (
              <div key={`${image}-${index}`} className={`overflow-hidden rounded-[24px] border bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${isMain ? "border-emerald-300 ring-2 ring-emerald-300/20" : "border-white"}`}>
                <div className="aspect-square bg-slate-50">
                  <img src={image} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                </div>

                <div className="space-y-2 p-2">
                  <button
                    type="button"
                    onClick={() => onSetMainImage?.(index)}
                    className={`w-full rounded-full px-3 py-2 text-[12px] font-black transition active:scale-95 ${isMain ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-600"}`}
                  >
                    {isMain ? "Photo principale" : "Mettre en premier"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveImage?.(index)}
                    className="w-full rounded-full bg-rose-50 px-3 py-2 text-[12px] font-black text-rose-600 transition active:scale-95"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
