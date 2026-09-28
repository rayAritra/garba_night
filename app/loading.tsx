export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="flex min-h-dvh items-center justify-center">
      <span className="size-8 animate-spin rounded-full border-2 border-saffron border-r-transparent" />
    </div>
  );
}
