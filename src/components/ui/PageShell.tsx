import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className = '' }: PageShellProps) {
  return <div className={`flex flex-1 flex-col animate-screen-in ${className}`}>{children}</div>;
}
