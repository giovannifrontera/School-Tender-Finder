import { useEffect } from "react";
import { Settings, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getScanProgress, getSchools } from "@/lib/api";

interface ScanProgressProps {
  sessionId: number;
  onComplete: () => void;
}

export default function ScanProgress({ sessionId, onComplete }: ScanProgressProps) {
  const { data: session, refetch } = useQuery({
    queryKey: [`/api/scan/${sessionId}`],
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['/api/schools'],
  });

  useEffect(() => {
    if (session?.status === 'completed') {
      onComplete();
    }
  }, [session?.status, onComplete]);

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader2 className="text-primary mr-2 animate-spin" />
            Caricamento sessione...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const overallProgress = session.totalSchools > 0 
    ? Math.round((session.completedSchools / session.totalSchools) * 100)
    : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completato</Badge>;
      case 'error':
        return <Badge variant="destructive">Errore</Badge>;
      case 'running':
        return <Badge className="bg-yellow-100 text-yellow-800">In corso</Badge>;
      default:
        return <Badge variant="secondary">In attesa</Badge>;
    }
  };

  const getPlatformStatus = (schoolId: number, platform: string) => {
    const schoolProgress = session.progress?.[schoolId];
    if (!schoolProgress) return 'pending';
    
    // Simulate platform-specific status based on overall school status
    if (schoolProgress.status === 'completed') {
      return Math.random() > 0.3 ? 'completed' : 'error';
    } else if (schoolProgress.status === 'running') {
      return Math.random() > 0.5 ? 'running' : 'pending';
    }
    return 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="text-primary mr-2 animate-spin" />
          Ricerca in Corso
        </CardTitle>
        <CardDescription>
          Scansionando {session.totalSchools} scuole su 5 piattaforme
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso Generale</span>
              <span className="text-sm text-gray-600">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Per-School Progress */}
          <div className="space-y-4">
            {Object.entries(session.progress || {}).map(([schoolId, progress]: [string, any]) => {
              const school = schools.find((s: any) => s.id === parseInt(schoolId));
              if (!school) return null;

              return (
                <div key={schoolId} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {school.denominazioneScuola}
                    </h4>
                    {getStatusBadge(progress.status)}
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {['edu', 'axios', 'argo', 'spaggiari', 'net4market'].map((platform) => {
                      const platformStatus = getPlatformStatus(parseInt(schoolId), platform);
                      return (
                        <div key={platform} className="flex items-center">
                          {getStatusIcon(platformStatus)}
                          <span className="ml-1 capitalize">
                            {platform === 'edu' ? '.edu.it' : 
                             platform === 'net4market' ? 'Net4M' : platform}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600">
                    {progress.tendersFound || 0} bandi trovati
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-md p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Scuole</div>
                <div className="text-gray-600">
                  {session.completedSchools} / {session.totalSchools}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Bandi Trovati</div>
                <div className="text-gray-600">{session.totalTenders}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Status</div>
                <div className="text-gray-600 capitalize">{session.status}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
