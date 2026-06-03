import { body } from 'express-validator';

export const activityValidation = [
  body('title').optional().isString(),
  body('activity_type').isIn(['running','trail_running','treadmill']).withMessage('Invalid activity type'),
  body('distance_m').isFloat({ gt: 0 }).withMessage('Distance must be > 0'),
  body('duration_seconds').isInt({ gt: 0 }).withMessage('Duration must be > 0'),
  body('start_time').isISO8601().withMessage('Invalid start time'),
  body('end_time').isISO8601().withMessage('Invalid end time'),
];

export default activityValidation;
