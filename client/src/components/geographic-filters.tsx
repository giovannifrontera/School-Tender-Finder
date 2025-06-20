import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { getGeographicData } from "@/lib/api";

interface GeographicFiltersProps {
  filters: {
    area: string;
    regione: string;
    provincia: string[];
  };
  onFiltersChange: (filters: { area: string; regione: string; provincia: string[] }) => void;
}

export default function GeographicFilters({ filters, onFiltersChange }: GeographicFiltersProps) {
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);

  const { data: geoData, isLoading } = useQuery({
    queryKey: ['/api/geographic'],
    enabled: true,
  });

  const handleAreaChange = (area: string) => {
    onFiltersChange({
      area,
      regione: '',
      provincia: [],
    });
  };

  const handleRegioneChange = (regione: string) => {
    onFiltersChange({
      ...filters,
      regione,
      provincia: [],
    });
  };

  const handleProvinciaToggle = (provincia: string, checked: boolean) => {
    const newProvincia = checked
      ? [...filters.provincia, provincia]
      : filters.provincia.filter(p => p !== provincia);
    
    onFiltersChange({
      ...filters,
      provincia: newProvincia,
    });
  };

  const availableRegions = filters.area ? geoData?.regions[filters.area] || [] : [];
  const availableProvinces = filters.regione ? geoData?.provinces[filters.regione] || [] : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="text-primary mr-2" />
            Filtri Geografici
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Caricamento...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="text-primary mr-2" />
          Filtri Geografici
        </CardTitle>
        <CardDescription>
          Seleziona l'area geografica, la regione e le province
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Area Geografica</label>
            <Select value={filters.area} onValueChange={handleAreaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona area..." />
              </SelectTrigger>
              <SelectContent>
                {geoData?.areas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Regione</label>
            <Select 
              value={filters.regione} 
              onValueChange={handleRegioneChange}
              disabled={!filters.area}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona regione..." />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((regione) => (
                  <SelectItem key={regione} value={regione}>
                    {regione}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
            <Popover open={showProvinceDropdown} onOpenChange={setShowProvinceDropdown}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  disabled={!filters.regione}
                >
                  {filters.provincia.length > 0
                    ? `${filters.provincia.length} province selezionate`
                    : "Seleziona province..."
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2">
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {availableProvinces.map((provincia) => (
                    <div key={provincia} className="flex items-center space-x-2">
                      <Checkbox
                        id={provincia}
                        checked={filters.provincia.includes(provincia)}
                        onCheckedChange={(checked) => 
                          handleProvinciaToggle(provincia, !!checked)
                        }
                      />
                      <label
                        htmlFor={provincia}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {provincia}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
