export type Climate = "tropical" | "arid" | "temperate" | "continental" | "polar" | "mediterranean";
export type Duration = "annual" | "biennial" | "perennial";

export interface Plant {
  id: string;
  name: string;
  description: string;
  origin_country: string;
  climate: Climate;
  duration: Duration;
  tags: string[];
  image_url: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export type DashboardRole = "super_admin" | "editor" | "reader";

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  social_links: Record<string, string> | null;
  avatar_url: string | null;
  role: DashboardRole | null;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  notifications_enabled: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  actor_id: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationItem extends Notification {
  actor: { username: string; name: string; avatar_url: string | null } | null;
  plant: { name: string; image_url: string } | null;
}

/** A user that has been granted a dashboard role */
export interface StaffEntry {
  id: string;
  name: string;
  username: string;
  email: string;
  role: DashboardRole;
  created_at: string;
}

export interface StaffUser {
  id: string;
  email: string;
  role: "super_admin" | "editor" | "reader";
  created_at: string;
}

export interface ActionLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ContentEntry {
  id: string;
  key: string;
  lang: string;
  value: string;
  updated_at: string;
}

export type PlantTag =
  | "medicinal"
  | "edible"
  | "ornamental"
  | "succulent"
  | "aquatic"
  | "climbing"
  | "shrub"
  | "tree"
  | "herb"
  | "fern"
  | "cactus"
  | "grass";
