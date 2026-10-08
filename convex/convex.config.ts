import { defineApp } from "convex/server";
import staticHosting from "@convex-dev/static-hosting/convex.config";

import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);
app.use(staticHosting);
export default app;
