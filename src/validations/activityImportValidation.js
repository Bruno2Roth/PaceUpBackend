import { body } from 'express-validator';

export const activityImportValidation = [
  body('activities')
    .isArray({ min: 1 })
    .withMessage('activities must be a non-empty array'),
  body('activities.*.activity_type')
    .isIn(['running', 'trail_running', 'treadmill'])
    .withMessage('Invalid activity type'),
  body('activities.*.distance_m')
    .isFloat({ gt: 0 })
    .withMessage('Distance must be > 0'),
  body('activities.*.duration_seconds')
    .isInt({ gt: 0 })
    .withMessage('Duration must be > 0'),
  body('activities.*.start_time')
    .isISO8601()
    .withMessage('Invalid start time'),
  body('activities.*.end_time')
    .isISO8601()
    .withMessage('Invalid end time'),
  body('activities.*.gps_data').optional().isArray(),
  body('activities.*.gps_data.*.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid GPS latitude'),
  body('activities.*.gps_data.*.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid GPS longitude'),
  body('activities.*.gps_data.*.timestamp')
    .optional()
    .isISO8601()
    .withMessage('Invalid GPS timestamp'),
];

export default activityImportValidation;
