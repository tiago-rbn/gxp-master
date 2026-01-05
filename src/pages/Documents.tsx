import { useState } from "react";
import { Plus, Search, Filter, FileText, Eye, Download, Sparkles, MoreHorizontal } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { documents, type Document } from "@/data/mockData";

const documentTypeLabels: Record<string, string> = {
  URS: "User Requirements Specification",
  FS: "Functional Specification",
  DS: "Design Specification",
  IQ: "Installation Qualification",
  OQ: "Operational Qualification",
  PQ: "Performance Qualification",
  RTM: "Requirements Traceability Matrix",
  Report: "Relatório de Validação",
};

const documentTypeColors: Record<string, string> = {
  URS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  FS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  DS: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  IQ: "bg-green-500/10 text-green-600 border-green-500/20",
  OQ: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  PQ: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  RTM: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  Report: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.systemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDialogOpen(true);
  };

  const documentStats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === "Approved").length,
    inReview: documents.filter((d) => d.status === "Review").length,
    draft: documents.filter((d) => d.status === "Draft").length,
  };

  return (
    <AppLayout>
      <PageHeader
        title="Documentação"
        description="Biblioteca de documentos de validação"
        action={{
          label: "Novo Documento",
          icon: Plus,
          onClick: () => {},
        }}
      >
        <Button variant="outline" onClick={() => setIsAIDialogOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar com IA
        </Button>
      </PageHeader>

      {/* Document Type Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`cursor-pointer ${typeFilter === "all" ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          Todos ({documents.length})
        </Badge>
        {["URS", "FS", "DS", "IQ", "OQ", "PQ", "RTM", "Report"].map((type) => {
          const count = documents.filter((d) => d.type === type).length;
          return (
            <Badge
              key={type}
              variant="outline"
              className={`cursor-pointer ${typeFilter === type ? "bg-primary text-primary-foreground" : documentTypeColors[type]}`}
              onClick={() => setTypeFilter(type)}
            >
              {type} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou sistema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Draft">Rascunho</SelectItem>
                <SelectItem value="Review">Em Revisão</SelectItem>
                <SelectItem value="Approved">Aprovado</SelectItem>
                <SelectItem value="Obsolete">Obsoleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={documentTypeColors[doc.type]}>
                      {doc.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.systemName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">v{doc.version}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell>{doc.author}</TableCell>
                  <TableCell>{doc.updatedAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument && documentTypeLabels[selectedDocument.type]}
            </DialogDescription>
          </DialogHeader>
          {selectedDocument && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={documentTypeColors[selectedDocument.type]}>
                      {selectedDocument.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Versão</Label>
                  <p className="font-medium">v{selectedDocument.version}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sistema</Label>
                  <p className="font-medium">{selectedDocument.systemName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedDocument.status} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Autor</Label>
                  <p className="font-medium">{selectedDocument.author}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Criado em</Label>
                  <p className="font-medium">{selectedDocument.createdAt}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Preview do documento não disponível no protótipo
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button>Editar Documento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gerar Documento com IA
            </DialogTitle>
            <DialogDescription>
              Use a IA para criar rascunhos de documentos de validação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Documento</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="URS">URS - User Requirements Specification</SelectItem>
                  <SelectItem value="FS">FS - Functional Specification</SelectItem>
                  <SelectItem value="IQ">IQ - Installation Qualification</SelectItem>
                  <SelectItem value="OQ">OQ - Operational Qualification</SelectItem>
                  <SelectItem value="PQ">PQ - Performance Qualification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sistema</Label>
              <Select>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">SAP ERP</SelectItem>
                  <SelectItem value="2">LIMS</SelectItem>
                  <SelectItem value="3">Quality Management System</SelectItem>
                  <SelectItem value="4">Environmental Monitoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Assistente de IA</p>
                  <p className="text-muted-foreground">
                    A IA irá gerar um rascunho baseado nas melhores práticas GAMP 5 e nas informações do sistema selecionado.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
              Cancelar
            </Button>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}