import Link from "next/link";
import { signUp } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Track } from "@/components/Logo";

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10 items-center">
      <div className="hidden md:block bg-teal text-white rounded-[28px] p-10">
        <h2 className="font-serif text-5xl leading-tight mb-4">Take your first test run.</h2>
        <p className="text-[#E3F2EF] mb-8">Free to join. Everyone is verified, so you know who you are meeting.</p>
        <Track width={300} />
      </div>
      <div>
        <div className="flex gap-2 mb-6">
          <span className="chip-on">Sign up</span>
          <Link href="/login" className="chip">Log in</Link>
        </div>
        <h1 className="font-serif text-4xl mb-5">Create your account</h1>
        {searchParams.error && <p className="bg-coral-light text-coral-dark rounded-xl p-3 mb-4">{searchParams.error}</p>}
        <form action={signUp} className="space-y-4">
          <div><label className="label" htmlFor="full_name">Full name</label><input className="input" id="full_name" name="full_name" required /></div>
          <div><label className="label" htmlFor="email">School email</label><input className="input" id="email" name="email" type="email" required placeholder="you@uncg.edu" /></div>
          <div><label className="label" htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" minLength={8} required /></div>
          <p className="text-sm text-muted">We send a confirmation email. Phone verification and photos are on the roadmap.</p>
          <SubmitButton className="btn-primary w-full" pendingText="Creating…">Create account</SubmitButton>
        </form>
      </div>
    </div>
  );
}
