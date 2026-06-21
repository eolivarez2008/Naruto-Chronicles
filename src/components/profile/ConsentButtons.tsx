"use client";

import { useRouter } from "next/navigation";

export default function ConsentButtons({ userId }: { userId: string }) {
  const router = useRouter();

  const handleAccept = async () => {
    const res = await fetch("/api/auth/consent", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      window.location.href = "/profile";
    }
  };

  const handleRefuse = async () => {
    await fetch("/api/auth/profile", { method: "DELETE" });
    window.location.href = "/";
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleAccept}
        className="w-full py-3 rounded-xl font-bold text-sm bg-naruto-orange hover:bg-[#e65500] text-white transition-all cursor-pointer"
      >
        J'accepte et je continue
      </button>

      <button
        onClick={handleRefuse}
        className="w-full py-2.5 rounded-xl text-sm text-white/35 hover:text-white/60 transition-colors cursor-pointer"
      >
        Refuser et supprimer mes données
      </button>
    </div>
  );
}
