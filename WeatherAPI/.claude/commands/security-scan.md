Perform a security audit of this Express/TypeScript API. Read every file under `src/` and check for each category below. Report all findings with file, line number, severity, description, and a concrete recommended fix.

$ARGUMENTS

## Checklist

### 1. Dependency vulnerabilities
Run `npm audit --audit-level=low` and report all findings grouped by severity (critical → high → moderate → low).

### 2. Input validation
For every route parameter (`req.params.*`), query string (`req.query.*`), and request body field (`req.body.*`):
- Is it validated for type, length, and character set before use?
- Is Zod, joi, or equivalent schema validation applied?
- Flag any raw pass-through to functions, templates, or external calls.

Key places to check in this codebase:
- `src/routes.ts` — `req.params.city` on the `/weather/:city` and `/forecast/:city` routes
- Any future body parsing (currently no `express.json()` middleware is mounted)

### 3. XSS (cross-site scripting)
- Scan `src/dashboard.ts` for any interpolation of user-controlled or externally sourced strings into HTML without escaping.
- The known risk: `w.city` is interpolated directly into the card template. Verify whether `city` is still coming only from the hardcoded `CITIES` constant or from a user-controlled path parameter.
- Check any new HTML-rendering code added since this audit was written.

### 4. Security headers
Check whether `helmet` (or equivalent manual headers) is mounted in `src/server.ts`. Required headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `Referrer-Policy`

### 5. CORS policy
Check `src/server.ts` for a `cors` middleware. Is a CORS policy explicitly defined? An absent policy defaults to no cross-origin access — flag if this looks unintentional for a public API.

### 6. Rate limiting
Check whether `express-rate-limit` or equivalent is mounted globally or on any individual route. Flag any endpoint that accepts unbounded requests per IP per minute.

### 7. Error handling and information disclosure
- Verify `src/middleware.ts` `errorHandler` does not send stack traces to clients when `NODE_ENV=production`.
- Check that no route handler calls `res.json(err)` or `res.send(err.stack)` directly.
- Check whether `/health` exposes information useful to an attacker (e.g. uptime, version, internal paths).

### 8. Hardcoded secrets
Grep all `src/*.ts` files for: API keys, tokens, passwords, connection strings, private keys, or any string that looks like a secret. Also check `tsconfig.json` and `jest.config.js`. Flag any that should be moved to environment variables.

### 9. Injection risks
- **Command injection:** any use of `child_process.exec/spawn` with user input?
- **Path traversal:** any `fs` calls using user input?
- **SQL injection:** any database queries? (Currently none — confirm this is still true.)
- **Prototype pollution:** any use of `Object.assign` or spread with untrusted input?

### 10. Authentication and authorization
List all endpoints and note which (if any) are intended to be protected. If there are protected routes without authentication middleware, flag them as HIGH severity.

---

## Severity guide

| Severity | Meaning |
|---|---|
| **Critical** | Exploitable right now with no preconditions; immediate fix required |
| **High** | Exploitable with minimal effort or a latent bug that becomes critical with one code change |
| **Medium** | Real risk but requires specific conditions or chaining with another issue |
| **Low** | Defense-in-depth / best-practice gap; low immediate risk |
| **Info** | Observation worth tracking; not a vulnerability |

## Report format

For each finding:

```
### [SEVERITY] Short title
- File: src/example.ts:42
- Description: What the issue is and why it matters.
- Recommended fix: Exact code change or package to add.
```

End with a summary table of all findings and an overall risk rating (Critical / High / Medium / Low / Clear).
