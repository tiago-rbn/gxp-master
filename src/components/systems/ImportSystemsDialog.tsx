import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface ImportSystemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (systems: ParsedSystem[]) => Promise<void>;
  isLoading?: boolean;
}

export interface ParsedSystem {
  name: string;
  vendor?: string;
  version?: string;
  gamp_category: string;
  criticality?: string;
  validation_status?: string;
  description?: string;
  gxp_impact?: boolean;
  data_integrity_impact?: boolean;
  bpx_relevant?: boolean;
  installation_location?: string;
}

const EXPECTED_COLUMNS = [
  "nome",
  "fornecedor",
  "versao",
  "categoria_gamp",
  "criticidade",
  "status_validacao",
  "descricao",
  "impacto_gxp",
  "integridade_dados",
  "bpx_relevante",
  "local_instalacao",
];

function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === "," || char === ";") && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return ["sim", "yes", "true", "1", "s", "y"].includes(normalized);
}

function mapGampCategory(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (["1", "3", "4", "5"].includes(num)) return num;
  return "4";
}

function mapCriticality(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("baixa") || normalized.includes("low")) return "low";
  if (normalized.includes("media") || normalized.includes("medium") || normalized.includes("média")) return "medium";
  if (normalized.includes("alta") || normalized.includes("high")) return "high";
  if (normalized.includes("critica") || normalized.includes("critical") || normalized.includes("crítica")) return "critical";
  return "medium";
}

function mapValidationStatus(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("validado") || normalized.includes("validated")) return "validated";
  if (normalized.includes("andamento") || normalized.includes("progress")) return "in_progress";
  if (normalized.includes("expirado") || normalized.includes("expired")) return "expired";
  if (normalized.includes("revalida") || normalized.includes("pending")) return "pending_revalidation";
  return "not_started";
}

function mapInstallationLocation(value: string): string {
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("nuvem") || normalized.includes("cloud")) return "cloud";
  if (normalized.includes("hibrid") || normalized.includes("hybrid")) return "hybrid";
  return "on_premise";
}

export function ImportSystemsDialog({
  open,
  onOpenChange,
  onImport,
  isLoading,
}: ImportSystemsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedSystems, setParsedSystems] = useState<ParsedSystem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [parseProgress, setParseProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setParsedSystems([]);
    setParseProgress(0);

    try {
      const content = await selectedFile.text();
      const rows = parseCSV(content);

      if (rows.length < 2) {
        setErrors(["O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados."]);
        return;
      }

      const headers = rows[0].map(normalizeHeader);
      const nameIndex = headers.findIndex((h) => h.includes("nome") || h.includes("name"));

      if (nameIndex === -1) {
        setErrors(["Coluna 'Nome' não encontrada. O arquivo deve ter uma coluna 'Nome' ou 'Name'."]);
        return;
      }

      const systems: ParsedSystem[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < rows.length; i++) {
        setParseProgress(Math.round((i / (rows.length - 1)) * 100));
        const row = rows[i];
        
        if (!row[nameIndex]?.trim()) {
          parseErrors.push(`Linha ${i + 1}: Nome do sistema é obrigatório`);
          continue;
        }

        const system: ParsedSystem = {
          name: row[nameIndex].trim(),
          gamp_category: "4",
        };

        headers.forEach((header, idx) => {
          const value = row[idx]?.trim() || "";
          
          if (header.includes("fornecedor") || header.includes("vendor")) {
            system.vendor = value;
          } else if (header.includes("versao") || header.includes("version")) {
            system.version = value;
          } else if (header.includes("categoria") || header.includes("gamp")) {
            system.gamp_category = mapGampCategory(value);
          } else if (header.includes("criticidade") || header.includes("criticality")) {
            system.criticality = mapCriticality(value);
          } else if (header.includes("status") || header.includes("validacao")) {
            system.validation_status = mapValidationStatus(value);
          } else if (header.includes("descricao") || header.includes("description")) {
            system.description = value;
          } else if (header.includes("gxp")) {
            system.gxp_impact = parseBoolean(value);
          } else if (header.includes("integridade") || header.includes("integrity")) {
            system.data_integrity_impact = parseBoolean(value);
          } else if (header.includes("bpx")) {
            system.bpx_relevant = parseBoolean(value);
          } else if (header.includes("local") || header.includes("location") || header.includes("instalacao")) {
            system.installation_location = mapInstallationLocation(value);
          }
        });

        systems.push(system);
      }

      setParsedSystems(systems);
      setErrors(parseErrors);
      setParseProgress(100);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setErrors(["Erro ao ler o arquivo. Verifique se é um arquivo CSV válido."]);
    }
  };

  const handleImport = async () => {
    await onImport(parsedSystems);
    setFile(null);
    setParsedSystems([]);
    setErrors([]);
    setParseProgress(0);
  };

  const handleClose = () => {
    setFile(null);
    setParsedSystems([]);
    setErrors([]);
    setParseProgress(0);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const headers = "Nome;Fornecedor;Versão;Categoria GAMP;Criticidade;Status Validação;Descrição;Impacto GxP;Integridade Dados;BPx Relevante;Local Instalação";
    const example = "SAP ERP;SAP SE;S/4HANA 2023;5;Alta;Validado;Sistema ERP principal;Sim;Sim;Sim;OnPremise";
    const content = `${headers}\n${example}`;
    
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_sistemas.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Sistemas via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os dados dos sistemas a serem importados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Baixar Template
            </Button>
          </div>

          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Clique para selecionar ou arraste um arquivo CSV"}
            </p>
          </div>

          {parseProgress > 0 && parseProgress < 100 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
              <Progress value={parseProgress} />
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside text-sm">
                  {errors.slice(0, 5).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {errors.length > 5 && (
                    <li>... e mais {errors.length - 5} erros</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parsedSystems.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>
                {parsedSystems.length} sistema(s) encontrado(s) e pronto(s) para importação.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedSystems.length === 0 || isLoading}
          >
            {isLoading ? "Importando..." : `Importar ${parsedSystems.length} Sistema(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
