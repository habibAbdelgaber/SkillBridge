import { cn } from "@/utils/cn";

interface SuccessCheckmarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<SuccessCheckmarkProps["size"]>, string> = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

export function SuccessCheckmark({ size = "md", className }: SuccessCheckmarkProps) {
  return (
    <span
      role="img"
      aria-label="Success"
      className={cn(
        "inline-flex items-center justify-center",
        SIZE_CLASS[size],
        className,
      )}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="32"
          cy="32"
          r="28"
          fill="none"
          stroke="#16a34a"
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            strokeDasharray: 176,
            strokeDashoffset: 176,
            transformOrigin: "center",
            animation: "sb-checkmark-circle 380ms ease-out forwards",
          }}
        />
        <path
          d="M20 33.5 L29 42 L45 25"
          fill="none"
          stroke="#16a34a"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 48,
            strokeDashoffset: 48,
            animation: "sb-checkmark-tick 260ms 320ms ease-out forwards",
          }}
        />
      </svg>
      <style>{`
        @keyframes sb-checkmark-circle {
          0% { stroke-dashoffset: 176; transform: scale(0.85); }
          100% { stroke-dashoffset: 0; transform: scale(1); }
        }
        @keyframes sb-checkmark-tick {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </span>
  );
}
