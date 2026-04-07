import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rooms = await db.room.findMany({
      include: {
        _count: {
          select: { lockers: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(rooms)
  } catch (error) {
    return NextResponse.json({ error: 'فشل في تحميل القاعات' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, capacity } = body

    if (!name || !capacity) {
      return NextResponse.json({ error: 'يرجى إدخال اسم القاعة والسعة' }, { status: 400 })
    }

    const room = await db.room.create({
      data: { name, description, capacity }
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في إنشاء القاعة' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'يرجى تحديد القاعة' }, { status: 400 })
    }

    await db.room.delete({ where: { id } })
    return NextResponse.json({ message: 'تم حذف القاعة بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في حذف القاعة' }, { status: 500 })
  }
}
