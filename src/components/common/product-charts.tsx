"use client";

import type { SankeyData } from "recharts";
import { EvilAreaChart } from "@/components/evilcharts/charts/area-chart";
import { EvilComposedChart } from "@/components/evilcharts/charts/composed-chart";
import {
  EvilPieChart,
  Legend,
  Pie,
  Tooltip,
} from "@/components/evilcharts/charts/pie-chart";
import {
  EvilSankeyChart,
  Link,
  Node,
  NodeLabel,
  Tooltip as SankeyTooltip,
} from "@/components/evilcharts/charts/sankey-chart";
import type { ChartConfig } from "@/components/evilcharts/ui/chart";

// ── Shared palette ────────────────────────────────────────────────────────────
const palette = {
  forest: ["#15803d"],
  emerald: ["#047857"],
  mint: ["#10b981"],
  teal: ["#0d9488"],
  sky: ["#0284c7"],
  amber: ["#d97706"],
  zinc: ["#71717a"],
};

// ── Project Status Pie/Donut Chart ────────────────────────────────────────────
export function ProjectStatusPieChart({
  data,
  isLoading,
}: {
  data: Array<{ status: string; total: number }>;
  isLoading?: boolean;
}) {
  const visibleData = data.some((item) => item.total > 0)
    ? data
    : [{ status: "No projects", total: 1 }];

  const keyedData = visibleData.map((item, index) => {
    // Sanitize space out of status keys to ensure valid CSS variable names
    const safeKey = `${item.status.toLowerCase().replace(/\s+/g, "_")}-${index}`;
    return {
      ...item,
      _key: safeKey,
    };
  });

  const chartConfig: ChartConfig = {};
  for (const item of keyedData) {
    const statusKey = item.status.toLowerCase();

    // Soft, premium, matching status brand colors
    let colors = {
      light: ["#71717a"],
      dark: ["#a1a1aa"],
    };

    if (statusKey.includes("progress")) {
      colors = {
        light: ["#0d9488"],
        dark: ["#2dd4bf"],
      };
    } else if (statusKey.includes("completed")) {
      colors = {
        light: ["#15803d"],
        dark: ["#22c55e"],
      };
    } else if (statusKey.includes("planning")) {
      colors = {
        light: ["#0284c7"],
        dark: ["#38bdf8"],
      };
    }

    chartConfig[item._key] = {
      colors,
      label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    };
  }

  return (
    <EvilPieChart
      className="h-[280px] w-full"
      config={chartConfig}
      data={keyedData}
      dataKey="total"
      isLoading={isLoading}
      nameKey="_key"
    >
      <Legend isClickable />
      <Tooltip />
      <Pie cornerRadius={5} innerRadius="55%" isClickable paddingAngle={3} />
    </EvilPieChart>
  );
}

// ── Deadline Area Chart ───────────────────────────────────────────────────────
export function DeadlineAreaChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; count: number }>;
  isLoading?: boolean;
}) {
  const visibleData =
    data.length > 0 ? data : [{ count: 0, label: "No dates" }];

  return (
    <EvilAreaChart
      chartConfig={{
        count: {
          colors: {
            light: ["#0d9488", "#10b981"],
            dark: ["#2dd4bf", "#6ee7b7"],
          },
          label: "Deadlines",
        },
      }}
      className="h-[300px]"
      curveType="monotone"
      data={visibleData}
      hideLegend
      isLoading={isLoading}
      tooltipVariant="default"
      xDataKey="label"
      yDataKey="count"
    />
  );
}

// ── Budget Composed Chart ─────────────────────────────────────────────────────
export function BudgetComposedChart({
  data,
  isLoading,
}: {
  data: Array<{ status: string; budget: number; count: number }>;
  isLoading?: boolean;
}) {
  return (
    <EvilComposedChart
      barDataKey="budget"
      chartConfig={{
        budget: {
          colors: {
            light: ["#047857", "#0d9488"],
            dark: ["#10b981", "#2dd4bf"],
          },
          label: "Budget ($)",
        },
        count: {
          colors: {
            light: ["#d97706"],
            dark: ["#f59e0b"],
          },
          label: "Projects",
        },
      }}
      className="h-[300px]"
      data={data}
      isLoading={isLoading}
      lineDataKey="count"
      tooltipVariant="default"
      xDataKey="status"
      yAxisLeftProps={{
        tickFormatter: (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
      }}
      yAxisRightProps={{
        tickFormatter: (v: number) => String(v),
      }}
    />
  );
}

// ── Activity Pie/Donut Chart ──────────────────────────────────────────────────
// Build static chartConfig from data labels
const ACTIVITY_COLOR_PALETTE = [
  { light: palette.forest, dark: palette.forest },
  { light: palette.mint, dark: palette.mint },
  { light: palette.teal, dark: palette.teal },
  { light: palette.sky, dark: palette.sky },
];

export function ActivityPieChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; total: number }>;
  isLoading?: boolean;
}) {
  const visibleData = data.some((item) => item.total > 0)
    ? data
    : [{ label: "No activity", total: 1 }];

  const keyedData = visibleData.map((item, index) => {
    const safeKey = `${item.label.toLowerCase().replace(/\s+/g, "_")}-${index}`;
    return {
      ...item,
      _key: safeKey,
    };
  });

  const chartConfig: ChartConfig = {};
  keyedData.forEach((item, i) => {
    const colors = ACTIVITY_COLOR_PALETTE[i % ACTIVITY_COLOR_PALETTE.length];
    chartConfig[item._key] = {
      colors: { light: colors.light, dark: colors.dark },
      label: item.label,
    };
  });

  return (
    <EvilPieChart
      className="h-[220px] w-full"
      config={chartConfig}
      data={keyedData}
      dataKey="total"
      isLoading={isLoading}
      nameKey="_key"
    >
      <Legend isClickable />
      <Tooltip />
      <Pie cornerRadius={4} innerRadius="55%" isClickable paddingAngle={3} />
    </EvilPieChart>
  );
}

// ── Activity Sankey Chart ────────────────────────────────────────────────────
// Source nodes (activity types) get distinct brand colors
const SANKEY_TYPE_COLORS: Record<string, { light: string[]; dark: string[] }> =
  {
    Clients: {
      light: ["#15803d"],
      dark: ["#22c55e"],
    },
    Projects: {
      light: ["#047857"],
      dark: ["#10b981"],
    },
    Comments: {
      light: ["#0284c7"],
      dark: ["#38bdf8"],
    },
    Files: {
      light: ["#d97706"],
      dark: ["#f59e0b"],
    },
    Onboarding: {
      light: ["#0d9488"],
      dark: ["#2dd4bf"],
    },
  };

// All project/target nodes share a single unified teal
const SANKEY_PROJECT_COLOR = { light: ["#0d9488"], dark: ["#2dd4bf"] };

export function ActivitySankeyChart({
  data,
  isLoading,
}: {
  data: SankeyData;
  isLoading?: boolean;
}) {
  const chartConfig: ChartConfig = {};

  for (const node of data.nodes) {
    if (SANKEY_TYPE_COLORS[node.name]) {
      chartConfig[node.name] = {
        label: node.name,
        colors: SANKEY_TYPE_COLORS[node.name],
      };
    } else {
      chartConfig[node.name] = {
        label: node.name,
        colors: SANKEY_PROJECT_COLOR,
      };
    }
  }

  return (
    <EvilSankeyChart
      className="h-[280px] w-full p-4"
      config={chartConfig}
      data={data}
      isLoading={isLoading}
      nodePadding={20}
      nodeWidth={8}
    >
      <Node isClickable>
        <NodeLabel position="outside" showValues />
      </Node>
      <Link variant="source" />
      <SankeyTooltip />
    </EvilSankeyChart>
  );
}
