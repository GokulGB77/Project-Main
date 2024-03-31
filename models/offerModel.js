const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
    productOffer: {
      products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Productsdb" }],
      discountPercentage: { type: Number, default: 0 },
      categoryOffer: {
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Categoriesdb", },
        discountPercentage: { type: Number, default: 0, },
      },
    },
  },
  {
    strictPopulate: false,
    timestamps: true,
  }
)