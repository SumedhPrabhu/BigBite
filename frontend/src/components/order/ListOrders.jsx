import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Loader from "../layout/Loader";
import { myOrders } from "../../redux/actions/orderActions";
import { clearErrors } from "../../redux/slices/orderSlice";

const ListOrders = () => {
  const dispatch = useDispatch();
  const { loading, error, orders } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(myOrders());
    const interval = setInterval(() => {
      dispatch(myOrders());
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

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
    <div className="max-w-5xl mx-auto py-4 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          My Orders
        </h1>
        <Link
          to="/"
          className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          ← Order More Food
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center text-3xl">
            📦
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">
              No orders found
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              You haven't placed any food orders yet.
            </p>
          </div>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-colors"
          >
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Recent";

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                      {order.restaurant?.name || "Restaurant"}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus || "Processing"}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Order <span className="font-mono text-gray-700">#{order._id.substring(order._id.length - 8)}</span> • Placed on {dateStr}
                  </p>

                  <div className="text-xs text-gray-600 flex flex-wrap gap-1">
                    {(order.orderItems || []).map((item, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100"
                      >
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <span className="text-lg font-extrabold text-gray-900">
                    ₹{order.finalTotal || order.totalPrice || 0}
                  </span>
                  <Link
                    to={`/eats/orders/${order._id}`}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors shadow-sm"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListOrders;