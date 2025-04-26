'use client'

import dynamic from "next/dynamic";

const Presenter = dynamic(() => import('./PresenterSceen'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      Loading presenter screen...
    </div>
  ),
});

export default function PresenterPage() {
  return <Presenter />;
}
