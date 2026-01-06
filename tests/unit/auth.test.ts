import { describe, it, expect } from 'vitest'
import bcrypt from 'bcrypt'

describe('Authentication', () => {
  describe('Password hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testPassword123'
      const hash = await bcrypt.hash(password, 12)

      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
    })

    it('should verify correct passwords', async () => {
      const password = 'testPassword123'
      const hash = await bcrypt.hash(password, 12)

      const isValid = await bcrypt.compare(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword'
      const hash = await bcrypt.hash(password, 12)

      const isValid = await bcrypt.compare(wrongPassword, hash)
      expect(isValid).toBe(false)
    })
  })
})
