"use client";

import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { toggleHsFavoriteAction } from "@/server/actions/hs-favorite.actions";

export function HsFavoriteToggleButton({
  basisDate,
  displayName,
  hskCode,
  isFavorite,
  returnTo
}: {
  basisDate: string;
  displayName: string;
  hskCode: string;
  isFavorite: boolean;
  returnTo: string;
}) {
  return (
    <form action={toggleHsFavoriteAction}>
      <input name="hskCode" type="hidden" value={hskCode} />
      <input name="displayName" type="hidden" value={displayName} />
      <input name="basisDate" type="hidden" value={basisDate} />
      <input name="returnTo" type="hidden" value={returnTo} />
      <FavoriteSubmitButton isFavorite={isFavorite} />
    </form>
  );
}

function FavoriteSubmitButton({ isFavorite }: { isFavorite: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`focus-ring inline-flex min-w-[96px] items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
        isFavorite ? "bg-amber-100 text-amber-900 hover:bg-amber-200" : "bg-white/15 text-white hover:bg-white/25"
      } disabled:cursor-wait disabled:opacity-70`}
      disabled={pending}
      type="submit"
    >
      <Star aria-hidden="true" className={isFavorite ? "fill-amber-500 text-amber-600" : ""} size={15} />
      {pending ? "저장 중" : isFavorite ? "즐겨찾기됨" : "즐겨찾기"}
    </button>
  );
}
