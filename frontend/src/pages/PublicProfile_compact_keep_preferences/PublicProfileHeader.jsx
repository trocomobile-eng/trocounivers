import { CalendarDays, MapPin, MoreHorizontal, Shield, Sparkles, Star, ThumbsUp } from "lucide-react";

import {
  getBio,
  getCompletedExchangeCount,
  getDisplayName,
  getHandle,
  getInitial,
  getLocation,
  getMemberSince,
  getPhoto,
} from "./profileUtils";

function ProfileAvatar({ profile }) {
  const photo = getPhoto(profile);

  return (
    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-[4px] border-white bg-gradient-to-br from-[#E8F4EF] via-[#DDF1EA] to-[#F6EFE5] shadow-[0_12px_28px_rgba(15,23,42,0.10)] sm:h-[86px] sm:w-[86px]">
      {photo ? (
        <img
          src={photo}
          alt={getDisplayName(profile)}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#E6F4EE_42%,#F4EFE4_100%)] text-[26px] font-black text-[#4C7468] sm:text-[32px]">
          {getInitial(profile)}
        </div>
      )}

      <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-[#67C99E] text-white shadow-[0_6px_14px_rgba(103,201,158,0.26)]">
        <Sparkles size={10} strokeWidth={2.5} />
      </span>
    </div>
  );
}

function MiniInfo({ icon: Icon, children, accent = false }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 text-[12.5px] font-bold leading-none",
        accent ? "text-[#0F9F86]" : "text-[#66758A]",
      ].join(" ")}
    >
      {Icon && <Icon size={14} strokeWidth={2.25} className={accent ? "text-[#0F9F86]" : "text-[#66758A]"} />}
      {children}
    </span>
  );
}

function computeReputation(feedbacks = []) {
  if (!feedbacks.length) return null;

  const total = feedbacks.length;

  const positiveOverall = feedbacks.filter(
    (f) => f.answers?.overall === "excellent" || f.answers?.overall === "good"
  ).length;

  const wouldDoAgain = feedbacks.filter(
    (f) => f.answers?.would_do_again === "yes"
  ).length;

  const trustworthy = feedbacks.filter(
    (f) => f.answers?.other_person === "trustworthy" || f.answers?.other_person === "friendly"
  ).length;

  const score = Math.round(((positiveOverall + wouldDoAgain + trustworthy) / (total * 3)) * 100);

  return {
    total,
    score,
    trustworthy: Math.round((trustworthy / total) * 100),
    wouldDoAgain: Math.round((wouldDoAgain / total) * 100),
  };
}

function ReputationLine({ feedbacks = [] }) {
  const rep = computeReputation(feedbacks);

  if (!rep) {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[15px] leading-none text-amber-400">★</span>
        <span className="text-[13px] font-black text-[#081225]">Nouveau profil</span>
      </div>
    );
  }

  const rating = Math.max(3.8, Math.min(5, rep.score / 20)).toFixed(1).replace(".", ",");

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="text-[16px] leading-none text-amber-400">★</span>
      <span className="text-[14px] font-black text-[#081225]">{rating}</span>
      <span className="text-[13px] font-bold text-[#8A96A8]">·</span>
      <span className="text-[13px] font-bold text-[#66758A]">{rep.total} avis</span>
    </div>
  );
}

function TrustBadges({ feedbacks = [] }) {
  const rep = computeReputation(feedbacks);
  if (!rep) return null;

  const badges = [];

  if (rep.score >= 80) badges.push({ label: "Ponctuel", icon: ThumbsUp });
  if (rep.trustworthy >= 70) badges.push({ label: "Fiable", icon: Shield });
  if (rep.wouldDoAgain >= 80) badges.push({ label: "Recommandé", icon: Star });

  if (!badges.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {badges.slice(0, 3).map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-full bg-[#F0FAF7] px-2.5 py-1 text-[11px] font-black text-[#0F9F86]"
        >
          <Icon size={11} strokeWidth={2.4} />
          {label}
        </span>
      ))}
    </div>
  );
}

export default function PublicProfileHeader({ profile, userId, feedbacks = [] }) {
  const completed = getCompletedExchangeCount(profile);
  const bio = getBio(profile);

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-[#ECF4F0] bg-white/[0.94] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_8%,rgba(45,212,191,0.07),transparent_30%),radial-gradient(circle_at_100%_100%,rgba(34,211,238,0.04),transparent_35%)]" />

      <div className="relative">
        <button
          type="button"
          className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#081225] shadow-[0_6px_18px_rgba(15,23,42,0.045)]"
          aria-label="Plus d’options"
        >
          <MoreHorizontal size={17} strokeWidth={2.35} />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <ProfileAvatar profile={profile} />

          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="truncate text-[28px] font-black leading-[0.94] tracking-[-0.055em] text-[#081225] sm:text-[32px]">
              {getDisplayName(profile)}
            </h1>

            <p className="mt-1 truncate text-[14px] font-black text-[#0F9F86]">
              {getHandle(profile, userId)}
            </p>

            <ReputationLine feedbacks={feedbacks} />

            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <MiniInfo icon={MapPin}>{getLocation(profile)}</MiniInfo>
              <span className="text-[12px] font-bold text-[#A0AABA]">·</span>
              <MiniInfo accent>{completed} échanges</MiniInfo>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <MiniInfo icon={CalendarDays}>{getMemberSince(profile)} sur Troco</MiniInfo>
            </div>
          </div>
        </div>

        {bio && (
          <p className="mt-3 line-clamp-2 text-[14px] font-medium leading-relaxed text-[#4D5E6B]">
            {bio}
          </p>
        )}

        <TrustBadges feedbacks={feedbacks} />
      </div>
    </section>
  );
}
