import Link from "next/link";
import { ThumbsUp, MapPin } from "lucide-react";
import type { Report } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { CategoryChip, SeverityDots, StatusBadge } from "./ui";

export default function ReportCard({ report }: { report: Report }) {
  const meta = CATEGORY_META[report.category];
  return (
    <Link
      href={`/report/${report.id}`}
      className="card card-hover group flex min-w-0 gap-3 overflow-hidden p-3"
    >
      <div
        className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${report.imagePlaceholder} text-2xl shadow-inner sm:h-20 sm:w-20 sm:text-3xl`}
      >
        <span aria-hidden>{meta.emoji}</span>
        {report.mediaType === "video" && (
          <span className="absolute bottom-1 right-1 p-0.5 bg-slate-950/75 rounded text-white text-[9px] leading-none select-none scale-90 origin-bottom-right shadow-sm border border-white/10">
            📹
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-slate-800 group-hover:text-brand-600 transition">
              {report.title}
            </h3>
            <span className="shrink-0 text-[10px] text-slate-400 font-medium">
              {timeAgo(report.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin size={11} className="shrink-0 text-slate-400" />
            <span className="truncate">{report.addressText}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <StatusBadge status={report.status} />
          <CategoryChip category={report.category} />
          <SeverityDots value={report.severity} />
          {report.upvoteCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold ml-1">
              <ThumbsUp size={10} /> {report.upvoteCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
