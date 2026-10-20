import Link from "next/link";
import { signIn } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Track } from "@/components/Logo";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; msg?: string; next?: string } }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10 items-center">
      <div className="hidden md:block bg-teal text-white rounded-[28px] p-10">
        <h2 className="font-serif text-5xl leading-tight mb-4">Welcome back.</h2>
        <p className="text-[#E3F2EF] mb-8">Your next test run is waiting.</p>
        <Track width={300} />
      </div>
      <div>
        <div className="flex gap-2 mb-6">
          <Link href="/signup" className="chip">Sign up</Link>
          <span className="chip-on">Log in</span>
        </div>
        <h1 className="font-serif text-4xl mb-5">Log in</h1>
        {searchParams.msg && <p className="bg-teal-light text-teal-dark rounded-xl p-3 mb-4">{searchParams.msg}</p>}
        {searchParams.error && <p className="bg-coral-light text-coral-dark rounded-xl p-3 mb-4">{searchParams.error}</p>}
        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={searchParams.next ?? "/"} />
          <div><label className="label" htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" required placeholder="you@uncg.edu" /></div>
          <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" required /></div>
          <SubmitButton className="btn-primary w-full" pendingText="Logging in…">Log in</SubmitButton>
        </form>
      </div>
    </div>
  );
}
