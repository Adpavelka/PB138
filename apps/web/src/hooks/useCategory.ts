import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UseCategoryResult {
  categorySlug: string;
  category: Category | null;
}

export function useCategory(
  newspaperId: string | undefined
): UseCategoryResult {
  const { categoryName: categorySlug } = useParams<{ categoryName: string }>();
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (!newspaperId || !categorySlug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategory(null);
    fetch(
      `${API_BASE_URL}/api/newspapers/${newspaperId}/categories/by-slug/${categorySlug}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Category not found");
        return res.json() as Promise<Category>;
      })
      .then((data) => setCategory(data))
      .catch(() => {});
  }, [newspaperId, categorySlug]);

  return { categorySlug: categorySlug ?? "", category };
}
