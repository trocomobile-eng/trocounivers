import { CalendarDays, MapPin, MoreHorizontal, Shield, Sparkles, Star, ThumbsUp, Zap } from "lucide-react";

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
    <div className="relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-full border-[6px] border-white bg-gradient-to-br from-[#E8F4EF] via-[#DDF1EA] to-[#F6EFE5] shadow-[0_22px_46px_rgba(15,23,42,0.10)]">
      {photo ? (
        <img
          src={photo}
          alt={getDisplayName(profile)}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#E6F4EE_42%,#F4EFE4_100%)] text-[46px] font-black text-[#4C7468]">
          {getInitial(profile)}
        </div>
      )}

      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border-[4px] border-white bg-[#67C99E] text-white shadow-[0_8px_18px_rgba(103,201,158,0.28)]">
        <Sparkles size={14} strokeWidth={2.4} />
      </span>
    </div>
  );
}

function MicroInfo({ icon: Icon, strong, muted }) {
  return (
    <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#65747B]">
      <Icon size={16} strokeWidth={2.15} className="text-[#4B9D8D]" />
      <span className="font-black text-[#081225]">{strong}</span>
      {muted && <span>{muted}</span>}
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
    score,         // % de satisfaction global
    trustworthy: Math.round((trustworthy / total) * 100),
    wouldDoAgain: Math.round((wouldDoAgain / total) * 100),
  };
}

function ReputationBadges({ feedbacks }) {
  const rep = computeReputation(feedbacks);

  if (!rep) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {rep.score >= 80 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-black text-emerald-700">
          <ThumbsUp size={13} strokeWidth={2.4} />
          {rep.score} % positif
        </span>
      )}
      {rep.trustworthy >= 70 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-[12px] font-black text-sky-700">
          <Shield size={13} strokeWidth={2.4} />
          De confiance
        </span>
      )}
      {rep.wouldDoAgain >= 80 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-black text-amber-700">
          <Star size={13} strokeWidth={2.4} />
          Recommandé
        </span>
      )}
      {rep.total >= 5 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[12px] font-black text-slate-500">
          {rep.total} avis
        </span>
      )}
    </div>
  );
}

export default function PublicProfileHeader({ profile, userId, feedbacks = [] }) {
  const completed = getCompletedExchangeCount(profile);

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-[#ECF4F0] bg-white/[0.92] p-8 shadow-[0_20px_60px_rgba(15,23,42,0.065)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_12%,rgba(45,212,191,0.08),transparent_32%),radial-gradient(circle_at_100%_100%,rgba(34,211,238,0.05),transparent_35%)]" />

      <div className="relative">
        <div className="flex justify-end">
          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#081225] shadow-[0_8px_24px_rgba(15,23,42,0.045)]"
            aria-label="Plus d’options"
          >
            <MoreHorizontal size={22} strokeWidth={2.35} />
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[152px_1fr] lg:items-center">
          <ProfileAvatar profile={profile} />

          <div className="min-w-0">
            <h1 className="text-[46px] font-black leading-[0.94] tracking-[-0.06em] text-[#081225]">
              {getDisplayName(profile)}
            </h1>

            <p className="mt-2 text-[15px] font-black text-[#2F9A82]">
              {getHandle(profile, userId)}
            </p>

            <p className="mt-4 flex items-center gap-2 text-[15px] font-bold text-[#60737A]">
              <MapPin size={17} className="text-[#4B9D8D]" />
              {getLocation(profile)}
            </p>

            <p className="mt-5 max-w-[540px] text-[18px] font-medium leading-relaxed text-[#283A46]">
              {getBio(profile)}
            </p>

            <ReputationBadges feedbacks={feedbacks} />
          </div>
        </div>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 rounded-[28px] border border-white/80 bg-white/82 px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
          <MicroInfo icon={Sparkles} strong={`${completed}`} muted="échanges réalisés" />
          <span className="hidden h-5 w-px bg-slate-200 md:block" />
          <MicroInfo icon={Zap} strong="Répond rapidement" />
          <span className="hidden h-5 w-px bg-slate-200 md:block" />
          <MicroInfo icon={CalendarDays} strong={getMemberSince(profile)} muted="sur Troco" />
        </div>
      </div>
    </section>
  );
}
