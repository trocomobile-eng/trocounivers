import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, BellOff, ChevronRight, FileText, Lock, LogOut, Mail, Shield, UserRound } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { usePushNotifications } from "../hooks/usePushNotifications";

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">
        {title}
      </p>
      <div className="overflow-hidden rounded-[18px] border border-[#E8F1ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
        {children}
      </div>
    </section>
  );
}

function Row({ icon: Icon, label, sublabel, to, onClick, danger = false, rightEl }) {
  const inner = (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <span className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full", danger ? "bg-rose-50 text-rose-500" : "bg-[#F0FAF7] text-[#1ABEA3]"].join(" ")}>
        <Icon size={16} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className={["text-[14px] font-extrabold", danger ? "text-rose-500" : "text-[#0d1b2a]"].join(" ")}>{label}</p>
        {sublabel && <p className="mt-0.5 text-[11px] font-medium text-[#94a3b8]">{sublabel}</p>}
      </div>
      {rightEl || (!onClick && to && <ChevronRight size={15} strokeWidth={2.3} className="shrink-0 text-[#94a3b8]" />)}
    </div>
  );

  const base = "block w-full border-b border-[#F0F5F3] last:border-0 text-left transition hover:bg-[#F8FDFB] active:bg-[#F0FAF7]";

  if (to) return <Link to={to} className={base}>{inner}</Link>;
  return <button type="button" onClick={onClick} className={base}>{inner}</button>;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const { pushStatus, enablePushNotifications } = usePushNotifications(user?.uid);
  const [enabling, setEnabling] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  async function handleEnablePush() {
    if (pushStatus === "denied") {
      showToast({ icon: "info", title: "Notifications bloquées", text: "Autorise dans les réglages de ton navigateur." });
      return;
    }
    setEnabling(true);
    const ok = await enablePushNotifications();
    setEnabling(false);
    if (ok) showToast({ icon: "success", title: "Notifications activées !", text: "Tu seras alerté en temps réel." });
  }

  const pushLabel = pushStatus === "granted"
    ? "Notifications activées"
    : pushStatus === "denied"
    ? "Notifications bloquées"
    : enabling ? "Activation…" : "Activer les notifications push";

  const pushSub = pushStatus === "granted"
    ? "Tu reçois les alertes en temps réel"
    : pushStatus === "denied"
    ? "Autorise dans les réglages du navigateur"
    : "Sois alerté pour tes trocs et messages";

  return (
    <div className="mx-auto max-w-[540px] px-4 pb-20 pt-6 lg:pt-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4ECE8] bg-white text-[#0d1b2a] shadow-sm transition hover:bg-[#F5F5F3] lg:hidden"
        >
          ←
        </button>
        <h1 className="text-[24px] font-black tracking-[-0.04em] text-[#0d1b2a]">Paramètres</h1>
      </div>

      {/* Compte */}
      <Section title="Compte">
        <Row
          icon={UserRound}
          label="Modifier le profil"
          sublabel={user?.displayName || user?.email || ""}
          to="/profile/edit"
        />
        <Row
          icon={Mail}
          label="Adresse e-mail"
          sublabel={user?.email || "—"}
          onClick={() => {}}
          rightEl={<span className="text-[11px] font-bold text-[#94a3b8]">{user?.email}</span>}
        />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row
          icon={pushStatus === "granted" ? Bell : BellOff}
          label={pushLabel}
          sublabel={pushSub}
          onClick={pushStatus === "granted" ? undefined : handleEnablePush}
          rightEl={
            pushStatus === "granted"
              ? <span className="rounded-full bg-[#F0FAF7] px-2.5 py-1 text-[10px] font-black text-[#1ABEA3]">Activé</span>
              : pushStatus === "denied"
              ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-500">Bloqué</span>
              : null
          }
        />
      </Section>

      {/* Légal */}
      <Section title="Informations légales">
        <Row icon={FileText} label="Conditions d'utilisation" to="/terms" />
        <Row icon={Lock} label="Confidentialité" to="/privacy" />
        <Row icon={Shield} label="Mentions légales" to="/mentions" />
      </Section>

      {/* Compte — danger */}
      <Section title="Session">
        <Row
          icon={LogOut}
          label="Se déconnecter"
          onClick={handleLogout}
          danger
        />
      </Section>

      <p className="mt-4 text-center text-[11px] font-medium text-[#94a3b8]">
        Troco v1.0 · © 2025
      </p>
    </div>
  );
}
