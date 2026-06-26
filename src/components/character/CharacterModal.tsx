"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import BaseModal from "@/components/ui/BaseModal";
import type { CharacterDetail } from "@/types/characters";
import {
  NATURE_COLORS,
  NATURE_ICONS,
  formatNatureName,
} from "@/types/characters";

const FALLBACK = "/logo/favicon-naruto.png";

// ─── Hook détail personnage ────────────────────────────────────────────────────

export function useCharacterDetail(id: number | null) {
  const [data, setData] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(null);
    fetch(`/api/characters/${id}`)
      .then((r) => r.json())
      .then((d: CharacterDetail) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading };
}

// ─── Sous-composants internes ──────────────────────────────────────────────────

function DrawerSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className="text-[10px] font-bold uppercase tracking-widest mb-3 pb-2 border-b"
        style={{ color: accent, borderColor: `${accent}30` }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoPair({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[10px] text-white/35 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm text-white/80 font-medium mt-0.5">{value}</dd>
    </div>
  );
}

function DrawerContent({
  data,
  accent,
}: {
  data: CharacterDetail;
  accent: string;
}) {
  return (
    <div className="flex flex-col pb-8">
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={data.image ?? FALLBACK}
          alt={data.name}
          fill
          className="object-cover object-top"
          unoptimized
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK;
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-naruto-surface via-naruto-surface/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-5">
          <h2
            className="text-2xl sm:text-3xl font-black text-white leading-none"
            style={{ textShadow: `0 0 40px ${accent}66` }}
          >
            {data.name}
          </h2>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {data.natureType?.length > 0 && (
          <DrawerSection title="Affinités chakra" accent={accent}>
            <div className="flex flex-wrap gap-2">
              {data.natureType.map((rawName) => {
                const clean = formatNatureName(rawName);
                const color = NATURE_COLORS[clean] ?? "#888";
                return (
                  <span
                    key={rawName}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: `${color}1a`,
                      color,
                      border: `1px solid ${color}44`,
                    }}
                  >
                    {(() => {
                      const IconComponent = NATURE_ICONS[clean];
                      return IconComponent ? (
                        <IconComponent size={14} className="shrink-0" />
                      ) : null;
                    })()}
                    {rawName}
                  </span>
                );
              })}
            </div>
          </DrawerSection>
        )}

        {(data.sex || data.birthdate) && (
          <DrawerSection title="Informations" accent={accent}>
            <div className="grid grid-cols-2 gap-3">
              {data.sex && <InfoPair label="Sexe" value={data.sex} />}
              {data.birthdate && (
                <InfoPair label="Anniversaire" value={data.birthdate} />
              )}
            </div>
            {data.height && Object.keys(data.height).length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Taille
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.height).map(([arc, h]) => (
                    <span
                      key={arc}
                      className="text-xs bg-white/5 rounded px-2 py-1"
                    >
                      <span className="text-white/35">{arc}: </span>
                      <span className="text-white/80">{h}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.age && Object.keys(data.age).length > 0 && (
              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">
                  Âge
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.age).map(([arc, a]) => (
                    <span
                      key={arc}
                      className="text-xs bg-white/5 rounded px-2 py-1"
                    >
                      <span className="text-white/35">{arc}: </span>
                      <span className="text-white/80">{a}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </DrawerSection>
        )}

        {data.rank && Object.keys(data.rank).length > 0 && (
          <DrawerSection title="Rang ninja" accent={accent}>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.rank as Record<string, string>).map(
                ([arc, r]) => (
                  <InfoPair key={arc} label={arc} value={r} />
                ),
              )}
            </div>
          </DrawerSection>
        )}

        {data.family && Object.keys(data.family).length > 0 && (
          <DrawerSection title="Famille" accent={accent}>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data.family).map(([rel, member]) => (
                <InfoPair key={rel} label={rel} value={member} />
              ))}
            </div>
          </DrawerSection>
        )}

        {data.jutsu?.length > 0 && (
          <DrawerSection
            title={`Jutsus · ${data.jutsu.length}`}
            accent={accent}
          >
            <ul className="max-h-48 overflow-y-auto flex flex-col divide-y divide-white/5 pr-1">
              {data.jutsu.map((j) => (
                <li
                  key={j}
                  className="py-1.5 text-sm text-white/65 hover:text-white/90 transition-colors"
                >
                  {j}
                </li>
              ))}
            </ul>
          </DrawerSection>
        )}

        {(data.debut?.anime ||
          data.debut?.manga ||
          data.debut?.movie ||
          data.debut?.game) && (
          <DrawerSection title="Premières apparitions" accent={accent}>
            <div className="flex flex-col gap-2">
              {data.debut.anime && (
                <InfoPair label="Anime" value={data.debut.anime} full />
              )}
              {data.debut.manga && (
                <InfoPair label="Manga" value={data.debut.manga} full />
              )}
              {data.debut.movie && (
                <InfoPair label="Film" value={data.debut.movie} full />
              )}
              {data.debut.game && (
                <InfoPair label="Jeu" value={data.debut.game} full />
              )}
            </div>
          </DrawerSection>
        )}
      </div>
    </div>
  );
}

// ─── Export principal : CharacterModal standalone ──────────────────────────────

export default function CharacterModal({
  characterId,
  onClose,
}: {
  characterId: number | null;
  onClose: () => void;
}) {
  const { data, loading } = useCharacterDetail(characterId);

  const accent = data?.natureType?.[0]
    ? (NATURE_COLORS[formatNatureName(data.natureType[0])] ?? "#e5c97e")
    : "#e5c97e";

  return (
    <BaseModal isOpen={characterId !== null} onClose={onClose}>
      {loading && (
        <div className="flex items-center justify-center min-h-50">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: `${accent} transparent transparent transparent`,
            }}
          />
        </div>
      )}
      {!loading && data && <DrawerContent data={data} accent={accent} />}
    </BaseModal>
  );
}
