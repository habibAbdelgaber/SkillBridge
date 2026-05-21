interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#08306b" />
      <path
        d="M9 20c3-1 4-3 4-5s-1-4-4-5M23 12c-3 1-4 3-4 5s1 4 4 5M12 16h8"
        stroke="#deebf7"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
