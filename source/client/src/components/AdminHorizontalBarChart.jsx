function AdminHorizontalBarChart({ emptyMessage = 'Chua co du lieu de hien thi.', items = [] }) {
  const normalizedItems = items.filter((item) => Number(item?.value) > 0);

  if (!normalizedItems.length) {
    return <div className="admin-chart-empty">{emptyMessage}</div>;
  }

  const maxValue = Math.max(...normalizedItems.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="admin-category-chart">
      {normalizedItems.map((item) => {
        const value = Number(item.value) || 0;
        const widthPercent = Math.max((value / maxValue) * 100, 8);

        return (
          <div className="admin-category-chart-row" key={item.label}>
            <span className="admin-category-chart-label">{item.label}</span>
            <div className="admin-category-chart-track" aria-label={`${item.label}: ${value}`}>
              <span
                className="admin-category-chart-bar"
                style={{
                  background: item.color || '#4f79bf',
                  width: `${widthPercent}%`,
                }}
              />
            </div>
            <strong>{value}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default AdminHorizontalBarChart;
