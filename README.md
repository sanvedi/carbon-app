# Carbon app

Single-page shopper comparison built with React/Vite and Convex. Enter two exact products to research public carbon footprint reports, see source-backed kg CO2e figures and a one-sentence recommendation. Unverified figures become "no reliable data for this one". No sign-in.

Install with npm ci. Run with npm run dev; use npx convex dev separately for backend development. Verify with npm run typecheck, npm run build and node --test tests/*.test.* (Node 24). Publish only this project with npm run deploy; GitHub pushes do not deploy. Check the live comparison with node scripts/check-live.cjs --require-comparison.

Set OPENAI_API_KEY only in this project's Convex dashboard, separately for production and development if needed. Never put it in a frontend variable or source file. The action uses gpt-4.1 with web search, a 2,200-token output limit, six search tool calls maximum and bounded fields. It verifies the original figure and short excerpt against the cited public HTML/PDF before displaying them. Recommendations require matching amounts, life stages and methods; missing evidence is not a zero footprint. AI interpretation of product/report matching still needs human review of the linked source.

Live URL: https://successful-opossum-152.convex.site

Environment files are ignored. No Prompt Gully keys, data, challenges, scoring or saved progress were copied.
