import type { SVGProps } from "react";

export function ArrowUpRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function ArrowLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20 12H4" />
      <path d="M10 6 4 12l6 6" />
    </svg>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 12h16" />
      <path d="M14 6l6 6-6 6" />
    </svg>
  );
}

export function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.94 4.58c.26-1.2-.9-2.16-2.02-1.7L2.9 9.66C1.7 10.14 1.77 11.9 3 12.28l4.28 1.33 1.62 4.98c.2.62.98.82 1.46.38l2.4-2.2 4.2 3.1c.66.48 1.6.12 1.77-.68l3.2-14.9ZM8.9 13.4l7.9-4.9c.14-.09.28.1.16.22l-6.36 5.98c-.22.2-.36.5-.4.8l-.22 1.66c-.03.2-.32.24-.4.05l-.86-3.05a.5.5 0 0 1 .24-.6l.3-.16Z" />
    </svg>
  );
}

export function BurgerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3.75 6.5h16.5M3.75 12h16.5M3.75 17.5h16.5" />
    </svg>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  );
}

/* Clover mark — four rounded L-elbows pointing at the centre.
   Geometry measured off the Figma artwork (40x40 viewBox): arm thickness 7.1,
   quadrant 15, centre gap 4, rounded outer corners + a softened inner corner.
   One elbow drawn, then rotated 4x — the mark has 90-degree rotational symmetry. */
const ELBOW =
  "M14.1,3 L14.8,3 A3.2,3.2 0 0 1 18,6.2 L18,14.8 A3.2,3.2 0 0 1 14.8,18 L6.2,18 A3.2,3.2 0 0 1 3,14.8 L3,14.1 A3.2,3.2 0 0 1 6.2,10.9 L8.5,10.9 A2.4,2.4 0 0 0 10.9,8.5 L10.9,6.2 A3.2,3.2 0 0 1 14.1,3 Z";

export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" {...props}>
      <g fill="#a3cf2b">
        {[0, 90, 180, 270].map((a) => (
          <path key={a} d={ELBOW} transform={`rotate(${a} 20 20)`} />
        ))}
      </g>
    </svg>
  );
}
