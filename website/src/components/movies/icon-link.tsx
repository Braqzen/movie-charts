import type { ReactNode } from "react";

type ExternalIconLinkProps = {
  href: string;
  "aria-label": string;
  children: ReactNode;
};

export function ExternalIconLink({ href, "aria-label": ariaLabel, children }: ExternalIconLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center justify-center text-foreground hover:text-primary"
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

type OptionalExternalIconLinkProps = {
  href: string;
  "aria-label": string;
  children: ReactNode;
};

export function OptionalExternalIconLink({
  href,
  "aria-label": ariaLabel,
  children,
}: OptionalExternalIconLinkProps) {
  if (!href.trim()) {
    return <span className="inline-flex h-5 items-center justify-center text-muted-foreground">-</span>;
  }
  return (
    <ExternalIconLink href={href} aria-label={ariaLabel}>
      {children}
    </ExternalIconLink>
  );
}
