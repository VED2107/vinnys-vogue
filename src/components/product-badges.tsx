export function ProductBadges({
  stock,
  isBestseller,
  isNew,
}: {
  stock: number;
  isBestseller: boolean;
  isNew: boolean;
}) {
  const badges: { label: string; bg: string; text: string }[] = [];

  if (stock <= 0) {
    badges.push({ label: "Out of Stock", bg: "bg-red-100", text: "text-red-700" });
  }

  if (isBestseller) {
    badges.push({ label: "Bestseller", bg: "bg-gold/10", text: "text-gold" });
  }

  if (isNew) {
    badges.push({ label: "New", bg: "bg-blue-50", text: "text-blue-700" });
  }

  if (stock > 0 && stock <= 2) {
    badges.push({ label: `Only ${stock} left`, bg: "bg-red-50", text: "text-red-700" });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${b.bg} ${b.text}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}

export function ProductCardBadges({
  stock,
  isBestseller,
  isNew,
}: {
  stock: number;
  isBestseller: boolean;
  isNew: boolean;
}) {
  const badges: { label: string; bg: string; text: string }[] = [];

  if (stock <= 0) {
    badges.push({ label: "Sold Out", bg: "bg-red-600/90", text: "text-white" });
  }

  if (isBestseller) {
    badges.push({ label: "Bestseller", bg: "bg-gold/90", text: "text-white" });
  }

  if (isNew) {
    badges.push({ label: "New", bg: "bg-blue-600/90", text: "text-white" });
  }

  if (stock > 0 && stock <= 2) {
    badges.push({ label: "Low Stock", bg: "bg-red-600/90", text: "text-white" });
  }

  if (badges.length === 0) return null;

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${b.bg} ${b.text}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
