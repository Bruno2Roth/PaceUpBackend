import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
  body('username')
    .notEmpty().withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be alphanumeric (letters, numbers, underscore)'),
];

export default registerValidation;
