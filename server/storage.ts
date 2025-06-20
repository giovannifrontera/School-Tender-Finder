import { schools, tenders, scanSessions, type School, type InsertSchool, type Tender, type InsertTender, type ScanSession, type InsertScanSession, type FilterOptions } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private schools: Map<number, School>;
  private tenders: Map<number, Tender>;
  private scanSessions: Map<number, ScanSession>;
  private currentSchoolId: number;
  private currentTenderId: number;
  private currentScanId: number;

  constructor() {
    this.schools = new Map();
    this.tenders = new Map();
    this.scanSessions = new Map();
    this.currentSchoolId = 1;
    this.currentTenderId = 1;
    this.currentScanId = 1;
  }

  async createSchools(insertSchools: InsertSchool[]): Promise<School[]> {
    const createdSchools: School[] = [];
    
    for (const insertSchool of insertSchools) {
      const id = this.currentSchoolId++;
      const school: School = { ...insertSchool, id };
      this.schools.set(id, school);
      createdSchools.push(school);
    }
    
    return createdSchools;
  }

  async getSchools(filters?: FilterOptions): Promise<School[]> {
    let schools = Array.from(this.schools.values());

    if (filters?.areaGeografica) {
      schools = schools.filter(s => s.areaGeografica === filters.areaGeografica);
    }

    if (filters?.regione) {
      schools = schools.filter(s => s.regione === filters.regione);
    }

    if (filters?.provincia && filters.provincia.length > 0) {
      schools = schools.filter(s => s.provincia && filters.provincia!.includes(s.provincia));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      schools = schools.filter(s => 
        s.denominazioneScuola.toLowerCase().includes(searchLower) ||
        s.codiceMeccanografico.toLowerCase().includes(searchLower) ||
        (s.comune && s.comune.toLowerCase().includes(searchLower))
      );
    }

    return schools;
  }

  async getSchoolById(id: number): Promise<School | undefined> {
    return this.schools.get(id);
  }

  async clearSchools(): Promise<void> {
    this.schools.clear();
    this.currentSchoolId = 1;
  }

  async getGeographicData(): Promise<{
    areas: string[];
    regions: Record<string, string[]>;
    provinces: Record<string, string[]>;
  }> {
    const schools = Array.from(this.schools.values());
    const areas = new Set<string>();
    const regions: Record<string, Set<string>> = {};
    const provinces: Record<string, Set<string>> = {};

    schools.forEach(school => {
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
    const createdTenders: Tender[] = [];
    
    for (const insertTender of insertTenders) {
      const id = this.currentTenderId++;
      const tender: Tender = { 
        ...insertTender, 
        id,
        createdAt: new Date(),
      };
      this.tenders.set(id, tender);
      createdTenders.push(tender);
    }
    
    return createdTenders;
  }

  async getTenders(filters?: { schoolIds?: number[]; search?: string; type?: string; platform?: string }): Promise<Tender[]> {
    let tenders = Array.from(this.tenders.values());

    if (filters?.schoolIds && filters.schoolIds.length > 0) {
      tenders = tenders.filter(t => filters.schoolIds!.includes(t.schoolId));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      tenders = tenders.filter(t => 
        t.title.toLowerCase().includes(searchLower) ||
        (t.excerpt && t.excerpt.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.type) {
      tenders = tenders.filter(t => t.type === filters.type);
    }

    if (filters?.platform) {
      tenders = tenders.filter(t => t.platform === filters.platform);
    }

    return tenders.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async clearTenders(): Promise<void> {
    this.tenders.clear();
    this.currentTenderId = 1;
  }

  async createScanSession(insertSession: InsertScanSession): Promise<ScanSession> {
    const id = this.currentScanId++;
    const session: ScanSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: null,
    };
    this.scanSessions.set(id, session);
    return session;
  }

  async updateScanSession(id: number, updates: Partial<ScanSession>): Promise<ScanSession | undefined> {
    const session = this.scanSessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.scanSessions.set(id, updatedSession);
    return updatedSession;
  }

  async getScanSession(id: number): Promise<ScanSession | undefined> {
    return this.scanSessions.get(id);
  }
}

export const storage = new MemStorage();
