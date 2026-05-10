/**
 * Render timeline các mốc xử lý booking để người dùng dễ theo dõi tiến trình.
 */
function BookingTimeline({ items }) {
  return (
    <div className="timeline">
      {items.map((item) => (
        <div className="timeline-item" key={`${item.title}-${item.time}`}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <strong>{item.title}</strong>
            <span>{item.time}</span>
            <p>{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default BookingTimeline;
