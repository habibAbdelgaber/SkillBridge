/**
 * Inline SVGs for landing-page category and step illustrations.
 *
 * They're all 24x24, single-color, and inherit `currentColor` so the parent
 * controls the tint. Keeping them in one file avoids the per-icon boilerplate
 * and makes it cheap to swap palettes when the design system evolves.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HandymanIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-6 6a1.5 1.5 0 0 0 2.1 2.1l6-6a4 4 0 0 0 5.4-5.4l-2.6 2.6-1.7-1.7 2.2-2.2Z" />
      <path d="m17 13 4.5 4.5a1.5 1.5 0 0 1-2.1 2.1L15 15" />
    </Svg>
  );
}

export function CleaningIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 3h2v6H9z" />
      <path d="M7 9h6l1 4H6z" />
      <path d="M6 13h8v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
      <path d="M16 5h3M16 9h4M17 13h3" />
    </Svg>
  );
}

export function PlumbingIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 8h6v3H4z" />
      <path d="M14 13h6v3h-6z" />
      <path d="M10 9.5h4v5h-4z" />
      <path d="M7 11v6M17 7v6" />
    </Svg>
  );
}

export function ElectricalIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </Svg>
  );
}

export function DesignIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 21s2-1 4-3 5-6 8-9l4 4c-3 3-7 6-9 8s-3 4-3 4z" />
      <path d="m15 5 4 4" />
      <path d="m18 2 4 4-2 2-4-4z" />
    </Svg>
  );
}

export function TutoringIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 5h8a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
      <path d="M21 5h-8a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h9z" />
    </Svg>
  );
}

export function GardeningIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22V11" />
      <path d="M12 11C8 11 5 8 5 4c4 0 7 3 7 7" />
      <path d="M12 11c4 0 7-3 7-7-4 0-7 3-7 7" />
    </Svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 17h14l-1.5-6a2 2 0 0 0-1.9-1.5H8.4A2 2 0 0 0 6.5 11L5 17z" />
      <circle cx="7.5" cy="17" r="1.75" />
      <circle cx="16.5" cy="17" r="1.75" />
      <path d="M5 17v2M19 17v2" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Svg {...props} fill="currentColor" stroke="none">
      <path d="m12 2 2.9 6.5 7.1.8-5.3 4.8 1.5 7L12 17.6 5.8 21l1.5-7L2 9.3l7.1-.8Z" />
    </Svg>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  );
}
