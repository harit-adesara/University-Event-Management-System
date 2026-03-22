import { asyncHandler } from "../utils/aysnc_handler.js";
import { User } from "../models/user_schema.js";
import crypto from "crypto";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refresToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(404, "email is required");
  }
  if (!password) {
    throw new ApiError(404, "Password is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const check = await user.isPasswordCorrect(password);

  if (!check) {
    throw new ApiError(404, "Incorrect password");
  }
  const isEmailVerified = user.isEmailVerified;
  if (!isEmailVerified) {
    throw new ApiError(404, "Please verify your email");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -isEmailVarified -refresToken -forgetPasswordExpiry -forgetPasswordToken -forgetPasswordToken -forgetPasswordExpiry",
  );
  const options = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged successfully",
      ),
    );
});

const logOut = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.refresToken = "";
  await user.save({ validateBeforeSave: false });
  const options = {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, fullname, roll_number } = req.body;
  const existedUser = await User.findOne({
    $or: [{ username }, { email }, { roll_number }],
  });
  if (existedUser) {
    throw new ApiError(
      409,
      "User with email,username or roll number already exists",
      [],
    );
  }

  const user = await User.create({
    email: email,
    password: password,
    fullname: fullname,
    username: username,
    roll_number: roll_number,
    isEmailVerified: false,
  });

  const { unHashedToken, hasedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.emailVerificationToken = hasedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });
  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get(
        "host",
      )}/api/v1/umes/verify/email/${unHashedToken}`,
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registring a user!");
  }
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification email has been sent to you",
      ),
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired");
  }

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    200,
    {
      isEmailVarified: true,
    },
    "Email is verified",
  );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  // const user = await User.findById(req.user?._id);
  const email = req.body.email;
  // if user register then frontend also know who is user so at resned email verification time frontend will send email and we can use it
  // || it will also work with if user type and send email again\

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  // till this upwords lines are added by me

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified");
  }

  const { unHashedToken, hasedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.emailVerificationToken = hasedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });
  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get(
        "host",
      )}/api/v1/umes/verify/email/${unHashedToken}`,
    ),
  });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Mail has been sent to your email id"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  // console.log(incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized user");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    // console.log(decodedToken);

    const user = await User.findById(decodedToken?._id);
    // console.log(user);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refresToken) {
      throw new ApiError(401, "Refresh token is expired");
    }
    // console.log("------");

    const options = {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    user.refresToken = newRefreshToken;
    await user.save();
    // console.log("------");
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exists", []);
  }
  const { unHashedToken, hasedToken, tokenExpiry } =
    user.generateTemporaryToken();
  user.forgetPasswordToken = hasedToken;
  user.forgetPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset mail sent to your mail id"));
});

const resetForgetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    forgetPasswordToken: hashedToken,
    forgetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.forgetPasswordToken = undefined;
  user.forgetPasswordExpiry = undefined;

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully changed"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export {
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
};
