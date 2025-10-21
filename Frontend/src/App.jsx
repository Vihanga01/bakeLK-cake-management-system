import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import CakeDetail from "./pages/CakeDetail/CakeDetail";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import AddCake from "./pages/cake_management/AddCake";
import CakeList from "./pages/cake_management/CakeList";
import EditCake from "./pages/cake_management/EditCake";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import Dashboard from "./components/Dashboard/Dashboard";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Wallet from "./pages/Wallet/Wallet";
import WalletEdit from "./pages/Wallet/WalletEdit";
import Profile from "./pages/Profile/Profile";
import OrderHistory from "./pages/OrderHistory/OrderHistory";

const App = () => {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <div className="app">
        {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
        <Routes>
          <Route path="/" element={<Home setShowLogin={setShowLogin} />} />
          <Route path="/products" element={<Products setShowLogin={setShowLogin} />} />
          <Route path="/cake/:id" element={<CakeDetail setShowLogin={setShowLogin} />} />
          <Route path="/cart" element={<Cart setShowLogin={setShowLogin} />} />
          <Route path="/checkout" element={<Checkout setShowLogin={setShowLogin} />} />
          <Route path="/thank-you" element={<ThankYou setShowLogin={setShowLogin} />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/wallet/edit/:id" element={<WalletEdit />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/myorders" element={<OrderHistory />} />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="addcake" element={<AddCake />} />
            <Route path="cakelist" element={<CakeList />} />
            <Route path="editcake/:id" element={<EditCake />} />
          </Route>
        </Routes>
      </div>
      <ToastContainer />
    </>
  );
};

export default App;
