import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type GampCategory = 1 | 3 | 4 | 5;

interface GampBadgeProps {
  category: GampCategory;
  showDescription?: boolean;
  className?: string;
}

const gampConfig: Record<GampCategory, { label: string; description: string; color: string }> = {
  1: { 
    label: 'Cat. 1', 
    description: 'Infraestrutura', 
    color: 'bg-gamp-1/10 text-gamp-1 border-gamp-1/20' 
  },
  3: { 
    label: 'Cat. 3', 
    description: 'COTS', 
    color: 'bg-gamp-3/10 text-gamp-3 border-gamp-3/20' 
  },
  4: { 
    label: 'Cat. 4', 
    description: 'Configurado', 
    color: 'bg-gamp-4/10 text-gamp-4 border-gamp-4/20' 
  },
  5: { 
    label: 'Cat. 5', 
    description: 'Customizado', 
    color: 'bg-gamp-5/10 text-gamp-5 border-gamp-5/20' 
  },
};

export function GampBadge({ category, showDescription = false, className }: GampBadgeProps) {
  const config = gampConfig[category];

  return (
    <Badge 
      variant="outline"
      className={cn("font-medium", config.color, className)}
    >
      {config.label}
      {showDescription && ` - ${config.description}`}
    </Badge>
  );
}