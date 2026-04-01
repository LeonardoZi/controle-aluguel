import { type CSSProperties, useId } from "react";

export interface SimpleChartDatum {
  name: string;
  total: number;
}

interface EmptyChartStateProps {
  message: string;
}

interface SimpleBarChartProps {
  data: SimpleChartDatum[];
  barColor: string;
  valueFormatter: (value: number) => string;
  emptyMessage: string;
}

interface SimpleAreaChartProps {
  data: SimpleChartDatum[];
  accentColor: string;
  valueFormatter: (value: number) => string;
  axisFormatter: (value: number) => string;
  emptyMessage: string;
}

const chartSurfaceStyle: CSSProperties = {
  backgroundColor: "var(--secondary)",
  borderColor: "var(--border)",
};

const chartTrackStyle: CSSProperties = {
  backgroundColor: "var(--background)",
};

const chartStrongTextStyle: CSSProperties = {
  color: "var(--foreground)",
};

const chartMutedTextStyle: CSSProperties = {
  color: "var(--muted-foreground)",
};

const svgMutedTextStyle: CSSProperties = {
  fill: "var(--muted-foreground)",
};

const svgStrongTextStyle: CSSProperties = {
  fill: "var(--foreground)",
};

const svgGridLineStyle: CSSProperties = {
  stroke: "var(--border)",
};

const svgPointStrokeStyle: CSSProperties = {
  stroke: "var(--secondary)",
};

function EmptyChartState({ message }: EmptyChartStateProps) {
  return (
    <div
      className="flex min-h-[350px] min-w-[300px] items-center justify-center rounded-xl border border-dashed px-4 py-10 text-center text-sm"
      style={{ ...chartSurfaceStyle, ...chartMutedTextStyle }}
    >
      {message}
    </div>
  );
}

export function SimpleBarChart({
  data,
  barColor,
  valueFormatter,
  emptyMessage,
}: SimpleBarChartProps) {
  if (data.length === 0) {
    return <EmptyChartState message={emptyMessage} />;
  }

  const maxValue = Math.max(...data.map((item) => item.total), 1);

  return (
    <div className="flex min-h-[350px] min-w-[300px] flex-col gap-4 pt-4">
      <div className="overflow-x-auto pb-2">
        <div
          className="flex h-[280px] min-w-full items-end gap-3 rounded-xl border p-4"
          style={chartSurfaceStyle}
        >
          {data.map((item) => {
            const heightPercentage =
              item.total > 0 ? Math.max((item.total / maxValue) * 100, 12) : 0;
            const barStyle: CSSProperties = {
              height: `${heightPercentage}%`,
              backgroundColor: barColor,
            };

            return (
              <div
                key={`${item.name}-${item.total}`}
                className="flex h-full w-20 shrink-0 flex-col justify-end gap-2"
                title={`${item.name}: ${valueFormatter(item.total)}`}
              >
                <span
                  className="text-center text-xs font-semibold"
                  style={chartStrongTextStyle}
                >
                  {valueFormatter(item.total)}
                </span>
                <div
                  className="relative flex-1 overflow-hidden rounded-t-xl"
                  style={chartTrackStyle}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-xl transition-all duration-300"
                    style={barStyle}
                  />
                </div>
                <span
                  className="truncate text-center text-xs"
                  style={chartMutedTextStyle}
                >
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SimpleAreaChart({
  data,
  accentColor,
  valueFormatter,
  axisFormatter,
  emptyMessage,
}: SimpleAreaChartProps) {
  const gradientId = useId();

  if (data.length === 0) {
    return <EmptyChartState message={emptyMessage} />;
  }

  const chartHeight = 280;
  const chartWidth = Math.max(data.length * 84, 640);
  const paddingTop = 20;
  const paddingRight = 20;
  const paddingBottom = 36;
  const paddingLeft = 24;
  const baselineY = chartHeight - paddingBottom;
  const drawableHeight = baselineY - paddingTop;
  const drawableWidth = chartWidth - paddingLeft - paddingRight;
  const maxValue = Math.max(...data.map((item) => item.total), 1);
  const yTicks = [maxValue, maxValue / 2, 0];
  const points = data.map((item, index) => {
    const x =
      data.length === 1
        ? paddingLeft + drawableWidth / 2
        : paddingLeft + (drawableWidth / (data.length - 1)) * index;
    const y = baselineY - (item.total / maxValue) * drawableHeight;

    return { ...item, x, y };
  });
  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${baselineY.toFixed(2)} L ${firstPoint.x.toFixed(2)} ${baselineY.toFixed(2)} Z`;

  return (
    <div className="flex min-h-[350px] min-w-[300px] flex-col gap-4 pt-4">
      <div className="overflow-x-auto pb-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-[280px] min-w-full rounded-xl border"
          style={chartSurfaceStyle}
          role="img"
          aria-label="Receita por dia"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks.map((tick) => {
            const y = baselineY - (tick / maxValue) * drawableHeight;

            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  x2={chartWidth - paddingRight}
                  y1={y}
                  y2={y}
                  strokeDasharray="4 4"
                  style={svgGridLineStyle}
                />
                <text
                  x={paddingLeft + 4}
                  y={y - 6}
                  fontSize="11"
                  style={svgMutedTextStyle}
                >
                  {axisFormatter(tick)}
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point) => (
            <g key={`${point.name}-${point.total}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill={accentColor}
                strokeWidth="2"
                style={svgPointStrokeStyle}
              />
              <text
                x={point.x}
                y={point.y - 12}
                fontSize="11"
                textAnchor="middle"
                style={svgStrongTextStyle}
              >
                {valueFormatter(point.total)}
              </text>
              <text
                x={point.x}
                y={chartHeight - 12}
                fontSize="11"
                textAnchor="middle"
                style={svgMutedTextStyle}
              >
                {point.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
