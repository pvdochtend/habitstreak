import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  checkRateLimit,
  recordAttempt,
  resetRateLimit,
  isAccountLocked,
  lockAccount,
  unlockAccount,
  RATE_LIMIT_CONFIG,
  DUTCH_ERRORS,
} from '@/lib/rate-limit'
import {
  getClientIp,
  getClientIdentifier,
  isValidIp,
  isLocalhost,
} from '@/lib/ip-utils'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    authAttempt: {
      create: vi.fn().mockResolvedValue({}),
      count: vi.fn().mockResolvedValue(0),
    },
    accountLockout: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    },
  },
}))

// Import mocked prisma
import { prisma } from '@/lib/prisma'

describe('IP Utilities', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-real-ip header', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
          'x-forwarded-for': '10.0.0.1',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.100')
    })

    it('should extract IP from x-forwarded-for header if x-real-ip is not present', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.100')
    })

    it('should return first IP from x-forwarded-for with multiple IPs', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.100')
    })

    it('should fallback to localhost if no headers present', () => {
      const request = new NextRequest('http://localhost:3000')

      expect(getClientIp(request)).toBe('127.0.0.1')
    })

    it('should handle whitespace in x-forwarded-for', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '  192.168.1.100  , 10.0.0.1',
        },
      })

      expect(getClientIp(request)).toBe('192.168.1.100')
    })
  })

  describe('getClientIdentifier', () => {
    it('should create consistent hash for same IP and user agent', () => {
      const request1 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const request2 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const hash1 = getClientIdentifier(request1)
      const hash2 = getClientIdentifier(request2)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA256 hex length
    })

    it('should create different hash for different IPs', () => {
      const request1 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const request2 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.101',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const hash1 = getClientIdentifier(request1)
      const hash2 = getClientIdentifier(request2)

      expect(hash1).not.toBe(hash2)
    })

    it('should create different hash for different user agents', () => {
      const request1 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
          'user-agent': 'Mozilla/5.0',
        },
      })

      const request2 = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
          'user-agent': 'Chrome/91.0',
        },
      })

      const hash1 = getClientIdentifier(request1)
      const hash2 = getClientIdentifier(request2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle missing user-agent', () => {
      const request = new NextRequest('http://localhost:3000', {
        headers: {
          'x-real-ip': '192.168.1.100',
        },
      })

      const hash = getClientIdentifier(request)
      expect(hash).toHaveLength(64)
    })
  })

  describe('isValidIp', () => {
    it('should validate correct IPv4 addresses', () => {
      expect(isValidIp('192.168.1.1')).toBe(true)
      expect(isValidIp('10.0.0.1')).toBe(true)
      expect(isValidIp('127.0.0.1')).toBe(true)
      expect(isValidIp('255.255.255.255')).toBe(true)
      expect(isValidIp('0.0.0.0')).toBe(true)
    })

    it('should reject invalid IPv4 addresses', () => {
      expect(isValidIp('256.1.1.1')).toBe(false) // Octet > 255
      expect(isValidIp('192.168.1')).toBe(false) // Too few octets
      expect(isValidIp('192.168.1.1.1')).toBe(false) // Too many octets
      expect(isValidIp('abc.def.ghi.jkl')).toBe(false) // Non-numeric
      expect(isValidIp('192.168.-1.1')).toBe(false) // Negative
    })

    it('should validate correct IPv6 addresses', () => {
      expect(isValidIp('::1')).toBe(true)
      expect(isValidIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true)
      expect(isValidIp('2001:db8::1')).toBe(true)
      expect(isValidIp('::ffff:192.0.2.1')).toBe(false) // Simplified check doesn't handle this
    })

    it('should reject completely invalid formats', () => {
      expect(isValidIp('not-an-ip')).toBe(false)
      expect(isValidIp('')).toBe(false)
      expect(isValidIp('localhost')).toBe(false)
    })
  })

  describe('isLocalhost', () => {
    it('should identify localhost addresses', () => {
      expect(isLocalhost('127.0.0.1')).toBe(true)
      expect(isLocalhost('localhost')).toBe(true)
      expect(isLocalhost('::1')).toBe(true)
      expect(isLocalhost('::ffff:127.0.0.1')).toBe(true)
    })

    it('should reject non-localhost addresses', () => {
      expect(isLocalhost('192.168.1.1')).toBe(false)
      expect(isLocalhost('10.0.0.1')).toBe(false)
      expect(isLocalhost('8.8.8.8')).toBe(false)
    })
  })
})

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    // Reset all rate limit stores
    resetRateLimit('test@example.com', 'login-email')
    resetRateLimit('192.168.1.1', 'login-ip')
    resetRateLimit('192.168.1.1', 'signup-ip')
  })

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const result = await checkRateLimit('test@example.com', 'login-email', 5, 15 * 60 * 1000)

      expect(result.allowed).toBe(true)
      expect(result.remainingAttempts).toBe(5) // No attempts yet
    })

    it('should block requests over the limit', async () => {
      const identifier = 'test@example.com'
      const maxAttempts = 3
      const windowMs = 15 * 60 * 1000

      // Make 3 failed attempts (record them to increment counter)
      for (let i = 0; i < maxAttempts; i++) {
        await recordAttempt(identifier, 'email', 'login', false)
      }

      // 4th check should be blocked
      const result = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(result.allowed).toBe(false)
      expect(result.remainingAttempts).toBe(0)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Te veel inlogpogingen')
    })

    it('should use sliding window (old attempts expire)', async () => {
      const identifier = 'test@example.com'
      const maxAttempts = 3
      const windowMs = 1000 // 1 second for testing

      // Make 3 failed attempts (reach limit)
      for (let i = 0; i < maxAttempts; i++) {
        await recordAttempt(identifier, 'email', 'login', false)
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should allow request again after window expires
      const result = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(result.allowed).toBe(true)
    })

    it('should track different identifiers independently', async () => {
      const maxAttempts = 3
      const windowMs = 15 * 60 * 1000

      // Make 3 failed attempts for email1 (reach limit)
      for (let i = 0; i < maxAttempts; i++) {
        await recordAttempt('email1@example.com', 'email', 'login', false)
      }

      // email1 should be blocked
      const result1 = await checkRateLimit('email1@example.com', 'login-email', maxAttempts, windowMs)
      expect(result1.allowed).toBe(false)

      // email2 should still be allowed
      const result2 = await checkRateLimit('email2@example.com', 'login-email', maxAttempts, windowMs)
      expect(result2.allowed).toBe(true)
    })

    it('should provide different error messages for different types', async () => {
      const maxAttempts = 1
      const windowMs = 15 * 60 * 1000

      // Reach limit for email
      await recordAttempt('test@example.com', 'email', 'login', false)
      const emailResult = await checkRateLimit('test@example.com', 'login-email', maxAttempts, windowMs)
      expect(emailResult.allowed).toBe(false)
      expect(emailResult.error).toBeDefined()
      if (emailResult.error) {
        expect(emailResult.error).toContain('Te veel inlogpogingen')
      }

      // Reach limit for IP (login)
      await recordAttempt('192.168.1.1', 'ip', 'login', false)
      const ipResult = await checkRateLimit('192.168.1.1', 'login-ip', maxAttempts, windowMs)
      expect(ipResult.allowed).toBe(false)
      expect(ipResult.error).toBeDefined()
      if (ipResult.error) {
        expect(ipResult.error).toContain('vanaf dit netwerk')
      }

      // Reach limit for signup
      await recordAttempt('192.168.1.2', 'ip', 'signup', false)
      const signupResult = await checkRateLimit('192.168.1.2', 'signup-ip', maxAttempts, windowMs)
      expect(signupResult.allowed).toBe(false)
      expect(signupResult.error).toBeDefined()
      if (signupResult.error) {
        expect(signupResult.error).toContain('registratiepogingen')
      }
    })

    it('should calculate correct remaining attempts', async () => {
      const identifier = 'test@example.com'
      const maxAttempts = 5
      const windowMs = 15 * 60 * 1000

      // No attempts yet
      const result0 = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(result0.remainingAttempts).toBe(5) // 5 - 0

      // Record first attempt
      await recordAttempt(identifier, 'email', 'login', false)
      const result1 = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(result1.remainingAttempts).toBe(4) // 5 - 1

      // Record second attempt
      await recordAttempt(identifier, 'email', 'login', false)
      const result2 = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(result2.remainingAttempts).toBe(3) // 5 - 2

      // Record third attempt
      await recordAttempt(identifier, 'email', 'login', false)
      const result3 = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(result3.remainingAttempts).toBe(2) // 5 - 3
    })
  })

  describe('resetRateLimit', () => {
    it('should reset rate limit for identifier', async () => {
      const identifier = 'test@example.com'
      const maxAttempts = 3
      const windowMs = 15 * 60 * 1000

      // Make 3 failed attempts (reach limit)
      for (let i = 0; i < maxAttempts; i++) {
        await recordAttempt(identifier, 'email', 'login', false)
      }

      // Should be blocked
      const blocked = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(blocked.allowed).toBe(false)

      // Reset
      resetRateLimit(identifier, 'login-email')

      // Should be allowed again
      const allowed = await checkRateLimit(identifier, 'login-email', maxAttempts, windowMs)
      expect(allowed.allowed).toBe(true)
    })
  })
})

describe('Account Lockout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isAccountLocked', () => {
    it('should return not locked when no lockout exists', async () => {
      vi.mocked(prisma.accountLockout.findUnique).mockResolvedValue(null)

      const result = await isAccountLocked('test@example.com')

      expect(result.isLocked).toBe(false)
      expect(result.lockedUntil).toBeUndefined()
      expect(result.remainingMinutes).toBeUndefined()
    })

    it('should return locked when lockout is active', async () => {
      const futureDate = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

      vi.mocked(prisma.accountLockout.findUnique).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        lockedUntil: futureDate,
        failedAttempts: 5,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await isAccountLocked('test@example.com')

      expect(result.isLocked).toBe(true)
      expect(result.lockedUntil).toEqual(futureDate)
      expect(result.remainingMinutes).toBeGreaterThan(0)
    })

    it('should return not locked and clean up when lockout has expired', async () => {
      const pastDate = new Date(Date.now() - 1000) // 1 second ago

      vi.mocked(prisma.accountLockout.findUnique).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        lockedUntil: pastDate,
        failedAttempts: 5,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      vi.mocked(prisma.accountLockout.delete).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        lockedUntil: pastDate,
        failedAttempts: 5,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await isAccountLocked('test@example.com')

      expect(result.isLocked).toBe(false)
      expect(prisma.accountLockout.delete).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })

    it('should normalize email to lowercase', async () => {
      vi.mocked(prisma.accountLockout.findUnique).mockResolvedValue(null)

      await isAccountLocked('Test@Example.COM')

      expect(prisma.accountLockout.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })
  })

  describe('lockAccount', () => {
    it('should create new lockout for new email', async () => {
      const email = 'test@example.com'
      const durationMs = 15 * 60 * 1000

      vi.mocked(prisma.accountLockout.upsert).mockResolvedValue({
        id: '1',
        email,
        lockedUntil: new Date(Date.now() + durationMs),
        failedAttempts: 1,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await lockAccount(email, durationMs)

      expect(prisma.accountLockout.upsert).toHaveBeenCalled()
      const call = vi.mocked(prisma.accountLockout.upsert).mock.calls[0][0]
      expect(call.where.email).toBe(email)
      expect(call.create.email).toBe(email)
    })

    it('should increment failed attempts for existing lockout', async () => {
      const email = 'test@example.com'
      const durationMs = 15 * 60 * 1000

      vi.mocked(prisma.accountLockout.upsert).mockResolvedValue({
        id: '1',
        email,
        lockedUntil: new Date(Date.now() + durationMs),
        failedAttempts: 2,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await lockAccount(email, durationMs)

      expect(prisma.accountLockout.upsert).toHaveBeenCalled()
      const call = vi.mocked(prisma.accountLockout.upsert).mock.calls[0][0]
      expect(call.update.failedAttempts).toEqual({ increment: 1 })
    })

    it('should normalize email to lowercase', async () => {
      vi.mocked(prisma.accountLockout.upsert).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        lockedUntil: new Date(),
        failedAttempts: 1,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await lockAccount('Test@Example.COM', 15 * 60 * 1000)

      const call = vi.mocked(prisma.accountLockout.upsert).mock.calls[0][0]
      expect(call.where.email).toBe('test@example.com')
    })
  })

  describe('unlockAccount', () => {
    it('should delete lockout record', async () => {
      const email = 'test@example.com'

      vi.mocked(prisma.accountLockout.delete).mockResolvedValue({
        id: '1',
        email,
        lockedUntil: new Date(),
        failedAttempts: 5,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await unlockAccount(email)

      expect(prisma.accountLockout.delete).toHaveBeenCalledWith({
        where: { email },
      })
    })

    it('should handle non-existent lockout gracefully', async () => {
      vi.mocked(prisma.accountLockout.delete).mockRejectedValue(new Error('Not found'))

      // Should not throw
      await expect(unlockAccount('test@example.com')).resolves.toBeUndefined()
    })

    it('should normalize email to lowercase', async () => {
      vi.mocked(prisma.accountLockout.delete).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        lockedUntil: new Date(),
        failedAttempts: 5,
        lastFailedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await unlockAccount('Test@Example.COM')

      expect(prisma.accountLockout.delete).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
    })
  })
})

describe('Dutch Error Messages', () => {
  it('should format account lockout message with singular minute', () => {
    const message = DUTCH_ERRORS.ACCOUNT_LOCKED(1)
    expect(message).toContain('1 minuut')
    expect(message).not.toContain('minuten')
  })

  it('should format account lockout message with plural minutes', () => {
    const message = DUTCH_ERRORS.ACCOUNT_LOCKED(15)
    expect(message).toContain('15 minuten')
  })

  it('should format rate limit messages correctly', () => {
    expect(DUTCH_ERRORS.RATE_LIMIT_LOGIN_EMAIL(5)).toContain('5 minuten')
    expect(DUTCH_ERRORS.RATE_LIMIT_LOGIN_IP(10)).toContain('10 minuten')
    expect(DUTCH_ERRORS.RATE_LIMIT_SIGNUP(60)).toContain('60 minuten')
  })

  it('should provide generic invalid credentials message', () => {
    const message = DUTCH_ERRORS.INVALID_CREDENTIALS()
    expect(message).toBe('Ongeldige inloggegevens')
  })
})

describe('Rate Limit Configuration', () => {
  it('should have correct login email limits', () => {
    expect(RATE_LIMIT_CONFIG.LOGIN_EMAIL.maxAttempts).toBe(5)
    expect(RATE_LIMIT_CONFIG.LOGIN_EMAIL.windowMs).toBe(15 * 60 * 1000)
  })

  it('should have correct login IP limits', () => {
    expect(RATE_LIMIT_CONFIG.LOGIN_IP.maxAttempts).toBe(15)
    expect(RATE_LIMIT_CONFIG.LOGIN_IP.windowMs).toBe(15 * 60 * 1000)
  })

  it('should have correct signup IP limits', () => {
    expect(RATE_LIMIT_CONFIG.SIGNUP_IP.maxAttempts).toBe(3)
    expect(RATE_LIMIT_CONFIG.SIGNUP_IP.windowMs).toBe(60 * 60 * 1000)
  })

  it('should have correct lockout settings', () => {
    expect(RATE_LIMIT_CONFIG.LOCKOUT.threshold).toBe(5)
    expect(RATE_LIMIT_CONFIG.LOCKOUT.durationMs).toBe(15 * 60 * 1000)
  })
})
