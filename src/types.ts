export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string; // ISO date
}

export interface Experience {
  id: string;
  title: string;
  category:
    | "Adventure"
    | "Culinary"
    | "Cultural"
    | "Wildlife"
    | "Wellness"
    | "Coastal"
    | "Mountain"
    | "City";
  location: string;
  country: string;
  shortDescription: string;
  description: string;
  images: string[];
  price: number;
  currency: "USD";
  rating: number;
  reviewCount: number;
  durationDays: number;
  groupSize: string;
  difficulty: "Easy" | "Moderate" | "Challenging";
  highlights: string[];
  includes: string[];
  tags: string[];
  reviews: Review[];
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AIRecommendRequestBody {
  prompt: string;
}

export interface AIRecommendationItem {
  id: string;
  reason: string;
}

export interface AIRecommendResponseBody {
  summary: string;
  recommendations: AIRecommendationItem[];
}

export interface AIHighlightRequestBody {
  experienceId: string;
  interest?: string;
}

export interface AIHighlightResponseBody {
  highlight: string;
}

export type UserRole = "user" | "admin";

/** User shape sent to the client — sourced from the MongoDB profile. */
export interface PublicUser {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: UserRole;
}

export interface SyncProfileRequestBody {
  name?: string;
}
