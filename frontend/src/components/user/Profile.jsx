import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../layout/Loader";

const Profile = () => {
  const { user, loading } = useSelector((state) => state.user);

  const isRestaurantPartner =
    user?.role === "restaurant" ||
    user?.role === "restaurant-owner" ||
    user?.role === "admin";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {loading || !user ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-100">
            <img
              src={user.avatar?.url || "/images/default_avatar.jpg"}
              alt={user.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-500/10 shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/images/default_avatar.jpg";
              }}
            />
            <div className="text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start space-x-2 flex-wrap gap-1">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {user.name}
                </h1>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                    isRestaurantPartner
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {user.role === "restaurant" ? "Restaurant Partner" : user.role || "Foodie"}
                </span>
                {user.emailVerified ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    ⚠ Unverified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400">
                Joined{" "}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })
                  : "Recently"}
              </p>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              <p className="font-semibold text-gray-900">
                {user.phoneNumber || "Not provided"}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                Account Status
              </span>
              <p className="font-semibold text-emerald-600 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                Active Member
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 sm:col-span-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center justify-between">
                Delivery Address
                <Link to="/users/me/update" className="text-emerald-600 hover:text-emerald-700 capitalize font-medium">Edit</Link>
              </span>
              <p className="font-semibold text-gray-900">
                {user.deliveryInfo?.address ? (
                  <>
                    {user.deliveryInfo.address}, {user.deliveryInfo.city}<br />
                    {user.deliveryInfo.postalCode}, {user.deliveryInfo.country}
                  </>
                ) : (
                  <span className="text-gray-400 font-normal italic">No delivery address saved. Place an order to save your address.</span>
                )}
              </p>
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/users/me/update"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-center text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              Edit Profile
            </Link>

            <Link
              to="/eats/orders/me/myOrders"
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center text-sm font-semibold rounded-xl transition-colors"
            >
              My Orders
            </Link>

            <Link
              to="/saved"
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center text-sm font-semibold rounded-xl transition-colors"
            >
              Saved Foods
            </Link>

            {isRestaurantPartner && (
              <Link
                to="/restaurant/dashboard"
                className="flex-1 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center text-sm font-bold rounded-xl transition-colors"
              >
                Partner Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
