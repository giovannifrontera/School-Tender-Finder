import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { uploadSchoolsSchema, scanRequestSchema, filterOptionsSchema } from "@shared/schema";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

const upload = multer({ storage: multer.memoryStorage() });

// Scraping utilities
const PLATFORMS = {
  axios: 'trasparenzascuole.it',
  argo: 'portaleargo.it', 
  spaggiari: 'web.spaggiari.eu',
  net4market: 'net4market.com',
  edu: '.edu.it'
};

const PROCUREMENT_KEYWORDS = /bando.*gara|gara.*appalto|procedura.*negoziata|appalto|fornitura|servizi/i;
const EXCLUDE_KEYWORDS = /concorso|selezione.*personale|graduatoria|albo.*pretorio/i;
const DATE_REGEX = /\d{1,2}\/\d{1,2}\/\d{4}/;

function detectPlatform(url: string): string {
  if (/trasparenzascuole\.it/.test(url)) return 'axios';
  if (/portaleargo\.it/.test(url)) return 'argo';
  if (/spaggiari\.eu/.test(url)) return 'spaggiari';  
  if (/net4market/.test(url)) return 'net4market';
  return 'edu';
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeSchoolTenders(school: any): Promise<any[]> {
  const tenders: any[] = [];
  const urls = [school.sitoWeb].filter(Boolean);
  
  // Add platform-specific URLs based on detected platforms
  if (school.detectedPlatforms?.includes('axios')) {
    urls.push(`https://trasparenzascuole.it/scuola/${school.codiceMeccanografico}`);
  }
  if (school.detectedPlatforms?.includes('argo')) {
    urls.push(`https://portaleargo.it/${school.codiceMeccanografico}`);
  }
  if (school.detectedPlatforms?.includes('spaggiari')) {
    urls.push(`https://web.spaggiari.eu/${school.codiceMeccanografico}`);
  }
  if (school.detectedPlatforms?.includes('net4market')) {
    urls.push(`https://${school.codiceMeccanografico}.net4market.com`);
  }

  const axios = require('axios');
  const cheerio = require('cheerio');
  
  for (const url of urls) {
    try {
      const platform = detectPlatform(url);
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);
      
      // Look for tender-related sections
      const tenderSections = $('a[href*="bandi"], a[href*="gara"], a[href*="amministrazione-trasparente"]');
      
      tenderSections.each((_, element) => {
        const title = $(element).text().trim();
        const href = $(element).attr('href');
        
        // Filter for procurement content only
        if (PROCUREMENT_KEYWORDS.test(title) && !EXCLUDE_KEYWORDS.test(title)) {
          const dateMatch = title.match(DATE_REGEX);
          
          tenders.push({
            title,
            excerpt: title.substring(0, 100) + (title.length > 100 ? '...' : ''),
            deadline: dateMatch ? dateMatch[0] : null,
            type: title.toLowerCase().includes('bando') ? 'bando' : 
                  title.toLowerCase().includes('gara') ? 'gara' :
                  title.toLowerCase().includes('avviso') ? 'avviso' : 'determina',
            platform,
            pdfUrl: href?.includes('.pdf') ? href : null,
            sourceUrl: url,
            schoolId: school.id,
            hash: Buffer.from(`${school.id}-${href || title}-${platform}`).toString('base64'),
          });
        }
      });
      
      await delay(1000); // Rate limiting
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }
  
  return tenders;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload schools dataset
  app.post('/api/schools', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      let schools: any[] = [];

      if (req.file.mimetype === 'application/json' || req.file.originalname?.endsWith('.json')) {
        const jsonData = JSON.parse(fileContent);
        // Handle both direct array and @graph structure
        schools = Array.isArray(jsonData) ? jsonData : jsonData['@graph'] || [];
      } else {
        // Parse CSV
        const results: any[] = [];
        const stream = Readable.from(fileContent);
        
        await new Promise((resolve, reject) => {
          stream
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', resolve)
            .on('error', reject);
        });
        
        schools = results;
      }

      // Filter for Calabria schools and transform data
      const calabriaSchools = schools
        .filter(school => 
          (school.REGIONE || school.regione || '').toLowerCase().includes('calabria') ||
          (school.PROVINCIA || school.provincia || '').match(/CS|CZ|RC|KR|VV/)
        )
        .map(school => ({
          codiceMeccanografico: school.CODICEMECCANOGRAFICO || school.codiceMeccanografico || '',
          denominazioneScuola: school.DENOMINAZIONESCUOLA || school.denominazioneScuola || '',
          codiceIstitutoRiferimento: school.CODICEISTITUTORIFERIMENTO || school.codiceIstitutoRiferimento,
          denominazioneIstitutoRiferimento: school.DENOMINAZIONEISTITUTORIFERIMENTO || school.denominazioneIstitutoRiferimento,
          indirizzoEmail: school.INDIRIZZOEMAILSCUOLA || school.indirizzoEmail,
          sitoWeb: school.SITOWEBSCUOLA || school.sitoWeb,
          indirizzo: school.INDIRIZZO || school.indirizzo,
          cap: school.CAP || school.cap,
          comune: school.COMUNE || school.comune,
          provincia: school.PROVINCIA || school.provincia,
          regione: 'CALABRIA',
          areaGeografica: 'SUD',
          tipoIstituto: school.TIPOISTRUZIONE || school.tipoIstituto,
          detectedPlatforms: [], // Will be populated during platform detection
        }));

      await storage.clearSchools();
      await storage.clearTenders();
      
      const createdSchools = await storage.createSchools(calabriaSchools);
      
      res.json({
        message: 'Schools uploaded successfully',
        count: createdSchools.length,
        schools: createdSchools.slice(0, 10), // Return first 10 for preview
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to process file' });
    }
  });

  // Get geographic data
  app.get('/api/geographic', async (req, res) => {
    try {
      const data = await storage.getGeographicData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get geographic data' });
    }
  });

  // Get filtered schools
  app.get('/api/schools', async (req, res) => {
    try {
      const filters = filterOptionsSchema.parse({
        areaGeografica: req.query.area as string,
        regione: req.query.regione as string,
        provincia: req.query.provincia ? (req.query.provincia as string).split(',') : undefined,
        search: req.query.search as string,
      });

      const schools = await storage.getSchools(filters);
      res.json(schools);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get schools' });
    }
  });

  // Start scanning
  app.post('/api/scan', async (req, res) => {
    try {
      const { schoolIds } = scanRequestSchema.parse(req.body);
      
      const scanSession = await storage.createScanSession({
        status: 'running',
        totalSchools: schoolIds.length,
        completedSchools: 0,
        totalTenders: 0,
        progress: {},
      });

      // Start scanning in background
      (async () => {
        const allTenders: any[] = [];
        let completedCount = 0;

        for (const schoolId of schoolIds) {
          try {
            const school = await storage.getSchoolById(schoolId);
            if (!school) continue;

            const tenders = await scrapeSchoolTenders(school);
            allTenders.push(...tenders);
            completedCount++;

            await storage.updateScanSession(scanSession.id, {
              completedSchools: completedCount,
              totalTenders: allTenders.length,
              progress: {
                ...scanSession.progress,
                [schoolId]: {
                  status: 'completed',
                  tendersFound: tenders.length,
                }
              }
            });
          } catch (error) {
            console.error(`Error scanning school ${schoolId}:`, error);
            await storage.updateScanSession(scanSession.id, {
              progress: {
                ...scanSession.progress,
                [schoolId]: {
                  status: 'error',
                  error: error.message,
                }
              }
            });
          }
        }

        // Save all tenders
        if (allTenders.length > 0) {
          await storage.createTenders(allTenders);
        }

        await storage.updateScanSession(scanSession.id, {
          status: 'completed',
          completedAt: new Date(),
        });
      })();

      res.json({
        sessionId: scanSession.id,
        message: 'Scan started',
        totalSchools: schoolIds.length,
      });

    } catch (error) {
      res.status(500).json({ message: 'Failed to start scan' });
    }
  });

  // Get scan progress
  app.get('/api/scan/:sessionId', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getScanSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get scan progress' });
    }
  });

  // Get tenders
  app.get('/api/tenders', async (req, res) => {
    try {
      const filters = {
        schoolIds: req.query.schoolIds ? (req.query.schoolIds as string).split(',').map(Number) : undefined,
        search: req.query.search as string,
        type: req.query.type as string,
        platform: req.query.platform as string,
      };

      const tenders = await storage.getTenders(filters);
      
      // Enrich with school data
      const enrichedTenders = await Promise.all(
        tenders.map(async (tender) => {
          const school = await storage.getSchoolById(tender.schoolId);
          return {
            ...tender,
            school: school ? {
              name: school.denominazioneScuola,
              code: school.codiceMeccanografico,
              location: `${school.comune} (${school.provincia})`,
            } : null,
          };
        })
      );

      res.json(enrichedTenders);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get tenders' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
