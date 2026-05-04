import {
  CalendarClock,
  Gauge,
  ListOrdered,
  MapPin,
  Package,
  Store,
  type LucideIcon,
  Users,
} from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Vendor Workspace",
    items: [
      {
        title: "Orders",
        url: "/dashboard/default",
        icon: ListOrdered,
      },
      {
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: Package,
      },
      {
        title: "Profile",
        url: "/dashboard/crm",
        icon: Store,
      },
      {
        title: "Availability",
        url: "/dashboard/finance",
        icon: CalendarClock,
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: Gauge,
      },
      {
        title: "Neighborhoods",
        url: "/dashboard/neighborhoods",
        icon: MapPin,
      },
      // Menu Management: /dashboard/productivity (stub)
    ],
  },
  {
    id: 2,
    label: "Team Access",
    items: [
      {
        title: "Team Members",
        url: "/dashboard/coming-soon",
        icon: Users
      }
    ],
  },
];
