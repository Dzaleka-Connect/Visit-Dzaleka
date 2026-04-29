type DocumentReviewMetaProps = {
  reviewedBy: string;
  reviewedDate?: string;
  cadence?: string;
  className?: string;
};

export function DocumentReviewMeta({
  reviewedBy,
  reviewedDate = "29 Apr 2026",
  cadence = "Quarterly review",
  className = "",
}: DocumentReviewMetaProps) {
  return (
    <dl
      aria-label="Document review metadata"
      className={`flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <div className="rounded-full border bg-background px-2.5 py-1">
        <dt className="sr-only">Reviewed by</dt>
        <dd>Reviewed by {reviewedBy}</dd>
      </div>
      <div className="rounded-full border bg-background px-2.5 py-1">
        <dt className="sr-only">Review date</dt>
        <dd>Review date: {reviewedDate}</dd>
      </div>
      <div className="rounded-full border bg-background px-2.5 py-1">
        <dt className="sr-only">Review cadence</dt>
        <dd>{cadence}</dd>
      </div>
    </dl>
  );
}
