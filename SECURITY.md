# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Architecture & Threat Model

This application adheres to defense-in-depth, privacy-first, and zero-leak engineering practices:

- **Zero Secret Exposure**: No private API keys, database credentials, service role keys, or JWT tokens are stored in source code, committed to Git, or bundled into client assets. The application operates with a standalone in-memory database by default, using only public anonymous access for optional Supabase connectivity.
- **Row-Level Security (RLS) Enforcement**: All database tables enforce granular Row-Level Security policies. Verified reference data is read-only. Crowdsourced feedback and fact submissions are write-only for anonymous users, completely isolating user communications and preventing unauthorized data harvesting.
- **Search Path Hijacking Defense**: Database `SECURITY DEFINER` functions explicitly set `SET search_path = public, pg_temp` to prevent schema manipulation attacks (CWE-426).
- **Strict Input & Link Sanitization**: All crowdsourced evidence URLs are rigorously validated (`isSafeUrl`) to only allow `http:` and `https:` protocols, effectively eliminating Stored XSS vectors (`javascript:`, `data:`, `vbscript:`). External links enforce `rel="noopener noreferrer"` to prevent tabnabbing.
- **Payload & Rate Limiting Controls**: Strict length constraints on notes and feedback messages, combined with database hourly rate caps (50 inserts/hr/area), defend against DoS, memory bloat, and automated spam.
- **Modern Security Headers & CSP**: Configured with strict Content Security Policy (CSP), `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff` (anti-MIME sniffing), and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Automated CI Security Auditing**: Every push and pull request runs automated dependency vulnerability scanning (`npm audit --audit-level=high`), linter verification, full end-to-end multi-city invariant testing, and typechecking.

## Reporting a Vulnerability

If you discover a potential vulnerability or security issue:
1. Please report it privately via GitHub Security Advisories or by contacting the maintainers directly.
2. Please do not publish public issues or discuss zero-day exploits publicly until maintainers have investigated and remediated the issue.
3. Maintainers will acknowledge reports within 48 hours and provide a timeline for fixes.
