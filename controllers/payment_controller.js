import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import crypto from "crypto";
import { asyncHandler } from "../utils/aysnc_handler.js";
import { Event } from "../models/event_schema.js";
import { razorpayInstance } from "../payment/payment.js";
import { Registration } from "../models/registration_schema.js";

// export const createOrder = asyncHandler(async (req, res) => {
//   const { eventId } = req.body;
//   const event = await Event.findById(eventId);

//   if (!event) {
//     throw new ApiError(404, "Event not found");
//   }

//   const options = {
//     amount: event.amount * 100,
//     currency: "INR",
//     receipt: "receipt_order_1",
//   };
//   try {
//     razorpayInstance.orders.create(options, (err, order) => {
//       if (err) {
//         throw new ApiError(404, "Something went wrong");
//       } else {
//         res.status(200).json(new ApiResponse(200, order));
//       }
//     });
//   } catch (error) {
//     throw new ApiError(404, "Something went wrong");
//   }
// });

// export const verifyPayment = asyncHandler(async (req, res) => {
//   const { order_id, payment_id, signature, eventId } = req.body;
//   const registration = await Registration.findOne({
//     user: req.user._id,
//     event: eventId,
//   });

//   if (!registration) {
//     throw new ApiError(404, "Registration not found");
//   }

//   if (!registration.orderId) {
//     throw new ApiError(400, "This event does not require payment");
//   }

//   if (registration.status === "Paid") {
//     throw new ApiError(400, "Payment already verified");
//   }

//   const secret = process.env.KEY_SECRET;
//   const hmac = crypto.createHmac("sha256", secret);
//   hmac.update(order_id + "|" + payment_id);
//   const generatedSignature = hmac.digest("hex");
//   if (generatedSignature === signature) {
//     const update = await Registration.findOneAndUpdate(
//       {
//         user: req.user._id,
//         event: eventId,
//         orderId: order_id,
//         status: "Pending",
//       },
//       {
//         status: "Paid",
//         paymentId: payment_id,
//         paidAt: new Date(),
//       },
//       { new: true },
//     );

//     if (!update) {
//       throw new ApiError(404, "Registration not found");
//     }

//     res.status(200).json(new ApiResponse(200, "Payment verified"));
//   } else {
//     throw new ApiError(404, "Payment not verified");
//   }
// });

export const verifyPayment = asyncHandler(async (req, res) => {
  const { order_id, payment_id, signature, eventId } = req.body;

  const registration = await Registration.findOne({
    user: req.user._id,
    event: eventId,
  });

  if (!registration) {
    throw new ApiError(404, "Registration not found");
  }

  if (!registration.orderId) {
    throw new ApiError(400, "This event does not require payment");
  }

  if (registration.status === "Paid") {
    throw new ApiError(400, "Payment already verified");
  }

  const secret = process.env.KEY_SECRET;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(order_id + "|" + payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === signature) {
    const update = await Registration.findOneAndUpdate(
      {
        user: req.user._id,
        event: eventId,
        orderId: order_id,
        status: "Pending",
      },
      {
        status: "Paid",
        paymentId: payment_id,
        paidAt: new Date(),
      },
      { new: true },
    );

    if (!update) {
      throw new ApiError(404, "Registration not found");
    }

    return res.status(200).json(new ApiResponse(200, "Payment verified"));
  } else {
    await Event.updateOne({ _id: eventId }, { $inc: { registeredCount: -1 } });

    await Registration.deleteOne({
      user: req.user._id,
      event: eventId,
    });

    throw new ApiError(400, "Payment not verified");
  }
});
