import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminBadge({ className = "" }) {
  return (
    <Link
      to="/admin"
      aria-label="Accéder à l’administration"
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border border-[#BFE9D9] bg-[#EBF8F2] px-2.5 py-1 text-[11px] font-extrabold text-[#08755C] transition hover:border-[#78D7B1] hover:bg-[#DCF4E8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#08755C] ${className}`}
    >
      <ShieldCheck size={13} strokeWidth={2.3} aria-hidden="true" />
      Admin
      <ArrowUpRight size={12} strokeWidth={2.3} aria-hidden="true" />
    </Link>
  );
}
