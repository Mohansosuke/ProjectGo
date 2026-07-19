const { body } = require('express-validator');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]:;"'<>,.?/\\|~`]).{8,32}$/;

const signupValidator = [
  body('fullName').trim().notEmpty().withMessage('Full Name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password')
    .matches(passwordRegex)
    .withMessage('Password must be 8-32 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const forgotPasswordValidator = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail()
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword')
    .matches(passwordRegex)
    .withMessage('Password must be 8-32 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

module.exports = {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
