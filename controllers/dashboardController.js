const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")
const Ordersdb = require("../models/ordersModel")
const Productsdb = require("../models/productsModel")
const Categoriesdb = require("../models/categoriesModel")
const Walletdb = require("../models/walletModel")
const Couponsdb = require("../models/couponsModel")
const mongoose = require("mongoose")

const loadAdminDashoard = async (req, res) => {
  try {
    const allProducts = await Productsdb.find()
    const allCategories = await Categoriesdb.find()
    const allOrders = await Ordersdb.find({ orderStatus: "delivered" });
    const allUsers = await Userdb.find({ status: 1, }).sort({ createdAt: 1 })

    const topUsers = await Ordersdb.aggregate([
      {
        $group: {
          _id: "$user",
          totalOrders: { $count: {} }
        }
      },
      {
        $sort: {
          totalOrders: -1
        }
      }
    ]);
    const userIds = topUsers.map(user => user._id);

    const users = await Userdb.find({ _id: { $in: userIds } });
    topUsers.forEach(user => {
      const userData = users.find(u => u._id.toString() === user._id.toString());
      user.name = userData.name; // Assuming the name field in Userdb is 'name'
    });

    const topProducts = await Productsdb.find().sort({ popularity: -1 }).limit(10)

    const topCategories = await Productsdb.aggregate([
      { $sort: { popularity: -1 } },
      { $limit: 10 },
      {
        $group: {
          _id: "$category",
          products: {
            $push: {
              _id: "$_id",
              productName: "$productName",
              popularity: "$popularity"
            }
          },
          totalPopularity: { $sum: "$popularity" }
        }
      }
    ])

    const categoryIds = topCategories.map(category => new mongoose.Types.ObjectId(category._id)); // Convert _id strings to ObjectId

    const categories = await Categoriesdb.find({ _id: { $in: categoryIds } });

    topCategories.forEach(categoryObj => {
      const category = categories.find(cat => cat._id.toString() === categoryObj._id.toString());
      if (category) {
        categoryObj.categoryName = category.categoryName;
      }
    });

    console.log("topCategories:", topCategories);

    const totalOrderPriceSum = allOrders.reduce((accumulator, currentOrder) => {
      const orderTotalPriceSum = currentOrder.orderProducts.reduce((productAccumulator, currentProduct) => {
        return productAccumulator + currentProduct.totalPrice;
      }, 0);
      return accumulator + orderTotalPriceSum;
    }, 0);

    console.log("Total sum of all order products' totalPrice:", totalOrderPriceSum);

    res.render("dashboard", { title: 'Admin Dashboard', allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, topUsers, topProducts,topCategories });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



console.log("nothing")

// const loadSalesReport = async (req, res) => {
//   try {
//     const allProducts = await Productsdb.find()
//     const allCategories = await Categoriesdb.find()
//     const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
//     const allOrders = await Ordersdb.find({}).sort({ orderDate: -1 });
//     const allUsers = await Userdb.find()

//     const totalOrderPriceSum = allOrders.reduce((accumulator, currentOrder) => {
//       const orderTotalPriceSum = currentOrder.orderProducts.reduce((productAccumulator, currentProduct) => {
//         return productAccumulator + currentProduct.totalPrice;
//       }, 0);
//       return accumulator + orderTotalPriceSum;
//     }, 0);

//     const statuses = await Ordersdb.distinct('orderStatus');

//     // Calculate orderPriceWODiscount for each order
//     const ordersObj = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const orders = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const totalOrdersAmount = orders.reduce((total, order) => {
//       return total + order.orderTotal;
//     }, 0);
//     const totalOrdersCount = orders.length
//     const averageOrderTotal = totalOrdersAmount / totalOrdersCount;

//     const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
//     const numberOfDeliveredOrders = deliveredOrders.length;
//     const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
//     const numberOfpendingOrders = pendingOrders.length;
//     const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
//     const numberOfcancelledOrders = cancelledOrders.length;


//     // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
//     // console.log('Number of Pending Orders:', numberOfpendingOrders);
//     // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

//     const couponDiscountSum = orders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     console.log('Coupon Discount Sum:', couponDiscountSum);

//     const offerDiscountSum = orders.reduce((total, order) => {
//       const orderPriceWODiscount = order.orderPriceWODiscount || 0;
//       return total + (orderPriceWODiscount - order.orderTotal);
//     }, 0);

//     console.log('Offer Discount Sum:', offerDiscountSum);


//     res.render("salesReport", { allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, statuses, ordersObj,
//       orders,totalOrdersAmount,offerDiscountSum,totalOrdersCount,averageOrderTotal,numberOfDeliveredOrders,numberOfpendingOrders,numberOfcancelledOrders,couponDiscountSum,
//       offerDiscountSum

//      });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// }
const loadSalesReport = async (req, res) => {
  try {
    const allProducts = await Productsdb.find()
    const allCategories = await Categoriesdb.find()
    const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
    const allOrders = await Ordersdb.find({ orderStatus: "delivered" }).sort({ orderDate: -1 });
    const allOrdersUnwinded = await Ordersdb.aggregate([
      { $unwind: "$orderProducts" },
      { $match: { orderStatus: "delivered" } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "productsdbs",
          localField: "orderProducts.product",
          foreignField: "_id",
          as: "orderProducts.prodDetails"
        }
      }
    ]);

    console.log("allOrdersUnwinded:", allOrdersUnwinded)

    const allUsers = await Userdb.find({ status: 1 })


    const statuses = await Ordersdb.distinct('orderStatus');

    // Calculate orderPriceWODiscount for each order
    const ordersObj = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(), // Convert Mongoose document to plain JavaScript object
        orderPriceWODiscount: orderPriceWODiscount
      };
    });
    let totalPriceSum = 0;
    let totalPriceWithoutOfferSum = 0;

    allOrdersUnwinded.forEach(order => {
      totalPriceSum += order.orderProducts.totalPrice;
      totalPriceWithoutOfferSum += order.orderProducts.totalPriceWithoutOffer;
    });

    console.log("Total Price Sum:", totalPriceSum);
    console.log("Total Price Without Offer Sum:", totalPriceWithoutOfferSum);

    const totalOrdersAmount = allOrdersUnwinded.reduce((total, order) => {
      return total + order.orderProducts.totalPrice;
    }, 0);
    const totalOrdersCount = allOrdersUnwinded.length

    const deliveredOrders = allOrdersUnwinded.length;
    const numberOfDeliveredOrders = deliveredOrders.length;

    const couponDiscountSum = allOrders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    // console.log('Coupon Discount Sum:', couponDiscountSum);

    const offerDiscountSum = allOrdersUnwinded.reduce((total, order) => {
      const totalPriceWithoutOffer = order.orderProducts.totalPriceWithoutOffer || 0;
      return total + (totalPriceWithoutOffer - order.orderProducts.totalPrice);
    }, 0);

    // console.log('Offer Discount Sum:', offerDiscountSum);


    res.render("salesReport", {
      allOrders, allOrdersUnwinded, allProducts, totalPriceSum, totalPriceWithoutOfferSum, allCategories, allUsers, statuses, ordersObj, totalOrdersAmount, offerDiscountSum, totalOrdersCount, numberOfDeliveredOrders, couponDiscountSum,
      offerDiscountSum

    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}




const generateData = async (startDate, endDate) => {
  try {
    let endDate1 = new Date(endDate);
    endDate1.setDate(endDate1.getDate() + 1);
    endDate1 = endDate1.toISOString().slice(0, 10);

    const allProducts = await Productsdb.find();
    const allCategories = await Categoriesdb.find();
    const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
    const allOrders = await Ordersdb.find({ orderStatus: "delivered", "createdAt": { $gte: new Date(startDate), $lt: new Date(endDate1) } }).sort({ orderDate: -1 });
    const allOrdersUnwinded = await Ordersdb.aggregate([
      { $unwind: "$orderProducts" },
      {
        $match: {
          "createdAt": {
            $gte: new Date(startDate),
            $lt: new Date(endDate1)
          },
          "orderStatus": "delivered"
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "productsdbs",
          localField: "orderProducts.product",
          foreignField: "_id",
          as: "orderProducts.prodDetails"
        }
      }
    ]);
    const allUsers = await Userdb.find({ status: 1 });

    const statuses = await Ordersdb.distinct('orderStatus');

    const ordersObj = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(),
        orderPriceWODiscount: orderPriceWODiscount
      };
    });

    let totalPriceSum = 0;
    let totalPriceWithoutOfferSum = 0;

    allOrdersUnwinded.forEach(order => {
      totalPriceSum += order.orderProducts.totalPrice;
      totalPriceWithoutOfferSum += order.orderProducts.totalPriceWithoutOffer;

      const productNameWords = order.orderProducts.prodDetails[0].productName.split(" ");
      const firstThreeWords = productNameWords.slice(0, 3).join(" ");
      order.orderProducts.firstThreeWords = firstThreeWords;
    });

    console.log("Total Price Sum:", totalPriceSum);
    console.log("Total Price Without Offer Sum:", totalPriceWithoutOfferSum);

    const totalOrdersAmount = allOrdersUnwinded.reduce((total, order) => {
      return total + order.orderProducts.totalPrice;
    }, 0);

    const totalOrdersCount = allOrdersUnwinded.length;

    const deliveredOrders = allOrdersUnwinded.length;
    const numberOfDeliveredOrders = deliveredOrders.length;

    const couponDiscountSum = allOrders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    const offerDiscountSum = allOrdersUnwinded.reduce((total, order) => {
      const totalPriceWithoutOffer = order.orderProducts.totalPriceWithoutOffer || 0;
      return total + (totalPriceWithoutOffer - order.orderProducts.totalPrice);
    }, 0);

    return {
      allOrders,
      allOrdersUnwinded,
      allProducts,
      totalPriceSum,
      totalPriceWithoutOfferSum,
      allCategories,
      allUsers,
      statuses,
      ordersObj,
      totalOrdersAmount,
      offerDiscountSum,
      totalOrdersCount,
      numberOfDeliveredOrders,
      couponDiscountSum,
      startDate,
      endDate,
    };

  } catch (error) {
    throw new Error(error.message);
  }
}

const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const data = await generateData(startDate, endDate);

    res.json(data);

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const fs = require('fs');
const ejs = require('ejs');
const pdfkit = require('pdfkit');

// const generateSalesReportPDF = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;
//     const data = await generateData(startDate, endDate);


//     const pdfDocument = new pdfkit();
//     const pdfBuffer = await new Promise((resolve, reject) => {
//       pdfDocument.pipe(
//         fs.createWriteStream(`demo/sales-report_${startDate}_${endDate}.pdf`)
//       );

//       pdfDocument.font('Helvetica-Bold').fontSize(18);
//      `Sales Report`, 50, 45);

//       // Subheading
//       pdfDocument.font('Helvetica').fontSize(12);
//      `Report Duration ${startDate} - ${endDate}`, 50, 70);

//       pdfDocument.font('Helvetica-Bold').fontSize(12);

//       // Table header
//      'Sl.No.', 10, 100, { valign: 'center' });
//      'Order ID', 50, 100, { valign: 'center' });
//      'Product', 168, 100, { valign: 'center' });
//      'Order Date', 255, 100, { valign: 'center' });
//      'Qty', 325, 100, { valign: 'center' });
//      'Total Amt', 345, 100, { width: 50, align: 'center', valign: 'center' });
//      'Discount', 390, 100, { valign: 'center' });
//      'Amt After Discount', 450, 100, { valign: 'center' });
//      'Payment', 520, 100, { width: 50, valign: 'center' });

//       pdfDocument.font('Helvetica').fontSize(10);
//       let y = 140; // Y-coordinate for the first row

//       // Table data
//       data.allOrdersUnwinded.forEach((order, index) => {
//        index + 1, 20, y);
//        "#" + order.orderId, 40, y);
//         let productNameWords = order.orderProducts.prodDetails[0].productName.split(" ");
//        productNameWords.slice(0, 2).join(" "), 168, y, { align: 'left' });
//        order.orderDate, 260, y);
//        order.orderProducts.quantity, 330, y);
//        (order.orderProducts.totalPriceWithoutOffer).toLocaleString(), 355, y,);
//        "- " + ((order.orderProducts.totalPriceWithoutOffer) - (order.orderProducts.totalPrice)), 400, y,);
//        "Rs. " + (order.orderProducts.totalPrice).toLocaleString(), 455, y,);
//        order.paymentMethod, 525, y, { width: 50, align: 'left' });
//         y += 22; // Increment Y-coordinate for the next row
//       });



//       //`Total Delivered Orders: ${}`, pdfDocument.page.width - 50 - pdfDocument.widthOfString(row.paymentMethod), y);
//       y += 10

//      `Total Amount Before Discounts:`, pdfDocument.page.width - 310, y,);
//      "Rs." + (data.totalPriceWithoutOfferSum).toLocaleString(), pdfDocument.page.width - 150, y,{ align: 'right' });
//       y += 20
//      `Discounts: `, pdfDocument.page.width - 217, y,);
//      `- Rs. ${(data.offerDiscountSum).toLocaleString()}`,pdfDocument.page.width - 150,  y,{ align: 'right' });
//       y += 20

//      `Coupons:`, pdfDocument.page.width - 214, y,);
//      `- Rs. ${(data.couponDiscountSum).toLocaleString()}`, pdfDocument.page.width - 185, y,{ align: 'right' });
//       y += 18
//       pdfDocument.moveTo(pdfDocument.page.width - 280, y)
//         .lineTo(pdfDocument.page.width - 70, y)
//         .stroke('black');

//       y += 15
//      `Total Delivered Orders:`, pdfDocument.page.width - 275, y,);
//       data.totalOrdersCount, pdfDocument.page.width - 230, y,{ align: 'right' });
//       y += 20
//      `Total Revenue After Discounts: `, pdfDocument.page.width - 310, y);
//      ` Rs. ${((data.totalPriceSum) - (data.couponDiscountSum)).toLocaleString()}`, pdfDocument.page.width - 280, y,{ align: 'right' });


//       pdfDocument.end();

//       pdfDocument.on("error", (err) => {
//         reject(err);
//       });

//       pdfDocument.on("finish", () => {
//         resolve(pdfDocument.stream.read());
//       });
//     });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

const handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const generateSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const data = await generateData(startDate, endDate);
    const totalOrdersCount = (data.totalOrdersCount).toLocaleString()
    const totalPriceWithoutOfferSum = (data.totalPriceWithoutOfferSum).toLocaleString()
    const offerDiscountSum = (data.offerDiscountSum).toLocaleString()
    const couponDiscountSum = (data.couponDiscountSum).toLocaleString()
    const totalRevenue = ((data.totalPriceSum) - (data.couponDiscountSum)).toLocaleString()

    const htmlContent = fs.readFileSync('./views/admins/salesReportPdfMain.ejs', 'utf8');
    const template = handlebars.compile(htmlContent);

    let tableContent = `
            <table class="table border my-5" style="font-size: 10px">
                <thead>
                    <tr class="bg-primary-subtle">
                        <th style="width:50px;" class="thead" scope="col">Sl.No.</th>
                        <th style="width:50px;" class="thead" scope="col">Order ID</th>
                        <th class="thead" scope="col">Product</th>
                        <th class="thead" scope="col">Order Date</th>
                        <th class="thead" scope="col">Qty</th>
                        <th class="thead" scope="col">Total Amt</th>
                        <th class="thead" scope="col">Discount</th>
                        <th class="thead" scope="col">Amt After Discount</th>
                        <th class="thead" scope="col">Payment</th>
                    </tr>
                </thead>
                <tbody>
            `;


    data.allOrdersUnwinded.forEach((order, index) => {
      let productNameWords = order.orderProducts.prodDetails[0].productName.split(" ");

      tableContent += `
            <tr>
            <td class="tbody">${index + 1}</td>
            <td class="tbody">${order.orderId}</td>
            <td class="tbody">${productNameWords.slice(0, 2).join(" ")}</td>
            <td class="tbody">${order.orderDate}</td>
            <td class="tbody">${order.orderProducts.quantity}</td>
            <td class="tbody">${(order.orderProducts.totalPriceWithoutOffer).toLocaleString()}</td>
            <td class="tbody">- ${((order.orderProducts.totalPriceWithoutOffer) - (order.orderProducts.totalPrice))}</td>
            <td class="tbody"> ${(order.orderProducts.totalPrice).toLocaleString()}</td>
            <td class="tbody"> ${order.paymentMethod}</td>
            </tr>
          `;
    })

    tableContent += `
            </tbody>
            </table>
        `;

    const renderedHtml = template({ tableContent, totalOrdersCount, totalPriceWithoutOfferSum, offerDiscountSum, couponDiscountSum, totalRevenue });
    const browser = await puppeteer.launch();
    const paged = await browser.newPage();
    const marginOptions = {
      top: '1cm',
      bottom: '1cm',
      left: '1cm',
      right: '1cm'
    };

    await paged.setContent(renderedHtml);
    const pdfBuffer = await paged.pdf({
      format: 'A4',
      margin: marginOptions
    });

    await browser.close();

    res.setHeader('Content-Disposition', 'inline; filename="Sales Report"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


// const generateSalesReport = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;

//     const allProducts = await Productsdb.find();
//     const allCategories = await Categoriesdb.find();
//     const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
//     const allOrders = await Ordersdb.find({ orderStatus: "delivered" }).sort({ orderDate: -1 });
//     const allOrdersUnwinded = await Ordersdb.aggregate([
//       { $unwind: "$orderProducts" },
//       { $match: { orderStatus: "delivered" } },
//       {
//         $match: {
//           createdAt: {
//             $gte: startDate,
//             $lte: endDate
//           }
//         }
//       },
//       { $sort: { createdAt: -1 } },
//       {
//         $lookup: {
//           from: "productsdbs",
//           localField: "orderProducts.product",
//           foreignField: "_id",
//           as: "orderProducts.prodDetails"
//         }
//       }

//     ]);
//     console.log("Fetched sales report data:", allOrdersUnwinded);


//     console.log("allOrdersUnwinded:", allOrdersUnwinded);

//     const allUsers = await Userdb.find({ status: 1 });

//     const statuses = await Ordersdb.distinct('orderStatus');

//     const ordersObj = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(),
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     let totalPriceSum = 0;
//     let totalPriceWithoutOfferSum = 0;

//     allOrdersUnwinded.forEach(order => {
//       totalPriceSum += order.orderProducts.totalPrice;
//       totalPriceWithoutOfferSum += order.orderProducts.totalPriceWithoutOffer;
//     });

//     console.log("Total Price Sum:", totalPriceSum);
//     console.log("Total Price Without Offer Sum:", totalPriceWithoutOfferSum);

//     const totalOrdersAmount = allOrdersUnwinded.reduce((total, order) => {
//       return total + order.orderProducts.totalPrice;
//     }, 0);

//     const totalOrdersCount = allOrdersUnwinded.length;

//     const deliveredOrders = allOrdersUnwinded.length;
//     const numberOfDeliveredOrders = deliveredOrders.length;

//     const couponDiscountSum = allOrders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     const offerDiscountSum = allOrdersUnwinded.reduce((total, order) => {
//       const totalPriceWithoutOffer = order.orderProducts.totalPriceWithoutOffer || 0;
//       return total + (totalPriceWithoutOffer - order.orderProducts.totalPrice);
//     }, 0);

//     res.setHeader('Content-Type', 'application/json');

//     res.json({
//       allOrders,
//       allOrdersUnwinded,
//       allProducts,
//       totalPriceSum,
//       totalPriceWithoutOfferSum,
//       allCategories,
//       allUsers,
//       statuses,
//       ordersObj,
//       totalOrdersAmount,
//       offerDiscountSum,
//       totalOrdersCount,
//       numberOfDeliveredOrders,
//       couponDiscountSum,
//       startDate,
//       endDate,
//     });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// }








// const generateSalesReportPDF = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;


//     console.log(startDate)
//     console.log(endDate)


//     const allOrders = await Ordersdb.find({
//       createdAt: {
//         $gte: startDate,
//         $lte: endDate
//       }
//     }).sort({ orderDate: -1 })
//     const orders = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const totalOrdersAmount = orders.reduce((total, order) => {
//       return total + order.orderTotal;
//     }, 0);
//     const totalOrdersCount = orders.length
//     const averageOrderTotal = totalOrdersAmount / totalOrdersCount;

//     const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
//     const numberOfDeliveredOrders = deliveredOrders.length;
//     const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
//     const numberOfpendingOrders = pendingOrders.length;
//     const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
//     const numberOfcancelledOrders = cancelledOrders.length;


//     // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
//     // console.log('Number of Pending Orders:', numberOfpendingOrders);
//     // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

//     const couponDiscountSum = orders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     console.log('Coupon Discount Sum:', couponDiscountSum);

//     const offerDiscountSum = orders.reduce((total, order) => {
//       const orderPriceWODiscount = order.orderPriceWODiscount || 0;
//       return total + (orderPriceWODiscount - order.orderTotal);
//     }, 0);

//     console.log('Offer Discount Sum:', offerDiscountSum);



//     res.render("salesReportPDF", {
//       orders,
//       totalOrdersAmount,
//       totalOrdersCount,
//       averageOrderTotal,
//       numberOfDeliveredOrders,
//       numberOfpendingOrders,
//       numberOfcancelledOrders,
//       couponDiscountSum,
//       offerDiscountSum,
//       startDate, endDate

//     });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };


// const generateSalesReport = async (req, res) => {
//   try {
//     const { startDate, endDate, sortBy } = req.body;

//     let sortByValue;
//     if (sortBy == "Quantity Sold") {
//       sortByValue = "totalQuantity";
//     } else {
//       sortByValue = "totalPrice";

//     }
//     const result = await Ordersdb.aggregate([
//       {
//         $unwind: "$orderProducts" 
//       },
//       {
//         $group: {
//           _id: "$orderProducts.product",
//           totalQuantity: { $sum: "$orderProducts.quantity" }, // Sum of quantity
//           totalPrice: { $sum: "$orderProducts.totalPrice" }, // Sum of totalPrice
//           totalOrderPriceWithoutOffer: { $sum: "$orderProducts.totalPriceWithoutOffer" } // Sum of totalPriceWithoutOffer
//         }
//       },
//       {
//         $sort: { sortByValue: -1 } 
//       }
//     ]);

//     if (result.length > 0) {
//       const { totalQuantity, totalPrice, totalOrderPriceWithoutOffer } = result[0];
//       console.log("Total Quantity:", result);
//     } else {
//       console.log("No orders found.");
//     }
//   } catch (error) {
//     console.error("Error:", error);
//   }

// };


// const generateSalesReportPdf = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;


//     console.log(startDate)
//     console.log(endDate)


//     const allOrders = await Ordersdb.find({
//       createdAt: {
//         $gte: startDate,
//         $lte: endDate
//       }
//     }).sort({ orderDate: -1 })
//     const orders = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const totalOrdersAmount = orders.reduce((total, order) => {
//       return total + order.orderTotal;
//     }, 0);
//     const totalOrdersCount = orders.length
//     const averageOrderTotal = totalOrdersAmount / totalOrdersCount;

//     const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
//     const numberOfDeliveredOrders = deliveredOrders.length;
//     const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
//     const numberOfpendingOrders = pendingOrders.length;
//     const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
//     const numberOfcancelledOrders = cancelledOrders.length;


//     // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
//     // console.log('Number of Pending Orders:', numberOfpendingOrders);
//     // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

//     const couponDiscountSum = orders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     console.log('Coupon Discount Sum:', couponDiscountSum);

//     const offerDiscountSum = orders.reduce((total, order) => {
//       const orderPriceWODiscount = order.orderPriceWODiscount || 0;
//       return total + (orderPriceWODiscount - order.orderTotal);
//     }, 0);

//     console.log('Offer Discount Sum:', offerDiscountSum);



//     res.render("salesReportPDF", {
//       orders,
//       totalOrdersAmount,
//       totalOrdersCount,
//       averageOrderTotal,
//       numberOfDeliveredOrders,
//       numberOfpendingOrders,
//       numberOfcancelledOrders,
//       couponDiscountSum,
//       offerDiscountSum,
//       startDate, endDate

//     });
//   } catch (error) {
//     console.error("Error:", error);
//   }

// };




module.exports = {
  loadAdminDashoard,
  loadSalesReport,
  generateSalesReport,
  generateSalesReportPDF,
}