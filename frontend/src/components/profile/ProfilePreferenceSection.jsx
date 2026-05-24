import { getTradePreferences, normalizePreferenceLabel } from "./profileUtils";

function Capsule({ children, muted = false }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-4 py-2.5 text-[14px] font-bold",
        muted
          ? "bg-[#F4F4F1] text-slate-500"
          : "bg-[#EEF7F2] text-[#315F51]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function ProfilePreferenceSection({ profile, onPropose }) {
  const preferences = getTradePreferences(profile || {});
  const isEmpty =
    preferences.lookingFor.length === 0 &&
    preferences.notLookingFor.length === 0 &&
    preferences.universe.length === 0 &&
    !preferences.note;

  // Sur un profil public (onPropose fourni) : afficher même si vide
  // Sur son propre profil sans onPropose : masquer si vide
  if (isEmpty && !onPropose) {
    return null;
  }

  if (isEmpty && onPropose) {
    return (
      <section className="rounded-[36px] border border-[#ECF4F0] bg-white/[0.92] p-6 shadow-[0_16px_46px_rgba(15,23,42,0.055)]">
        <p className="text-[12px] font-black uppercase tracking-[0.20em] text-[#4B9D8D]">
          Son univers
        </p>
        <h2 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.055em] text-[#081225]">
          Ce qu'il recherche
        </h2>
        <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-400">
          Cet utilisateur n'a pas encore renseigné ses préférences d'échange.
        </p>
        <button
          type="button"
          onClick={onPropose}
          className="mt-6 rounded-full bg-[#1f8f7b] px-5 py-3 text-[14px] font-black text-white shadow-[0_10px_24px_rgba(31,143,123,0.12)]"
        >
          Proposer un objet quand même
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[36px] border border-[#ECF4F0] bg-white/[0.92] p-6 shadow-[0_16px_46px_rgba(15,23,42,0.055)]">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.20em] text-[#4B9D8D]">
            Son univers
          </p>

          <h2 className="mt-3 text-[28px] font-black leading-tight tracking-[-0.055em] text-[#081225]">
            Ce qu'il recherche
          </h2>

          {preferences.lookingFor.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
              {preferences.lookingFor.map((tag) => (
                <Capsule key={tag}>{normalizePreferenceLabel(tag)}</Capsule>
              ))}
            </div>
          )}

          {preferences.universe.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Son univers
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {preferences.universe.slice(0, 6).map((tag) => (
                  <Capsule key={tag}>{tag}</Capsule>
                ))}
              </div>
            </div>
          )}

          {preferences.note && (
            <p className="mt-5 max-w-[560px] text-[15px] font-medium leading-relaxed text-slate-500">
              {preferences.note}
            </p>
          )}
        </div>

        {preferences.notLookingFor.length > 0 && (
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.20em] text-slate-400">
              Évite plutôt
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {preferences.notLookingFor.map((tag) => (
                <Capsule key={tag} muted>
                  {tag}
                </Capsule>
              ))}
            </div>
          </div>
        )}
      </div>

      {onPropose && (
        <button
          type="button"
          onClick={onPropose}
          className="mt-7 rounded-full bg-[#1f8f7b] px-5 py-3 text-[14px] font-black text-white shadow-[0_10px_24px_rgba(31,143,123,0.12)]"
        >
          Proposer un objet
        </button>
      )}
    </section>
  );
}