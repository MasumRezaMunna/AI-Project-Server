import { Router, Request, Response } from "express";
import experiencesData from "../data/experiences.json";
import { Experience, PaginatedResult } from "../types";

const router = Router();
const experiences = experiencesData as Experience[];

const VALID_SORTS = new Set([
  "rating-desc",
  "price-asc",
  "price-desc",
  "newest",
]);

router.get("/", (req: Request, res: Response) => {
  const {
    search = "",
    category = "",
    minPrice,
    maxPrice,
    minRating,
    sort = "rating-desc",
    page = "1",
    limit = "8",
  } = req.query as Record<string, string>;

  let results = [...experiences];

  // Search across title, location, country, and tags
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Filter: category
  if (category.trim() && category !== "All") {
    results = results.filter((e) => e.category === category);
  }

  // Filter: price range
  const min = minPrice ? Number(minPrice) : undefined;
  const max = maxPrice ? Number(maxPrice) : undefined;
  if (min !== undefined && !Number.isNaN(min)) {
    results = results.filter((e) => e.price >= min);
  }
  if (max !== undefined && !Number.isNaN(max)) {
    results = results.filter((e) => e.price <= max);
  }

  // Filter: minimum rating
  const minRatingNum = minRating ? Number(minRating) : undefined;
  if (minRatingNum !== undefined && !Number.isNaN(minRatingNum)) {
    results = results.filter((e) => e.rating >= minRatingNum);
  }

  // Sort
  const sortKey = VALID_SORTS.has(sort) ? sort : "rating-desc";
  switch (sortKey) {
    case "price-asc":
      results.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      break;
    case "rating-desc":
    default:
      results.sort((a, b) => b.rating - a.rating);
      break;
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(24, parseInt(limit, 10) || 8));
  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / limitNum));
  const start = (pageNum - 1) * limitNum;
  const pageItems = results.slice(start, start + limitNum);

  const payload: PaginatedResult<Experience> = {
    items: pageItems,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages,
  };

  res.json(payload);
});

router.get("/categories", (_req: Request, res: Response) => {
  const categories = Array.from(new Set(experiences.map((e) => e.category))).sort();
  res.json({ categories });
});

router.get("/:id", (req: Request, res: Response) => {
  const experience = experiences.find((e) => e.id === req.params.id);

  if (!experience) {
    return res.status(404).json({ error: "Experience not found" });
  }

  const related = experiences
    .filter((e) => e.id !== experience.id && e.category === experience.category)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);

  res.json({ experience, related });
});

export default router;
