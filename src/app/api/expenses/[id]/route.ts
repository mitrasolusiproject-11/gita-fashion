import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { expenses } from '@/lib/schema'
import { getSession } from '@/lib/auth-simple'
import { eq } from 'drizzle-orm'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if expense exists and user has permission
    const [expense] = await db.select()
      .from(expenses)
      .where(eq(expenses.id, id))
      .limit(1)

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    // Only admin or the user who created the expense can delete it
    if (session.role !== 'ADMIN' && expense.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the expense
    await db.delete(expenses).where(eq(expenses.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'