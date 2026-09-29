import api from "../../utils/api";
import { toast } from "react-toastify";
import {
  createOrderRequest,
  createOrderSuccess,
  createOrderFail,
  paymentRequest,
  paymentSuccess,
  paymentFail,
  myOrdersRequest,
  myOrdersSuccess,
  myOrdersFail,
  orderDetailsRequest,
  orderDetailsSuccess,
  orderDetailsFail,
} from "../slices/orderSlice";
import { clearCart } from "../slices/cartSlice";

/**
 * Load Razorpay SDK dynamically if not already present on window
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Full Razorpay Checkout & Server-Side Verification Action
 */
export const checkoutWithRazorpay =
  (cartItems, restaurant, user, deliveryInfo, navigate) =>
  async (dispatch) => {
    try {
      dispatch(paymentRequest());

      // 1. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        dispatch(paymentFail("Failed to load Razorpay payment SDK"));
        toast.error("Could not load payment gateway. Please check your connection.");
        return;
      }

      // 2. Create Razorpay order on the backend
      const { data } = await api.post(
        "/api/v1/payment/process",
        { items: cartItems, restaurant, deliveryInfo },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!data.success || (!data.order && !data.order_id)) {
        dispatch(paymentFail(data.message || "Failed to initialize payment order"));
        toast.error("Could not initialize order with payment gateway.");
        return;
      }

      const razorpayOrder = data.order || {
        id: data.order_id,
        amount: data.amount,
        currency: data.currency,
      };

      const keyId =
        data.keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID ||
        "rzp_test_TKrbL6u3XGvRsp";

      // 3. Configure Razorpay Checkout options
      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        name: "Snackr",
        description: `Order from ${restaurant?.name || "Restaurant"}`,
        image: "/images/logo.webp",
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phoneNumber || "",
        },
        theme: {
          color: "#059669", // Snackr emerald
        },
        handler: async function (response) {
          try {
            dispatch(createOrderRequest());

            // 4. Server-Side Signature Verification & Order Creation
            const verifyRes = await api.post(
              "/api/v1/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                deliveryInfo,
              },
              { headers: { "Content-Type": "application/json" } }
            );

            if (verifyRes.data.success) {
              dispatch(paymentSuccess());
              dispatch(createOrderSuccess(verifyRes.data.order));
              dispatch(clearCart());
              toast.success("Payment verified and order placed successfully! 🎉");
              navigate("/success", {
                state: { order: verifyRes.data.order },
              });
            } else {
              dispatch(createOrderFail("Payment verification failed"));
              toast.error("Payment verification failed on server.");
            }
          } catch (verifyErr) {
            console.error("Verification Error:", verifyErr);
            dispatch(
              createOrderFail(
                verifyErr.response?.data?.message || "Payment verification failed"
              )
            );
            toast.error(
              verifyErr.response?.data?.message ||
                "Payment verification failed. No order was created."
            );
          }
        },
        modal: {
          ondismiss: function () {
            dispatch(paymentFail("Payment cancelled by user"));
            toast.info("Payment cancelled. No order was placed.");
          },
        },
      };

      // 4. Open Razorpay Checkout modal
      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        dispatch(paymentFail(response.error?.description || "Payment failed"));
        toast.error(
          response.error?.description || "Payment failed. Please try again."
        );
      });

      razorpayInstance.open();
    } catch (error) {
      console.error("Checkout Error:", error);
      dispatch(paymentFail(error.response?.data?.message || error.message));
      toast.error(
        error.response?.data?.message || "Error initiating Razorpay checkout"
      );
    }
  };

/**
 * Fetch Logged-in Customer's Orders
 */
export const myOrders = () => async (dispatch) => {
  try {
    dispatch(myOrdersRequest());
    const { data } = await api.get("/api/v1/eats/orders/me/myOrders");
    dispatch(myOrdersSuccess(data.orders));
  } catch (error) {
    dispatch(myOrdersFail(error.response?.data?.message));
  }
};

/**
 * Fetch Single Order Details
 */
export const getOrderDetails = (id) => async (dispatch) => {
  try {
    dispatch(orderDetailsRequest());
    const { data } = await api.get(`/api/v1/eats/orders/${id}`);
    dispatch(orderDetailsSuccess(data.order));
  } catch (error) {
    dispatch(orderDetailsFail(error.response?.data?.message));
  }
};
