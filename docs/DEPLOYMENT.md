# Deployment

The supplied Compose configuration targets a Docker host with an existing Traefik network named `proxy_public`, HTTPS entrypoint `websecure`, and certificate resolver `letsencrypt`.

## Initial installation

1. Place the source in `/opt/stacks/coordiation-cms`.
2. Create a private `.env` (mode 0600) based on `.env.example`; use a cryptographically random setup token and your administrator email. Do not put passwords in Compose files.
3. Point the site's DNS A record to the server.
4. Run `docker compose up -d --build`.
5. Complete setup at `/login` using the setup token. After setup, that endpoint is disabled automatically.

The deployed site is configured as `https://app.coordiation.com`. For another domain, update the Compose build argument, runtime `CMS_ORIGIN`, and Traefik rule together. Production origin is embedded in the framework build and must match the runtime origin.

The container runs as the unprivileged Node user, uses a read-only root filesystem, drops Linux capabilities, and persists SQLite (including raster media) in the `cms-data` volume. The public web port is reached through Traefik, not published directly on the host.

```sh
docker compose ps
docker compose logs --tail=80 cms
docker compose exec -T cms node -e "fetch('http://127.0.0.1:3100/api/health').then(async r=>console.log(r.status,await r.text()))"
```

## Updates

Run the full build/tests before transferring source. Back up before an update. Rebuild only this Compose project; do not restart unrelated services. Keep the previous image/release archive for an application rollback. Database migrations are forward-only; reverting an image does not restore a database.

## Backup and recovery

```sh
docker compose exec -T cms node scripts/backup.js
```

This creates a new standalone SQLite snapshot and checksum receipt in `/data/backups`, covering users, content, media, themes, settings, comments, and revisions. The framework verifies database integrity. Copy snapshots to private off-host storage under your own retention policy. No cron job or offsite destination is configured by this repository.

To verify a restore into a **new** database filename:

```sh
docker compose exec -T cms node scripts/restore.js \
  /data/backups/SNAPSHOT.sqlite \
  /data/backups/SNAPSHOT.sqlite.receipt.json \
  /data/recovery/RESTORED.sqlite
```

If OpenAI has been configured, the backup also creates a private `SNAPSHOT.sqlite.ai-key` file. Keep this alongside the snapshot and receipt in protected storage: the database contains the encrypted provider key, and the sidecar contains its encryption key. To restore AI access, copy the sidecar to `ai-encryption.key` in the directory containing the restored database, with mode 0600 and ownership matching the application user. Do not overwrite the live encryption key. Without the matching key, remove and reconnect OpenAI in Settings after recovery.

Restore revokes copied sessions. Inspect the restored database before changing `CMS_DATABASE` and restarting this service. Never overwrite the live database with a raw copy while it is running.

## Administrator password recovery

From a private shell, securely read the replacement password without putting it in history or process arguments:

```sh
read -r -s -p 'New password (15+ characters): ' cms_new_password
printf '%s' "$cms_new_password" | docker compose exec -T cms node scripts/reset-password.js owner@example.com
unset cms_new_password
```

Replace the example email with the account's email. All existing sessions for that account are revoked. Signed-in users can instead change passwords from their profile.
