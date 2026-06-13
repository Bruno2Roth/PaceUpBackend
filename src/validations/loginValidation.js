import { body } from 'express-validator';

export const loginValidation = [
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export default loginValidation;
