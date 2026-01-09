import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Package, ShoppingCart, Clock } from "lucide-react";
import {
  useTemplatePackages,
  usePackageActivations,
  TemplatePackage,
} from "@/hooks/useTemplatePackages";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { TemplatePackageCard } from "./TemplatePackageCard";
import { TemplatePackageFormDialog } from "./TemplatePackageFormDialog";
import { TemplatePackageDetailsDialog } from "./TemplatePackageDetailsDialog";
import { TemplatePackageActivationsTab } from "./TemplatePackageActivationsTab";
import { EmptyState } from "@/components/shared/EmptyState";

export function TemplatePackagesTab() {
  const { user } = useAuth();
  const { activeCompany } = useUserCompanies();
  const companyId = activeCompany?.id;
  const {
    publishedPackages,
    publishedLoading,
    myPackages,
    myPackagesLoading,
    updatePackage,
  } = useTemplatePackages();
  const { requestActivation, getActivationStatus, isSuperAdmin } = usePackageActivations();

  const [activeTab, setActiveTab] = useState("marketplace");
  const [search, setSearch] = useState("");
  const [applicationFilter, setApplicationFilter] = useState<string>("__all__");
  const [gampFilter, setGampFilter] = useState<string>("__all__");
  const [formOpen, setFormOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<TemplatePackage | null>(null);
  const [detailsPackage, setDetailsPackage] = useState<TemplatePackage | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Get unique applications from all packages
  const allApplications = [
    ...new Set([
      ...(publishedPackages?.map((p) => p.application) || []),
      ...(myPackages?.map((p) => p.application) || []),
    ]),
  ];

  const filterPackages = (packages: TemplatePackage[] | undefined) => {
    if (!packages) return [];

    return packages.filter((pkg) => {
      const matchesSearch =
        !search ||
        pkg.name.toLowerCase().includes(search.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(search.toLowerCase()) ||
        pkg.system_name?.toLowerCase().includes(search.toLowerCase());

      const matchesApplication =
        applicationFilter === "__all__" || pkg.application === applicationFilter;

      const matchesGamp =
        gampFilter === "__all__" || pkg.gamp_category === gampFilter;

      return matchesSearch && matchesApplication && matchesGamp;
    });
  };

  const handleActivate = async (pkg: TemplatePackage) => {
    if (!user) return;

    setActivatingId(pkg.id);
    try {
      await requestActivation.mutateAsync({
        packageId: pkg.id,
        requestedBy: user.id,
      });
    } finally {
      setActivatingId(null);
    }
  };

  const handleUpdateDocumentCount = async (count: number) => {
    if (detailsPackage) {
      await updatePackage.mutateAsync({
        id: detailsPackage.id,
        document_count: count,
      });
    }
  };

  const filteredPublished = filterPackages(
    publishedPackages?.filter((p) => p.company_id !== companyId)
  );
  const filteredMyPackages = filterPackages(myPackages);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="marketplace" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="my-packages" className="gap-2">
              <Package className="h-4 w-4" />
              Meus Pacotes
            </TabsTrigger>
            <TabsTrigger value="activations" className="gap-2">
              <Clock className="h-4 w-4" />
              {isSuperAdmin ? "Solicitações" : "Minhas Ativações"}
            </TabsTrigger>
          </TabsList>

          {activeTab !== "activations" && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pacote
            </Button>
          )}
        </div>

        {/* Filters */}
        {activeTab !== "activations" && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacotes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={applicationFilter}
              onValueChange={setApplicationFilter}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Aplicação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as Aplicações</SelectItem>
                {allApplications.map((app) => (
                  <SelectItem key={app} value={app}>
                    {app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gampFilter} onValueChange={setGampFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoria GAMP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas as Categorias</SelectItem>
                <SelectItem value="1">Categoria 1</SelectItem>
                <SelectItem value="3">Categoria 3</SelectItem>
                <SelectItem value="4">Categoria 4</SelectItem>
                <SelectItem value="5">Categoria 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <TabsContent value="marketplace" className="mt-6">
          {publishedLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredPublished.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhum pacote disponível"
              description="Não há pacotes de templates publicados no marketplace ainda."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublished.map((pkg) => (
                <TemplatePackageCard
                  key={pkg.id}
                  pkg={pkg}
                  activation={getActivationStatus(pkg.id)}
                  onView={() => setDetailsPackage(pkg)}
                  onActivate={() => handleActivate(pkg)}
                  activating={activatingId === pkg.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-packages" className="mt-6">
          {myPackagesLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredMyPackages.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Nenhum pacote criado"
            description="Você ainda não criou nenhum pacote de templates. Clique em 'Novo Pacote' para começar."
            action={{
              label: "Criar Primeiro Pacote",
              onClick: () => setFormOpen(true),
            }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMyPackages.map((pkg) => (
                <TemplatePackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isOwner
                  onView={() => setDetailsPackage(pkg)}
                  onEdit={() => {
                    setEditPackage(pkg);
                    setFormOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activations" className="mt-6">
          <TemplatePackageActivationsTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TemplatePackageFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditPackage(null);
        }}
        editPackage={editPackage}
      />

      <TemplatePackageDetailsDialog
        open={!!detailsPackage}
        onOpenChange={(open) => {
          if (!open) setDetailsPackage(null);
        }}
        pkg={detailsPackage}
        isOwner={detailsPackage?.company_id === companyId}
        onUpdateDocumentCount={handleUpdateDocumentCount}
      />
    </div>
  );
}
