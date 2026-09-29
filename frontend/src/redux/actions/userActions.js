import api from "../../utils/api";
import {
  loginRequest,
  loginSuccess,
  loginFail,
  loadUserFail,
  logoutSuccess,
  logoutFail,
  updateRequest,
  updateSuccess,
  updateFail,
} from "../slices/userSlice";

const getErrorMessage = (error, defaultMsg) => {
  return (
    error.response?.data?.message ||
    error.response?.data?.errMessage ||
    error.message ||
    defaultMsg
  );
};

// LOGIN
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch(loginRequest());
    const { data } = await api.post("/api/v1/users/login", { email, password });
    dispatch(loginSuccess(data.data?.user || data.user));
  } catch (error) {
    dispatch(loginFail(getErrorMessage(error, "Invalid Email or Password")));
  }
};

// REGISTER
export const register = (userData) => async (dispatch) => {
  try {
    dispatch(loginRequest());
    const { data } = await api.post("/api/v1/users/signup", userData, {
      headers: { "Content-Type": "application/json" },
    });
    dispatch(loginSuccess(data.data?.user || data.user));
  } catch (error) {
    dispatch(loginFail(getErrorMessage(error, "Registration failed")));
  }
};

// LOAD CURRENT USER (Session Check)
export const loadUser = () => async (dispatch) => {
  try {
    const { data } = await api.get("/api/v1/users/me");
    if (data && (data.user || data.data?.user)) {
      dispatch(loginSuccess(data.user || data.data.user));
    }
  } catch (error) {
    dispatch(loadUserFail(null));
  }
};

// UPDATE PROFILE
export const updateProfile = (userData) => async (dispatch) => {
  try {
    dispatch(updateRequest());
    const { data } = await api.put("/api/v1/users/me/update", userData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    dispatch(updateSuccess(data.success));
  } catch (error) {
    dispatch(updateFail(getErrorMessage(error, "Profile update failed")));
  }
};

// LOGOUT
export const logout = () => async (dispatch) => {
  try {
    await api.get("/api/v1/users/logout");
    dispatch(logoutSuccess());
  } catch (error) {
    dispatch(logoutFail(getErrorMessage(error, "Logout failed")));
  }
};
