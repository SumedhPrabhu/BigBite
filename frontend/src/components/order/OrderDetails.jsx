import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../layout/Loader";
import { getOrderDetails } from "../../redux/actions/orderActions";
import { clearErrors } from "../../redux/slices/orderSlice";

const OrderDetails = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { loading, error, order } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(getOrderDetails(id));
    const interval = setInterval(() => {
      dispatch(getOrderDetails(id));
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  const {
    _id,
    deliveryInfo = {},
    orderItems = [],
    paymentInfo = {},
    user = {},
    finalTotal = 0,
    orderStatus = "Processing",
    createdAt,
    restaurant,
  } = order || {};

  const deliveryDetails = deliveryInfo
    ? `${deliveryInfo.address || ""}, ${deliveryInfo.city || ""}, ${
        deliveryInfo.postalCode || ""
      }, ${deliveryInfo.country || ""}`
    : "N/A";

  const isPaid =
    paymentInfo?.status === "paid" || paymentInfo?.status === "succeeded";

  const getStatusBadge = (status = "Processing") => {
    const s = status.toLowerCase();
    if (s.includes("delivered")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (s.includes("out") || s.includes("delivery") || s.includes("shipped")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (s.includes("cancel")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    return "bg-amber-100 text-amber-800 border-amber-200";
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Order Details
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            Order #{_id}
          </p>
        </div>
        <Link
          to="/eats/orders/me/myOrders"
          className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Orders
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-6">
          {/* Status & Highlights Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Order Status
              </span>
              <div className="flex items-center space-x-3">
                <span
                  className={`text-sm font-bold px-3 py-1 rounded-full border ${getStatusBadge(
                    orderStatus
                  )}`}
                >
                  {orderStatus}
                </span>
                <span className="text-xs text-gray-500">
                  Placed on{" "}
                  {createdAt
                    ? new Date(createdAt).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Recent"}
                </span>
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Payment Status
              </span>
              <div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isPaid ? "✓ PAID ONLINE" : "PENDING"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Info */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                Delivery Details
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong className="text-gray-900 font-medium">Customer:</strong>{" "}
                  {user?.name || "Customer"}
                </p>
                <p>
                  <strong className="text-gray-900 font-medium">Phone:</strong>{" "}
                  {deliveryInfo?.phoneNo || "N/A"}
                </p>
                <p>
                  <strong className="text-gray-900 font-medium">Address:</strong>{" "}
                  {deliveryDetails}
                </p>
              </div>
            </div>

            {/* Restaurant Info */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
                Restaurant
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong className="text-gray-900 font-medium">Name:</strong>{" "}
                  {restaurant?.name || "Partner Restaurant"}
                </p>
                <p>
                  <strong className="text-gray-900 font-medium">Address:</strong>{" "}
                  {restaurant?.address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Food List */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Items ({orderItems.length})
            </h2>

            <div className="divide-y divide-gray-100">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80"
                      }
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        ₹{item.price} × {item.quantity}
                      </p>
                    </div>
                  </div>

                  <span className="font-extrabold text-sm text-gray-900">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-lg">
              <span className="font-extrabold text-gray-900">Total Paid</span>
              <span className="font-extrabold text-emerald-600 text-xl">
                ₹{finalTotal}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;