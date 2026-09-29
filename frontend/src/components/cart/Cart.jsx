import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCartItems,
  removeItemFromCart,
  updateCartQuantity,
} from "../../redux/actions/cartActions";
import { checkoutWithRazorpay } from "../../redux/actions/orderActions";
import { toast } from "react-toastify";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems, restaurant, loading: cartLoading } = useSelector(
    (state) => state.cart
  );
  const { user } = useSelector((state) => state.user);
  const { loading: orderLoading } = useSelector((state) => state.order);

  const [address, setAddress] = useState(
    user?.deliveryInfo?.address || "123 Food Street"
  );
  const [city, setCity] = useState(user?.deliveryInfo?.city || "New Delhi");
  const [postalCode, setPostalCode] = useState(
    user?.deliveryInfo?.postalCode || "110001"
  );
  const [phoneNo, setPhoneNo] = useState(user?.phoneNumber || "9876543210");
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    dispatch(fetchCartItems());
  }, [dispatch]);

  const removeCartItemHandler = (id) => {
    dispatch(removeItemFromCart(id));
    toast.success("Item removed from cart");
  };

  const increaseQty = (id, quantity, stock) => {
    const newQty = quantity + 1;
    if (newQty > (stock || 99)) {
      toast.warning("Exceeded stock limit");
      return;
    }
    dispatch(updateCartQuantity(id, newQty));
  };

  const decreaseQty = (id, quantity) => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      dispatch(updateCartQuantity(id, newQty));
    } else {
      dispatch(removeItemFromCart(id));
      toast.info("Item removed from cart");
    }
  };

  const handleProceedToRazorpay = () => {
    if (!user) {
      toast.info("Please log in to complete checkout");
      return navigate("/users/login");
    }
    if (!cartItems || cartItems.length === 0) {
      toast.warning("Your cart is empty");
      return;
    }

    const deliveryInfo = {
      address,
      city,
      postalCode,
      phoneNo,
      country: "IN",
    };

    dispatch(
      checkoutWithRazorpay(
        cartItems,
        restaurant,
        user,
        deliveryInfo,
        navigate
      )
    );
  };

  const itemsTotal = (cartItems || []).reduce(
    (acc, item) =>
      acc +
      (item.quantity || 1) *
        (item.foodItem ? item.foodItem.price || 0 : item.price || 0),
    0
  );

  const deliveryFee = itemsTotal > 0 ? (itemsTotal > 500 ? 0 : 40) : 0;
  const tax = itemsTotal > 0 ? Math.round(itemsTotal * 0.05) : 0;
  const finalTotal = itemsTotal + deliveryFee + tax;

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Your Cart
          </h1>
          {restaurant && restaurant.name && (
            <p className="text-sm text-gray-500 mt-0.5">
              Ordering from{" "}
              <span className="font-semibold text-emerald-700">
                {restaurant.name}
              </span>
            </p>
          )}
        </div>
        <Link
          to="/"
          className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          ← Continue Browsing
        </Link>
      </div>

      {!cartItems || cartItems.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
          <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl shadow-sm">
            🛒
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              Your cart is empty
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Looks like you haven't added anything to your cart yet. Explore our delicious menus!
            </p>
          </div>
          <div>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
            >
              Explore Restaurants
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Item
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Quantity & Total
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {cartItems.map((item) => {
                  const food = item.foodItem || {};
                  const itemPrice = food.price || item.price || 0;
                  const itemImage =
                    (food.images && food.images[0]?.url) ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80";

                  return (
                    <div
                      key={item._id || food._id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={itemImage}
                          alt={food.name || "Food Item"}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-gray-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80";
                          }}
                        />
                        <div>
                          <div className="flex items-start gap-2">
                            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                              {food.name || "Delicious Item"}
                            </h3>
                            {/* Spice Badge */}
                            {food.spiceLevel && food.spiceLevel !== "No Spice" && (
                              <div className="flex items-center space-x-0.5 bg-red-50/80 px-1.5 py-0.5 rounded-full shrink-0 border border-red-100 shadow-sm mt-0.5" title={food.spiceLevel}>
                                {food.spiceLevel === "Mild" && <span className="text-[9px]">🌶️</span>}
                                {food.spiceLevel === "Medium" && <span className="text-[9px]">🌶️🌶️</span>}
                                {food.spiceLevel === "Spicy" && <span className="text-[9px]">🌶️🌶️🌶️</span>}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            ₹{itemPrice} each
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end sm:space-x-6">
                        {/* Quantity Selector */}
                        <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
                          <button
                            onClick={() => decreaseQty(food._id, item.quantity)}
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-sm shadow-sm transition-colors"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              increaseQty(food._id, item.quantity, food.stock)
                            }
                            className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 font-bold text-sm shadow-sm transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Total for this item */}
                        <div className="text-right min-w-[70px]">
                          <p className="text-base font-extrabold text-gray-900">
                            ₹{itemPrice * item.quantity}
                          </p>
                        </div>

                        {/* Delete item */}
                        <button
                          onClick={() => removeCartItemHandler(food._id)}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-600 font-bold text-base">📍</span>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Delivery Address
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  {showAddressForm ? "Done" : "Edit Address"}
                </button>
              </div>

              {!showAddressForm ? (
                <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100 leading-relaxed">
                  {address}, {city} - {postalCode} • 📞 {phoneNo}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Flat / House / Street"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="6-digit PIN"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNo}
                      onChange={(e) => setPhoneNo(e.target.value)}
                      className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="Mobile number"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Checkout Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">
              Bill Details
            </h2>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Item Total</span>
                <span className="font-semibold text-gray-900">₹{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-gray-900">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes & Charges (5%)</span>
                <span className="font-semibold text-gray-900">₹{tax}</span>
              </div>

              {deliveryFee === 0 && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  🎉 Free delivery applied on orders above ₹500!
                </p>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-base">
                <span className="font-extrabold text-gray-900">To Pay</span>
                <span className="font-extrabold text-emerald-600 text-xl">
                  ₹{finalTotal}
                </span>
              </div>
            </div>

            <button
              onClick={handleProceedToRazorpay}
              disabled={orderLoading || cartLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2"
            >
              {orderLoading ? (
                <span>Opening Razorpay...</span>
              ) : (
                <>
                  <span>Pay with Razorpay (₹{finalTotal})</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </>
              )}
            </button>

            <div className="flex items-center justify-center space-x-2 pt-1 text-gray-400 text-xs">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>100% Secure Checkout via Razorpay</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;