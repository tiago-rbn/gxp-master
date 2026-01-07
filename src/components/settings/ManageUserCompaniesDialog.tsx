import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Building2 } from "lucide-react";
import { useAddUserToCompany, useRemoveUserFromCompany } from "@/hooks/useUserCompanies";
import { Profile } from "@/hooks/useProfiles";

interface Company {
  id: string;
  name: string;
}

interface UserCompanyAssociation {
  id: string;
  company_id: string;
  is_primary: boolean;
  company: Company;
}

interface ManageUserCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Profile | null;
}

export function ManageUserCompaniesDialog({
  open,
  onOpenChange,
  user,
}: ManageUserCompaniesDialogProps) {
  const [userCompanies, setUserCompanies] = useState<UserCompanyAssociation[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const addUserToCompany = useAddUserToCompany();
  const removeUserFromCompany = useRemoveUserFromCompany();

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Load user's companies
      const { data: ucData, error: ucError } = await supabase
        .from("user_companies")
        .select(`
          id,
          company_id,
          is_primary,
          company:companies(id, name)
        `)
        .eq("user_id", user.id);

      if (ucError) throw ucError;
      setUserCompanies(ucData as unknown as UserCompanyAssociation[]);

      // Load all companies (for super admin)
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (companiesError) throw companiesError;
      setAllCompanies(companiesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!user || !selectedCompanyId) return;

    try {
      await addUserToCompany.mutateAsync({
        userId: user.id,
        companyId: selectedCompanyId,
        setPrimary: userCompanies.length === 0,
      });
      setSelectedCompanyId("");
      loadData();
    } catch (error) {
      console.error("Error adding company:", error);
    }
  };

  const handleRemoveCompany = async (companyId: string) => {
    if (!user) return;

    if (userCompanies.length === 1) {
      toast.error("O usuário deve pertencer a pelo menos uma empresa");
      return;
    }

    try {
      await removeUserFromCompany.mutateAsync({
        userId: user.id,
        companyId,
      });
      loadData();
    } catch (error) {
      console.error("Error removing company:", error);
    }
  };

  const handleSetPrimary = async (companyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc("switch_user_company", {
        _user_id: user.id,
        _company_id: companyId,
      });

      if (error) throw error;
      toast.success("Empresa principal atualizada");
      loadData();
    } catch (error) {
      console.error("Error setting primary:", error);
      toast.error("Erro ao atualizar empresa principal");
    }
  };

  const availableCompanies = allCompanies.filter(
    (c) => !userCompanies.some((uc) => uc.company_id === c.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Empresas do Usuário</DialogTitle>
          <DialogDescription>
            {user?.full_name} - {user?.email}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current companies */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Empresas vinculadas</h4>
              {userCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma empresa vinculada
                </p>
              ) : (
                <div className="space-y-2">
                  {userCompanies.map((uc) => (
                    <div
                      key={uc.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{uc.company.name}</span>
                        {uc.is_primary && (
                          <Badge variant="secondary">Principal</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!uc.is_primary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetPrimary(uc.company_id)}
                          >
                            Tornar principal
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCompany(uc.company_id)}
                          disabled={userCompanies.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new company */}
            {availableCompanies.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Adicionar a outra empresa</h4>
                <div className="flex gap-2">
                  <Select
                    value={selectedCompanyId}
                    onValueChange={setSelectedCompanyId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddCompany}
                    disabled={!selectedCompanyId || addUserToCompany.isPending}
                  >
                    {addUserToCompany.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}