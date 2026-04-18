import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { stars, comment, userId } = body

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: 'يرجى تقديم تقييم مابين 1 و 5 نجوم' },
        { status: 400 }
      )
    }

    const rating = await db.rating.create({
      data: {
        stars,
        comment: comment || null,
        userId: userId || null
      }
    })

    return NextResponse.json(rating)
  } catch (error) {
    console.error('Rating submission error:', error)
    return NextResponse.json(
      { error: 'فشل في إرسال التقييم' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const ratings = await db.rating.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    return NextResponse.json(ratings)
  } catch (error) {
    return NextResponse.json(
      { error: 'فشل في استرجاع التقييمات' },
      { status: 500 }
    )
  }
}
