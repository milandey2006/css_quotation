import {
  LayoutDashboard,
  FileText,
  Settings,
  User,
  Table,
  Clock,
  Briefcase,
  MapPin,
  Receipt,
  Radio,
  Wallet
} from 'lucide-react';

// Single source of truth for the app's navigation, shared by Sidebar (full menu) and
// BottomTabBar (mobile, top destinations only). `primary: true` marks the items shown
// directly in the bottom tab bar; everything else lives behind its "More" tab.
export const allNavItems = [
  { name: 'Dashboard',        icon: LayoutDashboard, href: '/',            roles: ['admin', 'super-admin'],           primary: true },
  { name: 'Quotation',        icon: FileText,        href: '/quotation',   roles: ['admin', 'super-admin'],           primary: true },
  { name: 'Proforma Invoice', icon: FileText,        href: '/proforma',    roles: ['admin', 'super-admin'] },
  { name: 'Estimated',        icon: FileText,        href: '/estimated',   roles: ['admin', 'super-admin'] },
  { name: 'Receipts',         icon: Receipt,         href: '/receipts',    roles: ['admin', 'super-admin'] },
  { name: 'Worksheet',        icon: Table,           href: '/worksheet',   roles: ['admin', 'super-admin'] },
  { name: 'Salary Slips',     icon: FileText,        href: '/salary',      roles: ['admin', 'super-admin'] },
  { name: 'Employees',        icon: User,            href: '/employees',   roles: ['admin', 'super-admin'] },
  { name: 'Expenses',         icon: Wallet,          href: '/expenses',    roles: ['admin', 'super-admin'] },
  { name: 'Attendance',       icon: Clock,           href: '/attendance',  roles: ['super-admin'] },
  { name: 'Office Attendance',icon: Clock,           href: '/punch',       roles: ['user'],                           primary: true },
  { name: 'Work List',        icon: Briefcase,       href: '/works',       roles: ['admin', 'super-admin', 'user'],   primary: true },
  { name: 'Assign Work',      icon: User,            href: '/works/create',roles: ['admin', 'super-admin'] },
  { name: 'Site Visits',      icon: MapPin,          href: '/site-visits', roles: ['admin', 'super-admin'] },
  { name: 'Live Tracking',    icon: Radio,           href: '/live-tracking', roles: ['admin', 'super-admin'] },
  { name: 'Settings',         icon: Settings,        href: '/settings',    roles: ['super-admin'] },
];

export function getNavItemsForRole(role) {
  const currentRole = role || 'user';
  return allNavItems.filter((item) => item.roles.includes(currentRole));
}

export function getPrimaryNavItemsForRole(role) {
  return getNavItemsForRole(role).filter((item) => item.primary);
}
