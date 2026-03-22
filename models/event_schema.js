import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizedBy: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
    },
    detail: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: null,
      min: 1,
    },
    registeredCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Event = mongoose.model("Event", eventSchema);
