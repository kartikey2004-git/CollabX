# Authentication Setup Guide

Complete setup guide for the production-ready Better Auth authentication system with Resend email and OAuth.

## Prerequisites

Ensure you have completed the basic setup from `SETUP.md`:
- Node.js 18+
- PostgreSQL running (via Docker: `docker compose up -d`)
- Dependencies installed: `npm install`

## Configuration Steps

### 1. Copy Environment Files

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

### 2. Configure Resend Email Service

**Sign up for Resend:**
1. Go to [https://resend.com](https://resend.com)
2. Create a free account (100 emails/day free tier)
3. Create API key in Dashboard → API Keys
4. Verify your sending domain (add SPF, DKIM, DMARC records)

**Update .env:**
```
RESEND_API_KEY=re_XXXXXXXXXXXXX
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

For local testing, use the default:
```
RESEND_FROM_EMAIL=noreply@collabx.local
```

### 3. Configure Google OAuth

**Create OAuth credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google+ API" or "Identity and Access Management (IAM) API"
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Add Authorized Redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:5000/api/auth/callback/google
   ```
7. Copy Client ID and Client Secret

**Update .env:**
```
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=XXXX_XXXX_XXXX
```

### 4. Configure GitHub OAuth

**Create OAuth application:**
1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. New OAuth App
3. Fill in details:
   - Application name: CollabX
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:5000/api/auth/callback/github
4. Copy Client ID and Client Secret (generate new secret if needed)

**Update .env:**
```
GITHUB_CLIENT_ID=XXXX_XXXX_XXXX_XXXX
GITHUB_CLIENT_SECRET=XXXX_XXXX_XXXX_XXXX_XXXX
```

### 5. Generate Better Auth Secret

```bash
# Generate 32-character hex string
openssl rand -hex 32
```

**Update .env:**
```
BETTER_AUTH_SECRET=<paste_generated_string_here>
```

### 6. Configure URLs

Ensure .env has correct URLs for local dev:
```
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Apply Database Migration

```bash
cd packages/database
npx prisma migrate deploy
cd ../..
```

This adds the `type` field to the Verification table for distinguishing email verification vs password reset tokens.

## Running the Application

Open two terminals:

**Terminal 1 - Backend API:**
```bash
cd apps/api
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 - Frontend Web:**
```bash
cd apps/web
npm run dev
# Running on http://localhost:3000
```

## Testing Authentication

### Test Email/Password Signup

1. Open http://localhost:3000/signup
2. Enter an email and password (min 8 chars)
3. Click "Sign Up"
4. Check your email (or logs if using mock) for verification link
5. Click the verification link
6. Automatically logged in, redirected to /workspace
7. See your email and name on workspace page

### Test Email/Password Login

1. Open http://localhost:3000/login
2. Enter your registered email and password
3. Click "Sign In"
4. Redirected to /workspace

### Test Forgot Password

1. Go to /login → "Forgot password?"
2. Enter your email
3. Check email for password reset link
4. Click link
5. Set new password (min 8 chars)
6. Redirected to /login
7. Login with new password

### Test Google OAuth

1. Go to /signup → "Sign up with Google"
2. Authenticate with Google account
3. Authorize CollabX app
4. Automatically redirected to /workspace
5. Session active, can sign out

### Test GitHub OAuth

1. Go to /signup → "Sign up with GitHub"
2. Authenticate with GitHub
3. Authorize CollabX app
4. Automatically redirected to /workspace
5. Session active, can sign out

## Environment Variables Reference

### Core Auth
- `BETTER_AUTH_URL` - OAuth callback base URL
- `BETTER_AUTH_SECRET` - JWT/CSRF signing secret (32-char hex)

### Email Service
- `RESEND_API_KEY` - Resend API key (starts with `re_`)
- `RESEND_FROM_EMAIL` - Verified sender email

### OAuth Providers
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GITHUB_CLIENT_ID` - GitHub OAuth Client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth Client Secret

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend URL for API calls (must be public)
- `NEXT_PUBLIC_APP_URL` - Frontend URL (must be public)

### Logging
- `LOG_LEVEL` - debug | info | warn | error
- `NODE_ENV` - development | production

## Troubleshooting

### "Email not sending" or "Email service error"

**Check:**
- `RESEND_API_KEY` is correct (no extra spaces)
- `RESEND_FROM_EMAIL` is verified in Resend dashboard
- Check API logs: `npm run dev` in api terminal shows email errors
- For dev without real emails, use mock provider (check API logs)

**Solution:**
```bash
# Restart backend
cd apps/api && npm run dev
```

### "OAuth callback failed" or "Redirect URI mismatch"

**Check:**
- Redirect URIs in Google/GitHub settings match exactly
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` are correct
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` are correct
- `BETTER_AUTH_URL` matches `http://localhost:3000`

**Solution:**
```bash
# Verify env vars
grep -E "GOOGLE|GITHUB|BETTER_AUTH" .env apps/api/.env
```

### "Session not persisting" or "Logout on refresh"

**Check:**
- `BETTER_AUTH_SECRET` is set in .env
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Browser cookies enabled
- Clear browser cookies and try again

**Solution:**
```bash
# Clear cookies in DevTools → Application → Cookies
# Then refresh the page
```

### "Invalid email format" or validation errors

**This is expected behavior:**
- Email must contain `@`
- Password must be 8+ characters
- Passwords must match
- Email must not already exist

### "Port already in use"

**For API (5000):**
```bash
# Kill process
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

**For Web (3000):**
```bash
# Kill process
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port in next.config.js
```

### "Database migration failed"

```bash
# Ensure database is running
docker compose ps

# Try applying migration again
cd packages/database
npx prisma migrate deploy

# If still failing, check database connection
npm run db:push
```

### "Card component not found" or UI component errors

```bash
# Rebuild UI components
npm run build -w @repo/ui

# Reinstall dependencies
npm install
```

## Security Checklist

- [ ] Never commit `.env` or `.env.local` files
- [ ] `BETTER_AUTH_SECRET` is a random 32-char hex string
- [ ] `RESEND_FROM_EMAIL` is verified in Resend dashboard
- [ ] OAuth redirect URIs are correctly registered
- [ ] No test/debug credentials in production `.env`
- [ ] Rate limiting is active (checked in `apps/api/src/middleware/rate-limit.ts`)
- [ ] HTTP-only cookies enabled for sessions
- [ ] CORS correctly configured for frontend origin

## Production Deployment

For production setup, see `DEPLOYMENT.md` (when available).

Key differences from development:
- Use production OAuth credentials from each provider
- Enable HTTPS/SSL certificates
- Set `BETTER_AUTH_URL` to production domain
- Update `NEXT_PUBLIC_API_URL` to production API domain
- Use production Resend account and verified domain
- Set `NODE_ENV=production`
- Generate new random `BETTER_AUTH_SECRET`

## Next Steps

1. ✅ Verify all auth flows work in development
2. ✅ Test OAuth providers (Google, GitHub)
3. ✅ Test email verification and password reset
4. ⏭️ Deploy to staging environment
5. ⏭️ Get stakeholder approval
6. ⏭️ Deploy to production

## Support & Resources

- Better Auth Docs: https://better-auth.com/docs
- Resend Docs: https://resend.com/docs
- Google OAuth: https://developers.google.com/identity/oauth2/web
- GitHub OAuth: https://docs.github.com/en/apps/oauth-apps

## Quick Reference Commands

```bash
# View API logs
cd apps/api && npm run dev

# View Frontend logs
cd apps/web && npm run dev

# Check database
cd packages/database && npx prisma studio

# Reset database (careful!)
npm run db:reset

# Generate new secret
openssl rand -hex 32

# Verify ports are available
lsof -i :3000 && lsof -i :5000
```
