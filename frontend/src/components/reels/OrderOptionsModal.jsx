import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addItemToCart } from "../../redux/actions/cartActions";
import { toast } from "react-toastify";
import api from "../../utils/api";

const OrderOptionsModal = ({ isOpen, onClose, reel }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [optionsData, setOptionsData] = useState(null);
  const [addedItemMap, setAddedItemMap] = useState({});

  useEffect(() => {
    if (isOpen && reel?._id) {
      fetchOrderOptions();
    } else {
      setOptionsData(null);
      setAddedItemMap({});
    }
  }, [isOpen, reel?._id]);

  const fetchOrderOptions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/v1/reels/${reel._id}/order-options`);
      setOptionsData(data);
    } catch (err) {
      console.error("Error fetching order options:", err);
      toast.error("Could not load restaurants for this dish");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (foodItem, restaurant) => {
    if (!user) {
      toast.info("Please log in to add items to your cart");
      navigate("/users/login");
      return;
    }

    try {
      const foodItemId = foodItem._id || foodItem.id;
      const restaurantId = restaurant._id || restaurant.id;

      dispatch(addItemToCart(foodItemId, restaurantId, 1));
      setAddedItemMap((prev) => ({ ...prev, [foodItemId]: true }));
      toast.success(`Added ${foodItem.name} from ${restaurant.name}!`);

      // Track order click signal
      try {
        await api.post(`/api/v1/reels/${reel._id}/interaction`, {
          orderClicked: true,
        });
      } catch (e) {}
    } catch (err) {
      toast.error("Failed to add item to cart");
    }
  };

  if (!isOpen) return null;

  const featured = optionsData?.featured;
  const alternatives = optionsData?.alternatives || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/30">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Order Discovery
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {reel?.category} • {reel?.cuisine}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-1">
              {reel?.dishName || "Select Restaurant"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-500">
                Finding restaurants serving {reel?.dishName}...
              </p>
            </div>
          ) : (
            <>
              {/* RESULT #1: GUARANTEED FEATURED RESTAURANT */}
              {featured ? (
                <div className="relative p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 shadow-md">
                  {/* Featured Badge */}
                  <div className="absolute -top-3.5 left-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center space-x-1.5 uppercase tracking-wide">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Featured in this Reel (Result #1)</span>
                  </div>

                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-bold text-gray-900">
                          {featured.restaurant?.name}
                        </h4>
                        <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-semibold">
                          <span>★ {featured.restaurant?.ratings || "4.5"}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {featured.restaurant?.address || "Available for instant delivery"}
                      </p>

                      <div className="pt-2 flex items-center space-x-2">
                        {featured.foodItem?.isVeg ? (
                          <span className="w-3.5 h-3.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-sm border border-rose-600 flex items-center justify-center p-0.5">
                            <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                          </span>
                        )}
                        <span className="font-medium text-gray-800 text-sm">
                          {featured.foodItem?.name}
                        </span>
                        <span className="font-bold text-emerald-700 text-base">
                          ₹{featured.foodItem?.price}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCart(featured.foodItem, featured.restaurant)}
                      className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 flex-shrink-0 ${
                        addedItemMap[featured.foodItem?._id]
                          ? "bg-emerald-800 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                      }`}
                    >
                      {addedItemMap[featured.foodItem?._id] ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Added to Cart</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          <span>Order Featured Dish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-sm text-gray-600">
                  Featured restaurant temporarily unavailable. Explore nearby alternatives below:
                </div>
              )}

              {/* ALTERNATIVE RESTAURANTS SERVING THIS DISH */}
              {alternatives.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Also Available At Other Restaurants ({alternatives.length})
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {alternatives.map((alt, idx) => (
                      <div
                        key={alt.restaurant?._id || idx}
                        className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-semibold text-gray-900 text-sm">
                              {alt.restaurant?.name}
                            </h5>
                            <span className="text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                              ★ {alt.restaurant?.ratings || "4.2"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>{alt.foodItem?.name}</span>
                            <span>•</span>
                            <span className="font-bold text-gray-900">₹{alt.foodItem?.price}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddToCart(alt.foodItem, alt.restaurant)}
                          className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 flex-shrink-0 ${
                            addedItemMap[alt.foodItem?._id]
                              ? "bg-gray-800 text-white"
                              : "bg-gray-900 hover:bg-emerald-600 text-white active:scale-95"
                          }`}
                        >
                          {addedItemMap[alt.foodItem?._id] ? (
                            <span>✓ In Cart</span>
                          ) : (
                            <span>+ Add to Cart</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-2"
          >
            ← Back to Reels
          </button>

          <button
            onClick={() => {
              onClose();
              navigate("/cart");
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-2 active:scale-95"
          >
            <span>Proceed to Cart & Checkout</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderOptionsModal;
