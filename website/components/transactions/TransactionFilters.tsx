"use client";

import { Search, Download } from "lucide-react";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  onExport?: () => void;
}

const filters = [
  "All",
  "Deposit",
  "Withdrawal",
  "Contribution",
  "Payout",
  "Pending",
  "Completed",
  "Failed",
];

export default function TransactionFilters({
  search,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  onExport,
}: Props) {
  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <button
          onClick={onExport}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-700"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => {
          const active = selectedFilter === filter;

          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}