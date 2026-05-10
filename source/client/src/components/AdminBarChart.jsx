/**
 * Split x-axis labels into up to 2 short lines so category names do not collide
 * with neighboring labels when the chart has many columns.
 */
function buildAxisLabelLines(label, maxLineLength = 10) {
  const normalizedLabel = String(label || '').trim();

  if (!normalizedLabel) {
    return [''];
  }

  if (normalizedLabel.length <= maxLineLength) {
    return [normalizedLabel];
  }

  const words = normalizedLabel.split(/\s+/);
  let firstLine = '';
  let splitIndex = -1;

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    const nextLine = firstLine ? `${firstLine} ${word}` : word;

    if (nextLine.length <= maxLineLength || !firstLine) {
      firstLine = nextLine;
      continue;
    }

    splitIndex = index;
    break;
  }

  if (splitIndex === -1) {
    return [`${normalizedLabel.slice(0, Math.max(maxLineLength - 3, 1)).trim()}...`];
  }

  const secondLine = words.slice(splitIndex).join(' ').trim();
  const normalizedSecondLine =
    secondLine.length > maxLineLength ? `${secondLine.slice(0, Math.max(maxLineLength - 3, 1)).trim()}...` : secondLine;

  return [firstLine, normalizedSecondLine];
}

function AdminBarChart({
  chartWidth = 460,
  emptyMessage = 'Chua co du lieu de hien thi.',
  formatValue,
  items = [],
  labelMaxLineLength = 10,
}) {
  const normalizedItems = items.filter((item) => Number(item?.value) > 0);

  if (!normalizedItems.length) {
    return <div className="admin-chart-empty">{emptyMessage}</div>;
  }

  // Keep one stable chart frame across admin pages so users can compare charts quickly.
  const maxValue = Math.max(...normalizedItems.map((item) => Number(item.value) || 0), 1);
  const roundedMaxValue = Math.ceil(maxValue / 5) * 5;
  const chartHeight = 220;
  const leftAxisWidth = 42;
  const rightPadding = 10;
  const topPadding = 16;
  const bottomAxisHeight = 48;
  const innerWidth = chartWidth - leftAxisWidth - rightPadding;
  const slotWidth = innerWidth / normalizedItems.length;
  const barWidth = Math.min(42, Math.max(28, slotWidth * 0.48));
  const gridSteps = Math.max(Math.ceil(roundedMaxValue / 5), 1);

  return (
    <div className="admin-chart-panel admin-chart-card admin-chart-card-classic">
      <svg
        aria-label="Bieu do cot"
        className="admin-bar-chart"
        role="img"
        viewBox={`0 0 ${chartWidth} ${chartHeight + bottomAxisHeight + topPadding}`}
      >
        <rect
          className="admin-chart-classic-frame"
          height={chartHeight + topPadding}
          rx="14"
          width={chartWidth}
          x="0"
          y="0"
        />

        {Array.from({ length: gridSteps + 1 }).map((_, index) => {
          const value = index * 5;
          const ratio = value / roundedMaxValue;
          const y = topPadding + chartHeight - ratio * chartHeight;

          return (
            <g key={`h-grid-${value}`}>
              <line
                className="admin-chart-grid-line-strong"
                x1={leftAxisWidth}
                x2={chartWidth - rightPadding}
                y1={y}
                y2={y}
              />
              <text className="admin-chart-axis-label-classic" x={leftAxisWidth - 8} y={y + 4}>
                {formatValue ? formatValue(value) : value}
              </text>
            </g>
          );
        })}

        {normalizedItems.map((item, index) => {
          const x = leftAxisWidth + index * slotWidth + slotWidth / 2;

          return (
            <line
              key={`v-grid-${item.label}`}
              className="admin-chart-grid-line-soft"
              x1={x}
              x2={x}
              y1={topPadding}
              y2={topPadding + chartHeight}
            />
          );
        })}

        <line
          className="admin-chart-axis-line"
          x1={leftAxisWidth}
          x2={leftAxisWidth}
          y1={topPadding}
          y2={topPadding + chartHeight}
        />
        <line
          className="admin-chart-axis-line"
          x1={leftAxisWidth}
          x2={chartWidth - rightPadding}
          y1={topPadding + chartHeight}
          y2={topPadding + chartHeight}
        />

        {normalizedItems.map((item, index) => {
          const value = Number(item.value) || 0;
          const height = Math.max((value / roundedMaxValue) * chartHeight, 8);
          const x = leftAxisWidth + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = topPadding + chartHeight - height;
          const labelLines = buildAxisLabelLines(item.shortLabel || item.label, labelMaxLineLength);

          return (
            <g key={item.label}>
              <text className="admin-chart-value-classic" x={x + barWidth / 2} y={Math.max(y - 8, 12)}>
                {formatValue ? formatValue(value) : value}
              </text>
              <rect className="admin-chart-bar-classic" height={height} width={barWidth} x={x} y={y} />
              <text className="admin-chart-label-classic" x={x + barWidth / 2} y={topPadding + chartHeight + 16}>
                {labelLines.map((line, lineIndex) => (
                  <tspan
                    dy={lineIndex === 0 ? 0 : 10}
                    key={`${item.label}-line-${lineIndex}`}
                    x={x + barWidth / 2}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default AdminBarChart;
