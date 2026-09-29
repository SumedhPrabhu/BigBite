import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, clearErrors } from "../../redux/slices/userSlice";
import { toast } from "react-toastify";
import Loader from "../layout/Loader";
import api from "../../utils/api";

const MAX_AVATAR_MB = 2;

const Register = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phoneNumber: "",
    role: "user",
  });

  // Restaurant-specific fields
  const [restaurantInfo, setRestaurantInfo] = useState({
    restaurantName: "",
    cuisine: "Multi-Cuisine",
    address: "",
    pincode: "",
    estDate: "",
    isVeg: false,
  });

  const { name, email, password, passwordConfirm, phoneNumber, role } = user;

  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("/images/default_avatar.jpg");
  const isSubmitting = useRef(false);

  // OTP state
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isAuthenticated, error, loading, user: loggedInUser } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (isAuthenticated && isSubmitting.current) {
      toast.success("Account created! Please verify your email with the OTP sent to your inbox.");
      isSubmitting.current = false;
      setShowOTP(true);
    }

    if (error) {
      toast.error(error);
      dispatch(clearErrors());
      isSubmitting.current = false;
    }
  }, [dispatch, isAuthenticated, error, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !passwordConfirm) {
      toast.warning("Please fill in all required fields");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (phoneNumber.trim().length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (role === "restaurant") {
      if (!restaurantInfo.restaurantName.trim()) {
        toast.error("Please enter your restaurant name");
        return;
      }
      if (!restaurantInfo.address.trim()) {
        toast.error("Please enter your restaurant address");
        return;
      }
      if (!restaurantInfo.pincode.trim() || restaurantInfo.pincode.trim().length !== 6) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }
    }

    isSubmitting.current = true;
    setIsRegistering(true);

    const userData = {
      name: name.trim(),
      email: email.trim(),
      password,
      passwordConfirm,
      phoneNumber: phoneNumber.trim(),
      role,
      avatar: avatar === "" ? "/images/default_avatar.jpg" : avatar,
    };

    try {
      const { data } = await api.post("/api/v1/users/signup", userData, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success(data.message || "OTP sent to your email!");
      setShowOTP(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsRegistering(false);
      isSubmitting.current = false;
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.warning("Please enter the 6-digit OTP");
      return;
    }

    setVerifying(true);
    try {
      const { data } = await api.post("/api/v1/users/verify-email", { email, otp });

      toast.success(data.message || "Email verified! Welcome to Snackr 🎉");
      
      // Dispatch Redux login success with the user returned from backend
      dispatch(loginSuccess(data.data?.user || data.user));

      // If restaurant role, create the restaurant
      if (role === "restaurant") {
        try {
          await api.post("/api/v1/eats/stores", {
            name: restaurantInfo.restaurantName,
            cuisine: restaurantInfo.cuisine,
            address: `${restaurantInfo.address}, ${restaurantInfo.pincode}`,
            pincode: restaurantInfo.pincode,
            estDate: restaurantInfo.estDate || undefined,
            isVeg: restaurantInfo.isVeg,
            location: { type: "Point", coordinates: [0, 0] },
            images: [{ public_id: "default", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600" }],
          }, { withCredentials: true });
          toast.success("Restaurant registered successfully! 🏪");
        } catch (restErr) {
          console.error(restErr);
          toast.error("Account created but restaurant setup failed. You can set it up from the dashboard.");
        }
      }

      if (role === "restaurant") {
        navigate("/restaurant/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const { data } = await api.post("/api/v1/users/resend-otp", { email });
      toast.info(data.message || "New OTP sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  const onChange = (e) => {
    if (e.target.name === "avatar") {
      if (e.target.files[0]) {
        const fileSizeMB = e.target.files[0].size / (1024 * 1024);
        if (fileSizeMB > MAX_AVATAR_MB) {
          toast.error(`Avatar must be under ${MAX_AVATAR_MB}MB. Your file is ${fileSizeMB.toFixed(1)}MB.`);
          e.target.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.readyState === 2) {
            setAvatarPreview(reader.result);
            setAvatar(reader.result);
          }
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    } else {
      setUser({ ...user, [e.target.name]: e.target.value });
    }
  };

  // OTP Verification Screen
  if (showOTP) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-3xl shadow-sm">
              ✉️
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Verify Your Email</h2>
            <p className="text-sm text-gray-500">
              We've sent a 6-digit OTP to <strong className="text-gray-900">{email}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Enter OTP</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center text-2xl font-bold tracking-[0.5em] px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-300"
              placeholder="------"
              autoFocus
            />
          </div>

          <button
            onClick={handleVerifyOTP}
            disabled={verifying || otp.length !== 6}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Verify Email & Continue"}
          </button>

          <div className="text-center">
            <button
              onClick={handleResendOTP}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Didn't receive OTP? Resend
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Skip for now (verify later)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      {loading || isRegistering ? (
        <Loader />
      ) : (
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
              BB
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Create an Account
            </h2>
            <p className="text-xs text-gray-500">
              Join BigBite today to explore great food and restaurants
            </p>
          </div>

          {/* Account Type Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setUser({ ...user, role: "user" })}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                role === "user"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🍔 Foodie / Customer
            </button>
            <button
              type="button"
              onClick={() => setUser({ ...user, role: "restaurant" })}
              className={`py-2.5 text-xs font-semibold rounded-xl transition-all ${
                role === "restaurant"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🏪 Restaurant Partner
            </button>
          </div>

          <form className="space-y-3" onSubmit={submitHandler} encType="multipart/form-data">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" required name="name" value={name} onChange={onChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
              <input type="email" required name="email" value={email} onChange={onChange}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input type="tel" required name="phoneNumber" value={phoneNumber} onChange={onChange} pattern="[0-9]{10}" maxLength={10}
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                placeholder="9876543210"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input type="password" required name="password" value={password} onChange={onChange} minLength={6}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm <span className="text-red-500">*</span></label>
                <input type="password" required name="passwordConfirm" value={passwordConfirm} onChange={onChange} minLength={6}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Restaurant-specific fields */}
            {role === "restaurant" && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                <p className="text-xs font-bold text-amber-900">🏪 Restaurant Details</p>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Restaurant Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={restaurantInfo.restaurantName}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, restaurantName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
                    placeholder="The Spice Kitchen"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cuisine</label>
                    <select value={restaurantInfo.cuisine}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, cuisine: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option>Multi-Cuisine</option>
                      <option>North Indian</option>
                      <option>South Indian</option>
                      <option>Chinese</option>
                      <option>Italian</option>
                      <option>Fast Food</option>
                      <option>Biryani</option>
                      <option>Desserts & Bakery</option>
                      <option>Street Food</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Est. Date</label>
                    <input type="date" value={restaurantInfo.estDate}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, estDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                  <input type="text" required value={restaurantInfo.address}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
                    placeholder="123 MG Road, Sector 5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                    <input type="text" required maxLength={6} value={restaurantInfo.pincode}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, pincode: e.target.value.replace(/\D/g, "") })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
                      placeholder="110001"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={restaurantInfo.isVeg}
                        onChange={(e) => setRestaurantInfo({ ...restaurantInfo, isVeg: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-semibold text-gray-700">Pure Veg Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Profile Photo <span className="text-gray-400">(Max {MAX_AVATAR_MB}MB)</span>
              </label>
              <div className="flex items-center space-x-4">
                <img src={avatarPreview} alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <input type="file" name="avatar" accept="image/*" onChange={onChange}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link to="/users/login" className="font-bold text-emerald-600 hover:text-emerald-700">Sign in</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
