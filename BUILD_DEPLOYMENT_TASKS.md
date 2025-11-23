# Build & Deployment Fix Tasks

## 1) Run database migrations in production
- Add a migration step to the deployment pipeline (e.g., Vercel Build Command: `npx prisma migrate deploy`).
- Ensure the command runs **before** the app starts so Prisma schema matches the database.
- Add rollback/alerting for failed migrations.

## 2) Verify required environment variables on the host
- Set `DATABASE_URL`, `JWT_SECRET`, `ADMIN_SECRET`, and Supabase keys in the hosting dashboard.
- Add a preflight check or deployment note so missing envs fail fast rather than at runtime.

## 3) Validate Next.js/React/Ant Design compatibility
- Run `npm run lint` and `npm run build` in CI to catch React 19 or Next 16 warnings early.
- Confirm Ant Design 5.28 renders correctly with React 19 in the target runtime.

## 4) Review Turbopack usage
- Test with `next dev --turbo` and `next build` to confirm stability on the target platform.
- Disable Turbopack if regressions appear, or add config to handle known issues.

## 5) Decide on production source maps
- If production debugging is needed, enable `productionBrowserSourceMaps` / `turbopackSourceMaps` and monitor bundle size impact.
- Keep disabled if bundle size or security is a concern.

## 6) Confirm remote image configuration
- Verify all remote asset hosts (e.g., Supabase buckets) are listed in `next.config.js` `images.remotePatterns`.
- Update the list before adding new asset domains to prevent build errors.
