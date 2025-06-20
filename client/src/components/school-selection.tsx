import { useState, useEffect } from "react";
import { School, Search, ExternalLink, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getSchools, startScan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SchoolSelectionProps {
  filters: {
    area: string;
    regione: string;
    provincia: string[];
  };
  selectedSchools: number[];
  onSelectionChange: (schoolIds: number[]) => void;
  onStartScan: (sessionId: number) => void;
}

export default function SchoolSelection({ 
  filters, 
  selectedSchools, 
  onSelectionChange, 
  onStartScan 
}: SchoolSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const { toast } = useToast();

  const { data: schools = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/schools', filters],
    enabled: !!filters.regione,
  });

  useEffect(() => {
    if (filters.regione) {
      refetch();
    }
  }, [filters, refetch]);

  const filteredSchools = schools.filter((school: any) =>
    searchTerm === '' ||
    school.denominazioneScuola.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.codiceMeccanografico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (school.comune && school.comune.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = () => {
    onSelectionChange(filteredSchools.map((school: any) => school.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleSchoolToggle = (schoolId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSchools, schoolId]);
    } else {
      onSelectionChange(selectedSchools.filter(id => id !== schoolId));
    }
  };

  const handleStartScan = async () => {
    if (selectedSchools.length === 0) {
      toast({
        title: "Nessuna scuola selezionata",
        description: "Seleziona almeno una scuola per iniziare la ricerca",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    try {
      const result = await startScan(selectedSchools);
      onStartScan(result.sessionId);
      toast({
        title: "Ricerca avviata",
        description: `Scansione di ${selectedSchools.length} scuole in corso`,
      });
    } catch (error) {
      toast({
        title: "Errore nell'avvio della ricerca",
        description: "Riprova più tardi",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  if (!filters.regione) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <School className="text-primary mr-2" />
            Selezione Scuole
          </CardTitle>
          <CardDescription>
            Seleziona prima la regione per visualizzare le scuole
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <School className="text-primary mr-2" />
            Selezione Scuole
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Caricamento scuole...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <School className="text-primary mr-2" />
          Selezione Scuole
        </CardTitle>
        <CardDescription>
          {filteredSchools.length} scuole trovate nelle province selezionate
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Button
              variant="default"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredSchools.length === 0}
            >
              Seleziona Tutte
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              disabled={selectedSchools.length === 0}
            >
              Deseleziona Tutte
            </Button>
            <div className="ml-auto">
              <Input
                placeholder="Cerca scuola..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
            {filteredSchools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nessuna scuola trovata con i filtri selezionati
              </div>
            ) : (
              filteredSchools.map((school: any) => (
                <div key={school.id} className="border-b border-gray-100 last:border-b-0">
                  <label className="flex items-start p-4 hover:bg-gray-50 cursor-pointer">
                    <Checkbox
                      className="mt-1 mr-3"
                      checked={selectedSchools.includes(school.id)}
                      onCheckedChange={(checked) => 
                        handleSchoolToggle(school.id, !!checked)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {school.denominazioneScuola}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {school.codiceMeccanografico}
                          </p>
                          <p className="text-sm text-gray-600">
                            {school.indirizzo ? `${school.indirizzo}, ` : ''}
                            {school.comune} ({school.provincia})
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1 ml-4">
                          {school.sitoWeb && (
                            <a
                              href={school.sitoWeb}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:text-primary/80 flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Sito Web
                            </a>
                          )}
                          {school.indirizzoEmail && (
                            <a
                              href={`mailto:${school.indirizzoEmail}`}
                              className="text-xs text-gray-600 hover:text-gray-800 flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center mt-2 space-x-4">
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {school.provincia}
                        </Badge>
                        {school.detectedPlatforms && school.detectedPlatforms.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Platform: {school.detectedPlatforms.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedSchools.length} scuole selezionate
            </p>
            <Button
              onClick={handleStartScan}
              disabled={selectedSchools.length === 0 || scanning}
              className="bg-primary hover:bg-primary/90"
            >
              <Search className="h-4 w-4 mr-2" />
              {scanning ? "Avvio in corso..." : "Avvia Ricerca Bandi"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
