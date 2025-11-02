import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { shifts, transactions, expenses, users } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq, and, gte, lte, sum, count, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const baseQuery = db.select({
      id: shifts.id,
      userId: shifts.userId,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      startingCash: shifts.startingCash,
      endingCash: shifts.endingCash,
      totalSales: shifts.totalSales,
      totalTransactions: shifts.totalTransactions,
      totalExpenses: shifts.totalExpenses,
      status: shifts.status,
      notes: shifts.notes,
      createdAt: shifts.createdAt,
      updatedAt: shifts.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    }).from(shifts).leftJoin(users, eq(shifts.userId, users.id))

    let allShifts
    if (status) {
      allShifts = await baseQuery.where(eq(shifts.status, status as 'OPEN' | 'CLOSED')).orderBy(desc(shifts.createdAt))
    } else {
      allShifts = await baseQuery.orderBy(desc(shifts.createdAt))
    }

    return NextResponse.json(allShifts)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, startingCash, endingCash, notes } = body

    if (action === 'start') {
      // Check if user already has an open shift
      const [existingShift] = await db.select()
        .from(shifts)
        .where(and(
          eq(shifts.userId, session.id),
          eq(shifts.status, 'OPEN')
        ))
        .limit(1)

      if (existingShift) {
        return NextResponse.json({ error: 'You already have an open shift' }, { status: 400 })
      }

      // Create new shift
      const [newShift] = await db.insert(shifts).values({
        userId: session.id,
        startTime: new Date(),
        startingCash: startingCash || 0,
        status: 'OPEN'
      }).returning()

      return NextResponse.json(newShift, { status: 201 })
    }

    if (action === 'close') {
      // Find open shift for user
      const [openShift] = await db.select()
        .from(shifts)
        .where(and(
          eq(shifts.userId, session.id),
          eq(shifts.status, 'OPEN')
        ))
        .limit(1)

      if (!openShift) {
        return NextResponse.json({ error: 'No open shift found' }, { status: 400 })
      }

      // Calculate shift statistics
      const shiftStart = openShift.startTime
      const shiftEnd = new Date()

      // Get transactions during this shift
      const shiftTransactions = await db.select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, session.id),
          gte(transactions.createdAt, shiftStart),
          lte(transactions.createdAt, shiftEnd)
        ))

      const totalSales = shiftTransactions.reduce((sum, t) => sum + t.cashAmount + t.transferAmount, 0)
      const totalTransactions = shiftTransactions.length

      // Get expenses during this shift
      const shiftExpenses = await db.select()
        .from(expenses)
        .where(and(
          eq(expenses.userId, session.id),
          gte(expenses.createdAt, shiftStart),
          lte(expenses.createdAt, shiftEnd)
        ))

      const totalExpenses = shiftExpenses.reduce((sum, e) => sum + e.amount, 0)

      // Update shift
      const [closedShift] = await db.update(shifts)
        .set({
          endTime: shiftEnd,
          endingCash: endingCash || 0,
          totalSales,
          totalTransactions,
          totalExpenses,
          status: 'CLOSED',
          notes: notes || null,
          updatedAt: new Date()
        })
        .where(eq(shifts.id, openShift.id))
        .returning()

      return NextResponse.json({
        shift: closedShift,
        summary: {
          totalSales,
          totalTransactions,
          totalExpenses,
          netCash: (openShift.startingCash + totalSales) - totalExpenses,
          actualCash: endingCash || 0,
          difference: (endingCash || 0) - ((openShift.startingCash + totalSales) - totalExpenses)
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'