"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { StoryArc } from "@/types/story";
import type { TocItem, ArcNeighbor, ContentBlock } from "@/types/story";
import { getArcText, type ArcLang } from "@/lib/arcLang";
import TranslationBanner from "@/components/story/TranslationBanner";
import { trackEvent, EVENTS } from "@/lib/analytics";
import {
  ChevronLeft,
  ChevronRight,
  List,
  X,
  LayoutList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  arc: StoryArc;
  prev: ArcNeighbor | null;
  next: ArcNeighbor | null;
  sagaColor: string;
  sagaLabel: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseContent(content: string): {
  blocks: ContentBlock[];
  toc: TocItem[];
} {
  const rawBlocks = content.split("\n\n").filter((b) => b.trim().length > 0);
  const blocks: ContentBlock[] = [];
  const toc: TocItem[] = [];
  const usedIds = new Map<string, number>();

  for (const raw of rawBlocks) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("## ")) {
      const text = trimmed.slice(3).trim();
      let id = slugify(text);
      const n = usedIds.get(id) ?? 0;
      usedIds.set(id, n + 1);
      if (n > 0) id = `${id}-${n}`;
      blocks.push({ type: "h2", id, text });
      toc.push({ id, text, level: 2 });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      const text = trimmed.slice(4).trim();
      let id = slugify(text);
      const n = usedIds.get(id) ?? 0;
      usedIds.set(id, n + 1);
      if (n > 0) id = `${id}-${n}`;
      blocks.push({ type: "h3", id, text });
      toc.push({ id, text, level: 3 });
      continue;
    }
    if (trimmed.startsWith("- ")) {
      const items = trimmed
        .split("\n")
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2).trim());
      blocks.push({ type: "ul", items });
      continue;
    }
    if (trimmed.length > 0) {
      blocks.push({ type: "p", text: trimmed });
    }
  }
  return { blocks, toc };
}

function ContentRenderer({
  blocks,
  sagaColor,
}: {
  blocks: ContentBlock[];
  sagaColor: string;
}) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          return (
            <h2
              key={i}
              id={block.id}
              className="text-xl font-black text-white mt-10 mb-3 pb-2 border-b border-white/8 scroll-mt-24"
            >
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3
              key={i}
              id={block.id}
              className="text-base font-bold text-white/85 mt-6 mb-2 scroll-mt-24"
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i} className="space-y-1.5 pl-4">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="text-white/60 text-sm leading-relaxed list-disc marker:text-white/20"
                >
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="text-white/65 text-sm sm:text-base leading-relaxed"
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

function TableOfContents({
  toc,
  activeId,
  sagaColor,
  onClose,
}: {
  toc: TocItem[];
  activeId: string;
  sagaColor: string;
  onClose?: () => void;
}) {
  if (toc.length === 0) {
    return (
      <nav aria-label="SommaireVide">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
          <List size={11} />
          Sommaire
        </p>
        <div className="text-xs text-white/30 p-2">Aucun titre disponible</div>
      </nav>
    );
  }

  return (
    <nav aria-label="Sommaire">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
        <List size={11} />
        Sommaire
      </p>
      <ul className="space-y-0.5">
        {toc.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={onClose}
                className="block text-xs leading-relaxed py-1 transition-all duration-200 hover:translate-x-1"
                style={{
                  paddingLeft: item.level === 3 ? "18px" : "8px",
                  color: isActive ? sagaColor : "rgba(255,255,255,0.35)",
                  fontWeight: isActive ? 700 : 400,
                  borderLeft: isActive
                    ? `2px solid ${sagaColor}`
                    : "2px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = sagaColor;
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                }}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ArcNavigation({
  prev,
  next,
  color,
  arcTitle,
}: {
  prev: ArcNeighbor | null;
  next: ArcNeighbor | null;
  color: string;
  arcTitle: string;
}) {
  function Btn({
    item,
    direction,
  }: {
    item: ArcNeighbor | null;
    direction: "prev" | "next";
  }) {
    const isDisabled = !item;
    const isNext = direction === "next";
    const base =
      "flex-1 lg:w-full rounded-xl px-3 py-3 transition-all min-w-0 border";

    if (isDisabled) {
      return (
        <div
          className={`${base} bg-white/2 text-white/20 border-white/8 cursor-not-allowed`}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isNext ? "Suivant" : "Précédent"}
            </span>
          </div>
        </div>
      );
    }

    return (
      <Link
        href={`/story/${encodeURIComponent(item.slug)}`}
        onClick={() =>
          trackEvent(isNext ? EVENTS.STORY_NAV_NEXT : EVENTS.STORY_NAV_PREV, {
            from: arcTitle,
            to: item.title,
          })
        }
        className={`${base} ${
          isNext
            ? "text-white border-transparent"
            : "bg-white/5 border-white/10 text-white/80"
        } hover:scale-[1.02] active:scale-[0.98]`}
        style={isNext ? { backgroundColor: color } : undefined}
      >
        <div
          className={`flex items-center w-full gap-2 ${isNext ? "justify-end" : "justify-start"}`}
        >
          {!isNext && <ChevronLeft size={18} className="shrink-0" />}
          <span className="lg:hidden text-[10px] font-black uppercase tracking-tighter">
            {isNext ? "Suivant" : "Précédent"}
          </span>
          <span className="hidden lg:block text-sm font-bold truncate">
            {item.title}
          </span>
          {isNext && <ChevronRight size={18} className="shrink-0" />}
        </div>
      </Link>
    );
  }

  return (
    <div className="flex lg:flex-col gap-2 w-full">
      <Btn item={prev} direction="prev" />
      <Btn item={next} direction="next" />
    </div>
  );
}

export default function ArcDetailClient({
  arc,
  prev,
  next,
  sagaColor,
  sagaLabel,
}: Props) {
  const [lang, setLang] = useState<ArcLang>("fr");
  const { title, summary, content, hasFr } = getArcText(arc, lang);
  const hasContent = content?.trim().length > 0;
  const source = hasContent ? content : summary;
  const { blocks, toc } = parseContent(source);

  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");
  const [tocOpen, setTocOpen] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const tocContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement | null>(null);
  const [mobileAtTop, setMobileAtTop] = useState<boolean | null>(null);
  const [mobileAtBottom, setMobileAtBottom] = useState<boolean | null>(null);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setMobileAtTop(el.scrollTop < 4);
    setMobileAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  };

  useEffect(() => {
    if (!tocOpen) return;
    const el = mobileScrollRef.current;
    if (!el) return;
    setMobileAtTop(el.scrollTop < 4);
    setMobileAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  }, [tocOpen]);

  useEffect(() => {
    if (toc.length === 0) return;
    const headingIds = toc.map((t) => t.id);
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.2 },
    );
    headingIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [toc]);

  const handleTocScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setAtTop(el.scrollTop < 20);
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 20);
  };

  useEffect(() => {
    const el = tocContainerRef.current;
    if (!el) return;
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 20);
  }, [toc]);

  const scrollToc = useCallback((direction: "up" | "down") => {
    const el = tocContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: direction === "up" ? 0 : el.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const handleLangToggle = (l: ArcLang) => {
    setLang(l);
    trackEvent(EVENTS.STORY_LANG_TOGGLE, { lang: l, arc: arc.slug });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white -mt-16 pt-19">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs text-white/30 mb-6">
          <Link
            href="/story"
            className="group flex items-center gap-1.5 hover:text-naruto-orange transition-colors shrink-0"
          >
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            <span>Histoire</span>
          </Link>

          <ChevronLeft size={14} className="shrink-0" />

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-white/5 border border-white/10 text-white/70 w-fit whitespace-nowrap">
            <LayoutList
              size={14}
              className="shrink-0"
              style={{ color: sagaColor }}
            />
            <span className="truncate max-w-37.5 lg:max-w-none">{title}</span>
          </span>
        </nav>

        <div className="mb-6">
          <TranslationBanner
            lang={lang}
            hasFr={hasFr}
            onToggle={handleLangToggle}
          />
        </div>

        <div className="flex gap-10 items-start">
          <article className="flex-1 min-w-0">
            <header className="mb-8">
              <p
                className="text-xs font-black uppercase tracking-[0.25em] mb-3"
                style={{ color: sagaColor }}
              >
                {sagaLabel}
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                {title}
              </h1>
              <div
                className="h-0.5 w-16 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${sagaColor}, transparent)`,
                }}
              />
            </header>

            <div
              className="mb-8 p-5 rounded-xl border-l-2"
              style={{ borderColor: sagaColor, background: `${sagaColor}08` }}
            >
              <p className="text-white/75 text-sm sm:text-base leading-relaxed italic">
                {summary}
              </p>
            </div>

            {hasContent && (
              <ContentRenderer blocks={blocks} sagaColor={sagaColor} />
            )}
          </article>

          <aside className="hidden lg:block w-56 xl:w-64 shrink-0 self-stretch h-screen sticky top-0 pr-4 pb-8">
            <div className="flex flex-col h-full pt-24 gap-4">
              <div className="min-h-0 relative rounded-xl border border-white/8 bg-white/2 backdrop-blur-sm overflow-hidden">
                {!atTop && (
                  <button
                    onClick={() => scrollToc("up")}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center px-4 h-6 rounded-full transition-all active:scale-95"
                    style={{
                      backgroundColor: `${sagaColor}70`,
                      border: `1px solid ${sagaColor}FF`,
                    }}
                    title="Aller en haut"
                  >
                    <ChevronUp size={13} style={{ color: sagaColor }} />
                  </button>
                )}

                <div
                  ref={tocContainerRef}
                  onScroll={handleTocScroll}
                  className="h-full overflow-y-auto p-4"
                  style={{ overscrollBehavior: "contain" }}
                >
                  <TableOfContents
                    toc={toc}
                    activeId={activeId}
                    sagaColor={sagaColor}
                  />
                </div>

                {!atBottom && (
                  <button
                    onClick={() => scrollToc("down")}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center px-4 h-6 rounded-full transition-all active:scale-95"
                    style={{
                      backgroundColor: `${sagaColor}70`,
                      border: `1px solid ${sagaColor}FF`,
                    }}
                    title="Aller en bas"
                  >
                    <ChevronDown size={13} style={{ color: sagaColor }} />
                  </button>
                )}
              </div>

              <div className="shrink-0 p-3 rounded-xl border border-white/8 bg-white/2 backdrop-blur-sm">
                <ArcNavigation
                  prev={prev}
                  next={next}
                  color={sagaColor}
                  arcTitle={arc.title}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      {toc.length > 0 && (
        <div className="fixed bottom-0 right-0 p-4 lg:hidden z-50">
          <AnimatePresence>
            {tocOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setTocOpen(false)}
                  className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[-1]"
                />

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ delay: 0.05 }}
                  className="absolute bottom-19 right-4 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-3 origin-bottom-right"
                >
                  <ArcNavigation
                    prev={prev}
                    next={next}
                    color={sagaColor}
                    arcTitle={arc.title}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10, x: 10 }}
                  className="absolute right-4 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl origin-bottom-right overflow-hidden"
                  style={{ bottom: "calc(5rem + 72px + 8px)" }}
                >
                  {mobileAtTop === false && (
                    <button
                      onClick={() => {
                        const el = mobileScrollRef.current;
                        if (el) el.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center px-4 h-6 rounded-full transition-all active:scale-95"
                      style={{
                        backgroundColor: `${sagaColor}70`,
                        border: `1px solid ${sagaColor}FF`,
                      }}
                    >
                      <ChevronUp size={13} style={{ color: sagaColor }} />
                    </button>
                  )}

                  <div
                    ref={mobileScrollRef}
                    onScroll={handleMobileScroll}
                    className="max-h-[45vh] overflow-y-auto p-4"
                    style={{ overscrollBehavior: "contain" }}
                  >
                    <TableOfContents
                      toc={toc}
                      activeId={activeId}
                      sagaColor={sagaColor}
                      onClose={() => setTocOpen(false)}
                    />
                  </div>

                  {mobileAtBottom === false && (
                    <button
                      onClick={() => {
                        const el = mobileScrollRef.current;
                        if (el)
                          el.scrollTo({
                            top: el.scrollHeight,
                            behavior: "smooth",
                          });
                      }}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center px-4 h-6 rounded-full transition-all active:scale-95"
                      style={{
                        backgroundColor: `${sagaColor}70`,
                        border: `1px solid ${sagaColor}FF`,
                      }}
                    >
                      <ChevronDown size={13} style={{ color: sagaColor }} />
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <button
            onClick={() => setTocOpen(!tocOpen)}
            aria-label={tocOpen ? "Fermer le sommaire" : "Ouvrir le sommaire"}
            className="flex items-center justify-center w-12 h-12 rounded-2xl shadow-2xl border border-white/10 transition-transform active:scale-95 cursor-pointer"
            style={{ backgroundColor: sagaColor }}
          >
            {tocOpen ? (
              <X size={20} className="text-white" />
            ) : (
              <List size={20} className="text-white" />
            )}
          </button>
        </div>
      )}
    </main>
  );
}
