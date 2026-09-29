import React, { useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Menu from "./components/Menu";
import { loadUser } from "./redux/actions/userActions";
import store from "./redux/store";
import Login from "./components/user/Login";
import Register from "./components/user/Register";
import Profile from "./components/user/Profile";
import UpdateProfile from "./components/user/UpdateProfile";
import SavedFoods from "./components/user/SavedFoods";
import Cart from "./components/cart/Cart";
import OrderSuccess from "./components/cart/OrderSuccess";
import ListOrders from "./components/order/ListOrders";
import OrderDetails from "./components/order/OrderDetails";
import RestaurantDashboard from "./components/restaurant/RestaurantDashboard";
import Reels from "./components/reels/Reels";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  useEffect(() => {
    store.dispatch(loadUser());
  }, []);

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Router>
        <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
          <Header />
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            <Routes>
              {/* Discovery */}
              <Route path="/" element={<Home />} exact />
              <Route path="/reels" element={<Reels />} />
              <Route
                path="/eats/stores/search/:keyword"
                element={<Home />}
                exact
              />
              <Route path="/eats/stores/:id/menus" element={<Menu />} />

              {/* User & Auth */}
              <Route path="/users/login" element={<Login />} />
              <Route path="/users/signup" element={<Register />} />
              <Route path="/users/me" element={<Profile />} />
              <Route path="/users/me/update" element={<UpdateProfile />} />
              <Route path="/saved" element={<SavedFoods />} />

              {/* Cart & Ordering */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/success" element={<OrderSuccess />} />
              <Route path="/eats/orders/me/myOrders" element={<ListOrders />} />
              <Route path="/eats/orders/:id" element={<OrderDetails />} />

              {/* Restaurant Partner Dashboard */}
              <Route
                path="/restaurant/dashboard"
                element={<RestaurantDashboard />}
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </>
  );
}

export default App;
