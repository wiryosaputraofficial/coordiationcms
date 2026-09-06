# Security model

- Framework password hashing uses scrypt with random salts (N=32768, r=8, p=3). Password changes use the same stored format.
- Session tokens are random, hashed in the database, revocable, and delivered in HttpOnly/SameSite=Lax cookies. Production requires Secure cookies and HTTPS.
- All authenticated API mutations require same-origin requests and server-side role checks. The Node adapter constructs requests using its configured trusted origin, not forwarded Host headers.
- Authors can modify their own posts. Contributors cannot publish and cannot edit published content. Editors manage all posts/pages and comments. Administrators control themes, users, settings, and imports.
- Production setup requires a random token and the configured administrator email. Once an administrator exists, setup is disabled. No public registration endpoint is exposed.
- SQL uses bound parameters. Content updates have version checks and preserve revisions. Imports use one transaction.
- Public HTML is escaped/sanitized and restricted by CSP. Theme scripts and active CSS are rejected. Theme input is size/depth bounded and nested loops are rejected.
- Media accepts only raster signatures and uses opaque URLs with explicit MIME types. Media URLs are public, as in a typical publishing library; do not upload confidential files.
- Authentication uses the framework's persistent per-account limits. Public comments have global and per-email limits. Traefik adds a baseline request limiter. These are basic controls, not an advanced abuse prevention service.
- Account recovery is performed by the server operator with the reset command. Email verification, password recovery emails, MFA, and a third-party security audit are not implemented.

Never commit `.env`, SQLite databases, uploaded media, setup tokens, session cookies, or credentials. Backups contain application data and password hashes. Store them privately and test recovery. The supplied backup command does not encrypt or upload snapshots.

The application and framework are alpha software. Production hardening, capacity testing, backup retention/offsite storage, incident response, and review against your commercial threat model remain deployment responsibilities.
