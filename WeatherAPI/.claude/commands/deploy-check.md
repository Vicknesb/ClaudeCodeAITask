Run the full pre-deployment checklist for this project and report results. Execute each step below in order, stopping at the first failure and explaining what to fix before re-running.

## Steps

### 1. Type-check
Run `npm run type-check`. Zero TypeScript errors required. If any errors appear, show them and stop.

### 2. Lint
Run `npm run lint`. Zero ESLint errors required. Warnings are acceptable but note them. If errors appear, show them and stop.

### 3. Tests
Run `npm test -- --coverage`. All tests must pass. Coverage must be ≥ 80 % lines (per project target). If any test fails or coverage drops below 80 %, show the failure and stop.

### 4. Build
Run `npm run build`. The `dist/` directory must be produced with no errors. If the build fails, show the TypeScript errors and stop.

### 5. Security audit
Run `npm audit --audit-level=high`. Zero high or critical vulnerabilities allowed. If any are found, list them with their advisory URLs and recommended fixes.

### 6. Dependency freshness (informational)
Run `npm outdated`. List any packages more than one major version behind. This does not block deployment but flag anything that looks risky.

### 7. Health check (if server is running)
If a local server is running on port 3000, run:
```
curl -s http://localhost:3000/health
```
The response must be `{"status":"ok"}`. If the server is not running, skip this step and note that it should be verified manually before going live.

## Report format

After running all steps, produce a summary table:

| Step | Status | Notes |
|---|---|---|
| Type-check | ✅ Pass / ❌ Fail | ... |
| Lint | ✅ Pass / ❌ Fail | ... |
| Tests | ✅ Pass / ❌ Fail | N tests, N% coverage |
| Build | ✅ Pass / ❌ Fail | ... |
| Security audit | ✅ Pass / ❌ Fail | N vulns found |
| Dependency freshness | ℹ️ Info | N packages outdated |
| Health check | ✅ Pass / ⏭️ Skipped | ... |

End with one of:
- **READY TO DEPLOY** — all required steps passed.
- **NOT READY** — list the blocking issues and the exact commands needed to fix them.
