import mongoose, { connect } from "mongoose";

const connectdb = async () => {
  try {
    await mongoose.connect(process.env.mongodb);
    console.log("✅Connected to DB");
  } catch (err) {
    console.log("❌Not connected to DB");
    process.exit(1);
  }
};

export { connectdb };
