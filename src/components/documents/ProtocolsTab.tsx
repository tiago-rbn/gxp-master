import { useState } from "react";
import { Plus, Search, FileText, Eye, Download, Edit, Trash2, MoreHorizontal, Loader2, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDocuments } from "@/hooks/useDocuments";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type Document = Database["public"]["Tables"]["documents"]["Row"] & {
  system?: { name: string } | null;
  author?: { full_name: string } | null;
  approver?: { full_name: string } | null;
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho", pending: "Em Revisão", approved: "Aprovado", rejected: "Rejeitado", completed: "Concluído", cancelled: "Cancelado",
};

const protocolTypes = ["IQ", "OQ", "PQ"];

interface ProtocolsTabProps {
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onCreate: () => void;
}

export function ProtocolsTab({ onView, onEdit, onDelete, onCreate }: ProtocolsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { documents, isLoading } = useDocuments();

  const protocolDocs = documents.filter(d => protocolTypes.includes(d.document_type));

  const filtered = protocolDocs.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || (doc.system?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchType = typeFilter === "all" || doc.document_type === typeFilter;
    const matchStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const handleDownload = async (doc: Document) => {
    if (!doc.file_url) return;
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(doc.file_url, 60);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) { console.error('Download error:', error); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Protocolos de Qualificação</h2>
          <p className="text-sm text-muted-foreground">Protocolos IQ, OQ e PQ para qualificação dos sistemas ({protocolDocs.length} protocolos)</p>
        </div>
        <Button onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Novo Protocolo</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={`cursor-pointer ${typeFilter === "all" ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setTypeFilter("all")}>Todos ({protocolDocs.length})</Badge>
        {protocolTypes.map(type => {
          const count = protocolDocs.filter(d => d.document_type === type).length;
          return <Badge key={type} variant="outline" className={`cursor-pointer ${typeFilter === type ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setTypeFilter(type)}>{type} ({count})</Badge>;
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos Status</SelectItem><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="pending">Em Revisão</SelectItem><SelectItem value="approved">Aprovado</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{protocolDocs.length === 0 ? "Nenhum protocolo cadastrado." : "Nenhum protocolo encontrado."}</p>
              {protocolDocs.length === 0 && <Button onClick={onCreate}><Plus className="mr-2 h-4 w-4" />Criar Primeiro Protocolo</Button>}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Protocolo</TableHead><TableHead>Tipo</TableHead><TableHead>Sistema</TableHead><TableHead>Versão</TableHead><TableHead>Status</TableHead><TableHead>Autor</TableHead><TableHead>Atualizado</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onView(doc)}>
                    <TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{doc.title}</span></div></TableCell>
                    <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                    <TableCell>{doc.system?.name || "-"}</TableCell>
                    <TableCell><Badge variant="secondary">v{doc.version || "1.0"}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[doc.status || "draft"]}</Badge></TableCell>
                    <TableCell>{doc.author?.full_name || "-"}</TableCell>
                    <TableCell>{new Date(doc.updated_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(doc); }}><Eye className="mr-2 h-4 w-4" />Visualizar</DropdownMenuItem>
                          {doc.file_url && <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(doc); }}><Edit className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(doc); }}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
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
    </div>
  );
}
