import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const OrderSuccess = () => {
  const location = useLocation();
  const { order: stateOrder } = useSelector((state) => state.order);

  const placedOrder = location.state?.order || stateOrder;

  return (
    <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
      {/* Success Animation Icon */}
      <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Payment Successful! 🎉
        </h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Your payment was verified and your order has been placed with the restaurant. It will arrive hot and fresh shortly!
        </p>
      </div>

      {placedOrder && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-2 max-w-sm mx-auto">
          <div className="flex justify-between text-gray-600">
            <span>Order ID:</span>
            <span className="font-mono font-bold text-gray-900 truncate max-w-[150px]">
              #{placedOrder._id}
            </span>
          </div>
          {placedOrder.paymentInfo?.id && (
            <div className="flex justify-between text-gray-600">
              <span>Razorpay Payment ID:</span>
              <span className="font-mono font-semibold text-emerald-700 truncate max-w-[150px]">
                {placedOrder.paymentInfo.id}
              </span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Amount Paid:</span>
            <span className="font-bold text-gray-900">
              ₹{placedOrder.finalTotal}
            </span>
          </div>
        </div>
      )}

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/eats/orders/me/myOrders"
          className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-sm transition-colors"
        >
          View My Orders
        </Link>
        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-2xl transition-colors"
        >
          Discover More Food
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;