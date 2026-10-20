import Link from "next/link";
import type { Post } from "@/lib/types";
import { KIND_LABEL } from "@/lib/types";
import { priceText, spotsText, fmtDateTime } from "@/lib/format";
import { SpotsBar } from "./SpotsBar";

export function PostCard({ post, highlight }: { post: Post; highlight?: boolean }) {
  const booked = post.status === "booked";
  const first = post.post_times?.slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const kindTag = post.kind === "activity" ? "bg-teal-light text-teal-dark" : "bg-coral-light text-coral-dark";
  return (
    <Link
      href={`/posts/${post.id}`}
      className={`block no-underline rounded-[22px] p-5 border ${
        booked ? "bg-navy text-white border-navy" : "bg-white text-navy border-line hover:border-teal"
      } ${highlight ? "border-2 border-teal" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${booked ? "bg-coral text-navy" : kindTag}`}>
          {booked ? "Booked" : KIND_LABEL[post.kind]}
        </span>
        <span className={`text-sm ${booked ? "text-[#D7E4E1]" : "text-muted"}`}>{priceText(post)}</span>
      </div>
      <div className="font-serif text-[23px] leading-tight mt-3 mb-1">{post.title}</div>
      <div className={`text-[15px] ${booked ? "text-[#D7E4E1]" : "text-muted"}`}>
        {[post.location, first && fmtDateTime(first.starts_at), post.post_times && post.post_times.length > 1 ? `${post.post_times.length} time options` : null]
          .filter(Boolean)
          .join(" · ")}
      </div>
      <SpotsBar filled={post.spots_filled} capacity={post.capacity} booked={booked} />
      <div className="flex items-center justify-between text-sm font-bold">
        <span className={booked ? "text-coral" : "text-teal-dark"}>{spotsText(post)}</span>
        <span className={booked ? "text-white" : "text-teal"}>{booked ? "See similar posts" : "View post"}</span>
      </div>
    </Link>
  );
}
