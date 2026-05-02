"use client";

import { EvilAreaChart } from "@/components/evilcharts/charts/area-chart";
import { EvilBarChart } from "@/components/evilcharts/charts/bar-chart";
import { EvilLineChart } from "@/components/evilcharts/charts/line-chart";
import { EvilRadialChart } from "@/components/evilcharts/charts/radial-chart";

const chartColors = {
  amber: ["#a16207"],
  slate: ["#475569"],
  teal: ["#0f766e"],
  zinc: ["#3f3f46"],
};

export function StatusBarChart({
  data,
}: {
  data: Array<{ status: string; total: number }>;
}) {
  return (
    <EvilBarChart
      barRadius={3}
      chartConfig={{
        total: { colors: { light: chartColors.teal }, label: "Projects" },
      }}
      className="h-64"
      data={data}
      hideLegend
      layout="horizontal"
      xDataKey="total"
      yDataKey="status"
    />
  );
}

export function DeadlineAreaChart({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  return (
    <EvilAreaChart
      areaVariant="solid"
      chartConfig={{
        count: { colors: { light: chartColors.slate }, label: "Deadlines" },
      }}
      className="h-64"
      data={data.length > 0 ? data : [{ count: 0, label: "No dates" }]}
      hideLegend
      xDataKey="label"
      yDataKey="count"
    />
  );
}

export function BudgetLineChart({
  data,
}: {
  data: Array<{ status: string; budget: number }>;
}) {
  return (
    <EvilLineChart
      chartConfig={{
        budget: { colors: { light: chartColors.amber }, label: "Budget" },
      }}
      className="h-64"
      curveType="monotone"
      data={data}
      hideLegend
      xDataKey="status"
      yDataKey="budget"
    />
  );
}

export function ActivityRadialChart({
  data,
}: {
  data: Array<{ label: string; total: number }>;
}) {
  const visibleData = data.some((item) => item.total > 0)
    ? data
    : [{ label: "No activity", total: 1 }];

  return (
    <EvilRadialChart
      barSize={12}
      chartConfig={{
        total: { colors: { light: chartColors.zinc }, label: "Activity" },
      }}
      className="h-64"
      data={visibleData}
      dataKey="total"
      hideLegend
      nameKey="label"
      variant="full"
    />
  );
}
