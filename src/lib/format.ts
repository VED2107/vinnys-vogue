/** Format a value in the major currency unit (e.g. rupees). */
export function formatMoney(
  amount: number,
  currency: string = "INR",
) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
