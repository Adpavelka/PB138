import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import type { Newspaper } from "../types";

interface UseNewspaperResult {
  newspaperName: string;
  newspaper: Newspaper | null;
}

export function useNewspaper(): UseNewspaperResult {
  const { newspaperName } = useParams<{ newspaperName: string }>();
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);

  useEffect(() => {
    if (!newspaperName) return;
    fetch(`${API_BASE_URL}/api/newspapers/by-slug/${newspaperName}`)
      .then((res) => {
        if (!res.ok) throw new Error("Newspaper not found");
        return res.json() as Promise<Newspaper>;
      })
      .then((data) => setNewspaper(data))
      .catch(() => {});
  }, [newspaperName]);

  return { newspaperName: newspaperName ?? "", newspaper };
}
