import { promises as fs } from "fs";
import path from "path";
import type { Character } from "@/types";

export async function getCharacters(): Promise<Character[]> {
  const filePath = path.join(process.cwd(), "data", "images.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as Character[];
}
