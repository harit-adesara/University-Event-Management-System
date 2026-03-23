import { Router } from "express";
import {
  registerUser,
  login,
  logOut,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgetPassword,
  changePassword,
} from "../controllers/auth.js";

import { validate } from "../middleware/validate.js";

import {
  createEvent,
  createUserByAdmin,
  eventStatusApprove,
  eventStatusReject,
  eventList_Admin_Techer_Club,
  eventListStudent,
  myEvent,
  updateProfile,
  registerInEvent,
  modifyEvent,
  deleteEvent,
} from "../controllers/functions.js";

import { verifyJWT } from "../middleware/auth_middleware.js";

import {
  userRegisterValidator,
  loginValidator,
  userChangeCurrentPasswordValidator,
  userForgotPasswordValidator,
  resetForgotPasswordValidator,
} from "../validators/index.js";

const router = Router();

router.route("/login").post(loginValidator(), validate, login);

router.route("/logout").post(verifyJWT, logOut);

router
  .route("/register/user")
  .post(userRegisterValidator(), validate, registerUser);

router.route("/get/current/user").get(verifyJWT, getCurrentUser);

router.route("/verify/email/:verificationToken").get(verifyEmail);

router.route("/resend/email/verification").post(resendEmailVerification);

router.route("/refresh-access-token").post(refreshAccessToken);

router
  .route("/forget-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);

router
  .route("/reset-password/:resetToken")
  .post(resetForgotPasswordValidator(), validate, resetForgetPassword);

router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changePassword,
  );

import { upload } from "../middleware/multer.js";

// Event routes
router
  .route("/createEvent")
  .post(verifyJWT, upload.single("image"), createEvent);

router.route("/createUser").post(verifyJWT, createUserByAdmin);

router.route("/approve/event/:id").post(verifyJWT, eventStatusApprove);

router.route("/reject/event/:id").post(verifyJWT, eventStatusReject);

router
  .route("/eventList/admin/teacher/club")
  .get(verifyJWT, eventList_Admin_Techer_Club);

router.route("/eventList/student").get(verifyJWT, eventListStudent);

router.route("/myEvent").get(verifyJWT, myEvent);

router.route("/update/profile").patch(verifyJWT, updateProfile);

router.route("/register/event/:eventId").post(verifyJWT, registerInEvent);
router
  .route("/event/modify/:eventId")
  .patch(verifyJWT, upload.single("image"), modifyEvent);
router.route("/event/delete/:eventId").delete(verifyJWT, deleteEvent);

import { verifyPayment } from "../controllers/payment_controller.js";

router.route("/verifyPayment").post(verifyJWT, verifyPayment);

router
  .route("/change-password")
  .post(
    verifyJWT,
    userChangeCurrentPasswordValidator(),
    validate,
    changePassword,
  );
router.route("/resend-email-verification").post(resendEmailVerification);
router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
  .route("/reset-password/:resetToken")
  .post(userForgotPasswordValidator(), validate, resetForgetPassword);
// router.route("/verify-email/:verificationToken").get(verifyEmail);

export { router };
