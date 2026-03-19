# CI/CD Context - Denny Personal Site Deployment

## Project Overview
- **Project**: Denny personal website (Astro + TypeScript + MDX + Tailwind CSS)
- **Domain**: www.winter-prosper.com
- **Server**: Alibaba Cloud ECS (Ubuntu 24.04), user: web
- **SSH**: web@www.winter-prosper.com, key: ~/.ssh/id_ed25519

## Current Status

### ✅ Deployment Pipeline - COMPLETE
1. GitHub Actions builds with bun ✅
2. Files rsync'd to `/home/web/projects/staging/myweb/dist/` ✅
3. nginx configured and running on port 80 ✅
4. Site accessible at `http://123.57.180.180/staging/` (HTTP 200) ✅
5. nginx config deployed via CI/CD ✅
6. Auto-reload nginx after deploy ✅ (workflow step added)

### ⚠️ Known Limitations

#### ICP Filing Block
- www.winter-prosper.com:80 returns ISP-level ICP filing block from China
- Direct IP access works: `http://123.57.180.180/staging/`
- This is a Chinese regulatory issue, not a server configuration issue

## Server Configuration

### nginx Config
- Source: `infra/docker/staging-80.conf`
- Deployed to: `/etc/nginx/sites-available/staging-80`
- Enabled in: `/etc/nginx/sites-enabled/staging-80`
- Site root: `/home/web/projects/staging/myweb/dist`
- Access via: `/staging/`

### Permissions
- `/home/web/projects/staging/myweb/` set to 755
- www-data can read files (added to web group)

## GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

**Steps:**
1. Checkout → Bun setup → Install → Build
2. SSH key config → Dir structure
3. Rsync dist/ → Rsync infra/docker/
4. Deploy nginx config → Reload nginx

### Required Secrets
| Secret | Status |
|--------|--------|
| `STAGING_SSH_KEY` | ✅ Configured |
| `STAGING_USER` | ✅ Configured |
| `STAGING_HOST` | ✅ Configured |
| `STAGING_SUDO_PASS` | ⏳ **You need to add this** |

## Infrastructure Files
| Local | Remote |
|-------|--------|
| `infra/docker/staging-80.conf` | `/etc/nginx/sites-available/staging-80` |
| `dist/` | `/home/web/projects/staging/myweb/dist/` |

## Access
- **Direct IP**: http://123.57.180.180/staging/ ✅ Working
- **Domain**: http://www.winter-prosper.com/staging/ ❌ ICP blocked

## GitHub Secrets - COMPLETE ✅

All secrets now configured:
- `STAGING_SSH_KEY` ✅
- `STAGING_USER` (web) ✅
- `STAGING_HOST` (123.57.180.180) ✅
- `STAGING_SUDO_PASS` (641121) ✅

## SSH Authorization Issue - BLOCKED ⚠️

**Problem:** The SSH key `~/.ssh/id_ed25519` is not authorized for user `web` on the server.

**Error:**
```
Permission denied (publickey,password)
```

**Solution:** The server's public key from `~/.ssh/id_ed25519.pub` (SHA256:vvDueb3RQnEQXRdd+OKHGsSL23xcarVJ6OwNhrWHgCY) needs to be added to `/home/web/.ssh/authorized_keys` on the server.

**How to fix (requires server console access):**
```bash
# On server, as web user:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKZ2Gxl7R1c/wv1nq8R6P5zXwqrVJ6OwNhrWHgCY denny@autoresearch" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Alternative:** Use password `641121` via SSH with `-o PreferredAuthentications=password -o PubkeyAuthentication=no` (if password auth is enabled on server)

## Commit History
- `dbca242` - refactor: cleanup dead code and improve design aesthetics
- `92f369f` - feat: complete CI/CD pipeline with nginx auto-deploy

---

**Status: CI/CD pipeline ready but blocked by SSH authorization. Server-side fix required.**
