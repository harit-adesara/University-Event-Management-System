import razorpay from "razorpay";
import dotenv from "dotenv";
dotenv.config();

export const razorpayInstance = new razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});
// console.log(process.env.KEY_ID);
// console.log(process.env.KEY_SECRET);

// import Razorpay from "razorpay";

// export const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });
