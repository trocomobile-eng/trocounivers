import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, X, Check } from "lucide-react";

// Fix icône Leaflet par défaut
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const PIN_ICON = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
      { headers: { "Accept-Language": "fr" } }
    );
    const data = await res.json();
    if (data?.display_name) {
      const parts = data.display_name.split(",").slice(0, 3);
      return parts.join(", ").trim();
    }
  } catch {}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function MapPickerModal({ onConfirm, onCancel }) {
  const [pin, setPin]       = useState(null);
  const [address, setAddr]  = useState("");
  const [loading, setLoad]  = useState(false);

  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    setLoad(true);
    setAddr("Recherche de l'adresse…");
    reverseGeocode(pin.lat, pin.lng).then((addr) => {
      if (!cancelled) { setAddr(addr); setLoad(false); }
    });
    return () => { cancelled = true; };
  }, [pin]);

  function confirm() {
    if (!pin) return;
    onConfirm({
      id: `custom-${pin.lat.toFixed(4)}-${pin.lng.toFixed(4)}`,
      name: "Lieu personnalisé",
      title: "Lieu personnalisé",
      address: address || `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`,
      distance: "Lieu choisi sur la carte",
      isPartner: false,
      lat: pin.lat,
      lng: pin.lng,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(10,20,30,0.55)", backdropFilter: "blur(4px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <MapPin size={18} className="text-[#1ABEA3]" strokeWidth={2.3} />
          <p className="text-[16px] font-black text-[#102033]">Choisir sur la carte</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
        >
          <X size={17} />
        </button>
      </div>

      {/* Hint */}
      <div className="bg-[#E8F7EF] px-5 py-2.5 text-center text-[13px] font-semibold text-[#167a58]">
        Appuie sur la carte pour poser un point de rendez-vous
      </div>

      {/* Carte */}
      <div className="flex-1 overflow-hidden">
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={setPin} />
          {pin && <Marker position={[pin.lat, pin.lng]} icon={PIN_ICON} />}
        </MapContainer>
      </div>

      {/* Footer */}
      <div className="bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
        {pin ? (
          <>
            <div className="mb-3 flex items-start gap-2.5 rounded-[14px] bg-[#E8F7EF] px-4 py-3">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#1ABEA3]" strokeWidth={2.2} />
              <p className="text-[13px] font-semibold leading-snug text-[#102033]">
                {loading ? "Recherche de l'adresse…" : address}
              </p>
            </div>
            <button
              type="button"
              onClick={confirm}
              disabled={loading}
              className="troco-primary-btn flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] disabled:opacity-50"
            >
              <Check size={16} strokeWidth={2.5} />
              Confirmer ce lieu
            </button>
          </>
        ) : (
          <p className="text-center text-[13px] font-medium text-slate-400">
            Aucun point sélectionné — appuie sur la carte
          </p>
        )}
      </div>
    </div>
  );
}
