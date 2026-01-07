import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanySwitcher() {
  const [open, setOpen] = useState(false);
  const { userCompanies, activeCompany, isLoading, switchCompany, hasMultipleCompanies } = useUserCompanies();

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  if (!activeCompany) {
    return null;
  }

  // If only one company, just show the name without dropdown
  if (!hasMultipleCompanies) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{activeCompany.name}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{activeCompany.name}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
            <CommandGroup heading="Suas empresas">
              {userCompanies.map((uc) => (
                <CommandItem
                  key={uc.company_id}
                  value={uc.company?.name || ""}
                  onSelect={() => {
                    if (uc.company_id !== activeCompany.id) {
                      switchCompany.mutate(uc.company_id);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeCompany.id === uc.company_id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {uc.company?.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}