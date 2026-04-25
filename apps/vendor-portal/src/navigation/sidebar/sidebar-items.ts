import {
  CalendarClock,
  Fingerprint,
  Gauge,
  ListOrdered,
  Menu,
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
        title: "Menu Management",
        url: "/dashboard/productivity",
        icon: Menu,
      },
    ],
  },
  {
    id: 2,
    label: "Team Access",
    items: [
      {
        title: "Team Members",
        url: "/dashboard/coming-soon",
        icon: Users,
        comingSoon: true,
      },
      {
        title: "Authentication",
        url: "/auth",
        icon: Fingerprint,
        subItems: [
          { title: "Login v1", url: "/auth/v1/login", newTab: true },
          { title: "Register v1", url: "/auth/v1/register", newTab: true },
        ],
      },
    ],
  },
];
