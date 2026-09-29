import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import api from "../../utils/api";
import { toast } from "react-toastify";
import Loader from "../layout/Loader";
import { addItemToCart } from "../../redux/actions/cartActions";

const SavedFoods = () => {
  const [savedFoods, setSavedFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) {
      navigate("/users/login");
      return;
    }

    const fetchSaved = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/api/v1/users/me/saved", {
          withCredentials: true,
        });
        if (data && data.savedFoods) {
          setSavedFoods(data.savedFoods);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load saved foods");
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [user, navigate]);

  const removeSaved = async (foodId) => {
    try {
      await api.delete(`/api/v1/users/me/saved/${foodId}`, {
        withCredentials: true,
      });
      setSavedFoods((prev) => prev.filter((item) => item._id !== foodId));
      toast.info("Removed from saved foods");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove food item");
    }
  };

  const handleAddToCart = (foodItem) => {
    // foodItem may have restaurant ID or reference
    const restaurantId = foodItem.restaurant || foodItem.storeId || "";
    dispatch(addItemToCart(foodItem._id, restaurantId, 1));
    toast.success(`${foodItem.name} added to cart!`);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Saved Foods & Favorites
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Quickly reorder and view your bookmarked dishes
          </p>
        </div>
        <Link
          to="/"
          className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          ← Discover More
        </Link>
      </div>

      {loading ? (
        <Loader />
      ) : savedFoods.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-sm">
            ❤️
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">
              No saved foods yet
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Tap the heart icon on any dish while browsing restaurant menus to save your favorites here.
            </p>
          </div>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            Explore Food
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedFoods.map((item) => {
            const imageUrl =
              item.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Veg/Non-Veg */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-1 rounded shadow-sm">
                      <div
                        className={`w-3.5 h-3.5 border flex items-center justify-center ${
                          item.isVeg !== false
                            ? "border-emerald-600"
                            : "border-red-600"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.isVeg !== false
                              ? "bg-emerald-600"
                              : "bg-red-600"
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Remove Saved Button */}
                    <button
                      onClick={() => removeSaved(item._id)}
                      className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white text-red-500 hover:text-red-600 transition-colors focus:outline-none"
                      title="Remove from favorites"
                    >
                      <svg
                        className="w-4 h-4 fill-current"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {item.description || "Delicious freshly prepared meal."}
                    </p>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between mt-auto">
                  <span className="text-base font-extrabold text-gray-900">
                    ₹{item.price}
                  </span>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Add to Cart +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedFoods;
