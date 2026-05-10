import { Router } from 'express';
import { getTour, listFeaturedTours, listTestimonials, listTours } from '../controllers/tourController.js';

const tourRouter = Router();

tourRouter.get('/', listTours);
tourRouter.get('/featured', listFeaturedTours);
tourRouter.get('/testimonials', listTestimonials);
tourRouter.get('/:tourId', getTour);

export default tourRouter;
