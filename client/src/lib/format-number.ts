/**
 * Formats a number with abbreviation (K, M, B) for compact display
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "4.9K", "1.2M")
 */
export function formatCompactNumber(num: number, decimals: number = 1): string {
  if (num < 1000) {
    return num.toString();
  }
  
  const units = ['', 'K', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const unit = units[magnitude];
  const scaled = num / Math.pow(1000, magnitude);
  
  // Remove unnecessary decimals (e.g., 5.0K → 5K)
  const formatted = scaled.toFixed(decimals);
  const cleaned = formatted.replace(/\.0+$/, '');
  
  return `${cleaned}${unit}`;
}
