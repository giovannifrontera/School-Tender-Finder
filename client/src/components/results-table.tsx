import { useState, useEffect } from "react";
import { Table, Download, RefreshCw, ExternalLink, FileText, Search, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getTenders } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ResultsTableProps {
  schoolIds: number[];
  refreshTrigger?: boolean;
}

export default function ResultsTable({ schoolIds, refreshTrigger }: ResultsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const { toast } = useToast();

  const { data: tenders = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tenders', schoolIds],
    enabled: schoolIds.length > 0,
  });

  useEffect(() => {
    if (refreshTrigger && schoolIds.length > 0) {
      refetch();
    }
  }, [refreshTrigger, schoolIds, refetch]);

  const filteredTenders = tenders.filter((tender: any) => {
    const matchesSearch = !searchTerm || 
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tender.excerpt && tender.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = !typeFilter || tender.type === typeFilter;
    const matchesPlatform = !platformFilter || tender.platform === platformFilter;
    
    return matchesSearch && matchesType && matchesPlatform;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const [day, month, year] = dateStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Scaduto';
      if (diffDays === 0) return 'Oggi';
      if (diffDays === 1) return '1 giorno';
      return `${diffDays} giorni`;
    } catch {
      return dateStr;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'bando':
        return 'bg-blue-100 text-blue-800';
      case 'gara':
        return 'bg-purple-100 text-purple-800';
      case 'avviso':
        return 'bg-yellow-100 text-yellow-800';
      case 'determina':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'axios':
        return 'bg-green-100 text-green-800';
      case 'argo':
        return 'bg-orange-100 text-orange-800';
      case 'spaggiari':
        return 'bg-purple-100 text-purple-800';
      case 'net4market':
        return 'bg-red-100 text-red-800';
      case 'edu':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportToCSV = () => {
    if (filteredTenders.length === 0) {
      toast({
        title: "Nessun dato da esportare",
        description: "Non ci sono risultati da esportare",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Titolo', 'Scadenza', 'Tipo', 'Scuola', 'Codice Scuola', 'Provincia', 'Piattaforma', 'Link PDF', 'Fonte'];
    const csvContent = [
      headers.join(','),
      ...filteredTenders.map((tender: any) => [
        `"${tender.title}"`,
        tender.deadline || '',
        tender.type,
        `"${tender.school?.name || ''}"`,
        tender.school?.code || '',
        tender.school?.location || '',
        tender.platform,
        tender.pdfUrl || '',
        tender.sourceUrl || '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bandi_scuole_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export completato",
      description: `${filteredTenders.length} risultati esportati in CSV`,
    });
  };

  if (schoolIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Table className="text-primary mr-2" />
            Risultati Ricerca
          </CardTitle>
          <CardDescription>
            Seleziona le scuole e avvia la ricerca per visualizzare i risultati
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Table className="text-primary mr-2" />
              Risultati Ricerca
            </CardTitle>
            <CardDescription>
              {filteredTenders.length} bandi trovati da {schoolIds.length} scuole
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredTenders.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Esporta CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Cerca nei risultati..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tutti i tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutti i tipi</SelectItem>
              <SelectItem value="bando">Bando</SelectItem>
              <SelectItem value="gara">Gara</SelectItem>
              <SelectItem value="avviso">Avviso</SelectItem>
              <SelectItem value="determina">Determina</SelectItem>
            </SelectContent>
          </Select>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tutte le piattaforme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tutte le piattaforme</SelectItem>
              <SelectItem value="edu">.edu.it</SelectItem>
              <SelectItem value="axios">Axios</SelectItem>
              <SelectItem value="argo">Argo</SelectItem>
              <SelectItem value="spaggiari">Spaggiari</SelectItem>
              <SelectItem value="net4market">Net4Market</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Table */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Caricamento risultati...</div>
        ) : filteredTenders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nessun bando trovato con i filtri selezionati
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scadenza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scuola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Piattaforma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenders.map((tender: any) => (
                  <tr key={tender.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {tender.title}
                      </div>
                      {tender.excerpt && (
                        <div className="text-sm text-gray-500 mt-1">
                          {tender.excerpt}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tender.deadline || 'N/A'}</div>
                      {tender.deadline && (
                        <div className="text-xs text-gray-500">
                          {formatDate(tender.deadline)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getTypeColor(tender.type)}>
                        {tender.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {tender.school?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tender.school?.location || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getPlatformColor(tender.platform)}>
                        {tender.platform === 'edu' ? '.edu.it' : tender.platform}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {tender.pdfUrl && (
                        <a
                          href={tender.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 inline-flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </a>
                      )}
                      {tender.sourceUrl && (
                        <a
                          href={tender.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-800 inline-flex items-center"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Fonte
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
