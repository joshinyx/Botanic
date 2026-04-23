export type Climate = "tropical" | "arid" | "temperate" | "continental" | "polar" | "mediterranean" | "unknown";
export type Duration = "annual" | "biennial" | "perennial" | "unknown";

export interface Plant {
  id: string;
  name: string;
  description: string;
  origin_country: string;
  climate: Climate;
  duration: Duration;
  tags: string[];
  family: string | null;
  image_url: string;
  flower_url: string | null;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface PlantTagRow {
  key: string;
  label_es: string;
  label_en: string;
  active: boolean;
  sort_order: number;
}

export interface PlantFamilyRow {
  key: string;
  label_es: string;
  label_en: string;
  active: boolean;
  sort_order: number;
}

export interface PlantClimateRow {
  key: string;
  label_es: string;
  label_en: string;
  active: boolean;
  sort_order: number;
}

export interface PlantDurationRow {
  key: string;
  label_es: string;
  label_en: string;
  active: boolean;
  sort_order: number;
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
  banner_url: string | null;
  role: DashboardRole | null;
  show_staff_badge: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/** A user that has been granted a dashboard role */
export interface StaffEntry {
  id: string;
  name: string;
  username: string;
  email: string;
  role: DashboardRole;
  show_staff_badge: boolean;
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
