import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Tv,
  GraduationCap,
  Film,
  HeartPulse,
  Users,
  MoreHorizontal,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Coins,
  ShieldAlert,
  Tag,
  Briefcase,
  Gift,
  Coffee,
  Plane,
  Fuel,
  ShoppingCart,
  Wifi,
  Package,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Tv,
  GraduationCap,
  Film,
  HeartPulse,
  Users,
  MoreHorizontal,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Coins,
  ShieldAlert,
  Tag,
  Briefcase,
  Gift,
  Coffee,
  Plane,
  Fuel,
  ShoppingCart,
  Wifi,
  Package,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, size = 18, className = '' }) => {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent size={size} className={className} />;
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
