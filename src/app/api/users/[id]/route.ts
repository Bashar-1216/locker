import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const adminSession = await db.user.findFirst({
      where: { id: token, role: 'ADMIN' }
    })

    if (!adminSession) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    if (!role || (role !== 'ADMIN' && role !== 'STUDENT')) {
      return NextResponse.json({ error: 'صلاحية غير صالحة' }, { status: 400 })
    }

    // Prevent removing own admin privileges to avoid lockout accidentally
    if (params.id === adminSession.id && role === 'STUDENT') {
        return NextResponse.json({ error: 'لا يمكنك سحب صلاحية المدير من نفسك' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!targetUser) {
       return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, name: true, role: true }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { error: 'فشل في تحديث الصلاحيات' },
      { status: 500 }
    )
  }
}
