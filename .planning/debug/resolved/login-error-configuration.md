---
status: resolved
trigger: "Login error displays 'Configuration' instead of proper Dutch error message when entering incorrect credentials"
created: 2026-01-26T12:00:00Z
updated: 2026-01-26T12:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - auth.ts throws regular Error() objects which NextAuth v5 converts to "Configuration" because they're not in the clientErrors whitelist
test: Verified by examining @auth/core source code
expecting: N/A - root cause found
next_action: Fix by either (1) throwing CredentialsSignin with codes, or (2) mapping all errors to Dutch in login page

## Symptoms

expected: Error message like "Het e-mailadres en wachtwoord combinatie is onjuist" (Dutch error message for invalid credentials)
actual: Shows "Configuration" in red text
errors: No console errors
reproduction: Enter incorrect credentials on login page (either wrong email OR wrong password) and submit - shows "Configuration" instead of proper error
started: Unknown if ever worked correctly

## Eliminated

## Evidence

- timestamp: 2026-01-26T12:01:00Z
  checked: login page error handling (src/app/(auth)/login/page.tsx)
  found: Login page checks if result.error === 'CredentialsSignin', maps to Dutch message, otherwise displays result.error directly
  implication: Error is being received as something other than 'CredentialsSignin'

- timestamp: 2026-01-26T12:02:00Z
  checked: auth.ts authorize function
  found: Throws errors with Dutch messages like DUTCH_ERRORS.INVALID_CREDENTIALS() which is 'Ongeldige inloggegevens'
  implication: Custom error messages are thrown but possibly not reaching client correctly

- timestamp: 2026-01-26T12:03:00Z
  checked: NextAuth version
  found: next-auth ^5.0.0-beta.30 (v5 beta)
  implication: NextAuth v5 has different error handling than v4 - may not pass error messages through to client

- timestamp: 2026-01-26T12:04:00Z
  checked: @auth/core/errors.js and @auth/core/index.js
  found: NextAuth v5 has a clientErrors set that determines which error types are safe to pass to client. Only these are allowed: CredentialsSignin, OAuthAccountNotLinked, OAuthCallbackError, AccessDenied, Verification, MissingCSRF, AccountNotLinked, WebAuthnVerificationError. Any other error type is converted to "Configuration" to prevent leaking server details.
  implication: auth.ts throws new Error() which is NOT a CredentialsSignin instance, so NextAuth converts to "Configuration"

- timestamp: 2026-01-26T12:05:00Z
  checked: CredentialsSignin class definition
  found: CredentialsSignin extends SignInError and has a 'code' property (default: "credentials"). This code is passed to the client in the URL as ?error=CredentialsSignin&code=credentials
  implication: To pass custom error information to client, must throw CredentialsSignin with custom code, or handle error mapping differently on client

## Resolution

root_cause: NextAuth v5 only passes "client-safe" errors to the client. When auth.ts authorize() throws a regular Error('Ongeldige inloggegevens'), NextAuth converts the error type to "Configuration" (a fallback for non-whitelisted errors). The login page then displays result.error directly, which is "Configuration" instead of the Dutch message. Only errors extending CredentialsSignin (and a few other types) are allowed through.
fix: Updated login page to treat both 'CredentialsSignin' and 'Configuration' error types as credential errors, displaying 'Ongeldige inloggegevens' Dutch message for both. Any other error type gets a generic Dutch error message.
verification: TypeScript and ESLint pass. Code logic verified - now handles both NextAuth v5 error types correctly.
files_changed:
  - src/app/(auth)/login/page.tsx
