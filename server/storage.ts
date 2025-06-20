import { schools, tenders, scanSessions, type School, type InsertSchool, type Tender, type InsertTender, type ScanSession, type InsertScanSession, type FilterOptions } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Schools
  createSchools(schools: InsertSchool[]): Promise<School[]>;
  getSchools(filters?: FilterOptions): Promise<School[]>;
  getSchoolById(id: number): Promise<School | undefined>;
  clearSchools(): Promise<void>;
  getGeographicData(): Promise<{
    areas: string[];
    regions: Record<string, string[]>;
    provinces: Record<string, string[]>;
  }>;

  // Tenders
  createTenders(tenders: InsertTender[]): Promise<Tender[]>;
  getTenders(filters?: { schoolIds?: number[]; search?: string; type?: string; platform?: string }): Promise<Tender[]>;
  clearTenders(): Promise<void>;

  // Scan Sessions
  createScanSession(session: InsertScanSession): Promise<ScanSession>;
  updateScanSession(id: number, updates: Partial<ScanSession>): Promise<ScanSession | undefined>;
  getScanSession(id: number): Promise<ScanSession | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createSchools(insertSchools: InsertSchool[]): Promise<School[]> {
    return await db.insert(schools).values(insertSchools).returning();
  }

  async getSchools(filters?: FilterOptions): Promise<School[]> {
    const query = db.select().from(schools);
    
    // Apply filters here if needed
    // For now, return all schools and filter in application
    const allSchools = await query;
    
    let filteredSchools = allSchools;

    if (filters?.areaGeografica) {
      filteredSchools = filteredSchools.filter(s => s.areaGeografica === filters.areaGeografica);
    }

    if (filters?.regione) {
      filteredSchools = filteredSchools.filter(s => s.regione === filters.regione);
    }

    if (filters?.provincia && filters.provincia.length > 0) {
      filteredSchools = filteredSchools.filter(s => s.provincia && filters.provincia!.includes(s.provincia));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredSchools = filteredSchools.filter(s => 
        s.denominazioneScuola.toLowerCase().includes(searchLower) ||
        s.codiceMeccanografico.toLowerCase().includes(searchLower) ||
        (s.comune && s.comune.toLowerCase().includes(searchLower))
      );
    }

    return filteredSchools;
  }

  async getSchoolById(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async clearSchools(): Promise<void> {
    await db.delete(schools);
  }

  async getGeographicData(): Promise<{
    areas: string[];
    regions: Record<string, string[]>;
    provinces: Record<string, string[]>;
  }> {
    const allSchools = await db.select().from(schools);
    const areas = new Set<string>();
    const regions: Record<string, Set<string>> = {};
    const provinces: Record<string, Set<string>> = {};

    allSchools.forEach(school => {
      if (school.areaGeografica) {
        areas.add(school.areaGeografica);
        
        if (!regions[school.areaGeografica]) {
          regions[school.areaGeografica] = new Set();
        }
        if (school.regione) {
          regions[school.areaGeografica].add(school.regione);
          
          if (!provinces[school.regione]) {
            provinces[school.regione] = new Set();
          }
          if (school.provincia) {
            provinces[school.regione].add(school.provincia);
          }
        }
      }
    });

    return {
      areas: Array.from(areas).sort(),
      regions: Object.fromEntries(
        Object.entries(regions).map(([area, regionSet]) => [area, Array.from(regionSet).sort()])
      ),
      provinces: Object.fromEntries(
        Object.entries(provinces).map(([region, provinceSet]) => [region, Array.from(provinceSet).sort()])
      ),
    };
  }

  async createTenders(insertTenders: InsertTender[]): Promise<Tender[]> {
    if (insertTenders.length === 0) return [];
    return await db.insert(tenders).values(insertTenders).returning();
  }

  async getTenders(filters?: { schoolIds?: number[]; search?: string; type?: string; platform?: string }): Promise<Tender[]> {
    const query = db.select().from(tenders);
    const allTenders = await query;
    
    let filteredTenders = allTenders;

    if (filters?.schoolIds && filters.schoolIds.length > 0) {
      filteredTenders = filteredTenders.filter(t => filters.schoolIds!.includes(t.schoolId));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTenders = filteredTenders.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        (t.excerpt && t.excerpt.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.type) {
      filteredTenders = filteredTenders.filter(t => t.type === filters.type);
    }

    if (filters?.platform) {
      filteredTenders = filteredTenders.filter(t => t.platform === filters.platform);
    }

    return filteredTenders.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async clearTenders(): Promise<void> {
    await db.delete(tenders);
  }

  async createScanSession(insertSession: InsertScanSession): Promise<ScanSession> {
    const [session] = await db.insert(scanSessions).values(insertSession).returning();
    return session;
  }

  async updateScanSession(id: number, updates: Partial<ScanSession>): Promise<ScanSession | undefined> {
    const [session] = await db.update(scanSessions)
      .set(updates)
      .where(eq(scanSessions.id, id))
      .returning();
    return session || undefined;
  }

  async getScanSession(id: number): Promise<ScanSession | undefined> {
    const [session] = await db.select().from(scanSessions).where(eq(scanSessions.id, id));
    return session || undefined;
  }
}

export const storage = new DatabaseStorage();
