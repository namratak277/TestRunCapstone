/**
 * CONVERSATION STARTERS
 *
 * Suggested first messages ("What made you want to learn this skill?") shown
 * in the chat and on the join page, so meeting a stranger is less awkward.
 *
 * If an Anthropic (Claude AI) API key is configured, we ask the AI to write
 * starters tailored to the specific post. Otherwise, or if the AI call fails,
 * we use the built-in lists below. The app works fine either way.
 */
import type { Kind } from "./types";

// Built-in starters for each kind of post, used when AI isn't available.
const FALLBACK: Record<Kind, string[]> = {
  skill: [
    "What made you want to learn this skill?",
    "What is the first thing you want to try?",
    "Is there anything I should know before we start?",
  ],
  activity: [
    "What is the best thing you have seen or done lately?",
    "Have you done this before, or is it your first time?",
    "What are you most looking forward to?",
  ],
  request: [
    "What are you hoping to get out of this?",
    "Is there anything you would like done a certain way?",
    "How did you hear about this?",
  ],
};

// Returns the built-in starters for a kind of post.
export function fallbackStarters(kind: Kind): string[] {
  return FALLBACK[kind] ?? FALLBACK.activity;
}

/** Uses the Anthropic API when ANTHROPIC_API_KEY is set; otherwise returns the built-in list. */
export async function getStarters(input: { title: string; category: string; kind: Kind }): Promise<string[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallbackStarters(input.kind);
  try {
    // Send the post's title, category and kind to Claude and ask for 3 starters as JSON.
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Write 3 short, friendly conversation starters for people who just matched on a meetup post. Post: "${input.title}" (category: ${input.category || "general"}, type: ${input.kind}). Each under 90 characters, no emojis. Reply with only a JSON array of 3 strings.`,
          },
        ],
      }),
      // Cache the answer for an hour so repeat visits don't cost another AI call.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallbackStarters(input.kind);
    // Pull the JSON array out of the AI's reply, even if it added extra words around it.
    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
    if (Array.isArray(arr) && arr.length) return arr.map(String).slice(0, 3);
  } catch {
    // Network error or a malformed reply: fall through to the built-in list.
  }
  return fallbackStarters(input.kind);
}
