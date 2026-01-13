import { NextRequest } from 'next/server'
import { createHash } from 'crypto'

/**
 * Extract the real client IP address from a NextRequest
 * Vercel-aware: handles x-forwarded-for and x-real-ip headers
 *
 * Priority order:
 * 1. x-real-ip header (most reliable on Vercel)
 * 2. First IP in x-forwarded-for header
 * 3. Fallback to localhost for development
 *
 * @param request - NextRequest object
 * @returns Client IP address as string
 */
export function getClientIp(request: NextRequest): string {
  // Try x-real-ip header (Vercel provides this)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Try x-forwarded-for header (standard proxy header)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    // We want the first one (the original client)
    const firstIp = forwardedFor.split(',')[0].trim()
    if (firstIp) {
      return firstIp
    }
  }

  // Fallback for local development
  // In production on Vercel, one of the above headers will always be present
  return '127.0.0.1'
}

/**
 * Generate a unique client identifier combining IP and user agent
 * This helps differentiate between users on shared IPs (e.g., office networks)
 * while still allowing rate limiting
 *
 * @param request - NextRequest object
 * @returns Hashed identifier string (SHA256)
 */
export function getClientIdentifier(request: NextRequest): string {
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Create a hash combining IP + user agent
  // This provides better granularity than IP alone while preserving privacy
  const identifier = `${ip}:${userAgent}`

  return createHash('sha256').update(identifier).digest('hex')
}

/**
 * Validate if an IP address is in valid format
 * Supports both IPv4 and IPv6
 *
 * @param ip - IP address string
 * @returns true if valid IP format
 */
export function isValidIp(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/

  // IPv6 regex (simplified - covers most cases)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/

  if (ipv4Regex.test(ip)) {
    // Additional validation for IPv4: each octet should be 0-255
    const octets = ip.split('.')
    return octets.every(octet => {
      const num = parseInt(octet, 10)
      return num >= 0 && num <= 255
    })
  }

  return ipv6Regex.test(ip)
}

/**
 * Check if IP address is localhost/loopback
 * Useful for skipping rate limiting in development
 *
 * @param ip - IP address string
 * @returns true if localhost
 */
export function isLocalhost(ip: string): boolean {
  return ip === '127.0.0.1' ||
         ip === 'localhost' ||
         ip === '::1' ||
         ip === '::ffff:127.0.0.1'
}
