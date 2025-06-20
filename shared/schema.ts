import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  codiceMeccanografico: text("codice_meccanografico").notNull().unique(),
  denominazioneScuola: text("denominazione_scuola").notNull(),
  codiceIstitutoRiferimento: text("codice_istituto_riferimento"),
  denominazioneIstitutoRiferimento: text("denominazione_istituto_riferimento"),
  indirizzoEmail: text("indirizzo_email"),
  sitoWeb: text("sito_web"),
  indirizzo: text("indirizzo"),
  cap: text("cap"),
  comune: text("comune"),
  provincia: text("provincia"),
  regione: text("regione"),
  areaGeografica: text("area_geografica"),
  tipoIstituto: text("tipo_istituto"),
  detectedPlatforms: json("detected_platforms").$type<string[]>().default([]),
});

export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  deadline: text("deadline"),
  type: text("type").notNull(),
  platform: text("platform").notNull(),
  pdfUrl: text("pdf_url"),
  sourceUrl: text("source_url"),
  hash: text("hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scanSessions = pgTable("scan_sessions", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  totalSchools: integer("total_schools").notNull(),
  completedSchools: integer("completed_schools").default(0),
  totalTenders: integer("total_tenders").default(0),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  progress: json("progress").$type<Record<string, any>>().default({}),
});

// Insert schemas
export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
});

export const insertTenderSchema = createInsertSchema(tenders).omit({
  id: true,
  createdAt: true,
});

export const insertScanSessionSchema = createInsertSchema(scanSessions).omit({
  id: true,
  startedAt: true,
});

// Types
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type Tender = typeof tenders.$inferSelect;
export type InsertTender = z.infer<typeof insertTenderSchema>;
export type ScanSession = typeof scanSessions.$inferSelect;
export type InsertScanSession = z.infer<typeof insertScanSessionSchema>;

// API request/response schemas
export const uploadSchoolsSchema = z.object({
  data: z.array(z.record(z.string(), z.any())),
  format: z.enum(['csv', 'json']),
});

export const scanRequestSchema = z.object({
  schoolIds: z.array(z.number()),
});

export const filterOptionsSchema = z.object({
  areaGeografica: z.string().optional(),
  regione: z.string().optional(),
  provincia: z.array(z.string()).optional(),
  search: z.string().optional(),
});

export type UploadSchoolsRequest = z.infer<typeof uploadSchoolsSchema>;
export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type FilterOptions = z.infer<typeof filterOptionsSchema>;
