/**
 * Format number to Indonesian currency format (using dots as thousand separator)
 * Example: 150000 -> "150.000"
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('id-ID')
}

/**
 * Format number to Indonesian number format (using dots as thousand separator)
 * Example: 1500 -> "1.500"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID')
}

/**
 * Format price with Rp prefix
 * Example: 150000 -> "Rp 150.000"
 */
export function formatPrice(amount: number): string {
  return `Rp ${formatCurrency(amount)}`
}

/**
 * Format price without space (for compact display)
 * Example: 150000 -> "Rp150.000"
 */
export function formatPriceCompact(amount: number): string {
  return `Rp${formatCurrency(amount)}`
}