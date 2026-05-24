import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import {
  formatLocation,
  getDisplayItemType,
  getItemImage,
} from "../utils/format";

const PARIS_AREAS = {
  "paris 1er": [48.864, 2.336],
  "paris 1e": [48.864, 2.336],
  "paris 2e": [48.868, 2.344],
  "paris 3e": [48.863, 2.361],
  "paris 4e": [48.855, 2.357],
  "paris 5e": [48.846, 2.344],
  "paris 6e": [48.849, 2.333],
  "paris 7e": [48.857, 2.312],
  "paris 8e": [48.873, 2.311],
  "paris 9e": [48.876, 2.337],
  "paris 10e": [48.876, 2.36],
  "paris 11e": [48.858, 2.379],
  "paris 12e": [48.84, 2.395],
  "paris 13e": [48.832, 2.356],
  "paris 14e": [48.833, 2.326],
  "paris 15e": [48.842, 2.292],
  "paris 16e": [48.863, 2.276],
  "paris 17e": [48.884, 2.307],
  "paris 18e": [48.892, 2.344],
  "paris 19e": [48.884, 2.383],
  "paris 20e": [48.864, 2.399],
};

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getApproxPosition(item) {
  if (typeof item?.geo?.lat === "number" && typeof item?.geo?.lng === "number") {
    return [item.geo.lat, item.geo.lng];
  }

  if (typeof item?.locationCoords?.lat === "number" && typeof item?.locationCoords?.lng === "number") {
    return [item.locationCoords.lat, item.locationCoords.lng];
  }

  if (typeof item?.lat === "number" && typeof item?.lng === "number") {
    return [item.lat, item.lng];
  }

  const text = normalize(
    item?.arrondissement ||
      item?.locationArea ||
      item?.location ||
      item?.quartier ||
      item?.neighborhood ||
      ""
  );

  const key = Object.keys(PARIS_AREAS).find((area) =>
    text.includes(normalize(area))
  );

  const base = key ? PARIS_AREAS[key] : [48.8566, 2.3522];

  const seed = String(item?.id || item?.title || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return [
    base[0] + ((seed % 17) - 8) * 0.0011,
    base[1] + (((seed * 3) % 17) - 8) * 0.0011,
  ];
}

function createTrocoIcon(item) {
  const image = getItemImage(item);

  const html = image
    ? `
      <div class="troco-map-object">
        <div class="troco-map-object-photo">
          <img src="${image}" alt="" />
        </div>
        <div class="troco-map-object-dot"></div>
      </div>
    `
    : `
      <div class="troco-map-object">
        <div class="troco-map-object-photo troco-map-object-empty">
          <span>📦</span>
        </div>
        <div class="troco-map-object-dot"></div>
      </div>
    `;

  return L.divIcon({
    html,
    className: "troco-map-object-wrapper",
    iconSize: [62, 72],
    iconAnchor: [31, 58],
    popupAnchor: [0, -54],
  });
}

function FitMapToItems({ items }) {
  const map = useMap();

  useEffect(() => {
    if (!items.length) return;

    const bounds = L.latLngBounds(items.map(getApproxPosition));
    map.fitBounds(bounds, {
      padding: [54, 54],
      maxZoom: 14,
      animate: true,
    });
  }, [items, map]);

  return null;
}

function PopupCard({ item }) {
  const navigate = useNavigate();

  const image = getItemImage(item);
  const title = getDisplayItemType(item);
  const location = formatLocation(item);
  const distanceLabel = item.distanceLabel || "";

  return (
    <div className="w-[235px] overflow-hidden rounded-[28px] bg-white text-left">
      <div className="p-3">
        <div className="flex gap-3">
          <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[22px] bg-slate-50">
            {image ? (
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                📦
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="line-clamp-2 text-[15px] font-semibold leading-[1.05] tracking-[-0.025em] text-slate-950">
              {title}
            </p>

            <p className="mt-1.5 truncate text-[12px] font-semibold text-slate-500">
📍 {distanceLabel || location}
            </p>

            <button
              type="button"
              onClick={() => navigate(`/items/${item.id}`)}
              className="mt-3 rounded-full bg-emerald-50 px-3.5 py-2 text-[11.5px] font-black text-emerald-700 transition active:scale-95"
            >
              Voir l’objet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapOverlay({ count }) {
  return (
    <>
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-[3] flex items-start justify-between gap-3">
        <div className="rounded-[26px] border border-white/75 bg-white/82 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">
            Autour de toi
          </p>
          <p className="mt-1 text-[15px] font-black tracking-[-0.025em] text-slate-950">
{count} objet{count > 1 ? "s" : ""} autour de toi
          </p>
        </div>

        <div className="rounded-full border border-white/75 bg-white/82 px-3.5 py-2 text-[12px] font-black text-slate-500 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          Carte douce
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-28 bg-gradient-to-b from-white/72 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-t from-white/82 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-14 bg-gradient-to-r from-white/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-14 bg-gradient-to-l from-white/70 to-transparent" />

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-[3] -translate-x-1/2 rounded-full border border-white/75 bg-white/84 px-4 py-2 text-[12px] font-black text-slate-600 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        Touchez un objet pour le voir
      </div>
    </>
  );
}

export default function TrocoMap({ items = [], className = "" }) {
  const visibleItems = useMemo(() => items.filter((item) => item?.id), [items]);

  return (
    <section
      className={[
        "relative overflow-hidden rounded-[38px] border border-white/80",
        "bg-white/76 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      <div className="relative h-[430px] w-full overflow-hidden rounded-[38px] sm:h-[540px]">
        <MapContainer
          center={[48.8566, 2.3522]}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            attribution=""
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <FitMapToItems items={visibleItems} />

          {visibleItems.map((item) => (
            <Marker
              key={item.id}
              position={getApproxPosition(item)}
              icon={createTrocoIcon(item)}
            >
              <Popup closeButton={false} className="troco-map-popup">
                <PopupCard item={item} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <MapOverlay count={visibleItems.length} />
      </div>

      <style>{`
        .leaflet-container {
          font-family: inherit;
          background: #f7fffb;
        }

        .leaflet-tile {
          filter:
            saturate(0.42)
            contrast(0.86)
            brightness(1.12)
            sepia(0.06)
            hue-rotate(12deg);
        }

        .leaflet-control-container {
          display: none;
        }

        .troco-map-object-wrapper {
          background: transparent;
          border: none;
        }

        .troco-map-object {
          position: relative;
          width: 62px;
          height: 72px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          animation: trocoMapFloat 3.2s ease-in-out infinite;
        }

        .troco-map-object-photo {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.92);
          border: 3px solid rgba(255, 255, 255, 0.96);
          box-shadow:
            0 12px 28px rgba(15, 23, 42, 0.14),
            0 0 0 1px rgba(15, 23, 42, 0.035);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .troco-map-object:hover .troco-map-object-photo {
          transform: translateY(-2px) scale(1.07);
          box-shadow:
            0 18px 38px rgba(15, 23, 42, 0.18),
            0 0 0 1px rgba(16, 185, 129, 0.18);
        }

        .troco-map-object-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .troco-map-object-empty span {
          font-size: 23px;
        }

        .troco-map-object-dot {
          position: absolute;
          bottom: 8px;
          left: 50%;
          width: 13px;
          height: 13px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: linear-gradient(135deg, #22c55e, #06b6d4);
          border: 2px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.24);
        }

        .troco-map-popup .leaflet-popup-content-wrapper {
          border-radius: 30px;
          padding: 0;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.96);
          box-shadow:
            0 24px 70px rgba(15, 23, 42, 0.16),
            0 0 0 1px rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .troco-map-popup .leaflet-popup-content {
          margin: 0;
        }

        .troco-map-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.96);
        }

        @keyframes trocoMapFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </section>
  );
}
