"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel mx-auto mt-24 max-w-lg p-8 text-center">
      <CircleAlert className="mx-auto mb-4 text-[#a8453c]" size={34} />
      <h2 className="text-xl font-extrabold">화면을 불러오지 못했습니다</h2>
      <p className="mb-5 text-sm leading-6 text-[#6c7b79]">잠시 후 다시 시도해 주세요.</p>
      <button type="button" className="btn-secondary" onClick={reset}>
        <RotateCcw size={15} /> 다시 시도
      </button>
    </div>
  );
}
