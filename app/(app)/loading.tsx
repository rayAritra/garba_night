import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="pb-nav mx-auto flex min-h-dvh max-w-[640px] flex-col gap-4 px-5 pt-8">
      <Skeleton className="h-9 w-40" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}
