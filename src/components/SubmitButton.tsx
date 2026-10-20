"use client";
/**
 * SUBMIT BUTTON WITH A LOADING STATE
 *
 * Put inside any <form>. While the form is being sent it disables itself and
 * swaps its text (e.g. "Post it" -> "Posting..."). That gives the user feedback
 * and stops accidental double-submits like joining twice.
 */
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary", pendingText = "Working…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingText : children}
    </button>
  );
}
