import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRiskAssessments } from "@/hooks/useRiskAssessments";
import { IRAQuestionnaireForm } from "@/components/risks/IRAQuestionnaireForm";
import { IRAViewDialog } from "@/components/risks/IRAViewDialog";
import { IRAListTab } from "@/components/risks/IRAListTab";
import { FRAGroupedTab } from "@/components/risks/FRAGroupedTab";
import { RiskFormDialog } from "@/components/risks/RiskFormDialog";
import { RiskViewDialog } from "@/components/risks/RiskViewDialog";
import { DeleteRiskDialog } from "@/components/risks/DeleteRiskDialog";
import { LoadFromTemplateDialog } from "@/components/risks/LoadFromTemplateDialog";
import type { Database } from "@/integrations/supabase/types";

type RiskAssessment = Database["public"]["Tables"]["risk_assessments"]["Row"] & {
  system?: { name: string } | null;
  assessor?: { full_name: string } | null;
  approver?: { full_name: string } | null;
  reviewer?: { full_name: string } | null;
};

export default function Risks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("ira");

  const [isIRAFormOpen, setIsIRAFormOpen] = useState(false);
  const [isFRAFormOpen, setIsFRAFormOpen] = useState(false);
  const [isIRAViewOpen, setIsIRAViewOpen] = useState(false);
  const [isFRAViewOpen, setIsFRAViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoadTemplateOpen, setIsLoadTemplateOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null);
  const [prefilledSystemId, setPrefilledSystemId] = useState<string | null>(null);
  const [prefilledSystemName, setPrefilledSystemName] = useState<string | null>(null);

  const {
    riskAssessments,
    isLoading,
    stats,
    createRiskAssessment,
    updateRiskAssessment,
    deleteRiskAssessment,
  } = useRiskAssessments();

  const iraRisks = riskAssessments.filter((r) => r.assessment_type === "IRA");
  const fraRisks = riskAssessments.filter((r) => r.assessment_type !== "IRA");

  // Handle URL parameters
  useEffect(() => {
    const createIRA = searchParams.get("createIRA");
    const systemId = searchParams.get("systemId");
    const systemName = searchParams.get("systemName");
    const viewIRA = searchParams.get("viewIRA");

    if (createIRA === "true" && systemId) {
      setPrefilledSystemId(systemId);
      setPrefilledSystemName(systemName);
      setSelectedRisk(null);
      setActiveTab("ira");
      setIsIRAFormOpen(true);
      setSearchParams({});
    }

    if (viewIRA && riskAssessments.length > 0) {
      const riskToView = riskAssessments.find((r) => r.id === viewIRA);
      if (riskToView) {
        setSelectedRisk(riskToView);
        if (riskToView.assessment_type === "IRA") {
          setActiveTab("ira");
          setIsIRAViewOpen(true);
        } else {
          setActiveTab("fra");
          setIsFRAViewOpen(true);
        }
        setSearchParams({});
      }
    }
  }, [searchParams, riskAssessments, setSearchParams]);

  const handleIRACreate = () => {
    setPrefilledSystemId(null);
    setPrefilledSystemName(null);
    setSelectedRisk(null);
    setIsIRAFormOpen(true);
  };

  const handleFRACreate = () => {
    setSelectedRisk(null);
    setIsFRAFormOpen(true);
  };

  const handleView = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    if (risk.assessment_type === "IRA") {
      setIsIRAViewOpen(true);
    } else {
      setIsFRAViewOpen(true);
    }
  };

  const handleEdit = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setIsIRAViewOpen(false);
    setIsFRAViewOpen(false);
    if (risk.assessment_type === "IRA") {
      setIsIRAFormOpen(true);
    } else {
      setIsFRAFormOpen(true);
    }
  };

  const handleDelete = (risk: RiskAssessment) => {
    setSelectedRisk(risk);
    setIsDeleteOpen(true);
  };

  const handleIRASubmit = (values: any) => {
    if (selectedRisk) {
      updateRiskAssessment.mutate(
        { id: selectedRisk.id, ...values },
        { onSuccess: () => setIsIRAFormOpen(false) }
      );
    } else {
      createRiskAssessment.mutate(values, { onSuccess: () => setIsIRAFormOpen(false) });
    }
  };

  const handleFRASubmit = (values: any) => {
    const payload = {
      ...values,
      system_id: values.system_id || null,
      assessor_id: values.assessor_id || null,
      approver_id: values.approver_id || null,
      reviewer_id: values.reviewer_id || null,
      tags: values.tags || [],
    };
    if (selectedRisk) {
      updateRiskAssessment.mutate(
        { id: selectedRisk.id, change_summary: values.change_summary, ...payload },
        { onSuccess: () => setIsFRAFormOpen(false) }
      );
    } else {
      createRiskAssessment.mutate(payload, { onSuccess: () => setIsFRAFormOpen(false) });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedRisk) {
      deleteRiskAssessment.mutate(selectedRisk.id, {
        onSuccess: () => {
          setIsDeleteOpen(false);
          setSelectedRisk(null);
        },
      });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Gerenciamento de Riscos"
        description="Avaliações de risco inicial (IRA) e funcional (FRA)"
      />

      {/* Risk Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-risk-high/10">
              <AlertTriangle className="h-6 w-6 text-risk-high" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.high}</p>
              <p className="text-sm text-muted-foreground">Riscos Altos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-risk-medium/10">
              <AlertTriangle className="h-6 w-6 text-risk-medium" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.medium}</p>
              <p className="text-sm text-muted-foreground">Riscos Médios</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-risk-low/10">
              <AlertTriangle className="h-6 w-6 text-risk-low" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.low}</p>
              <p className="text-sm text-muted-foreground">Riscos Baixos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.open}</p>
              <p className="text-sm text-muted-foreground">Em Aberto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: IRA / FRA */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="ira" className="gap-2">
            IRA - Risco Inicial
            <Badge variant="secondary" className="ml-1">{iraRisks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="fra" className="gap-2">
            FRA - Risco Funcional
            <Badge variant="secondary" className="ml-1">{fraRisks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ira">
          <IRAListTab
            risks={iraRisks}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleIRACreate}
          />
        </TabsContent>

        <TabsContent value="fra">
          <FRAGroupedTab
            risks={fraRisks}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleFRACreate}
            onLoadTemplate={() => setIsLoadTemplateOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <IRAQuestionnaireForm
        open={isIRAFormOpen}
        onOpenChange={(open) => {
          setIsIRAFormOpen(open);
          if (!open) { setPrefilledSystemId(null); setPrefilledSystemName(null); }
        }}
        risk={selectedRisk?.assessment_type === "IRA" ? selectedRisk : null}
        onSubmit={handleIRASubmit}
        isLoading={createRiskAssessment.isPending || updateRiskAssessment.isPending}
        prefilledSystemId={prefilledSystemId}
        prefilledSystemName={prefilledSystemName}
      />

      <RiskFormDialog
        open={isFRAFormOpen}
        onOpenChange={setIsFRAFormOpen}
        risk={selectedRisk?.assessment_type !== "IRA" ? selectedRisk : null}
        onSubmit={handleFRASubmit}
        isLoading={createRiskAssessment.isPending || updateRiskAssessment.isPending}
        prefilledSystemId={null}
        prefilledSystemName={null}
      />

      <IRAViewDialog
        open={isIRAViewOpen}
        onOpenChange={setIsIRAViewOpen}
        risk={selectedRisk}
        onEdit={() => selectedRisk && handleEdit(selectedRisk)}
      />

      <RiskViewDialog
        open={isFRAViewOpen}
        onOpenChange={setIsFRAViewOpen}
        risk={selectedRisk}
        onEdit={() => selectedRisk && handleEdit(selectedRisk)}
      />

      <DeleteRiskDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        riskTitle={selectedRisk?.title || ""}
        onConfirm={handleConfirmDelete}
        isLoading={deleteRiskAssessment.isPending}
      />

      <LoadFromTemplateDialog
        open={isLoadTemplateOpen}
        onOpenChange={setIsLoadTemplateOpen}
      />
    </AppLayout>
  );
}
