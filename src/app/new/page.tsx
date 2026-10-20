/**
 * NEW POST PAGE (/new), login required
 *
 * A thin wrapper: the real form is the NewPostForm component. This page only
 * picks the starting lane from the URL (/new?kind=activity, used by the Home
 * page buttons) and passes along any error message from a failed submit.
 */
import { createPost } from "@/app/actions";
import { NewPostForm } from "@/components/NewPostForm";
import type { Kind } from "@/lib/types";

export default function NewPostPage({ searchParams }: { searchParams: { kind?: string; error?: string } }) {
  // Only accept the three real kinds; anything else falls back to "skill".
  const kind = (["skill", "activity", "request"].includes(searchParams.kind ?? "") ? searchParams.kind : "skill") as Kind;
  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">
      <div className="text-teal font-bold text-sm tracking-wider">NEW POST</div>
      <h1 className="font-serif text-4xl md:text-5xl mt-1 mb-6">What kind of test run?</h1>
      <NewPostForm action={createPost} initialKind={kind} error={searchParams.error} />
    </div>
  );
}
