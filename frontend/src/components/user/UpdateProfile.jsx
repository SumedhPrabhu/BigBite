import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, loadUser } from "../../redux/actions/userActions";
import { clearErrors, updateReset } from "../../redux/slices/userSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Loader from "../layout/Loader";

const MAX_AVATAR_MB = 2;

const UpdateProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("/images/default_avatar.jpg");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, error, isUpdated, loading } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarPreview(user?.avatar?.url || "/images/default_avatar.jpg");
      setAddress(user?.deliveryInfo?.address || "");
      setCity(user?.deliveryInfo?.city || "");
      setPostalCode(user?.deliveryInfo?.postalCode || "");
    }

    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }

    if (isUpdated) {
      toast.success("Profile updated successfully!");
      dispatch(loadUser());
      navigate("/users/me");
      dispatch(updateReset());
    }
  }, [dispatch, error, navigate, isUpdated, user]);

  const submitHandler = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set("name", name);
    formData.set("email", email);
    if (avatar) {
      formData.set("avatar", avatar);
    }
    
    // Pass deliveryInfo as JSON string
    const deliveryInfo = {
      address,
      city,
      postalCode,
      country: user?.deliveryInfo?.country || "IN",
      phoneNo: user?.deliveryInfo?.phoneNo || user?.phoneNumber || "",
    };
    formData.set("deliveryInfo", JSON.stringify(deliveryInfo));

    dispatch(updateProfile(formData));
  };

  const onChange = (e) => {
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
  };

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Update Profile
            </h1>
            <Link to="/users/me" className="text-xs font-semibold text-gray-500 hover:text-gray-700">
              Cancel
            </Link>
          </div>

          <form className="space-y-4" onSubmit={submitHandler} encType="multipart/form-data">
            <div>
              <label htmlFor="name_field" className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input type="text" id="name_field" required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email_field" className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input type="email" id="email_field" required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Delivery Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                  <input type="text"
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                    value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat / House / Street"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input type="text"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                      value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code</label>
                    <input type="text"
                      className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
                      value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="6-digit PIN"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Profile Photo <span className="text-gray-400">(Max {MAX_AVATAR_MB}MB)</span>
              </label>
              <div className="flex items-center space-x-4">
                <img src={avatarPreview} alt="Avatar Preview"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                  onError={(e) => { e.target.onerror = null; e.target.src = "/images/default_avatar.jpg"; }}
                />
                <input type="file" name="avatar" accept="image/*" onChange={onChange}
                  className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default UpdateProfile;