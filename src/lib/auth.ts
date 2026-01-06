import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { AuthUser } from '@/types'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht')
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) {
          throw new Error('Ongeldige inloggegevens')
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isValidPassword) {
          throw new Error('Ongeldige inloggegevens')
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
