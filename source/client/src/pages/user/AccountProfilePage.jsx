import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/FormField.jsx';
import { getCurrentUser, getStoredUser, updateProfile } from '../../services/user/authService.js';

const initialForm = {
  email: '',
  fullName: '',
  phone: '',
};

/**
 * Trang tài khoản giúp người dùng xem và cập nhật thông tin liên hệ cơ bản.
 */
function AccountProfilePage() {
  const [formData, setFormData] = useState(() => {
    const user = getStoredUser();

    return user
      ? {
          email: user.email || '',
          fullName: user.fullName || '',
          phone: user.phone || '',
        }
      : initialForm;
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    /**
     * Khi trang mở ra, luôn lấy lại hồ sơ mới nhất từ backend để form không bị lệch với localStorage cũ.
     */
    async function syncUserProfile() {
      try {
        const user = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setFormData({
          email: user.email || '',
          fullName: user.fullName || '',
          phone: user.phone || '',
        });
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    syncUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Đồng bộ từng ô nhập liệu vào form state để gửi đúng payload cập nhật lên backend.
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  /**
   * Lưu thay đổi hồ sơ và cập nhật ngay tên người dùng trong header thông qua auth storage.
   * Sau khi `updateProfile()` thành công, auth event sẽ được bắn ra và Header tự đồng bộ tên mới.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const user = await updateProfile(formData);
      setFormData({
        email: user.email || '',
        fullName: user.fullName || '',
        phone: user.phone || '',
      });
      setSuccessMessage('Thông tin tài khoản đã được cập nhật.');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell container">
      <section className="auth-panel auth-intro">
        <p className="section-eyebrow">Tài khoản của bạn</p>
        <h1>Chỉnh sửa thông tin liên hệ để hành trình luôn được xác nhận đúng người.</h1>
        <p>
          Hệ thống sẽ dùng các thông tin này để đồng bộ hồ sơ đăng nhập, hỗ trợ giữ chỗ và gửi xác nhận cho
          những booking tiếp theo của bạn.
        </p>
        <ul className="feature-list">
          <li>Cập nhật họ tên, email và số điện thoại đang dùng cho các chuyến đi sắp tới</li>
          <li>Tên hiển thị trên nút tài khoản ở header sẽ đổi ngay sau khi lưu thành công</li>
          <li>
            Cần đổi mật khẩu? <Link to="/account/password">Mở trang đổi mật khẩu</Link>
          </li>
        </ul>
      </section>

      <section className="auth-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <FormField label="Họ và tên" name="fullName" onChange={handleChange} placeholder="Nguyễn Văn A" value={formData.fullName} />
          <FormField label="Email" name="email" onChange={handleChange} placeholder="you@example.com" type="email" value={formData.email} />
          <FormField label="Số điện thoại" name="phone" onChange={handleChange} placeholder="09xxxxxxxx" value={formData.phone} />

          <button className="button button-primary full-width" disabled={isSubmitting || isLoading} type="submit">
            {isSubmitting ? 'Đang lưu thay đổi...' : 'Lưu thông tin'}
          </button>

          {isLoading ? <p className="helper-text">Đang tải hồ sơ tài khoản...</p> : null}
          {successMessage ? <p className="success-message">{successMessage}</p> : null}
          {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        </form>
      </section>
    </div>
  );
}

export default AccountProfilePage;
