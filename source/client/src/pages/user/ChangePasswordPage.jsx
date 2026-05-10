import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { changePassword } from '../../services/user/authService.js';

const initialForm = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

/**
 * Trang đổi mật khẩu dành cho người dùng đã đăng nhập.
 */
function ChangePasswordPage() {
  const [formData, setFormData] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Giữ state form đổi mật khẩu đồng bộ với từng thao tác nhập của người dùng.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  /**
   * Gửi yêu cầu đổi mật khẩu sau khi xác nhận mật khẩu mới được nhập trùng nhau.
   * Luồng này dùng cho người đã đăng nhập, khác với trang "quên mật khẩu" vốn dùng reset token qua email/liên kết.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccessMessage('Mật khẩu đã được thay đổi thành công.');
      setFormData(initialForm);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell container">
      <section className="auth-panel auth-intro">
        <p className="section-eyebrow">Bảo mật tài khoản</p>
        <h1>Đổi mật khẩu để giữ an toàn cho hồ sơ và các booking của bạn.</h1>
        <p>
          Hãy dùng mật khẩu đủ mạnh và chỉ chia sẻ thông tin đăng nhập trên những thiết bị bạn tin cậy.
        </p>
        <ul className="feature-list">
          <li>Nhập đúng mật khẩu hiện tại để xác nhận đây là chủ tài khoản</li>
          <li>Mật khẩu mới cần có ít nhất 6 ký tự và nên khác với các mật khẩu cũ gần đây</li>
          <li>
            Cần cập nhật thông tin liên hệ? <Link to="/account">Quay lại hồ sơ tài khoản</Link>
          </li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField
            label="Mật khẩu hiện tại"
            name="currentPassword"
            onChange={handleChange}
            placeholder="Nhập mật khẩu hiện tại"
            type="password"
            value={formData.currentPassword}
          />
          <FormField
            label="Mật khẩu mới"
            name="newPassword"
            onChange={handleChange}
            placeholder="Tạo mật khẩu mới"
            type="password"
            value={formData.newPassword}
          />
          <FormField
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            onChange={handleChange}
            placeholder="Nhập lại mật khẩu mới"
            type="password"
            value={formData.confirmPassword}
          />

          <button className="button button-primary full-width" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Đang cập nhật mật khẩu...' : 'Đổi mật khẩu'}
          </button>

          {successMessage ? <p className="success-message">{successMessage}</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </form>
      </section>
    </div>
  );
}

export default ChangePasswordPage;
