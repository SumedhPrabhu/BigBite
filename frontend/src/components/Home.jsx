import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  sortByRatings,
  sortByReviews,
  toggleVegOnly,
} from "../redux/slices/restaurantSlice";
import { getRestaurants } from "../redux/actions/restaurantAction";
import Restaurant from "./Restaurant";
import Loader from "./layout/Loader";
import CountRestaurant from "./CountRestaurant";

const Home = () => {
  const dispatch = useDispatch();
  const { keyword } = useParams();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.user);

  const {
    loading: restaurantsLoading,
    error: restaurantsError,
    restaurants,
    showVegOnly,
  } = useSelector((state) => state.restaurants);

  useEffect(() => {
    if (user?.role === "restaurant") {
      navigate("/restaurant/dashboard");
      return;
    }
    dispatch(getRestaurants(keyword));
  }, [dispatch, keyword, user, navigate]);

  const handleSortByRatings = () => {
    dispatch(sortByRatings());
  };

  const handleSortByReviews = () => {
    dispatch(sortByReviews());
  };

  const handleToggleVegOnly = () => {
    dispatch(toggleVegOnly());
  };

  return (
    <div className="space-y-6">
      {/* Discovery Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-10 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider">
            Fast & Fresh Discovery
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Craving something delicious?
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base">
            Explore hand-picked top restaurants and delicious dishes near you.
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center space-x-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
            🍔
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
            🍕
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
            🍜
          </div>
        </div>
      </div>

      {/* Filter and Sorting Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Veg Only Toggle */}
          <button
            onClick={handleToggleVegOnly}
            className={`inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all ${
              showVegOnly
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                showVegOnly ? "bg-white" : "bg-emerald-600"
              }`}
            ></span>
            Pure Veg
          </button>

          {/* Sort By Rating */}
          <button
            onClick={handleSortByRatings}
            className="inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-current"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Sort by Rating
          </button>

          {/* Sort By Reviews */}
          <button
            onClick={handleSortByReviews}
            className="inline-flex items-center px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            Sort by Reviews
          </button>
        </div>
      </div>

      <CountRestaurant />

      {/* Main Grid */}
      {restaurantsLoading ? (
        <Loader />
      ) : restaurantsError ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-center">
          <p className="font-semibold">{restaurantsError}</p>
        </div>
      ) : (
        <div>
          {restaurants && restaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {restaurants.map((restaurant) =>
                !showVegOnly || restaurant.isVeg ? (
                  <Restaurant key={restaurant._id} restaurant={restaurant} />
                ) : null
              )}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="w-16 h-16 mx-auto bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center text-2xl mb-4">
                🔍
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No restaurants found
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Try searching with another keyword or removing active filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
