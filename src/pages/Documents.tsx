import { useState } from "react";
import { Plus, Search, Filter, FileText, Eye, Download, Edit, Trash2, MoreHorizontal, Loader2, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentFormDialog } from "@/components/documents/DocumentFormDialog";
import { DocumentViewDialog } from "@/components/documents/DocumentViewDialog";
import { DeleteDocumentDialog } from "@/components/documents/DeleteDocumentDialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Document = Database["public"]["Tables"]["documents"]["Row"] & {
  system?: { name: string } | null;
  author?: { full_name: string } | null;
  approver?: { full_name: string } | null;
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  pending: "Em Revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  completed: "Concluído",
  cancelled: "Cancelado",
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { documents, isLoading, stats, createDocument, updateDocument, deleteDocument } =
    useDocuments();

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.system?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedDocument(null);
    setIsFormOpen(true);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewOpen(true);
  };

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setIsFormOpen(true);
    setIsViewOpen(false);
  };

  const handleDelete = (doc: Document) => {
    setSelectedDocument(doc);
    setIsDeleteOpen(true);
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_url, 60);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleFormSubmit = (values: any) => {
    const payload = {
      ...values,
      system_id: values.system_id || null,
      project_id: values.project_id || null,
    };

    if (selectedDocument) {
      updateDocument.mutate(
        { id: selectedDocument.id, ...payload },
        { onSuccess: () => setIsFormOpen(false) }
      );
    } else {
      createDocument.mutate(payload, { onSuccess: () => setIsFormOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedDocument) {
      deleteDocument.mutate(selectedDocument.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedDocument(null);
        },
      });
    }
  };

  // Count documents by type
  const typeCounts = documents.reduce((acc, doc) => {
    acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <PageHeader
        title="Documentação"
        description="Biblioteca de documentos de validação"
        action={{
          label: "Novo Documento",
          icon: Plus,
          onClick: handleCreate,
        }}
      >
        <Button variant="outline" disabled>
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
          const count = typeCounts[type] || 0;
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
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="pending">Em Revisão</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {documents.length === 0
                  ? "Nenhum documento cadastrado ainda."
                  : "Nenhum documento encontrado com os filtros aplicados."}
              </p>
              {documents.length === 0 && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Documento
                </Button>
              )}
            </div>
          ) : (
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
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleView(doc)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={documentTypeColors[doc.document_type] || ""}>
                        {doc.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.system?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">v{doc.version || "1.0"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statusLabels[doc.status || "draft"]}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.author?.full_name || "-"}</TableCell>
                    <TableCell>
                      {new Date(doc.updated_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(doc);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          {doc.file_url && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(doc);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(doc);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DocumentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        document={selectedDocument}
        onSubmit={handleFormSubmit}
        isLoading={createDocument.isPending || updateDocument.isPending}
      />

      <DocumentViewDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        document={selectedDocument}
        onEdit={() => selectedDocument && handleEdit(selectedDocument)}
      />

      <DeleteDocumentDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        documentTitle={selectedDocument?.title || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDocument.isPending}
      />
    </AppLayout>
  );
}
