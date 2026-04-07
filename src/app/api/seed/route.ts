import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear existing data
    await db.booking.deleteMany()
    await db.locker.deleteMany()
    await db.room.deleteMany()
    await db.user.deleteMany()

    // Create rooms (Locker Areas)
    const rooms = await Promise.all([
      db.room.create({
        data: {
          name: 'منطقة اللواكر أ (الدور الأرضي)',
          description: 'منطقة لواكر رئيسية بسعة ٤٠ لوكر',
          capacity: 40
        }
      }),
      db.room.create({
        data: {
          name: 'منطقة اللواكر ب (الدور الأول)',
          description: 'منطقة لواكر مجهزة بخزائن حديثة',
          capacity: 40
        }
      }),
      db.room.create({
        data: {
          name: 'خزائن الصالة الرياضية',
          description: 'لواكر مخصصة لمستخدمي الصالة الرياضية',
          capacity: 40
        }
      })
    ])

    // Create lockers for each room (5 rows × 8 columns = 40 lockers)
    for (const room of rooms) {
      const lockers = []
      for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 8; col++) {
          lockers.push({
            lockerNumber: (row - 1) * 8 + col,
            row,
            column: col,
            roomId: room.id,
            status: 'AVAILABLE'
          })
        }
      }
      await db.locker.createMany({ data: lockers })
    }

    // Create sample users
    const arabicNames = [
      'فاطمة أحمد العلي', 'نورة سعد الغامدي', 'ريم محمد القحطاني',
      'هند خالد الزهراني', 'مريم عبدالله الشهري', 'أمل فهد المالكي',
      'سارة سلطان الدوسري', 'لينا ناصر الحربي', 'عائشة إبراهيم المطيري',
      'دانة طارق السبيعي'
    ]

    const users = []
    for (let i = 0; i < arabicNames.length; i++) {
      users.push({
        name: arabicNames[i],
        studentId: `4400${String(i + 1).padStart(4, '0')}`,
        phone: `05${String(Math.floor(Math.random() * 90000000 + 10000000))}`,
        role: 'STUDENT'
      })
    }
    await db.user.createMany({ data: users })

    // Get all items for creating bookings
    const allLockers = await db.locker.findMany()
    const allUsers = await db.user.findMany()

    // Time slots
    const timeSlots = ['08:00 - 09:30', '09:30 - 11:00', '11:00 - 12:30', '13:00 - 14:30']

    // Create sample bookings
    const today = new Date()
    const bookings = []
    for (let i = 0; i < 15; i++) {
      const randomLocker = allLockers[Math.floor(Math.random() * allLockers.length)]
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)]
      const randomDate = new Date(today)
      randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 7) - 2)
      const dateStr = randomDate.toISOString().split('T')[0]
      const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
      const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'CANCELLED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Check for duplicates
      const exists = bookings.some(
        b => b.lockerId === randomLocker.id && b.date === dateStr && b.timeSlot === randomTimeSlot
      )
      if (!exists) {
        bookings.push({
          userId: randomUser.id,
          lockerId: randomLocker.id,
          date: dateStr,
          timeSlot: randomTimeSlot,
          status
        })
      }
    }

    await db.booking.createMany({ data: bookings })

    return NextResponse.json({
      message: 'تم إنشاء البيانات التجريبية بنجاح',
      rooms: rooms.length,
      lockers: allLockers.length,
      users: allUsers.length,
      bookings: bookings.length
    })
  } catch (error) {
    return NextResponse.json({ error: 'فشل في إنشاء البيانات التجريبية' }, { status: 500 })
  }
}
