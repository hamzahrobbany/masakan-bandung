"use client";

import dynamic from "next/dynamic";

import type { FoodFormProps } from "./FoodForm";

const DynamicFoodForm = dynamic(() => import("./FoodForm"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
      Memuat form makanan...
    </div>
  ),
});

export default function FoodFormLazy(props: FoodFormProps) {
  return <DynamicFoodForm {...props} />;
}
