import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'locker-booking-secret-key-2024'

export interface JwtPayload {
  userId: string
  email?: string | null
  role: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}
