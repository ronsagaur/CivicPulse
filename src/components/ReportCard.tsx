import Image from "next/image";
import Link from "next/link";
import { ThumbsUp, MapPin } from "lucide-react";
import type { Report } from "@/lib/types";
import { CATEGORY_META } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { CategoryChip, SeverityDots, StatusBadge } from "./ui";

export default function ReportCard({ report }: { report: Report }) {
  const meta = CATEGORY_META[report.category] ?? CATEGORY_META.OTHER;
  return (
    <Link
      href={`/report/${report.id}`}
      className="card card-hover group flex flex-col min-w-0 overflow-hidden bg-white"
    >
      {/* Full bleed diorama header */}
      <div className={`relative h-56 w-full shrink-0 overflow-hidden bg-gradient-to-br ${report.imagePlaceholder} border-b border-dashed border-slate-200/60`}>
        <Image
          src={meta.iconPath}
          alt={meta.label}
          fill
          sizes="(max-width: 640px) 100vw, 400px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority={true}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/5 pointer-events-none" />
        
        {/* Layered badges over diorama */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <StatusBadge status={report.status} />
        </div>
        <div className="absolute top-3 right-3">
          <SeverityDots value={report.severity} />
        </div>
        
        {report.mediaType === "video" && (
          <span className="absolute bottom-3 right-3 p-1.5 bg-slate-950/75 rounded-md text-white text-[10px] uppercase font-bold tracking-widest leading-none shadow-sm backdrop-blur-sm">
            Video attached
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-brand-600 transition leading-tight mb-2">
          {report.title}
        </h3>
        <div className="flex items-start gap-1.5 text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
          <MapPin size={14} className="shrink-0 text-slate-400 mt-0.5" />
          <span>{report.addressText}</span>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <CategoryChip category={report.category} />
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium tracking-wide">
            <span>{timeAgo(report.createdAt)}</span>
            {report.upvoteCount > 0 && (
              <span className="flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ThumbsUp size={12} /> {report.upvoteCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
