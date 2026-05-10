import { Router } from 'express';
import {
  createPayment,
  getPayment,
  receivePayosWebhook,
  syncPayment,
} from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const paymentRouter = Router();

paymentRouter.post('/payos/webhook', receivePayosWebhook);

paymentRouter.use(authenticate);
paymentRouter.get('/:bookingId', getPayment);
paymentRouter.post('/', createPayment);
paymentRouter.post('/:bookingId/sync', syncPayment);

export default paymentRouter;
