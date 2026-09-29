import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { analyzeReviews } from "../redux/actions/restaurantAction";
import { toast } from "react-toastify";

const Restaurant = ({ restaurant }) => {
  const [showAI, setShowAI] = useState(false);
  const [generating, setGenerating] = useState(false);
  const dispatch = useDispatch();

  const handleGenerate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setGenerating(true);
    try {
      await dispatch(analyzeReviews(restaurant._id)).unwrap();
      toast.success("✨ AI Insights generated!");
      setShowAI(true);
    } catch (err) {
      toast.error(err || "Failed to generate AI insights");
    } finally {
      setGenerating(false);
    }
  };

  const imageUrl =
    restaurant.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Restaurant Image */}
      <Link
        to={`/eats/stores/${restaurant._id}/menus`}
        className="relative block aspect-[16/10] overflow-hidden bg-gray-100"
      >
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={imageUrl}
          alt={restaurant.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80";
          }}
        />
        {restaurant.isVeg && (
          <span className="absolute top-3 left-3 bg-emerald-600/95 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span>Pure Veg</span>
          </span>
        )}
      </Link>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              to={`/eats/stores/${restaurant._id}/menus`}
              className="text-lg font-bold text-gray-900 hover:text-emerald-600 transition-colors line-clamp-1"
            >
              {restaurant.name}
            </Link>

            {/* Rating Pill */}
            <div className="flex items-center space-x-1 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0">
              <span>{Number(restaurant.ratings || 0).toFixed(1)}</span>
              <svg
                className="w-3 h-3 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
            {restaurant.cuisine || restaurant.address}
          </p>

          <div className="mt-2 text-xs text-gray-400">
            {restaurant.numOfReviews || 0} reviews
          </div>
        </div>

        {/* AI Review Summary Accordion / Generate Button */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          {restaurant.reviewSentiment ? (
            <>
              <button
                onClick={() => setShowAI(!showAI)}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 focus:outline-none"
              >
                <svg
                  className="w-3.5 h-3.5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>{showAI ? "Hide AI Insights" : "AI Review Summary"}</span>
              </button>

              {showAI && (
                <div className="mt-2 p-2.5 bg-emerald-50/50 rounded-xl text-xs space-y-2 border border-emerald-100">
                  <div className="flex items-center justify-between font-semibold text-emerald-900">
                    <span>Sentiment:</span>
                    <span className="capitalize">{restaurant.reviewSentiment}</span>
                  </div>

                  {restaurant.reviewSummaryBullets &&
                    restaurant.reviewSummaryBullets.length > 0 && (
                      <ul className="space-y-1 text-gray-700 list-disc list-inside">
                        {restaurant.reviewSummaryBullets.map((bullet, idx) => (
                          <li key={idx} className="line-clamp-2">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}

                  {restaurant.reviewTopMentions &&
                    restaurant.reviewTopMentions.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {restaurant.reviewTopMentions.map((mention, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-medium border border-emerald-200"
                          >
                            #{mention}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`text-xs font-medium flex items-center space-x-1 focus:outline-none ${generating ? "text-gray-400 cursor-not-allowed" : "text-emerald-600 hover:text-emerald-700"
                }`}
            >
              <svg
                className={`w-3.5 h-3.5 ${generating ? "animate-spin text-gray-400" : "text-emerald-500"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {generating ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                )}
              </svg>
              <span>{generating ? "Generating..." : "Generate AI Review"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;