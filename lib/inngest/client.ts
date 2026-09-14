import { Inngest } from "inngest";

// The single Inngest client, shared by the function definitions (lib/inngest/functions.ts) and by
// anywhere in the app that sends an event (lib/inngest/events.ts). `id` is this app's stable
// identifier in the Inngest dashboard/dev server — not a per-environment value.
export const inngest = new Inngest({ id: "collabx" });
