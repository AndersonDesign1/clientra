"use client";

import { EvilBarChart } from "@/components/evilcharts/charts/bar-chart";
import { EvilPieChart } from "@/components/evilcharts/charts/pie-chart";
import { EvilRadialChart } from "@/components/evilcharts/charts/radial-chart";
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

// ── Status Bar Chart (Horizontal) ─────────────────────────────────────────────
export function StatusBarChart({
  data,
  isLoading,
}: {
  data: Array<{ status: string; total: number }>;
  isLoading?: boolean;
}) {
  return (
    <EvilBarChart
      barRadius={4}
      barVariant="gradient"
      chartConfig={{
        total: {
          colors: {
            light: ["#047857", "#10b981"],
            dark: ["#10b981", "#6ee7b7"],
          },
          label: "Projects",
        },
      }}
      className="h-[180px]"
      data={data}
      enableHoverHighlight
      hideLegend
      isLoading={isLoading}
      layout="horizontal"
      tooltipVariant="frosted-glass"
      xDataKey="status"
    />
  );
}

// ── Deadline Bar Chart ────────────────────────────────────────────────────────
export function DeadlineBarChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; count: number }>;
  isLoading?: boolean;
}) {
  const visibleData =
    data.length > 0 ? data : [{ count: 0, label: "No dates" }];

  return (
    <EvilBarChart
      barRadius={4}
      barVariant="gradient"
      chartConfig={{
        count: {
          colors: {
            light: ["#0d9488", "#10b981"],
            dark: ["#2dd4bf", "#6ee7b7"],
          },
          label: "Deadlines",
        },
      }}
      className="h-[180px]"
      data={visibleData}
      enableHoverHighlight
      hideLegend
      isLoading={isLoading}
      tooltipVariant="frosted-glass"
      xDataKey="label"
    />
  );
}

// ── Budget Horizontal Bar Chart ───────────────────────────────────────────────
export function BudgetBarChart({
  data,
  isLoading,
}: {
  data: Array<{ status: string; budget: number }>;
  isLoading?: boolean;
}) {
  return (
    <EvilBarChart
      barRadius={4}
      barVariant="gradient"
      chartConfig={{
        budget: {
          colors: {
            light: ["#047857", "#0d9488"],
            dark: ["#10b981", "#2dd4bf"],
          },
          label: "Budget ($)",
        },
      }}
      className="h-[180px]"
      data={data}
      enableHoverHighlight
      hideLegend
      isLoading={isLoading}
      layout="horizontal"
      tooltipVariant="frosted-glass"
      xDataKey="status"
      yAxisProps={{
        tickFormatter: (v: number) =>
          v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`,
      }}
    />
  );
}

// ── Activity Pie/Donut Chart ──────────────────────────────────────────────────
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

  // Build dynamic chartConfig from data labels
  const colorPalette = [
    { light: palette.forest, dark: palette.forest },
    { light: palette.mint, dark: palette.mint },
    { light: palette.teal, dark: palette.teal },
    { light: palette.sky, dark: palette.sky },
  ];

  const chartConfig: ChartConfig = {};
  for (let i = 0; i < visibleData.length; i++) {
    const item = visibleData[i];
    const colors = colorPalette[i % colorPalette.length];
    chartConfig[item.label] = {
      colors: { light: colors.light, dark: colors.dark },
      label: item.label,
    };
  }

  return (
    <EvilPieChart
      chartConfig={chartConfig}
      className="h-[180px]"
      cornerRadius={4}
      data={visibleData}
      dataKey="total"
      innerRadius="55%"
      isLoading={isLoading}
      nameKey="label"
      paddingAngle={3}
      tooltipVariant="frosted-glass"
    />
  );
}

// ── Activity Radial Chart ─────────────────────────────────────────────────────
export function ActivityRadialChart({
  data,
  isLoading,
}: {
  data: Array<{ label: string; total: number }>;
  isLoading?: boolean;
}) {
  // Each bar in a radial chart needs its own chartConfig key matching the nameKey
  const visibleData = data.some((item) => item.total > 0)
    ? data
    : [{ label: "No activity", total: 1 }];

  // Build a dynamic chartConfig from the data labels
  const colorPalette = [
    palette.forest,
    palette.mint,
    palette.teal,
    palette.sky,
  ];
  const chartConfig: ChartConfig = {};
  for (let i = 0; i < visibleData.length; i++) {
    const item = visibleData[i];
    const color = colorPalette[i % colorPalette.length];
    chartConfig[item.label] = {
      colors: { light: color, dark: color },
      label: item.label,
    };
  }

  return (
    <EvilRadialChart
      barSize={10}
      chartConfig={chartConfig}
      className="h-[180px]"
      data={visibleData}
      dataKey="total"
      isLoading={isLoading}
      nameKey="label"
      variant="full"
    />
  );
}
