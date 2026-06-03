import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name').notEmpty().withMessage('Name is required'),
];

export default registerValidation;
