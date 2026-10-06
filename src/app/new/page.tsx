import { createPost } from "@/app/actions";
import { NewPostForm } from "@/components/NewPostForm";
import type { Kind } from "@/lib/types";

export default function NewPostPage({ searchParams }: { searchParams: { kind?: string; error?: string } }) {
  const kind = (["skill", "activity", "request"].includes(searchParams.kind ?? "") ? searchParams.kind : "skill") as Kind;
  return (
    <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-8">
      <div className="text-teal font-bold text-sm tracking-wider">NEW POST</div>
      <h1 className="font-serif text-4xl md:text-5xl mt-1 mb-6">What kind of test run?</h1>
      <NewPostForm action={createPost} initialKind={kind} error={searchParams.error} />
    </div>
  );
}
