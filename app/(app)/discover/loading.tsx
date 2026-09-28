import { Skeleton } from "@/components/ui/states";

export default function Loading() {
  return (
    <div className="pb-nav flex h-dvh flex-col px-4 lg:items-center lg:justify-center lg:pb-8">
      <div className="h-[60px] lg:hidden" />
      <Skeleton className="w-full max-w-[460px] flex-1 rounded-card lg:max-h-[700px] lg:w-[460px]" />
      <div className="flex justify-center gap-[22px] pt-3 lg:pt-6">
        <Skeleton className="size-15 rounded-full" />
        <Skeleton className="size-[72px] rounded-full" />
      </div>
    </div>
  );
}
