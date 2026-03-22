import mongoose, { connect, model, Schema } from "mongoose";

const registration = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Free", "Paid"],
      default: "Pending",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

registration.index({ user: 1, event: 1 }, { unique: true });

export const Registration = mongoose.model("Registration", registration);
