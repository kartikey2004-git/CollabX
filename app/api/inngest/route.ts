import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// Inngest calls back into this one route to run any registered function — this is the entire
// "worker," no separate long-running process needed. GET is used by the local Inngest Dev Server
// (`npx inngest-cli@latest dev`) to discover registered functions; POST executes a function step;
// PUT registers this app's function list with Inngest (Cloud or the dev server) on deploy/startup.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],
});
