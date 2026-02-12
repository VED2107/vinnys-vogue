export function formatMoneyFromCents(
  cents: number,
  currency: string = "INR",
) {
  const amount = cents / 100;

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

/** Format a value already in the major currency unit (e.g. rupees, not paise). */
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
