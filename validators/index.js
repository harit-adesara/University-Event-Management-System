import { body } from "express-validator";
const userRegisterValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("User name is required")
      .isLowercase()
      .withMessage("User name must be in lower case")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 character long"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 3, max: 8 }),
    body("fullname").optional().trim(),
    body("roll_number")
      .trim()
      .notEmpty()
      .withMessage("Roll number is required"),
  ];
};

const loginValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 3, max: 8 }),
  ];
};

const userChangeCurrentPasswordValidator = () => {
  return [
    body("oldPassword")
      .notEmpty()
      .withMessage("Old password is required")
      .isLength({ min: 3, max: 8 })
      .withMessage("Ensure password length between 3 to 8"),
    ,
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 3, max: 8 })
      .withMessage("Ensure password length between 3 to 8"),
    ,
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
  ];
};

const resetForgotPasswordValidator = () => {
  return [
    body("newPassword")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 3, max: 8 })
      .withMessage("Ensure password length between 3 to 8"),
  ];
};

export {
  userRegisterValidator,
  loginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  resetForgotPasswordValidator,
};
