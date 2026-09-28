import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading conversation" className="fixed inset-0 flex flex-col bg-night lg:left-[260px]">
      <div className="pt-safe border-b border-white/6">
        <div className="mx-auto flex h-[76px] max-w-[760px] items-center gap-3 px-4">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-end gap-2 px-4 pb-28">
        <Skeleton className="h-11 w-48 self-start rounded-[20px]" />
        <Skeleton className="h-11 w-56 self-end rounded-[20px]" />
        <Skeleton className="h-11 w-40 self-start rounded-[20px]" />
      </div>
    </div>
  );
}
