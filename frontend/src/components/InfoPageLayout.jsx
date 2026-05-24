import BottomNav from "./BottomNav";
import TrocoFooter from "./TrocoFooter";
import TrocoPageHeader from "./TrocoPageHeader";

export default function InfoPageLayout({
  eyebrow,
  title,
  subtitle,
  children,
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_10%,rgba(125,211,252,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(134,239,172,0.16),transparent_34%),radial-gradient(circle_at_50%_92%,rgba(16,185,129,0.08),transparent_40%),linear-gradient(180deg,#f9fffd_0%,#f3fcf8_52%,#ffffff_100%)]">
      <main className="mx-auto max-w-[980px] px-5 pb-36 pt-5">
        <TrocoPageHeader
          showBack
          showLogo
          showAvatar={false}
          showNotifications={false}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
        />

        <section className="mt-6 rounded-[34px] border border-white/80 bg-white/82 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.055)] backdrop-blur-xl sm:p-8">
          <div className="prose prose-slate max-w-none prose-headings:tracking-[-0.035em] prose-headings:text-slate-950 prose-p:text-slate-600 prose-li:text-slate-600">
            {children}
          </div>
        </section>

        <TrocoFooter />
      </main>

      <BottomNav />
    </div>
  );
}
