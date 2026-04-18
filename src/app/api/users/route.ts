import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const activeSession = await db.user.findFirst({
      where: { id: token, role: 'ADMIN' }
    })

    if (!activeSession) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        studentId: true,
        phone: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { error: 'فشل في استرجاع المستخدمين' },
      { status: 500 }
    )
  }
}
