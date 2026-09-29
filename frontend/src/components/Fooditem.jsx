import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  addItemToCart,
  updateCartQuantity,
  removeItemFromCart,
} from "../redux/actions/cartActions";
import api from "../utils/api";
import { toast } from "react-toastify";

const Fooditem = ({ fooditem, restaurant }) => {
  const [quantity, setQuantity] = useState(1);
  const [showButtons, setShowButtons] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);
  const isAuthenticated = !!user;
  const { cartItems } = useSelector((state) => state.cart);

  useEffect(() => {
    const cartItem = (cartItems || []).find(
      (item) => item.foodItem && item.foodItem._id === fooditem._id
    );

    if (cartItem) {
      setQuantity(cartItem.quantity);
      setShowButtons(true);
    } else {
      setQuantity(1);
      setShowButtons(false);
    }
  }, [cartItems, fooditem]);

  // Check if saved
  useEffect(() => {
    if (user && user.savedFoods && Array.isArray(user.savedFoods)) {
      setIsSaved(user.savedFoods.some((id) => (id._id || id) === fooditem._id));
    }
  }, [user, fooditem]);

  const decreaseQty = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      dispatch(updateCartQuantity(fooditem._id, newQuantity));
    } else {
      setQuantity(0);
      setShowButtons(false);
      dispatch(removeItemFromCart(fooditem._id));
    }
  };

  const increaseQty = () => {
    if (quantity < (fooditem.stock || 99)) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      dispatch(updateCartQuantity(fooditem._id, newQuantity));
    } else {
      toast.warning("Reached maximum stock limit");
    }
  };

  const addToCartHandler = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to add items to your cart");
      return navigate("/users/login");
    }

    dispatch(addItemToCart(fooditem._id, restaurant, quantity));
    setShowButtons(true);
    toast.success(`${fooditem.name} added to cart!`);
  };

  const toggleSaveFood = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to save foods");
      return navigate("/users/login");
    }

    try {
      if (isSaved) {
        await api.delete(`/api/v1/users/me/saved/${fooditem._id}`, {
          withCredentials: true,
        });
        setIsSaved(false);
        toast.info("Removed from saved foods");
      } else {
        await api.post(
          `/api/v1/users/me/saved/${fooditem._id}`,
          {},
          { withCredentials: true }
        );
        setIsSaved(true);
        toast.success("Saved to your favorites!");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update saved foods");
    }
  };

  const imageUrl =
    fooditem.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Food Image Container */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={fooditem.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";
            }}
          />

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-1 rounded shadow-sm">
            <div
              className={`w-3.5 h-3.5 border flex items-center justify-center ${
                fooditem.isVeg !== false
                  ? "border-emerald-600"
                  : "border-red-600"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  fooditem.isVeg !== false ? "bg-emerald-600" : "bg-red-600"
                }`}
              ></div>
            </div>
          </div>

          {/* Favorite Button */}
          <button
            onClick={toggleSaveFood}
            className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
            title={isSaved ? "Remove from saved" : "Save food"}
          >
            <svg
              className={`w-4 h-4 ${
                isSaved ? "fill-red-500 text-red-500" : "fill-none stroke-current"
              }`}
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* Stock badge */}
          {fooditem.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-bold text-gray-900 text-[17px] leading-tight line-clamp-2" title={fooditem.name}>
              {fooditem.name}
            </h4>
            
            {/* Spice Badge */}
            {fooditem.spiceLevel && fooditem.spiceLevel !== "No Spice" && (
              <div className="flex items-center space-x-0.5 bg-red-50/80 px-2 py-1 rounded-full shrink-0 border border-red-100 shadow-sm" title={fooditem.spiceLevel}>
                {fooditem.spiceLevel === "Mild" && <span className="text-[10px]">🌶️</span>}
                {fooditem.spiceLevel === "Medium" && <span className="text-[10px]">🌶️🌶️</span>}
                {fooditem.spiceLevel === "Spicy" && <span className="text-[10px]">🌶️🌶️🌶️</span>}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {fooditem.description || "Freshly prepared with quality ingredients."}
          </p>
        </div>
      </div>

      {/* Bottom Bar: Price & Action */}
      <div className="p-4 pt-0 flex items-center justify-between mt-auto">
        <div>
          <span className="text-xs text-gray-400 font-medium">Price</span>
          <p className="text-base font-extrabold text-gray-900">
            ₹{fooditem.price}
          </p>
        </div>

        <div>
          {!showButtons ? (
            <button
              disabled={fooditem.stock === 0}
              onClick={addToCartHandler}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
            >
              Add +
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-0.5">
              <button
                onClick={decreaseQty}
                className="w-6 h-6 rounded flex items-center justify-center bg-white text-emerald-700 hover:bg-emerald-100 font-bold text-xs shadow-sm transition-colors"
              >
                −
              </button>
              <span className="w-5 text-center text-xs font-bold text-emerald-900">
                {quantity}
              </span>
              <button
                onClick={increaseQty}
                className="w-6 h-6 rounded flex items-center justify-center bg-white text-emerald-700 hover:bg-emerald-100 font-bold text-xs shadow-sm transition-colors"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fooditem;