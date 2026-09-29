import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { getMenus } from "../redux/actions/menuActions";
import { getRestaurants, analyzeReviews } from "../redux/actions/restaurantAction";
import Fooditem from "./Fooditem";
import Loader from "./layout/Loader";
import api from "../utils/api";
import { toast } from "react-toastify";

const Menu = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const { menus, loading, error } = useSelector((state) => state.menus);
  const { restaurants } = useSelector((state) => state.restaurants);
  const { user } = useSelector((state) => state.user);

  const [restaurantData, setRestaurantData] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);

  useEffect(() => {
    dispatch(getMenus(id));
    dispatch(getRestaurants());

    // Fetch store details directly
    const fetchStore = async () => {
      try {
        const { data } = await api.get(`/api/v1/eats/stores/${id}`);
        if (data && data.data) {
          setRestaurantData(data.data);
        }
      } catch (err) {
        console.error("Failed to load restaurant details", err);
      }
    };
    fetchStore();
  }, [dispatch, id]);

  const currentRestaurant =
    restaurantData ||
    (restaurants && restaurants.find((r) => r._id === id));

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please log in to submit a review");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(
        `/api/v1/eats/stores/${id}/reviews`,
        {
          rating: Number(reviewRating),
          comment: reviewComment,
        },
        { withCredentials: true }
      );

      toast.success("Review submitted successfully!");
      setShowReviewModal(false);
      setReviewComment("");

      // Refresh restaurant data
      const { data } = await api.get(`/api/v1/eats/stores/${id}`);
      if (data && data.data) {
        setRestaurantData(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleGenerateInsights = async () => {
    setAnalyzingInsights(true);
    try {
      const res = await dispatch(analyzeReviews(id)).unwrap();
      toast.success("✨ AI Insights generated!");
      
      // Update local state directly so it reflects immediately
      if (res && res.aiData) {
        setRestaurantData((prev) => ({
          ...prev,
          reviewSentiment: res.aiData.sentiment,
          reviewSummaryBullets: res.aiData.summaryBullets,
          reviewTopMentions: res.aiData.topMentions,
        }));
      }
    } catch (err) {
      toast.error(err || "Failed to generate AI insights");
    } finally {
      setAnalyzingInsights(false);
    }
  };

  const filteredMenus =
    activeCategory === "all"
      ? menus
      : (menus || []).filter(
          (m) => m.category.toLowerCase() === activeCategory.toLowerCase()
        );

  return (
    <div className="space-y-8 pb-12">
      {/* Restaurant Header Banner */}
      {currentRestaurant ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {currentRestaurant.name}
                </h1>
                {currentRestaurant.isVeg && (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Pure Veg
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-500">
                {currentRestaurant.cuisine || "Multi-Cuisine"} •{" "}
                {currentRestaurant.address}
              </p>

              {/* Ratings and Stats */}
              <div className="flex items-center space-x-4 pt-1">
                <div className="flex items-center space-x-1.5 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  <span>
                    {Number(currentRestaurant.ratings || 0).toFixed(1)}
                  </span>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500">
                  {currentRestaurant.numOfReviews || 0} reviews
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-emerald-600 font-medium">
                  30-40 mins delivery
                </span>
              </div>
            </div>

            {/* Review CTA */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200 shadow-sm"
              >
                Write a Review
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Category Pills Navigation */}
      {menus && menus.length > 0 && (
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md py-3 border-b border-gray-100 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar max-w-7xl mx-auto">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === "all"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Items
            </button>
            {menus.map((m) => (
              <button
                key={m._id}
                onClick={() => setActiveCategory(m.category)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory.toLowerCase() === m.category.toLowerCase()
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {m.category} ({m.items ? m.items.length : 0})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Categories and Items */}
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-center">
          <p className="font-semibold">{error}</p>
        </div>
      ) : filteredMenus && filteredMenus.length > 0 ? (
        <div className="space-y-10">
          {filteredMenus.map((menu) => (
            <div key={menu._id} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {menu.category}
                </h2>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {menu.items ? menu.items.length : 0} items
                </span>
              </div>

              {menu.items && menu.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {menu.items.map((fooditem) => (
                    <Fooditem
                      key={fooditem._id}
                      fooditem={fooditem}
                      restaurant={id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic py-4">
                  No items listed in this category yet.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-base font-semibold text-gray-700">
            No menu items available for this restaurant.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            ← Back to restaurants
          </Link>
        </div>
      )}

      {/* Reviews Section (AI Insights) */}
      {currentRestaurant && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6 mt-12">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">AI Review Insights</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerateInsights}
                disabled={analyzingInsights}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  analyzingInsights
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {analyzingInsights ? "Generating..." : "Refresh Insights"}
              </button>
              <button
                onClick={() => setShowReviewModal(true)}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                + Add Review
              </button>
            </div>
          </div>

          {currentRestaurant.reviewSentiment ? (
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
              <div className="flex items-center space-x-2 font-semibold text-emerald-900">
                <span className="text-lg">Overall Sentiment:</span>
                <span className="capitalize text-lg px-3 py-1 bg-white rounded-lg shadow-sm border border-emerald-100">{currentRestaurant.reviewSentiment}</span>
              </div>

              {currentRestaurant.reviewSummaryBullets && currentRestaurant.reviewSummaryBullets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-900">Key Highlights</h4>
                  <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                    {currentRestaurant.reviewSummaryBullets.map((bullet, idx) => (
                      <li key={idx} className="leading-relaxed">{bullet}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentRestaurant.reviewTopMentions && currentRestaurant.reviewTopMentions.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">Top Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentRestaurant.reviewTopMentions.map((mention, idx) => (
                      <span
                        key={idx}
                        className="bg-white text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 shadow-sm"
                      >
                        #{mention}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-500">
                AI insights haven't been generated for this restaurant yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Review {currentRestaurant?.name}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rating
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="5">5 ★ — Excellent</option>
                  <option value="4">4 ★ — Very Good</option>
                  <option value="3">3 ★ — Good</option>
                  <option value="2">2 ★ — Fair</option>
                  <option value="1">1 ★ — Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Review
                </label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell others what you loved about the food and service..."
                  className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-gray-400"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;