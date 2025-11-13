// src/services/surahService.ts

import { quran_suras } from "@/db/schema";
import { getDrizzleDb } from "../DrizzleConnection";

export async function fetchAllSurahs() {
  const db = await getDrizzleDb();
  const rows = await db.select().from(quran_suras).orderBy(quran_suras.id);
  // rows is typed and maps to the table columns
  return rows;
}
