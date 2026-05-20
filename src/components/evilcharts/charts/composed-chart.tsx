"use client";

import { type ComponentProps, useId, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import {
  type BackgroundVariant,
  ChartBackground,
} from "@/components/evilcharts/ui/background";
import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  getLoadingData,
  LoadingIndicator,
} from "@/components/evilcharts/ui/chart";
import { ChartDot } from "@/components/evilcharts/ui/dot";
import {
  ChartLegend,
  ChartLegendContent,
  type ChartLegendVariant,
} from "@/components/evilcharts/ui/legend";
import {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from "@/components/evilcharts/ui/tooltip";

type ComposedChartProps = ComponentProps<typeof ComposedChart>;
type XAxisProps = ComponentProps<typeof XAxis>;
type YAxisProps = ComponentProps<typeof YAxis>;

interface EvilComposedChartProps<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
> {
  backgroundVariant?: BackgroundVariant;
  barDataKey: keyof TData & string;
  barRadius?: number;
  chartConfig: TConfig;
  chartProps?: ComposedChartProps;
  className?: string;
  data: TData[];
  glowingBar?: boolean;
  glowingLine?: boolean;
  hideCartesianGrid?: boolean;
  hideLegend?: boolean;
  hideTooltip?: boolean;
  isLoading?: boolean;
  legendVariant?: ChartLegendVariant;
  lineDataKey: keyof TData & string;
  tooltipRoundness?: TooltipRoundness;
  tooltipVariant?: TooltipVariant;
  xAxisProps?: XAxisProps;
  xDataKey: keyof TData & string;
  yAxisLeftProps?: YAxisProps;
  yAxisRightProps?: YAxisProps;
}

export function EvilComposedChart<
  TData extends Record<string, unknown>,
  TConfig extends Record<string, ChartConfig[string]>,
>({
  chartConfig,
  data,
  barDataKey,
  lineDataKey,
  xDataKey,
  className,
  chartProps,
  xAxisProps,
  yAxisLeftProps,
  yAxisRightProps,
  barRadius = 4,
  legendVariant,
  hideTooltip = false,
  hideCartesianGrid = false,
  hideLegend = false,
  tooltipRoundness,
  tooltipVariant,
  isLoading = false,
  backgroundVariant,
  glowingLine = true,
  glowingBar = false,
}: EvilComposedChartProps<TData, TConfig>) {
  const chartId = useId().replace(/:/g, "");
  const [selectedDataKey] = useState<string | null>(null);

  // Generate fake data points for loader state
  const loadingData = getLoadingData(6).map((item, index) => ({
    ...item,
    [xDataKey]: `Label ${index}`,
    [barDataKey]: Math.floor(Math.random() * 80) + 20,
    [lineDataKey]: Math.floor(Math.random() * 6) + 1,
  }));

  const displayData = isLoading ? loadingData : data;

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      <ComposedChart
        accessibilityLayer
        data={displayData}
        margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
        {...chartProps}
      >
        {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
        {!(hideCartesianGrid || backgroundVariant) && (
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
        )}

        {!hideLegend && (
          <ChartLegend
            align="right"
            content={
              <ChartLegendContent
                isClickable={false}
                selected={selectedDataKey}
                variant={legendVariant}
              />
            }
            verticalAlign="top"
          />
        )}

        {xDataKey && (
          <XAxis
            axisLine={false}
            dataKey={xDataKey}
            tickLine={false}
            tickMargin={8}
            {...xAxisProps}
          />
        )}

        {/* Left YAxis for Bar Values (Budget) */}
        <YAxis
          axisLine={false}
          orientation="left"
          tickFormatter={yAxisLeftProps?.tickFormatter}
          tickLine={false}
          tickMargin={8}
          width={45}
          yAxisId="left"
          {...yAxisLeftProps}
        />

        {/* Right YAxis for Line Values (Project Count) */}
        <YAxis
          axisLine={false}
          orientation="right"
          tickFormatter={yAxisRightProps?.tickFormatter}
          tickLine={false}
          tickMargin={8}
          width={25}
          yAxisId="right"
          {...yAxisRightProps}
        />

        {!(hideTooltip || isLoading) && (
          <ChartTooltip
            content={
              <ChartTooltipContent
                roundness={tooltipRoundness}
                selected={selectedDataKey}
                variant={tooltipVariant}
              />
            }
            cursor={{ stroke: "rgba(148, 163, 184, 0.1)", strokeWidth: 1 }}
          />
        )}

        {/* Bar Series: Total Budget */}
        <Bar
          dataKey={barDataKey as any}
          fill={`url(#${chartId}-gradient-${barDataKey})`}
          filter={
            glowingBar ? `url(#${chartId}-glow-${barDataKey})` : undefined
          }
          isAnimationActive={!isLoading}
          maxBarSize={32}
          radius={[barRadius, barRadius, 0, 0]}
          yAxisId="left"
        />

        {/* Line Series: Project Count */}
        <Line
          activeDot={
            <ChartDot chartId={chartId} dataKey={lineDataKey} type="colored-border" />
          }
          dataKey={lineDataKey as any}
          dot={
            <ChartDot chartId={chartId} dataKey={lineDataKey} type="default" />
          }
          filter={
            glowingLine ? `url(#${chartId}-glow-${lineDataKey})` : undefined
          }
          isAnimationActive={!isLoading}
          stroke={`url(#${chartId}-gradient-${lineDataKey})`}
          strokeDasharray="5 5"
          strokeWidth={2}
          type="monotone"
          yAxisId="right"
        />

        {/* Dynamic Defs for Gradients and Glow filters */}
        <defs>
          {/* Vertical gradient styling for Bar and Line */}
          {Object.entries(chartConfig).map(([dataKey, config]) => {
            const colorsCount = getColorsCount(config);
            return (
              <linearGradient
                id={`${chartId}-gradient-${dataKey}`}
                key={`${chartId}-gradient-${dataKey}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                {colorsCount === 1 ? (
                  <>
                    <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                    <stop
                      offset="100%"
                      stopColor={`var(--color-${dataKey}-0)`}
                      stopOpacity={0.4}
                    />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                    <stop
                      offset="100%"
                      stopColor={`var(--color-${dataKey}-1, var(--color-${dataKey}-0))`}
                      stopOpacity={0.3}
                    />
                  </>
                )}
              </linearGradient>
            );
          })}

          {/* Premium Glow Filters */}
          {Object.entries(chartConfig).map(([dataKey]) => (
            <filter
              height="140%"
              id={`${chartId}-glow-${dataKey}`}
              key={`${chartId}-glow-${dataKey}`}
              width="140%"
              x="-20%"
              y="-20%"
            >
              <feGaussianBlur result="blur" stdDeviation="6" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>
      </ComposedChart>
    </ChartContainer>
  );
}
