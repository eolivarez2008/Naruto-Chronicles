"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
  X,
  Filter,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
}

export interface SortOptionDef {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
  minWidth?: string;
}

interface SortDropdownProps {
  options: SortOptionDef[];
  value: string;
  onChange: (value: string) => void;
  minWidth?: string;
}

interface FilterToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sortOptions?: SortOptionDef[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  secondFilterOptions?: FilterOption[];
  secondFilterValue?: string;
  onSecondFilterChange?: (value: string) => void;
}

function SortDropdown({
  options,
  value,
  onChange,
  minWidth = "sm:min-w-40",
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLabel = options.find((o) => o.value === value)?.label ?? "Trier";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Trier les résultats"
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap min-w-12.5 ${minWidth}`}
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <SlidersHorizontal size={16} className="text-white/50 shrink-0" />
          <span className="hidden sm:inline truncate">{currentLabel}</span>
        </span>
        <ChevronDown
          size={12}
          className={`text-white/30 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Options de tri"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute top-full right-0 mt-2 w-44 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20"
          >
            {options.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={value === opt.value}
              >
                <button
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${value === opt.value ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  {opt.label}
                  {value === opt.value && <Check size={14} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  value,
  onChange,
  minWidth = "sm:min-w-48",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Filtrer les résultats"
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 bg-white/5 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-all cursor-pointer whitespace-nowrap min-w-12.5 ${minWidth}`}
      >
        <span className="flex items-center gap-2 overflow-hidden text-left">
          {current?.icon ? (
            <current.icon
              size={14}
              className="shrink-0"
              style={current.color ? { color: current.color } : undefined}
            />
          ) : (
            <Filter size={14} className="text-white/50 shrink-0" />
          )}
          <span className="hidden sm:inline truncate">
            {current?.label ?? label}
          </span>
        </span>
        <ChevronDown
          size={12}
          className={`text-white/30 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Options de filtre"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            className="absolute top-full right-0 mt-2 w-52 bg-[#141414] border border-white/10 rounded-xl overflow-hidden shadow-xl z-20"
          >
            {options.map((opt) => (
              <li key={opt.id} role="option" aria-selected={value === opt.id}>
                <button
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${value === opt.id ? "text-naruto-orange bg-naruto-orange/10" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                >
                  <span className="flex items-center gap-2">
                    {opt.icon ? (
                      <opt.icon
                        size={14}
                        className="shrink-0"
                        style={opt.color ? { color: opt.color } : undefined}
                      />
                    ) : (
                      <Filter size={14} className="text-white/70" />
                    )}
                    {opt.label}
                  </span>
                  {value === opt.id && <Check size={14} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  sortOptions,
  sortValue,
  onSortChange,
  filterOptions,
  filterValue,
  onFilterChange,
  secondFilterOptions,
  secondFilterValue,
  onSecondFilterChange,
}: FilterToolbarProps) {
  return (
    <div className="relative z-110 mb-8 flex flex-wrap gap-2 sm:gap-3 items-center bg-[#050505]/80 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/10">
      <div className="relative flex-1 min-w-35">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full bg-white/5 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Effacer la recherche"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {sortOptions && sortValue !== undefined && onSortChange && (
        <SortDropdown
          options={sortOptions}
          value={sortValue}
          onChange={onSortChange}
        />
      )}

      {filterOptions && filterValue !== undefined && onFilterChange && (
        <FilterDropdown
          label="Tous"
          options={filterOptions}
          value={filterValue}
          onChange={onFilterChange}
        />
      )}

      {secondFilterOptions &&
        secondFilterValue !== undefined &&
        onSecondFilterChange && (
          <FilterDropdown
            label="Tous"
            options={secondFilterOptions}
            value={secondFilterValue}
            onChange={onSecondFilterChange}
          />
        )}
    </div>
  );
}
