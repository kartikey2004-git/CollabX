# Authentication Testing Checklist

Comprehensive QA checklist for all authentication flows. Use this to verify the system works end-to-end.

## Test Environment Setup

- [ ] API running on `http://localhost:5000`
- [ ] Web running on `http://localhost:3000`
- [ ] Database running and migrations applied
- [ ] Environment variables configured (`.env` and `apps/api/.env`)
- [ ] Resend configured or mocked (check API logs for email output)
- [ ] Browser cookies enabled
- [ ] No active sessions (clear all cookies before starting)

## Email & Password Authentication

### Signup Flow

- [ ] Navigate to `/signup`
- [ ] Form displays all fields: email, password, confirm password
- [ ] Form shows OAuth buttons (Google, GitHub)
- [ ] Try signup with invalid email (no @): shows error
- [ ] Try signup with password < 8 chars: shows error  
- [ ] Try signup with mismatched passwords: shows error
- [ ] Try signup with valid email and 8+ char password
- [ ] Passwords match: form submits
- [ ] Success toast shown: "Account created! Verification email sent."
- [ ] Redirected to `/verify-email`
- [ ] Email sent (check API logs or Resend dashboard)
- [ ] Email contains verification link with token
- [ ] Email contains expiration notice (1 hour)

### Email Verification

- [ ] On `/verify-email`, can enter email to resend
- [ ] Click verification link in email
- [ ] Verification succeeds silently
- [ ] Automatically logged in and redirected to `/workspace`
- [ ] Session active: can see email and name
- [ ] Try clicking same verification link again: shows error "Already verified"
- [ ] Try verification link after 1+ hour (or manually expire in DB): shows error "Expired"
- [ ] Click resend on `/verify-email`:
  - [ ] Shows loading state
  - [ ] Shows success toast
  - [ ] Disables resend button with countdown (60 sec)
  - [ ] Countdown timer decrements
  - [ ] Button re-enables after countdown

### Login Flow

- [ ] Navigate to `/login`
- [ ] Form shows email and password fields
- [ ] Form shows "Forgot password?" link
- [ ] Link goes to `/forgot-password`
- [ ] Try login with non-existent email: shows error
- [ ] Try login with wrong password: shows error
- [ ] Try login with correct email/password:
  - [ ] Form submits
  - [ ] Shows loading state
  - [ ] Success toast: "Logged in successfully!"
  - [ ] Redirected to `/workspace`
  - [ ] Session persists (page refresh shows logged in)

### Session Management

- [ ] Session data displays user email and name
- [ ] Session persists on page refresh
- [ ] Session expires after 7 days (dev cookie shows expiration)
- [ ] Sign out button clears session
- [ ] After sign out, can't access `/workspace` (redirects to `/login`)

### Password Reset Flow

- [ ] From `/login`, click "Forgot password?"
- [ ] On `/forgot-password`, enter email
- [ ] Click "Send Reset Link"
- [ ] Shows loading state
- [ ] Success toast and redirected to check email
- [ ] Email received (check API logs)
- [ ] Email contains reset link with token
- [ ] Email contains expiration (1 hour)
- [ ] Click reset link → taken to `/reset-password?token=...`
- [ ] Try reset with mismatched passwords: shows error
- [ ] Try reset with password < 8 chars: shows error
- [ ] Enter matching passwords (8+ chars)
- [ ] Click "Reset Password"
- [ ] Shows loading state
- [ ] Success toast: "Password reset successfully! Redirecting..."
- [ ] Redirected to `/login` after 1.5 seconds
- [ ] Old password no longer works
- [ ] New password works for login
- [ ] All previous sessions invalidated (if any were active)

### Edge Cases

- [ ] Signup with trailing/leading spaces in email: trimmed
- [ ] Signup with same email twice: shows "Email already exists" error
- [ ] Password with special characters (!@#$%): works
- [ ] Password with spaces: works
- [ ] Very long password (100+ chars): works
- [ ] Email with internationalized characters: accepted or shown error
- [ ] Concurrent signup attempts with same email: one succeeds, other fails

---

## OAuth: Google

### New User Signup

- [ ] Go to `/signup`
- [ ] Click "Sign up with Google"
- [ ] Redirected to Google consent screen
- [ ] Authorize CollabX app
- [ ] Redirected back to `/workspace`
- [ ] Logged in successfully
- [ ] User created in database
- [ ] Email verified automatically (from Google)
- [ ] Session active, can sign out

### Existing User Linking (Same Email)

- [ ] Signup with email/password first
- [ ] Verify email
- [ ] Sign out
- [ ] Sign up with Google using same email
- [ ] Check if auto-linked or shown error
- [ ] If linked: login with either Google or email/password works

### Scope Verification

- [ ] Google returns email and profile name
- [ ] Name and email stored correctly in User table
- [ ] Profile picture (if available) stored

---

## OAuth: GitHub

### New User Signup

- [ ] Go to `/signup`
- [ ] Click "Sign up with GitHub"
- [ ] Redirected to GitHub authorization screen
- [ ] Authorize CollabX app
- [ ] Redirected back to `/workspace`
- [ ] Logged in successfully
- [ ] User created in database
- [ ] Email verified (if GitHub email is verified)
- [ ] Session active

### Existing Email User

- [ ] Signup with email/password first
- [ ] Verify email
- [ ] Sign out
- [ ] Try to signup with GitHub using same email
- [ ] Should either auto-link or show clear error

### Account Linking Prevention

- [ ] Signup with GitHub (email: alice@example.com)
- [ ] Logout
- [ ] Signup with Google (email: alice@example.com)
- [ ] System should:
  - [ ] NOT auto-link (emails match but different providers)
  - [ ] Ask user to sign in with existing account first
  - [ ] OR prevent signup with clear error message

---

## Security Tests

### Rate Limiting

- [ ] Rapid signup attempts (10+/minute): 429 error after limit
- [ ] Rapid login attempts (10+/minute): 429 error after limit  
- [ ] Rapid forgot password (5+/minute): 429 error after limit
- [ ] Error message shows retry time

### CSRF Protection

- [ ] Inspect login form → check for CSRF token
- [ ] Remove CSRF token → form submission fails
- [ ] Token changes per request (if state-based)

### Cookie Security

- [ ] Open DevTools → Application → Cookies
- [ ] Session cookie has `HttpOnly` flag ✓
- [ ] Session cookie has `Secure` flag (production) ✓
- [ ] Session cookie has `SameSite=Lax` ✓
- [ ] Session cookie not accessible from JavaScript

### Input Validation

- [ ] Try SQL injection in email: `admin'--` → shows validation error
- [ ] Try XSS in email: `<script>alert('xss')</script>` → shows validation error
- [ ] Try XSS in password: same email field character limit applies
- [ ] No script execution on page

### Authorization

- [ ] Unauthenticated users can't access `/workspace`: redirected to `/login`
- [ ] Authenticated users can't access `/login`: redirected to `/workspace`
- [ ] Authenticated users can't access `/signup`: redirected to `/workspace`
- [ ] Expired session: redirected to `/login`

---

## Error Handling

### Network Errors

- [ ] Disconnect internet during signup
- [ ] Shows error: "Network error" or "Connection failed"
- [ ] Can retry after reconnecting
- [ ] Reconnect and retry signup: works

### Backend Down

- [ ] Stop API server
- [ ] Try to login
- [ ] Shows error: "Connection failed" or "Server error"
- [ ] Restart API
- [ ] Can login again

### Database Errors

- [ ] Database goes offline during signup
- [ ] Shows generic error (no DB details leaked)
- [ ] Restart database
- [ ] Retry: works

---

## Email Delivery Tests

### Verification Email

- [ ] Subject: "Verify your CollabX email"
- [ ] Contains verification link with full URL
- [ ] Contains token parameter
- [ ] Contains expiration: "1 hour"
- [ ] Contains fallback link as text
- [ ] Professional HTML formatting
- [ ] Renders correctly on mobile

### Password Reset Email

- [ ] Subject: "Reset your CollabX password"
- [ ] Contains reset link with full URL
- [ ] Contains token parameter
- [ ] Contains expiration: "1 hour"
- [ ] Contains security notice: "If you didn't request..."
- [ ] Contains fallback link as text
- [ ] Professional HTML formatting
- [ ] Renders correctly on mobile

### Email Delivery

- [ ] Email sent within 5 seconds
- [ ] Email delivered to correct address
- [ ] No emails sent if error occurs
- [ ] No duplicate emails on retry

---

## Performance Tests

### Loading States

- [ ] Signup button shows "Creating account..." while loading
- [ ] Login button shows "Signing in..." while loading
- [ ] All inputs disabled during loading
- [ ] Can't double-click submit (race condition prevented)

### Response Time

- [ ] Signup completes within 5 seconds
- [ ] Login completes within 3 seconds
- [ ] Password reset link sent within 5 seconds
- [ ] Email verification within 5 seconds

### Database Performance

- [ ] User can login with 1M users in database (basic index check)
- [ ] No N+1 queries when fetching session
- [ ] Verification lookup uses index (fast)

---

## Accessibility Tests

### Keyboard Navigation

- [ ] Tab through all form fields
- [ ] Can fill form with keyboard only
- [ ] Enter key submits form
- [ ] Focus visible on all interactive elements

### Screen Reader

- [ ] Form labels properly associated with inputs (for attribute)
- [ ] Error messages linked to fields (aria-describedby)
- [ ] Form instructions announced
- [ ] Button state changes announced

### Color Contrast

- [ ] Login/signup form text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Error text contrast ≥ 4.5:1
- [ ] Links color contrast ≥ 4.5:1

### Responsive Design

- [ ] `/login` responsive on mobile (320px)
- [ ] `/signup` responsive on mobile
- [ ] Forms don't require horizontal scroll
- [ ] Buttons large enough to click (44px min)
- [ ] Touch targets properly spaced

---

## Mobile Tests

### Touch Interactions

- [ ] Form fields clickable on mobile
- [ ] Buttons easily clickable (not too small)
- [ ] Can type in form fields with mobile keyboard
- [ ] Keyboard appears appropriately (email vs password)

### Responsive Layout

- [ ] Page layout adjusts to 320px width
- [ ] Text readable without zooming
- [ ] Images scale appropriately
- [ ] No horizontal scrolling needed

---

## Browser Compatibility

- [ ] Chrome/Edge (Chromium): all flows work
- [ ] Firefox: all flows work
- [ ] Safari: all flows work
- [ ] Mobile Safari (iOS): all flows work
- [ ] Chrome Mobile (Android): all flows work

---

## Regression Tests

After each auth flow change, re-verify:

- [ ] Existing user can still login
- [ ] Existing user can reset password
- [ ] OAuth still works (Google, GitHub)
- [ ] Email still sends
- [ ] Session persists
- [ ] No console errors
- [ ] No network errors (DevTools)

---

## Sign-Off

- [ ] All tests completed
- [ ] No critical bugs found
- [ ] All edge cases handled
- [ ] Performance acceptable
- [ ] Security measures verified
- [ ] Accessibility confirmed

**Tested by**: ________________  
**Date**: ________________  
**Notes**: ____________________________________________________________
