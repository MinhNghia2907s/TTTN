import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAdminAuth from '../components/RequireAdminAuth.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminBookingDetailPage from '../pages/admin/AdminBookingDetailPage.jsx';
import AdminBookingListPage from '../pages/admin/AdminBookingListPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminLoginPage from '../pages/admin/AdminLoginPage.jsx';
import AdminPaymentDetailPage from '../pages/admin/AdminPaymentDetailPage.jsx';
import AdminPaymentListPage from '../pages/admin/AdminPaymentListPage.jsx';
import AdminTourFormPage from '../pages/admin/AdminTourFormPage.jsx';
import AdminTourListPage from '../pages/admin/AdminTourListPage.jsx';
import AdminUserDetailPage from '../pages/admin/AdminUserDetailPage.jsx';
import AdminUserListPage from '../pages/admin/AdminUserListPage.jsx';
import UserLayout from '../layouts/UserLayout.jsx';
import AccountProfilePage from '../pages/user/AccountProfilePage.jsx';
import BookingDetailPage from '../pages/user/BookingDetailPage.jsx';
import BookingHistoryPage from '../pages/user/BookingHistoryPage.jsx';
import BookingPage from '../pages/user/BookingPage.jsx';
import ChangePasswordPage from '../pages/user/ChangePasswordPage.jsx';
import ForgotPasswordPage from '../pages/user/ForgotPasswordPage.jsx';
import HomePage from '../pages/user/HomePage.jsx';
import LoginPage from '../pages/user/LoginPage.jsx';
import PaymentPage from '../pages/user/PaymentPage.jsx';
import RegisterPage from '../pages/user/RegisterPage.jsx';
import ResetPasswordPage from '../pages/user/ResetPasswordPage.jsx';
import TourDetailPage from '../pages/user/TourDetailPage.jsx';
import TourListPage from '../pages/user/TourListPage.jsx';
import RequireAuth from '../components/RequireAuth.jsx';

/**
 * Khai báo toàn bộ route của ứng dụng:
 * - khu người dùng ở `/`
 * - khu quản trị ở `/admin`
 *
 * Convention tham số route:
 * - `userId`, `tourId`: khóa số trong DB
 * - `bookingCode`, `paymentCode`: mã nghiệp vụ hiển thị ra ngoài
 */
function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminLoginPage />} path="/admin/login" />
      <Route element={<RequireAdminAuth />} path="/admin">
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route element={<AdminUserListPage />} path="users" />
          <Route element={<AdminUserDetailPage />} path="users/:userId" />
          <Route element={<AdminTourListPage />} path="tours" />
          <Route element={<AdminTourFormPage />} path="tours/new" />
          <Route element={<AdminTourFormPage />} path="tours/:tourId/edit" />
          <Route element={<AdminBookingListPage />} path="bookings" />
          <Route element={<AdminBookingDetailPage />} path="bookings/:bookingCode" />
          <Route element={<AdminPaymentListPage />} path="payments" />
          <Route element={<AdminPaymentDetailPage />} path="payments/:paymentCode" />
        </Route>
      </Route>

      <Route element={<UserLayout />} path="/">
        <Route index element={<HomePage />} />
        <Route element={<TourListPage />} path="tours" />
        <Route element={<TourDetailPage />} path="tours/:tourId" />
        <Route element={<RegisterPage />} path="register" />
        <Route element={<LoginPage />} path="login" />
        <Route element={<ForgotPasswordPage />} path="forgot-password" />
        <Route element={<ResetPasswordPage />} path="reset-password" />
        <Route element={<RequireAuth />}>
          {/* Cụm route tài khoản được mở từ dropdown trên Header sau khi user đăng nhập. */}
          <Route element={<AccountProfilePage />} path="account" />
          <Route element={<ChangePasswordPage />} path="account/password" />
          <Route element={<BookingPage />} path="booking/:tourId" />
          <Route element={<PaymentPage />} path="payment/:bookingId" />
          <Route element={<BookingHistoryPage />} path="bookings" />
          <Route element={<BookingDetailPage />} path="bookings/:bookingId" />
        </Route>
      </Route>
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default AppRoutes;
