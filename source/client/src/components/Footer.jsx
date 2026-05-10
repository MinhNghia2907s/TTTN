import { Link } from 'react-router-dom';

/**
 * Footer tổng hợp các lối tắt quan trọng của luồng người dùng.
 */
function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-kicker">Chill n Free</p>
          <h3>Lên kế hoạch chuyến đi gọn gàng, dễ chọn và dễ đặt hơn.</h3>
          <p>
            Khám phá điểm đến nổi bật, so sánh lịch khởi hành và hoàn tất đặt tour trong cùng một hành trình trực quan, rõ ràng.
          </p>
        </div>

        <div>
          <h4>Điều hướng nhanh</h4>
          <div className="footer-links">
            <Link to="/tours">Xem tour</Link>
            <Link to="/booking/tour-sapa">Đặt tour</Link>
            <Link to="/payment/BK-2026-002">Thanh toán</Link>
            <Link to="/bookings">Lịch sử booking</Link>
          </div>
        </div>

        <div>
          <h4>Thông tin liên hệ</h4>
          <ul className="footer-list">
            <li>Địa chỉ: 180 Cao Lỗ, Phường Chánh Hưng, TP. HCM</li>
            <li>Giờ làm việc: 8:00 - 18:00 (Thứ 2 - Thứ 7)</li>
            <li>Họ tên: Đàm Huỳnh Minh Nghĩa</li>
            <li>Điện thoại: (028) 1234 5678</li>
            <li>Email: dh52100953@chillnfree.com</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
