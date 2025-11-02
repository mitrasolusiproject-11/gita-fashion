import bcrypt from 'bcryptjs'
import { db } from './db'
import { users, categories, products, transactions, outgoingItems } from './schema'
import { eq } from 'drizzle-orm'

async function seed() {
    console.log('🌱 Seeding database...')

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 10)
    await db.insert(users).values({
        email: 'admin@gitafashion.com',
        name: 'Administrator',
        password: hashedAdminPassword,
        role: 'ADMIN'
    }).onConflictDoNothing()

    // Create cashier user
    const hashedCashierPassword = await bcrypt.hash('kasir123', 10)
    await db.insert(users).values({
        email: 'kasir@gitafashion.com',
        name: 'Kasir 1',
        password: hashedCashierPassword,
        role: 'CASHIER'
    }).onConflictDoNothing()

    // Create categories
    const categoryData = [
        { name: 'Atasan' },
        { name: 'Bawahan' },
        { name: 'Dress' },
        { name: 'Aksesoris' },
        { name: 'Sepatu' }
    ]

    for (const category of categoryData) {
        await db.insert(categories).values(category).onConflictDoNothing()
    }

    // Get categories for products
    const allCategories = await db.select().from(categories)
    const atasanCategory = allCategories.find(c => c.name === 'Atasan')
    const bawahanCategory = allCategories.find(c => c.name === 'Bawahan')
    const dressCategory = allCategories.find(c => c.name === 'Dress')

    // Create sample products
    if (atasanCategory && bawahanCategory && dressCategory) {
        const productData = [
            {
                barcode: 'GF001001',
                name: 'Kemeja Putih Formal',
                categoryId: atasanCategory.id,
                initialStock: 50,
                currentStock: 45,
                sellPrice: 85000
            },
            {
                barcode: 'GF001002',
                name: 'Blouse Casual Biru',
                categoryId: atasanCategory.id,
                initialStock: 30,
                currentStock: 28,
                sellPrice: 65000
            },
            {
                barcode: 'GF002001',
                name: 'Celana Jeans Slim Fit',
                categoryId: bawahanCategory.id,
                initialStock: 25,
                currentStock: 20,
                sellPrice: 120000
            },
            {
                barcode: 'GF002002',
                name: 'Rok Mini Hitam',
                categoryId: bawahanCategory.id,
                initialStock: 20,
                currentStock: 18,
                sellPrice: 75000
            },
            {
                barcode: 'GF003001',
                name: 'Dress Maxi Floral',
                categoryId: dressCategory.id,
                initialStock: 15,
                currentStock: 12,
                sellPrice: 150000
            }
        ]

        for (const product of productData) {
            await db.insert(products).values(product).onConflictDoNothing()
        }
    }

    // Create sample transactions
    const adminUser = await db.select().from(users).where(eq(users.email, 'admin@gitafashion.com')).limit(1)
    
    if (adminUser.length > 0) {
        // Sample transaction 1
        const transaction1Code = 'TRX001'
        await db.insert(transactions).values({
            code: transaction1Code,
            totalItems: 2,
            cashAmount: 150000,
            transferAmount: 0,
            paymentStatus: 'PAID',
            userId: adminUser[0].id
        }).onConflictDoNothing()

        // Sample outgoing items for transaction 1
        await db.insert(outgoingItems).values([
            {
                barcode: 'GF001001',
                productName: 'Kemeja Putih Formal',
                quantity: 1,
                transactionCode: transaction1Code,
                price: 85000,
                discountPercent: 0,
                discountAmount: 0
            },
            {
                barcode: 'GF001002',
                productName: 'Blouse Casual Biru',
                quantity: 1,
                transactionCode: transaction1Code,
                price: 65000,
                discountPercent: 0,
                discountAmount: 0
            }
        ]).onConflictDoNothing()

        // Sample transaction 2
        const transaction2Code = 'TRX002'
        await db.insert(transactions).values({
            code: transaction2Code,
            totalItems: 1,
            cashAmount: 0,
            transferAmount: 120000,
            bankName: 'BCA',
            paymentStatus: 'PAID',
            userId: adminUser[0].id
        }).onConflictDoNothing()

        // Sample outgoing items for transaction 2
        await db.insert(outgoingItems).values({
            barcode: 'GF002001',
            productName: 'Celana Jeans Slim Fit',
            quantity: 1,
            transactionCode: transaction2Code,
            price: 120000,
            discountPercent: 0,
            discountAmount: 0
        }).onConflictDoNothing()
    }

    console.log('✅ Database seeded successfully!')
    console.log('👤 Admin login: admin@gitafashion.com / admin123')
    console.log('👤 Cashier login: kasir@gitafashion.com / kasir123')
}

seed().catch(console.error)