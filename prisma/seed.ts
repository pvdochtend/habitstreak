import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create test user with known credentials
  const testUserEmail = 'test@habitstreak.test'
  const testUserPassword = 'TestPassword123!'

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: testUserEmail }
  })

  if (existingUser) {
    console.log('Test user already exists:', testUserEmail)
    return
  }

  // Hash password
  const passwordHash = await bcrypt.hash(testUserPassword, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email: testUserEmail,
      passwordHash,
      dailyTarget: 1,
      colorScheme: 'blue',
      darkMode: false,
    }
  })

  console.log('✓ Created test user:', testUserEmail)
  console.log('  Password:', testUserPassword)
  console.log('  User ID:', user.id)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
