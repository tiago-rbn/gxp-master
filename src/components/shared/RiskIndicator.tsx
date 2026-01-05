import { cn } from "@/lib/utils";

type RiskLevel = 'High' | 'Medium' | 'Low';

interface RiskIndicatorProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  'High': { label: 'Alto', color: 'bg-risk-high', bgColor: 'bg-risk-high/10' },
  'Medium': { label: 'Médio', color: 'bg-risk-medium', bgColor: 'bg-risk-medium/10' },
  'Low': { label: 'Baixo', color: 'bg-risk-low', bgColor: 'bg-risk-low/10' },
};

const sizeConfig = {
  sm: { dot: 'h-2 w-2', text: 'text-xs', padding: 'px-2 py-0.5' },
  md: { dot: 'h-3 w-3', text: 'text-sm', padding: 'px-2.5 py-1' },
  lg: { dot: 'h-4 w-4', text: 'text-base', padding: 'px-3 py-1.5' },
};

export function RiskIndicator({ level, showLabel = true, size = 'md', className }: RiskIndicatorProps) {
  const risk = riskConfig[level];
  const sizeStyles = sizeConfig[size];

  if (!showLabel) {
    return (
      <span 
        className={cn("inline-block rounded-full", sizeStyles.dot, risk.color, className)}
        title={risk.label}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        sizeStyles.padding,
        sizeStyles.text,
        risk.bgColor,
        className
      )}
    >
      <span className={cn("rounded-full", sizeStyles.dot, risk.color)} />
      {risk.label}
    </span>
  );
}