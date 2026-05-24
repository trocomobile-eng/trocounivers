import { useNavigate } from "react-router-dom";

export default function TrocoLogo({
  className = "",
  clickable = true,
  to = "/feed",
  widthClass = "w-[210px] max-w-[58vw] md:w-[230px] lg:w-[248px]",
}) {
  const navigate = useNavigate();

  const logo = (
    <img
      src="/logo.png"
      alt="Troco"
      className={["h-auto object-contain", widthClass, className].join(" ")}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );

  if (!clickable) return logo;

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="shrink-0 transition active:scale-60"
      aria-label="Accueil Troco"
    >
      {logo}
    </button>
  );
}
