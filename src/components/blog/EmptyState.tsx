interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center py-24 px-4">
      <p className="label-accent inline-block text-xs uppercase tracking-wider mb-4">
        Blog
      </p>
      <p className="text-[var(--muted-hi)] text-lg">{message}</p>
    </div>
  );
}
