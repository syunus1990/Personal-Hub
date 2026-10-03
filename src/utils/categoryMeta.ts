import { Category, Priority, Status } from '../types';
import {
  Briefcase,
  User,
  DollarSign,
  Car,
  Home,
  ShoppingBag,
  FileText,
  Lightbulb,
  Heart,
  Tag,
  LucideIcon,
} from 'lucide-react';

export interface CategoryMetadata {
  label: Category;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const CATEGORIES: Category[] = [
  'Personal',
  'Work',
  'Finance',
  'Car',
  'Home',
  'Shopping',
  'Documents',
  'Ideas',
  'Wishlist',
  'Other',
];

export const CATEGORY_META: Record<Category, CategoryMetadata> = {
  Personal: {
    label: 'Personal',
    icon: User,
    bgColor: 'bg-emerald-500/15 text-emerald-300 backdrop-blur-md',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/30',
  },
  Work: {
    label: 'Work',
    icon: Briefcase,
    bgColor: 'bg-blue-500/15 text-blue-300 backdrop-blur-md',
    textColor: 'text-blue-300',
    borderColor: 'border-blue-500/30',
  },
  Finance: {
    label: 'Finance',
    icon: DollarSign,
    bgColor: 'bg-amber-500/15 text-amber-300 backdrop-blur-md',
    textColor: 'text-amber-300',
    borderColor: 'border-amber-500/30',
  },
  Car: {
    label: 'Car',
    icon: Car,
    bgColor: 'bg-cyan-500/15 text-cyan-300 backdrop-blur-md',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500/30',
  },
  Home: {
    label: 'Home',
    icon: Home,
    bgColor: 'bg-orange-500/15 text-orange-300 backdrop-blur-md',
    textColor: 'text-orange-300',
    borderColor: 'border-orange-500/30',
  },
  Shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    bgColor: 'bg-rose-500/15 text-rose-300 backdrop-blur-md',
    textColor: 'text-rose-300',
    borderColor: 'border-rose-500/30',
  },
  Documents: {
    label: 'Documents',
    icon: FileText,
    bgColor: 'bg-violet-500/15 text-violet-300 backdrop-blur-md',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/30',
  },
  Ideas: {
    label: 'Ideas',
    icon: Lightbulb,
    bgColor: 'bg-yellow-500/15 text-yellow-300 backdrop-blur-md',
    textColor: 'text-yellow-300',
    borderColor: 'border-yellow-500/30',
  },
  Wishlist: {
    label: 'Wishlist',
    icon: Heart,
    bgColor: 'bg-purple-500/15 text-purple-300 backdrop-blur-md',
    textColor: 'text-purple-300',
    borderColor: 'border-purple-500/30',
  },
  Other: {
    label: 'Other',
    icon: Tag,
    bgColor: 'bg-white/10 text-slate-300 backdrop-blur-md',
    textColor: 'text-slate-300',
    borderColor: 'border-white/15',
  },
};

export const STATUS_META: Record<Status, { label: Status; color: string; dotColor: string }> = {
  'Pending': {
    label: 'Pending',
    color: 'bg-slate-500/15 text-slate-300 border-slate-500/30 backdrop-blur-md',
    dotColor: 'bg-slate-400',
  },
  'In Progress': {
    label: 'In Progress',
    color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 backdrop-blur-md',
    dotColor: 'bg-emerald-400',
  },
  'Completed': {
    label: 'Completed',
    color: 'bg-violet-500/15 text-violet-300 border-violet-500/30 backdrop-blur-md',
    dotColor: 'bg-violet-400',
  },
  'On Hold': {
    label: 'On Hold',
    color: 'bg-amber-500/15 text-amber-300 border-amber-500/30 backdrop-blur-md',
    dotColor: 'bg-amber-400',
  },
};

export const PRIORITY_META: Record<Priority, { label: Priority; color: string; badge: string }> = {
  'Low': {
    label: 'Low',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  'Medium': {
    label: 'Medium',
    color: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  },
  'High': {
    label: 'High',
    color: 'text-orange-400',
    badge: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  },
};
