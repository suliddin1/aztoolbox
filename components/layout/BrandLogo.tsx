type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-sm">
        Az
      </span>
      <span className="text-lg font-bold tracking-normal text-foreground">
        Toolbox
      </span>
    </span>
  );
}
