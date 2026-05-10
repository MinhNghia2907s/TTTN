/**
 * Đổi từ góc cực sang tọa độ SVG để vẽ cung tròn.
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Tạo path cho một lát donut bằng cung ngoài + cung trong.
 */
function createDonutSegmentPath(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

/**
 * Chuẩn hóa item thành các segment có góc bắt đầu/kết thúc và phần trăm hiển thị.
 */
function getDonutSegments(items) {
  const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  if (!total) {
    return [];
  }

  let currentAngle = 0;

  return items.map((item) => {
    const value = Number(item.value) || 0;
    const angle = (value / total) * 360;
    const segment = {
      ...item,
      endAngle: currentAngle + angle,
      percent: Math.round((value / total) * 100),
      startAngle: currentAngle,
      total,
      value,
    };

    currentAngle += angle;
    return segment;
  });
}

/**
 * Biểu đồ doughnut theo dạng báo cáo tổng quan, hiển thị tổng số ở giữa và legend giá trị bên dưới.
 */
function AdminDonutChart({ centerLabel = 'Tổng số', emptyMessage = 'Chưa có dữ liệu để hiển thị.', items = [] }) {
  const normalizedItems = items.filter((item) => Number(item?.value) > 0);
  const segments = getDonutSegments(normalizedItems);
  const total = segments[0]?.total || 0;
  const centerX = 110;
  const centerY = 110;
  const outerRadius = 86;
  const innerRadius = 46;

  if (!segments.length) {
    return <div className="admin-chart-empty">{emptyMessage}</div>;
  }

  return (
    <div className="admin-chart-panel admin-chart-card admin-donut-report">
      <div className="admin-donut-visual">
        <svg aria-label="Biểu đồ tròn" className="admin-donut-chart" role="img" viewBox="0 0 220 220">
          <circle className="admin-donut-track" cx={centerX} cy={centerY} r={outerRadius} />
          {segments.map((item) => (
            <path
              key={item.label}
              d={createDonutSegmentPath(
                centerX,
                centerY,
                innerRadius,
                outerRadius,
                item.startAngle,
                item.endAngle,
              )}
              fill={item.color}
            />
          ))}
          <circle className="admin-donut-hole" cx={centerX} cy={centerY} r={innerRadius - 2} />
        </svg>

        <div className="admin-donut-center">
          <strong>{total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <div className="admin-donut-legend">
        {segments.map((item) => (
          <div className="admin-donut-legend-row" key={item.label}>
            <div className="admin-donut-legend-label">
              <span className="admin-chart-dot" style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDonutChart;
