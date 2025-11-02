import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth-simple'
import { 
  products, 
  transactions, 
  outgoingItems, 
  shifts, 
  expenses,
  users,
  categories
} from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'transactions'
    const format = searchParams.get('format') || 'csv'

    let csvContent = ''
    let fileName = ''

    switch (type) {
      case 'products':
        const productsData = await db.select({
          barcode: products.barcode,
          name: products.name,
          categoryId: products.categoryId,
          sellPrice: products.sellPrice,
          currentStock: products.currentStock,
          initialStock: products.initialStock,
          createdAt: products.createdAt
        }).from(products).orderBy(desc(products.createdAt))

        csvContent = 'Barcode,Nama Produk,Kategori ID,Harga Jual,Stok Saat Ini,Stok Awal,Tanggal Dibuat\n'
        csvContent += productsData.map(item => 
          `"${item.barcode}","${item.name}","${item.categoryId}",${item.sellPrice},${item.currentStock},${item.initialStock},"${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : ''}"`
        ).join('\n')
        fileName = `produk-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'transactions':
        const transactionsData = await db.select({
          code: transactions.code,
          transactionDate: transactions.transactionDate,
          totalItems: transactions.totalItems,
          cashAmount: transactions.cashAmount,
          transferAmount: transactions.transferAmount,
          bankName: transactions.bankName,
          paymentStatus: transactions.paymentStatus,
          createdAt: transactions.createdAt
        }).from(transactions).orderBy(desc(transactions.createdAt))

        csvContent = 'Kode Transaksi,Tanggal Transaksi,Total Item,Tunai,Transfer,Bank,Status,Tanggal Dibuat\n'
        csvContent += transactionsData.map(item => 
          `"${item.code}","${item.transactionDate ? new Date(item.transactionDate).toLocaleString('id-ID') : ''}",${item.totalItems},${item.cashAmount},${item.transferAmount},"${item.bankName || ''}","${item.paymentStatus}","${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : ''}"`
        ).join('\n')
        fileName = `transaksi-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'sales':
        const salesData = await db.select({
          transactionCode: outgoingItems.transactionCode,
          barcode: outgoingItems.barcode,
          productName: outgoingItems.productName,
          quantity: outgoingItems.quantity,
          price: outgoingItems.price,
          discountPercent: outgoingItems.discountPercent,
          discountAmount: outgoingItems.discountAmount,
          createdAt: outgoingItems.createdAt
        }).from(outgoingItems).orderBy(desc(outgoingItems.createdAt))

        csvContent = 'Kode Transaksi,Barcode,Nama Produk,Quantity,Harga,Diskon %,Diskon Rp,Tanggal\n'
        csvContent += salesData.map(item => 
          `"${item.transactionCode}","${item.barcode}","${item.productName}",${item.quantity},${item.price},${item.discountPercent || 0},${item.discountAmount || 0},"${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : ''}"`
        ).join('\n')
        fileName = `penjualan-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'shifts':
        const shiftsData = await db.select({
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
          userName: users.name
        }).from(shifts)
        .leftJoin(users, eq(shifts.userId, users.id))
        .orderBy(desc(shifts.createdAt))

        csvContent = 'ID Shift,Petugas,Waktu Mulai,Waktu Selesai,Kas Awal,Kas Akhir,Total Penjualan,Total Transaksi,Total Pengeluaran,Status,Catatan\n'
        csvContent += shiftsData.map(item => 
          `"${item.id}","${item.userName || 'Unknown'}","${new Date(item.startTime).toLocaleString('id-ID')}","${item.endTime ? new Date(item.endTime).toLocaleString('id-ID') : ''}",${item.startingCash},${item.endingCash || 0},${item.totalSales},${item.totalTransactions},${item.totalExpenses},"${item.status}","${item.notes || ''}"`
        ).join('\n')
        fileName = `shift-${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'expenses':
        const expensesData = await db.select({
          id: expenses.id,
          category: expenses.category,
          description: expenses.description,
          amount: expenses.amount,
          receipt: expenses.receipt,
          createdAt: expenses.createdAt,
          userName: users.name
        }).from(expenses)
        .leftJoin(users, eq(expenses.userId, users.id))
        .orderBy(desc(expenses.createdAt))

        csvContent = 'ID,Kategori,Deskripsi,Jumlah,Nota,Petugas,Tanggal\n'
        csvContent += expensesData.map(item => 
          `"${item.id}","${item.category}","${item.description}",${item.amount},"${item.receipt || ''}","${item.userName || 'Unknown'}","${item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : ''}"`
        ).join('\n')
        fileName = `pengeluaran-${new Date().toISOString().split('T')[0]}.csv`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'