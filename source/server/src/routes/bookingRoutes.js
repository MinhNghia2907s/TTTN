import { Router } from 'express';
import { cancelBooking, createBooking, getBooking, listBookings, quoteBooking } from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const bookingRouter = Router();

bookingRouter.use(authenticate);
bookingRouter.get('/', listBookings);
bookingRouter.post('/quote', quoteBooking);
bookingRouter.post('/', createBooking);
bookingRouter.get('/:bookingId', getBooking);
bookingRouter.patch('/:bookingId/cancel', cancelBooking);

export default bookingRouter;
