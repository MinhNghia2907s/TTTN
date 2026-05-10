/**
 * Tiêu đề section dùng lại cho nhiều trang để giữ cùng nhịp trình bày.
 */
function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="section-heading">
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <div className="section-heading-row">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </div>
    </div>
  );
}

export default SectionHeading;
