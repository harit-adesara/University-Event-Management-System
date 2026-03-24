import { Registration } from "../models/registration_schema.js";
import { User } from "../models/user_schema.js";
import { Event } from "../models/event_schema.js";
import { asyncHandler } from "../utils/aysnc_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { razorpayInstance } from "../payment/payment.js";
import cloudinary from "../db/cloudinary.js";
import { redis } from "../db/redis.js";

const createEvent = asyncHandler(async (req, res) => {
  try {
    if (!["Teacher", "Club", "Admin"].includes(req.user.role)) {
      throw new ApiError(403, "Unauthorized user");
    }
    //console.log("------");
    // console.log(req.body);

    const { name, detail, date, venue, capacity } = req.body;
    let { amount } = req.body;
    if (!amount) {
      amount = 0;
    }

    if (!name || !detail || !date || !venue) {
      throw new ApiError(400, "All fields are required");
    }

    let imageUrl = null;
    let imageId = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "events image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
      imageId = result.public_id;
    }

    const event = await Event.create({
      name,
      organizedBy: req.user.fullname,
      detail,
      date,
      venue,
      amount,
      capacity: capacity || null,
      registeredCount: 0,
      photo: imageUrl,
      photoId: imageId,
    });
    await event.save();
    res.status(200).json(new ApiResponse(200, {}, "Event created"));
  } catch (error) {
    console.log(error);
    throw new ApiError(404, "Error occurs while creating event");
  }
});

const createUserByAdmin = asyncHandler(async (req, res) => {
  try {
    if (req.user.role != "Admin") {
      throw new ApiError(404, "Unauthorized user");
    }

    const { username, email, password, role, fullname } = req.body;

    if (role != "Teacher" && role != "Club") {
      throw new ApiError(404, "Select proper role");
    }

    // console.log("-------");
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    }).select("-password");
    // console.log("-------");

    if (existingUser) {
      throw new ApiError(404, "User already exists");
    }
    // console.log("--------");
    const user = await User.create({
      role: role,
      username: username,
      fullname: fullname,
      email: email,
      password: password,
      isEmailVerified: true,
    });
    await user.save();
    // console.log("--------");
    return res
      .status(200)
      .json(new ApiResponse(200, { user }, "User created successfully"));
  } catch (error) {
    // console.log(error);
    throw new ApiError(404, "Error while creating user");
  }
});

const eventStatusApprove = asyncHandler(async (req, res) => {
  try {
    if (req.user.role == "Admin") {
      const id = req.params.id;
      const event = await Event.findById(id);
      event.status = "Accepted";
      await event.save();
      return res.status(200).json(new ApiResponse(200, {}, "Event approved"));
    }
  } catch (error) {
    throw new ApiError(404, "Error occured while modifying event");
  }
});

const eventStatusReject = asyncHandler(async (req, res) => {
  try {
    if (req.user.role == "Admin") {
      const id = req.params.id;
      const event = await Event.findById(id);
      event.status = "Rejected";
      await event.save();
      return res.status(200).json(new ApiResponse(200, {}, "Event rejected"));
    }
  } catch (error) {
    throw new ApiError(404, "Error occured while modifying event");
  }
});

const eventList_Admin_Techer_Club = asyncHandler(async (req, res) => {
  try {
    if (
      req.user.role == "Teacher" ||
      req.user.role == "Club" ||
      req.user.role == "Admin"
    ) {
      let filter = {
        date: { $gte: new Date() },
      };
      if (req.query.status) {
        filter.status = req.query.status;
      }
      if (req.query.myEvents === "true") {
        filter.organizedBy = req.user.fullname;
      }
      if (req.query.date) {
        filter.date = new Date(req.query.date);
      }
      const events = await Event.find(filter).sort({ date: 1 });
      if (events.length === 0) {
        throw new ApiError(404, "Events not found");
      }
      const updatedEvents = events.map((e) => ({
        ...e._doc,
        seatsLeft: e.capacity !== null ? e.capacity - e.registeredCount : null,
        isFull: e.capacity !== null ? e.registeredCount >= e.capacity : false,
      }));
      return res.status(200).json(new ApiResponse(200, { updatedEvents }));
    }
  } catch (error) {
    throw new ApiError(404, "Error occured in event list");
  }
});

const eventListStudent = asyncHandler(async (req, res) => {
  try {
    if (req.user.role != "Student") {
      throw new ApiError(404, "Error in event list");
    }
    let filter = {
      status: "Accepted",
      date: { $gte: new Date() },
    };
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: "i" };
    }
    if (req.query.organizedBy) {
      filter.organizedBy = { $regex: req.query.organizedBy, $options: "i" };
    }
    if (req.query.date) {
      filter.date = new Date(req.query.date);
    }
    const event = await Event.find(filter).sort({ date: 1 });
    if (!event) {
      throw new ApiError(404, "Events not found");
    }
    const updatedEvents = event.map((e) => ({
      ...e._doc,
      seatsLeft: e.capacity !== null ? e.capacity - e.registeredCount : null,
      isFull: e.capacity !== null ? e.registeredCount >= e.capacity : false,
    }));
    return res.status(200).json(new ApiResponse(200, { updatedEvents }));
  } catch (error) {
    console.log(error);
    throw new ApiError(404, "Error in events list");
  }
});

const myEvent = asyncHandler(async (req, res) => {
  try {
    const event = await Registration.find({
      user: req.user._id,
    })
      .populate("event")
      .sort({ date: -1 });

    if (event.length === 0) {
      throw new ApiError(404, "No registration found");
    }
    return res.status(200).json(new ApiResponse(200, { event }));
  } catch (error) {
    throw new ApiError(404, "Error in my event");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { fullname, username, roll_number } = req.body;

    const updateData = {
      fullname,
      username,
    };

    let existing = null;

    if (req.user.role === "Student" && roll_number) {
      existing = await User.findOne({ roll_number });
    }

    if (existing && existing._id.toString() !== req.user._id.toString()) {
      throw new Error("Roll number already taken");
    }

    if (req.user.role === "Student" && roll_number) {
      updateData.roll_number = roll_number;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true },
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, { user }));
  } catch (error) {
    throw new ApiError(404, "Error while updating profile");
  }
});

const registerInEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const existing = await Registration.findOne({
    user: req.user._id,
    event: eventId,
  });

  if (existing) {
    throw new ApiError(400, "User already registered");
  }

  const event = await Event.findOneAndUpdate(
    {
      _id: eventId,
      status: "Accepted",
      $or: [
        { capacity: null },
        { $expr: { $lt: ["$registeredCount", "$capacity"] } },
      ],
    },
    {
      $inc: { registeredCount: 1 },
    },
    { new: true },
  );

  if (!event) {
    throw new ApiError(400, "Event is full or not available");
  }

  if (event.amount === 0) {
    const registration = await Registration.create({
      user: req.user._id,
      event: eventId,
      status: "Free",
    });

    return res.status(200).json(
      new ApiResponse(200, {
        isPaid: false,
        registration,
      }),
    );
  }

  const order = await razorpayInstance.orders.create({
    amount: event.amount * 100,
    currency: "INR",
    receipt: `rec_${req.user._id.toString().slice(-8)}_${eventId.toString().slice(-8)}`,
  });

  await Registration.create({
    user: req.user._id,
    event: eventId,
    status: "Pending",
    orderId: order.id,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      isPaid: true,
      order: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    }),
  );
});

const modifyEvent = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      throw new ApiError(404, "Event not found");
    }
    const updates = req.body;
    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, "Event not found");
    }
    if (event.status !== "Pending") {
      throw new ApiError(404, "Event can not be modify");
    }
    const createdBy = req.user.fullname;
    if (event.organizedBy !== createdBy) {
      throw new ApiError(404, "You are not owner of this event");
    }
    const allowFields = ["name", "detail", "date", "amount", "venue"];
    const updateKeys = Object.keys(updates);

    if (updateKeys.length === 0) {
      throw new ApiError(404, "No fields provided to change");
    }
    updateKeys.forEach((field) => {
      if (!allowFields.includes(field)) {
        throw new ApiError(404, "Can not update field");
      }
      event[field] = updates[field];
    });

    if (req.file) {
      if (event.photoId) {
        await cloudinary.uploader.destroy(event.photoId);
      }
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "events image" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      event.photo = result.secure_url;
      event.photoId = result.public_id;
    }

    await event.save();
    return res
      .status(200)
      .json(new ApiResponse(200, event, "Event modify successfully"));
  } catch (error) {
    throw new ApiError(404, "Error while modifying event");
  }
});

const deleteEvent = asyncHandler(async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) throw new ApiError(404, "Event not found");

    if (event.status !== "Pending") {
      throw new ApiError(
        400,
        "Cannot delete event after it is accepted or rejected",
      );
    }
    if (event.organizedBy !== req.user.fullname) {
      throw new ApiError(
        403,
        "You do not have permission to delete this event",
      );
    }
    if (event.photoId) {
      await cloudinary.uploader.destroy(event.photoId);
    }
    await Event.findByIdAndDelete(eventId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Event deleted successfully"));
  } catch (error) {
    throw new ApiError(404, "Erro while deleting event");
  }
});

export {
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
};
