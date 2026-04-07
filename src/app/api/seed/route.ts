import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Clear existing data
    await db.booking.deleteMany()
    await db.seat.deleteMany()
    await db.room.deleteMany()
    await db.user.deleteMany()

    // Create rooms
    const rooms = await Promise.all([
      db.room.create({
        data: {
          name: 'قاعة المحاضرات ١',
          description: 'قاعة محاضرات رئيسية',
          capacity: 40
        }
      }),
      db.room.create({
        data: {
          name: 'المعمل ١',
          description: 'معمل حاسوب مجهز بأحدث الأجهزة',
          capacity: 40
        }
      }),
      db.room.create({
        data: {
          name: 'المكتبة',
          description: 'مكتبة الكلية مجهزة للاستخدام الذاتي',
          capacity: 40
        }
      })
    ])

    // Create seats for each room (5 rows × 8 columns = 40 seats)
    for (const room of rooms) {
      const seats = []
      for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 8; col++) {
          seats.push({
            seatNumber: (row - 1) * 8 + col,
            row,
            column: col,
            roomId: room.id,
            status: 'AVAILABLE'
          })
        }
      }
      await db.seat.createMany({ data: seats })
    }

    // Create sample users with hashed passwords
    const sampleUsers = [
      { name: 'فاطمة أحمد العلي', studentId: '44000001', email: 'fatma@tech.edu', phone: '0512345678', password: '123456' },
      { name: 'نورة سعد الغامدي', studentId: '44000002', email: 'noura@tech.edu', phone: '0523456789', password: '123456' },
      { name: 'ريم محمد القحطاني', studentId: '44000003', email: 'reem@tech.edu', phone: '0534567890', password: '123456' },
      { name: 'هند خالد الزهراني', studentId: '44000004', email: 'hind@tech.edu', phone: '0545678901', password: '123456' },
      { name: 'مريم عبدالله الشهري', studentId: '44000005', email: 'mariam@tech.edu', phone: '0556789012', password: '123456' },
      { name: 'أمل فهد المالكي', studentId: '44000006', email: 'amal@tech.edu', phone: '0567890123', password: '123456' },
      { name: 'سارة سلطان الدوسري', studentId: '44000007', email: 'sara@tech.edu', phone: '0578901234', password: '123456' },
      { name: 'لينا ناصر الحربي', studentId: '44000008', email: 'lina@tech.edu', phone: '0589012345', password: '123456' },
      { name: 'عائشة إبراهيم المطيري', studentId: '44000009', email: 'aisha@tech.edu', phone: '0590123456', password: '123456' },
      { name: 'دانة طارق السبيعي', studentId: '44000010', email: 'dana@tech.edu', phone: '0501234567', password: '123456' }
    ]

    const createdUsers = []
    for (const u of sampleUsers) {
      const hashedPassword = await bcrypt.hash(u.password, 12)
      const user = await db.user.create({
        data: {
          name: u.name,
          studentId: u.studentId,
          email: u.email,
          password: hashedPassword,
          phone: u.phone,
          role: 'STUDENT'
        }
      })
      createdUsers.push(user)
    }

    // Get all seats for creating bookings
    const allSeats = await db.seat.findMany()

    // Time slots
    const timeSlots = ['08:00 - 09:30', '09:30 - 11:00', '11:00 - 12:30', '13:00 - 14:30']

    // Create sample bookings
    const today = new Date()
    const bookings = []
    for (let i = 0; i < 10; i++) {
      const randomSeat = allSeats[Math.floor(Math.random() * allSeats.length)]
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)]
      const randomDate = new Date(today)
      randomDate.setDate(randomDate.getDate() + Math.floor(Math.random() * 7) - 2)
      const dateStr = randomDate.toISOString().split('T')[0]
      const randomTimeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)]
      const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'CANCELLED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Check for duplicates
      const exists = bookings.some(
        b => b.seatId === randomSeat.id && b.date === dateStr && b.timeSlot === randomTimeSlot
      )
      if (!exists) {
        bookings.push({
          userId: randomUser.id,
          seatId: randomSeat.id,
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
      seats: allSeats.length,
      users: createdUsers.length,
      bookings: bookings.length,
      note: 'كلمة المرور لجميع الحسابات: 123456'
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'فشل في إنشاء البيانات التجريبية' }, { status: 500 })
  }
}
