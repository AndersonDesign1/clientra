"use client";

import { motion } from "motion/react";
import { type ComponentProps, useCallback, useId, useState } from "react";
import {
  LabelList,
  Pie,
  PieChart,
  type PieSectorShapeProps,
  Sector,
} from "recharts";
import {
  type BackgroundVariant,
  ChartBackground,
} from "@/components/evilcharts/ui/background";
import {
  type ChartConfig,
  ChartContainer,
  getColorsCount,
  LoadingIndicator,
} from "@/components/evilcharts/ui/chart";
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

// Loading animation constants
const LOADING_SECTORS = 5;
const LOADING_ANIMATION_DURATION = 2000; // Full cycle duration in ms

// Constants
const DEFAULT_INNER_RADIUS = 0;
const DEFAULT_OUTER_RADIUS = "80%";
const DEFAULT_CORNER_RADIUS = 0;
const DEFAULT_PADDING_ANGLE = 0;
const ID_SAFE_CHARS_REGEX = /[^a-zA-Z0-9_-]/g;

type ChartProps = ComponentProps<typeof PieChart>;
type PieProps = ComponentProps<typeof Pie>;
type LabelListProps = ComponentProps<typeof LabelList>;

type EvilPieChartProps<TData extends Record<string, unknown>> = {
  // Data
  data: TData[];
  dataKey: keyof TData & string;
  nameKey: keyof TData & string;
  chartConfig: ChartConfig;
  className?: string;
  chartProps?: ChartProps;
  pieProps?: Omit<PieProps, "data" | "dataKey" | "nameKey">;

  // Pie Shape
  innerRadius?: number | string;
  outerRadius?: number | string;
  cornerRadius?: number;
  paddingAngle?: number;
  startAngle?: number;
  endAngle?: number;

  // Labels
  showLabels?: boolean;
  labelKey?: keyof TData & string;
  labelListProps?: Omit<LabelListProps, "dataKey">;

  // Hide Stuffs
  hideTooltip?: boolean;
  hideLegend?: boolean;
  legendVariant?: ChartLegendVariant;
  // Tooltip
  tooltipRoundness?: TooltipRoundness;
  tooltipVariant?: TooltipVariant;
  tooltipDefaultIndex?: number;

  // Interactive Stuffs
  isLoading?: boolean;

  // Glow Effects
  glowingSectors?: string[];
  // Background
  backgroundVariant?: BackgroundVariant;
};

type EvilPieChartClickable = {
  isClickable: true;
  onSelectionChange?: (
    selection: { dataKey: string; value: number } | null
  ) => void;
};

type EvilPieChartNotClickable = {
  isClickable?: false;
  onSelectionChange?: never;
};

type EvilPieChartPropsWithCallback<TData extends Record<string, unknown>> =
  EvilPieChartProps<TData> & (EvilPieChartClickable | EvilPieChartNotClickable);

function sanitizeForId(value: string) {
  return value.replace(ID_SAFE_CHARS_REGEX, "_");
}

export function EvilPieChart<TData extends Record<string, unknown>>({
  data,
  dataKey,
  nameKey,
  chartConfig,
  className,
  chartProps,
  pieProps,
  innerRadius = DEFAULT_INNER_RADIUS,
  outerRadius = DEFAULT_OUTER_RADIUS,
  cornerRadius = DEFAULT_CORNER_RADIUS,
  paddingAngle = DEFAULT_PADDING_ANGLE,
  startAngle = 0,
  endAngle = 360,
  showLabels = false,
  labelKey,
  labelListProps,
  hideTooltip = false,
  hideLegend = false,
  legendVariant,
  tooltipRoundness,
  tooltipVariant,
  tooltipDefaultIndex,
  isClickable = false,
  isLoading = false,
  glowingSectors = [],
  onSelectionChange,
  backgroundVariant,
}: EvilPieChartPropsWithCallback<TData>) {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const chartId = useId().replace(/:/g, "");

  // Handler to update selection and call callback
  const handleSelectionChange = useCallback(
    (sectorName: string | null) => {
      setSelectedSector(sectorName);
      if (isClickable && onSelectionChange) {
        if (sectorName === null) {
          onSelectionChange(null);
        } else {
          // Find the data item and get its value
          const selectedItem = data.find(
            (item) => item[nameKey] === sectorName
          );
          if (
            selectedItem &&
            typeof selectedItem[nameKey] === "string" &&
            typeof selectedItem[dataKey] === "number"
          ) {
            onSelectionChange({
              dataKey: selectedItem[nameKey],
              value: selectedItem[dataKey],
            });
          }
        }
      }
    },
    [isClickable, onSelectionChange, data, nameKey, dataKey]
  );

  // Prepare data with fill colors referencing gradients
  const preparedData = data.map((item) => {
    const sectorName =
      typeof item[nameKey] === "string" ? item[nameKey] : String(item[nameKey]);
    return {
      ...item,
      fill: `url(#${chartId}-pie-colors-${sanitizeForId(sectorName)})`,
    };
  });

  return (
    <ChartContainer className={className} config={chartConfig}>
      <LoadingIndicator isLoading={isLoading} />
      <PieChart accessibilityLayer id="evil-charts-pie-chart" {...chartProps}>
        {backgroundVariant && <ChartBackground variant={backgroundVariant} />}
        {!hideLegend && (
          <ChartLegend
            align="center"
            content={
              <ChartLegendContent
                isClickable={isClickable}
                nameKey={nameKey}
                onSelectChange={handleSelectionChange}
                selected={selectedSector}
                variant={legendVariant}
              />
            }
            verticalAlign="bottom"
          />
        )}
        {!(hideTooltip || isLoading) && (
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                nameKey={nameKey}
                roundness={tooltipRoundness}
                variant={tooltipVariant}
              />
            }
            defaultIndex={tooltipDefaultIndex}
          />
        )}
        {!isLoading && (
          <Pie
            cornerRadius={cornerRadius}
            data={preparedData}
            dataKey={dataKey}
            endAngle={endAngle}
            innerRadius={innerRadius}
            isAnimationActive
            nameKey={nameKey}
            onClick={(_, index) => {
              if (!isClickable) {
                return;
              }
              const clickedName = data[index]?.[nameKey];
              if (typeof clickedName !== "string") {
                return;
              }
              handleSelectionChange(
                selectedSector === clickedName ? null : clickedName
              );
            }}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            shape={(props: PieSectorShapeProps) => {
              const index = props.index ?? 0;
              const rawSectorName = data[index]?.[nameKey];
              const sectorName =
                typeof rawSectorName === "string" ? rawSectorName : "";
              const safeSectorName = sanitizeForId(sectorName);
              const isGlowing = glowingSectors.includes(sectorName);
              const isSelected =
                selectedSector === null || selectedSector === sectorName;

              const getFilter = () => {
                if (isGlowing) {
                  return `url(#${chartId}-pie-glow-${safeSectorName})`;
                }
                return undefined;
              };

              return (
                <Sector
                  {...props}
                  className="transition-opacity duration-200"
                  fill={`url(#${chartId}-pie-colors-${safeSectorName})`}
                  filter={getFilter()}
                  opacity={isClickable && !isSelected ? 0.3 : 1}
                  stroke={paddingAngle < 0 ? "var(--background)" : "none"}
                  strokeWidth={paddingAngle < 0 ? 5 : 0}
                />
              );
            }}
            startAngle={startAngle}
            strokeWidth={0}
            style={isClickable ? { cursor: "pointer" } : undefined}
            {...pieProps}
          >
            {showLabels && (
              <LabelList
                className="fill-background"
                dataKey={labelKey ?? dataKey}
                fill="currentColor"
                fontSize={12}
                fontWeight={500}
                stroke="none"
                {...labelListProps}
              />
            )}
          </Pie>
        )}

        {/* Animated loading overlay using custom shape */}
        {isLoading && (
          <Pie
            cornerRadius={cornerRadius}
            data={LOADING_PIE_DATA}
            dataKey="value"
            endAngle={endAngle}
            innerRadius={innerRadius}
            isAnimationActive={false}
            nameKey="name"
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            shape={(props) => <AnimatedLoadingSector {...props} />}
            startAngle={startAngle}
            strokeWidth={0}
          />
        )}

        {/* ======== CHART STYLES ======== */}
        <defs>
          {/* Radial color gradients for each sector */}
          <RadialColorGradientStyle
            chartConfig={chartConfig}
            chartId={chartId}
          />

          {/* Glow filters */}
          {glowingSectors.length > 0 && (
            <GlowFilterStyle
              chartId={chartId}
              glowingSectors={glowingSectors}
            />
          )}
        </defs>
      </PieChart>
    </ChartContainer>
  );
}

// Generate fixed loading data with equal sectors for circular pulsing animation
const LOADING_PIE_DATA = Array.from({ length: LOADING_SECTORS }, (_, i) => ({
  name: `loading${i}`,
  value: 100 / LOADING_SECTORS,
}));

// Animated sector for loading state using motion.dev
const AnimatedLoadingSector = (
  props: ComponentProps<typeof Sector> & { index?: number }
) => {
  const { index = 0, ...sectorProps } = props;

  // Calculate delay for circular wave effect
  const delay = (index / LOADING_SECTORS) * (LOADING_ANIMATION_DURATION / 1000);

  return (
    <motion.g
      animate={{ opacity: [0.15, 0.5, 0.15] }}
      initial={{ opacity: 0.15 }}
      transition={{
        duration: LOADING_ANIMATION_DURATION / 1000,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      <Sector {...sectorProps} fill="currentColor" />
    </motion.g>
  );
};

// Create radial color gradient for pie sectors
const RadialColorGradientStyle = ({
  chartConfig,
  chartId,
}: {
  chartConfig: ChartConfig;
  chartId: string;
}) => {
  return (
    <>
      {Object.entries(chartConfig).map(([dataKey, config]) => {
        const colorsCount = getColorsCount(config);

        return (
          <linearGradient
            id={`${chartId}-pie-colors-${sanitizeForId(dataKey)}`}
            key={`${chartId}-pie-colors-${sanitizeForId(dataKey)}`}
            x1="0"
            x2="1"
            y1="0"
            y2="1"
          >
            {colorsCount === 1 ? (
              <>
                <stop offset="0%" stopColor={`var(--color-${dataKey}-0)`} />
                <stop offset="100%" stopColor={`var(--color-${dataKey}-0)`} />
              </>
            ) : (
              Array.from({ length: colorsCount }, (_, index) => {
                const offset = `${(index / (colorsCount - 1)) * 100}%`;

                return (
                  <stop
                    key={`${dataKey}-${offset}`}
                    offset={offset}
                    stopColor={`var(--color-${dataKey}-${index}, var(--color-${dataKey}-0))`}
                  />
                );
              })
            )}
          </linearGradient>
        );
      })}
    </>
  );
};

// Apply soft glow filter effect to pie sectors using SVG filters
const GlowFilterStyle = ({
  chartId,
  glowingSectors,
}: {
  chartId: string;
  glowingSectors: string[];
}) => {
  return (
    <>
      {glowingSectors.map((sectorName) => (
        <filter
          height="300%"
          id={`${chartId}-pie-glow-${sanitizeForId(sectorName)}`}
          key={`${chartId}-pie-glow-${sanitizeForId(sectorName)}`}
          width="300%"
          x="-100%"
          y="-100%"
        >
          <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="8" />
          <feColorMatrix
            in="blur"
            result="glow"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"
          />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      ))}
    </>
  );
};
