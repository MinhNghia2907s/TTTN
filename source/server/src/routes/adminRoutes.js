import { Router } from 'express';
import multer from 'multer';
import {
  createAdminTour,
  downloadAdminTourImportTemplate,
  getAdminMeta,
  getAdminBooking,
  getAdminPayment,
  getAdminTour,
  getAdminUser,
  listAdminBookings,
  listAdminPayments,
  listAdminTours,
  listAdminUsers,
  importAdminTours,
  refundAdminPayment,
  removeAdminBooking,
  removeAdminTour,
  removeAdminUser,
  updateAdminBookingStatus,
  updateAdminPaymentStatus,
  updateAdminTour,
  updateAdminUser,
} from '../controllers/adminController.js';
import { authorizeAdmin, authorizeAdminPermission } from '../middlewares/adminMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const adminRouter = Router();
const uploadExcel = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  storage: multer.memoryStorage(),
});

/**
 * Toàn bộ route trong file này đều yêu cầu:
 * - người dùng đã đăng nhập hợp lệ
 * - role thuộc nhóm quản trị (`admin`, `staff`)
 */
adminRouter.use(authenticate, authorizeAdmin);

// Metadata dùng chung cho các select/filter của frontend admin.
adminRouter.get('/meta', authorizeAdminPermission('admin.meta.read'), getAdminMeta);

// Người dùng
adminRouter.get('/users', authorizeAdminPermission('admin.users.read'), listAdminUsers);
adminRouter.get('/users/:userId', authorizeAdminPermission('admin.users.read'), getAdminUser);
adminRouter.put('/users/:userId', authorizeAdminPermission('admin.users.update'), updateAdminUser);
adminRouter.delete('/users/:userId', authorizeAdminPermission('admin.users.delete'), removeAdminUser);

// Tour
adminRouter.get('/tours', authorizeAdminPermission('admin.tours.read'), listAdminTours);
adminRouter.get('/tours/import/template', authorizeAdminPermission('admin.tours.create'), downloadAdminTourImportTemplate);
adminRouter.post(
  '/tours/import',
  authorizeAdminPermission('admin.tours.create'),
  uploadExcel.single('file'),
  importAdminTours,
);
adminRouter.get('/tours/:tourId', authorizeAdminPermission('admin.tours.read'), getAdminTour);
adminRouter.post('/tours', authorizeAdminPermission('admin.tours.create'), createAdminTour);
adminRouter.put('/tours/:tourId', authorizeAdminPermission('admin.tours.update'), updateAdminTour);
adminRouter.delete('/tours/:tourId', authorizeAdminPermission('admin.tours.delete'), removeAdminTour);

// Booking
adminRouter.get('/bookings', authorizeAdminPermission('admin.bookings.read'), listAdminBookings);
adminRouter.get('/bookings/:bookingCode', authorizeAdminPermission('admin.bookings.read'), getAdminBooking);
adminRouter.put(
  '/bookings/:bookingCode/status',
  authorizeAdminPermission('admin.bookings.update_status'),
  updateAdminBookingStatus,
);
adminRouter.delete('/bookings/:bookingCode', authorizeAdminPermission('admin.bookings.delete'), removeAdminBooking);

// Payment
adminRouter.get('/payments', authorizeAdminPermission('admin.payments.read'), listAdminPayments);
adminRouter.get('/payments/:paymentCode', authorizeAdminPermission('admin.payments.read'), getAdminPayment);
adminRouter.put(
  '/payments/:paymentCode/status',
  authorizeAdminPermission('admin.payments.update_status'),
  updateAdminPaymentStatus,
);
adminRouter.post('/payments/refund/:paymentCode', authorizeAdminPermission('admin.payments.refund'), refundAdminPayment);

export default adminRouter;
