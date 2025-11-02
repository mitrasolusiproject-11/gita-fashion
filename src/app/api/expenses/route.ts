import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { expenses, shifts } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq, and, gte, lte, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = db.select().from(expenses)

    if (shiftId) {
      query = query.where(eq(expenses.shiftId, shiftId))
    } else if (startDate && endDate) {
      query = query.where(and(
        gte(expenses.createdAt, new Date(startDate)),
        lte(expenses.createdAt, new Date(endDate))
      ))
    } else {
      // Default: expenses from today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      query = query.where(and(
        gte(expenses.createdAt, today),
        lte(expenses.createdAt, tomorrow)
      ))
    }

    const allExpenses = await query.orderBy(desc(expenses.createdAt))

    return NextResponse.json(allExpenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
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
    const { category, description, amount, receipt } = body

    // Get current open shift
    const [currentShift] = await db.select()
      .from(shifts)
      .where(and(
        eq(shifts.userId, session.id),
        eq(shifts.status, 'OPEN')
      ))
      .limit(1)

    const [newExpense] = await db.insert(expenses).values({
      shiftId: currentShift?.id || null,
      userId: session.id,
      category,
      description,
      amount,
      receipt: receipt || null
    }).returning()

    return NextResponse.json(newExpense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'