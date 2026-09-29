import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../layout/Loader";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../redux/actions/userActions";
import { clearErrors } from "../../redux/slices/userSlice";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isSubmitting = useRef(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (isAuthenticated) {
      if (isSubmitting.current) {
        toast.success("Welcome back to Snackr! 🎉");
        isSubmitting.current = false;
      }
      navigate("/");
    }

    if (error) {
      toast.error(error);
      dispatch(clearErrors());
      isSubmitting.current = false;
    }
  }, [dispatch, isAuthenticated, error, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please fill in both email and password");
      return;
    }
    isSubmitting.current = true;
    dispatch(login(email, password));
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <Loader />
      ) : (
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
              BB
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Sign in to BigBite
            </h2>
            <p className="text-xs text-gray-500">
              Discover top restaurants and order your favorite meals
            </p>
          </div>

          <form className="space-y-4" onSubmit={submitHandler}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-gray-700"
                >
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/users/signup"
                className="font-bold text-emerald-600 hover:text-emerald-700"
              >
                Sign up for BigBite
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
