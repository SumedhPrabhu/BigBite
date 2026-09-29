import React from "react";
import { useSelector } from "react-redux";

const CountRestaurant = () => {
  const { count, pureVegRestaurantsCount, showVegOnly, loading, error } =
    useSelector((state) => state.restaurants);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return null;
  }

  const displayCount = showVegOnly ? pureVegRestaurantsCount : count;

  return (
    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
      <p className="text-sm font-medium text-gray-600">
        <span className="font-semibold text-gray-900">{displayCount || 0}</span>{" "}
        {displayCount === 1 ? "restaurant available" : "restaurants available"}
        {showVegOnly && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Pure Veg Only
          </span>
        )}
      </p>
    </div>
  );
};

export default CountRestaurant;
