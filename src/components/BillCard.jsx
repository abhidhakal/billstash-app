import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, UtensilsCrossed, Zap, Car, ShoppingBag,
  Heart, Film, GraduationCap, Home, MoreHorizontal, Receipt,
} from 'lucide-react';
import './BillCard.css';

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
      className="bill-card"
      onClick={() => navigate(`/bills/${bill.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/bills/${bill.id}`)}
    >
      <div className="bill-card-icon">
        <IconComponent size={18} strokeWidth={1.5} />
      </div>
      <div className="bill-card-info">
        <span className="bill-card-merchant">{bill.merchant || 'Unknown'}</span>
        <span className="bill-card-date">{formatDate(bill.date)}</span>
      </div>
      <div className="bill-card-amount">
        {formatAmount(bill.amount)}
      </div>
    </div>
  );
}
