PR Title: feat: prepare deploy (Render backend + Vercel frontend) + CI

Branch name: chore/deploy-readiness

Commit message (single commit contains all current workspace edits):
- feat: prepare deploy (prisma generate postinstall, secure seed, CI, deploy scripts, README)

PR Body (paste into GitHub when creating PR):

Summary
- Prepare project for deployment to Render (backend) and Vercel (frontend).
- Add CI that builds backend Prisma client and frontend production build.
- Convert admin seed to use env vars; update `.env.example` and README.
- Add helper deploy scripts: `scripts/deploy_render.sh`, `scripts/deploy_vercel.sh`.
- Add `postinstall` to `backend/package.json` to run `npx prisma generate` on install.

Files changed (high level)
- backend/scripts/seedAdmin.js
- backend/package.json
- backend/.env.example
- README.md
- .github/workflows/ci.yml
- scripts/deploy_render.sh
- scripts/deploy_vercel.sh

How to create the PR locally (run these commands from repo root)

```bash
# create branch
git checkout -b chore/deploy-readiness
# stage all changes
git add -A
# commit
git commit -m "feat: prepare deploy (prisma generate postinstall, secure seed, CI, deploy scripts, README)"
# push branch
git push origin chore/deploy-readiness
# then open PR on GitHub from that branch -> main
```

PR Checklist (what I will do after PR is merged or if you invite me)
- [ ] Ensure Render service is configured with rootDir `backend`, build command `npm install && npx prisma generate`, start command `node src/index.js`.
- [ ] Add Render environment variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` (optional), `CLIENT_URL` (Vercel URL), `ADMIN_EMAIL`, `ADMIN_PASSWORD` (temporary for seed), `SHOW_ERROR_DETAILS` (set true temporarily for debugging only).
- [ ] Add Vercel environment variable: `VITE_API_URL=https://<render-url>/api` and deploy frontend.
- [ ] After successful deploy, set `SHOW_ERROR_DETAILS=false` and rotate `ADMIN_PASSWORD` (or remove admin seed values).
- [ ] Run `node backend/scripts/seedAdmin.js` once with env vars to create admin (or let CI/Render run it if desired).

Deploy checklist for you (manual)
1. Merge PR to `main`.
2. Render: create a new Web Service -> connect GitHub repo -> set Root Directory to `backend`.
3. Set Build Command: `npm install && npx prisma generate` and Start Command: `node src/index.js`.
4. Add required environment variables in Render. Use values from `backend/.env.example` (do NOT commit secrets).
5. Deploy; watch logs for errors. If you see `500` on login, temporarily set `SHOW_ERROR_DETAILS=true` to get stack traces in JSON responses.
6. Vercel: create project from repo, set root to `frontend`, set `VITE_API_URL` to `https://<render-url>/api`, and deploy.
7. Update `CLIENT_URL` in Render to point to Vercel URL and redeploy backend if necessary.

Optional: remove plaintext admin from Git history (recommended)
If you want to remove the previously committed plaintext admin password from history, use `git-filter-repo` (this rewrites history):

```bash
# install git-filter-repo (if not installed)
# careful: this rewrites history and requires force-push and coordination
git filter-repo --path backend/scripts/seedAdmin.js --invert-paths
```

(If you want I can prepare an exact git-filter-repo command series and instructions — this must be coordinated because it rewrites history and will require force-push.)

If you want me to finish deployment for you, invite a deploy account to Render and Vercel or add API tokens to your repo Secrets and say "invite" here; otherwise follow the PR steps above.

File with these instructions: [PR_DETAILS.md](PR_DETAILS.md)
