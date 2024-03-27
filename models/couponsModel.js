const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const couponsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  discountType: { type: String, enum: ["percentage", "fixed"], required: true, unique: true },
  discountValue: { type: Number, required: true, },
  expiryDate: { type: Date, required: true, },
  minimumOffer: { type: Number, default: 500, },
  maximumOffer: { type: Number },
  status: { type: String, enum: ["active", "blocked"], default: "active" },

},
{ timestamps: true,}
);

module.exports = mongoose.model("Couponsdb", couponsSchema);