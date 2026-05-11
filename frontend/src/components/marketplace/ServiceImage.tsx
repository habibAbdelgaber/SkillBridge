import { useEffect, useState } from "react";

import { cn } from "@/utils/cn";

interface ServiceImageProps {
  src?: string;
  className?: string;
}

export function ServiceImage({ src, className }: ServiceImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageSrc = src?.trim();
  const shouldShowImage = Boolean(imageSrc) && !hasError;

  useEffect(() => {
    setHasError(false);
  }, [imageSrc]);

  if (shouldShowImage) {
    return (
      <img
        src={imageSrc}
        alt=""
        className={cn(
          "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
          className,
        )}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full w-full overflow-hidden bg-brand-surface",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,120,194,0.16),transparent_34%),linear-gradient(135deg,#eef6ff_0%,#ffffff_48%,#dbeafe_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-borderLight bg-white/75 shadow-sm" />
      <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/20" />
    </div>
  );
}
