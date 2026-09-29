import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../../redux/actions/userActions";
import { toast } from "react-toastify";
import Search from "./Search";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, loading } = useSelector((state) => state.user);
  const { cartItems } = useSelector((state) => state.cart);

  const totalCartCount = (cartItems || []).reduce(
    (acc, item) => acc + (item.quantity || 1),
    0
  );

  const logoutHandler = () => {
    dispatch(logout());
    setDropdownOpen(false);
    toast.success("Logged out successfully");
    navigate("/");
  };

  const isRestaurant = user?.role === "restaurant" || user?.role === "restaurant-owner";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Brand Logo */}
          <Link to={isRestaurant ? "/restaurant/dashboard" : "/"} className="flex items-center space-x-2.5 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-sm font-bold text-lg group-hover:bg-emerald-700 transition-colors">
              Big
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Bite
            </span>
          </Link>

          {/* Centered Search Bar on Desktop (Hidden for restaurants) */}
          {!isRestaurant && (
            <div className="hidden md:flex flex-1 max-w-lg mx-auto">
              <Search />
            </div>
          )}

          {/* Right Action Icons & Auth */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {!isRestaurant && (
              <>
                {/* Reels Discovery Feed */}
                <Link
                  to="/reels"
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-gray-700 hover:text-emerald-600 rounded-xl hover:bg-emerald-50/70 transition-all font-semibold text-xs border border-gray-200/80 hover:border-emerald-300 shadow-sm"
                  title="Discover Food with Reels"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Reels</span>
                </Link>

                {/* Favorites / Saved Foods */}
                <Link
                  to="/saved"
                  className="flex items-center space-x-1 p-2 text-gray-600 hover:text-emerald-600 rounded-xl hover:bg-gray-50 transition-colors"
                  title="Favorites & Saved Dishes"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span className="hidden lg:inline text-xs font-medium">Favorites</span>
                </Link>

                {/* Cart Link */}
                <Link
                  to="/cart"
                  className="flex items-center space-x-1.5 px-2.5 py-2 text-gray-700 hover:text-emerald-600 rounded-xl hover:bg-gray-50 transition-colors relative"
                >
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {totalCartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center shadow-sm">
                        {totalCartCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium text-xs sm:text-sm">Cart</span>
                </Link>
              </>
            )}

            {/* User Dropdown / Auth Buttons */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-50 focus:outline-none transition-colors border border-transparent hover:border-gray-200"
                >
                  <img
                    src={user?.avatar?.url || "/images/default_avatar.jpg"}
                    alt={user?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/20"
                  />
                  <span className="hidden sm:inline text-xs font-semibold text-gray-800 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {(user?.role === "restaurant" ||
                      user?.role === "restaurant-owner" ||
                      user?.role === "admin") && (
                      <Link
                        to="/restaurant/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-2.5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        Restaurant Dashboard
                      </Link>
                    )}

                    {!isRestaurant && (
                      <>
                        <Link
                          to="/eats/orders/me/myOrders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          My Orders
                        </Link>

                        <Link
                          to="/saved"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2.5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          Favorites
                        </Link>
                      </>
                    )}

                    <Link
                      to="/users/me/update"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Manage Address
                    </Link>

                    <Link
                      to="/users/me"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2.5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Profile Settings
                    </Link>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={logoutHandler}
                      className="w-full text-left flex items-center px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-2.5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/users/login"
                    className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/users/signup"
                    className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm hover:shadow transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <Search />
        </div>
      </div>
    </header>
  );
};

export default Header;