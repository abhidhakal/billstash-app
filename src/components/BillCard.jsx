import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, UtensilsCrossed, Zap, Car, ShoppingBag,
  Heart, Film, GraduationCap, Home, MoreHorizontal, Receipt,
} from 'lucide-react';

const iconMap = {
  groceries: ShoppingCart,
  dining: UtensilsCrossed,
  utilities: Zap,
  transport: Car,
  shopping: ShoppingBag,
  healthcare: Heart,
  entertainment: Film,
  education: GraduationCap,
  rent: Home,
  other: MoreHorizontal,
};

function formatAmount(amount) {
  if (amount == null) return 'Rs. 0';
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BillCard({ bill }) {
  const navigate = useNavigate();
  const IconComponent = iconMap[bill.category] || Receipt;

  return (
    <div
      className="flex items-center gap-3 py-3 border-b border-[var(--border-light)] last:border-b-0 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => navigate(`/bills/${bill.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/bills/${bill.id}`)}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
        <IconComponent size={18} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{bill.merchant || 'Unknown'}</span>
        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(bill.date)}</span>
      </div>
      <div className="font-bold text-sm text-[var(--text-primary)] text-right shrink-0">
        {formatAmount(bill.amount)}
      </div>
    </div>
  );
}
