import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-base">
                Big
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Bite
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm">
              Discover amazing restaurants, explore rich menus, and order your favorite meals seamlessly with Snackr.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 tracking-wider uppercase mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link to="/" className="hover:text-emerald-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/saved" className="hover:text-emerald-600 transition-colors">
                  Saved Foods
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-emerald-600 transition-colors">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-900 tracking-wider uppercase mb-3">
              For Partners
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link
                  to="/restaurant/dashboard"
                  className="hover:text-emerald-600 transition-colors"
                >
                  Partner Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/users/signup"
                  className="hover:text-emerald-600 transition-colors"
                >
                  Register Restaurant
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} BigBite. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Crafted with ❤️ for food lovers</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
