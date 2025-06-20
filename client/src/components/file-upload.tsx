import { useState, useRef } from "react";
import { Upload, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadSchoolFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUploaded: (fileInfo: { name: string; count: number }) => void;
}

export default function FileUpload({ onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ name: string; count: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast({
        title: "Formato file non supportato",
        description: "Seleziona un file CSV o JSON",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const result = await uploadSchoolFile(file);
      const fileInfo = { name: file.name, count: result.count };
      setUploadResult(fileInfo);
      onFileUploaded(fileInfo);
      
      toast({
        title: "File caricato con successo",
        description: `${result.count} scuole caricate dal file ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Errore durante il caricamento",
        description: "Verifica che il file sia in formato corretto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="text-primary mr-2" />
          Caricamento Dataset MIUR
        </CardTitle>
        <CardDescription>
          Carica il file CSV o JSON con i dati delle scuole
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!uploadResult ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Trascina il file qui</h3>
            <p className="text-gray-600 mb-4">oppure clicca per selezionare il file</p>
            
            <Button 
              type="button" 
              disabled={uploading}
              className="bg-primary hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              {uploading ? "Caricamento..." : "Seleziona File"}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        ) : (
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">File caricato con successo</p>
              <p className="text-sm text-green-700">
                {uploadResult.name} - {uploadResult.count.toLocaleString()} scuole caricate
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
