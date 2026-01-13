import { prisma } from '@/lib/prisma'

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════════════════

export const RATE_LIMIT_CONFIG = {
  // Login rate limits
  LOGIN_EMAIL: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  LOGIN_IP: {
    maxAttempts: 15,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Signup rate limits
  SIGNUP_IP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Account lockout settings
  LOCKOUT: {
    threshold: 5, // Failed attempts before lockout
    durationMs: 15 * 60 * 1000, // 15 minutes
    progressiveThreshold: 3, // Lockouts in 24h before progressive
    progressiveDurationMs: 60 * 60 * 1000, // 1 hour
  },
  // Cleanup settings
  CLEANUP: {
    intervalMs: 5 * 60 * 1000, // 5 minutes
    memoryRetentionMs: 60 * 60 * 1000, // 1 hour
    auditLogRetentionDays: 7,
  },
} as const

/**
 * Toggle to enable/disable rate limiting globally
 * Set RATE_LIMITING_ENABLED=false in environment to disable
 */
export const RATE_LIMITING_ENABLED = process.env.RATE_LIMITING_ENABLED !== 'false'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts?: number
  resetAt?: Date
  error?: string
}

export interface LockoutInfo {
  isLocked: boolean
  lockedUntil?: Date
  remainingMinutes?: number
}

interface AttemptRecord {
  timestamp: number
  success: boolean
}

type AttemptType = 'login-email' | 'login-ip' | 'signup-ip'

// ════════════════════════════════════════════════════════════════════════════
// IN-MEMORY RATE LIMIT STORE
// ════════════════════════════════════════════════════════════════════════════

/**
 * In-memory store for rate limiting
 * Structure: Map<identifier, Array<{timestamp, success}>>
 *
 * This store is intentionally in-memory (not shared across serverless instances).
 * On Vercel, each serverless function has its own memory space, and cold starts
 * reset the store. This actually provides better UX - rate limits are more lenient
 * due to distribution across instances and automatic reset on cold start.
 */
const rateLimitStore = new Map<string, AttemptRecord[]>()

/**
 * Start automatic cleanup of expired entries
 * Runs every 5 minutes to prevent memory leaks
 */
let cleanupInterval: NodeJS.Timeout | null = null

function startCleanup() {
  if (cleanupInterval) return // Already running

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    const retentionMs = RATE_LIMIT_CONFIG.CLEANUP.memoryRetentionMs

    for (const [identifier, attempts] of rateLimitStore.entries()) {
      // Remove attempts older than retention period
      const filtered = attempts.filter(
        attempt => now - attempt.timestamp < retentionMs
      )

      if (filtered.length === 0) {
        // No recent attempts - remove the identifier entirely
        rateLimitStore.delete(identifier)
      } else if (filtered.length !== attempts.length) {
        // Some attempts were removed - update the store
        rateLimitStore.set(identifier, filtered)
      }
    }
  }, RATE_LIMIT_CONFIG.CLEANUP.intervalMs)

  // Ensure cleanup stops when Node process exits
  if (typeof process !== 'undefined') {
    process.on('exit', () => {
      if (cleanupInterval) clearInterval(cleanupInterval)
    })
  }
}

// Start cleanup immediately when module loads
startCleanup()

// ════════════════════════════════════════════════════════════════════════════
// DUTCH ERROR MESSAGES
// ════════════════════════════════════════════════════════════════════════════

function formatMinutes(ms: number): number {
  return Math.ceil(ms / 60000)
}

export const DUTCH_ERRORS = {
  ACCOUNT_LOCKED: (minutes: number) =>
    `Je account is tijdelijk geblokkeerd vanwege te veel mislukte inlogpogingen. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.`,
  ACCOUNT_LOCKED_LONG: () =>
    'Je account is geblokkeerd. Probeer het later opnieuw of neem contact op met ondersteuning.',
  RATE_LIMIT_LOGIN_EMAIL: (minutes: number) =>
    `Te veel inlogpogingen. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.`,
  RATE_LIMIT_LOGIN_IP: (minutes: number) =>
    `Te veel inlogpogingen vanaf dit netwerk. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.`,
  RATE_LIMIT_SIGNUP: (minutes: number) =>
    `Te veel registratiepogingen. Probeer het over ${minutes} ${minutes === 1 ? 'minuut' : 'minuten'} opnieuw.`,
  INVALID_CREDENTIALS: () =>
    'Ongeldige inloggegevens',
}

// ════════════════════════════════════════════════════════════════════════════
// RATE LIMITING FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check if identifier is within rate limit
 * Uses sliding window algorithm
 *
 * @param identifier - Email, IP, or hashed identifier
 * @param type - Type of attempt (login-email, login-ip, signup-ip)
 * @param maxAttempts - Maximum allowed attempts
 * @param windowMs - Time window in milliseconds
 * @returns Rate limit result with allowed status and details
 */
export async function checkRateLimit(
  identifier: string,
  type: AttemptType,
  maxAttempts: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (!RATE_LIMITING_ENABLED) {
    return { allowed: true }
  }

  const now = Date.now()
  const key = `${type}:${identifier}`

  // Get existing attempts for this identifier
  const attempts = rateLimitStore.get(key) || []

  // Filter to only attempts within the time window (sliding window)
  const recentAttempts = attempts.filter(
    attempt => now - attempt.timestamp < windowMs
  )

  // Update store with filtered attempts
  rateLimitStore.set(key, recentAttempts)

  // Check if limit exceeded
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = recentAttempts[0]
    const resetAt = new Date(oldestAttempt.timestamp + windowMs)
    const remainingMs = resetAt.getTime() - now
    const remainingMinutes = formatMinutes(remainingMs)

    let error: string
    if (type === 'login-email') {
      error = DUTCH_ERRORS.RATE_LIMIT_LOGIN_EMAIL(remainingMinutes)
    } else if (type === 'login-ip') {
      error = DUTCH_ERRORS.RATE_LIMIT_LOGIN_IP(remainingMinutes)
    } else {
      error = DUTCH_ERRORS.RATE_LIMIT_SIGNUP(remainingMinutes)
    }

    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt,
      error,
    }
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - recentAttempts.length,
    resetAt: new Date(now + windowMs),
  }
}

/**
 * Record an authentication attempt
 * Stores in memory and optionally in database for audit trail
 *
 * @param identifier - Email or IP address
 * @param identifierType - 'email' or 'ip'
 * @param attemptType - 'login' or 'signup'
 * @param success - Whether attempt was successful
 * @param ipAddress - Optional IP address for context
 * @param userAgent - Optional user agent for context
 */
export async function recordAttempt(
  identifier: string,
  identifierType: 'email' | 'ip',
  attemptType: 'login' | 'signup',
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  if (!RATE_LIMITING_ENABLED) return

  const now = Date.now()
  // Determine the correct AttemptType based on attemptType and identifierType
  const type: AttemptType = attemptType === 'signup'
    ? 'signup-ip'
    : (identifierType === 'ip' ? 'login-ip' : 'login-email')
  const key = `${type}:${identifier}`

  // Update in-memory store
  const attempts = rateLimitStore.get(key) || []
  attempts.push({ timestamp: now, success })
  rateLimitStore.set(key, attempts)

  // Store in database for audit trail (async, non-blocking)
  // Don't await - we don't want DB issues to block auth flow
  prisma.authAttempt
    .create({
      data: {
        identifier,
        identifierType,
        attemptType,
        success,
        ipAddress,
        userAgent,
      },
    })
    .catch(err => {
      console.error('Failed to record auth attempt in database:', err)
    })
}

// ════════════════════════════════════════════════════════════════════════════
// ACCOUNT LOCKOUT FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Check if an account is currently locked
 *
 * @param email - User email address
 * @returns Lockout information
 */
export async function isAccountLocked(email: string): Promise<LockoutInfo> {
  if (!RATE_LIMITING_ENABLED) {
    return { isLocked: false }
  }

  const lockout = await prisma.accountLockout.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!lockout) {
    return { isLocked: false }
  }

  const now = new Date()
  const isLocked = lockout.lockedUntil > now

  if (!isLocked) {
    // Lockout has expired - clean it up
    await prisma.accountLockout.delete({
      where: { email: email.toLowerCase() },
    }).catch(err => {
      console.error('Failed to delete expired lockout:', err)
    })

    return { isLocked: false }
  }

  const remainingMs = lockout.lockedUntil.getTime() - now.getTime()
  const remainingMinutes = formatMinutes(remainingMs)

  return {
    isLocked: true,
    lockedUntil: lockout.lockedUntil,
    remainingMinutes,
  }
}

/**
 * Lock an account for a specified duration
 *
 * @param email - User email address
 * @param durationMs - Lockout duration in milliseconds
 */
export async function lockAccount(email: string, durationMs: number): Promise<void> {
  if (!RATE_LIMITING_ENABLED) return

  const now = new Date()
  const lockedUntil = new Date(now.getTime() + durationMs)

  await prisma.accountLockout.upsert({
    where: { email: email.toLowerCase() },
    create: {
      email: email.toLowerCase(),
      lockedUntil,
      failedAttempts: 1,
      lastFailedAt: now,
    },
    update: {
      lockedUntil,
      failedAttempts: { increment: 1 },
      lastFailedAt: now,
    },
  })
}

/**
 * Manually unlock an account
 * Useful for admin operations or after successful password reset
 *
 * @param email - User email address
 */
export async function unlockAccount(email: string): Promise<void> {
  await prisma.accountLockout.delete({
    where: { email: email.toLowerCase() },
  }).catch(() => {
    // Ignore error if lockout doesn't exist
  })
}

/**
 * Count recent failed login attempts for an email
 * Used to determine when to trigger account lockout
 *
 * @param email - User email address
 * @param windowMs - Time window to check (default: 15 minutes)
 * @returns Number of failed attempts
 */
export async function countRecentFailures(
  email: string,
  windowMs: number = RATE_LIMIT_CONFIG.LOCKOUT.threshold
): Promise<number> {
  if (!RATE_LIMITING_ENABLED) return 0

  const cutoff = new Date(Date.now() - windowMs)

  const count = await prisma.authAttempt.count({
    where: {
      identifier: email.toLowerCase(),
      identifierType: 'email',
      attemptType: 'login',
      success: false,
      createdAt: {
        gte: cutoff,
      },
    },
  })

  return count
}

/**
 * Reset rate limit for an identifier
 * Useful for testing or after successful authentication
 *
 * @param identifier - Email, IP, or hashed identifier
 * @param type - Type of rate limit to reset
 */
export function resetRateLimit(identifier: string, type: AttemptType): void {
  const key = `${type}:${identifier}`
  rateLimitStore.delete(key)
}

// ════════════════════════════════════════════════════════════════════════════
// AUDIT LOG CLEANUP
// ════════════════════════════════════════════════════════════════════════════

/**
 * Clean up old auth attempt records from database
 * Should be run periodically (e.g., daily via cron job)
 *
 * @param retentionDays - Number of days to keep records (default: 7)
 */
export async function cleanupAuditLog(
  retentionDays: number = RATE_LIMIT_CONFIG.CLEANUP.auditLogRetentionDays
): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)

  const result = await prisma.authAttempt.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  })

  return result.count
}
