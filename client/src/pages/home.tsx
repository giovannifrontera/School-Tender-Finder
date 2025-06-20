import { useState } from "react";
import { Search, Upload, Filter, School, Clock, Table } from "lucide-react";
import FileUpload from "@/components/file-upload";
import GeographicFilters from "@/components/geographic-filters";
import SchoolSelection from "@/components/school-selection";
import ScanProgress from "@/components/scan-progress";
import ResultsTable from "@/components/results-table";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<{ name: string; count: number } | null>(null);
  const [selectedSchools, setSelectedSchools] = useState<number[]>([]);
  const [scanSession, setScanSession] = useState<{ id: number; status: string } | null>(null);
  const [geographicFilters, setGeographicFilters] = useState({
    area: '',
    regione: '',
    provincia: [] as string[],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Search className="text-primary text-2xl mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">School Tender Finder</h1>
              <span className="ml-2 px-2 py-1 bg-primary text-white text-xs rounded-full">Calabria</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Ultima sincronizzazione:</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleString('it-IT')}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* File Upload Section */}
        <FileUpload onFileUploaded={setUploadedFile} />

        {uploadedFile && (
          <>
            {/* Geographic Filters */}
            <GeographicFilters 
              filters={geographicFilters}
              onFiltersChange={setGeographicFilters}
            />

            {/* School Selection */}
            <SchoolSelection
              filters={geographicFilters}
              selectedSchools={selectedSchools}
              onSelectionChange={setSelectedSchools}
              onStartScan={(sessionId) => setScanSession({ id: sessionId, status: 'running' })}
            />

            {/* Scan Progress */}
            {scanSession && (
              <ScanProgress
                sessionId={scanSession.id}
                onComplete={() => setScanSession(prev => prev ? { ...prev, status: 'completed' } : null)}
              />
            )}

            {/* Results Table */}
            <ResultsTable 
              schoolIds={selectedSchools}
              refreshTrigger={scanSession?.status === 'completed'}
            />
          </>
        )}
      </div>
    </div>
  );
}
