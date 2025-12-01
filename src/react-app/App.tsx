import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import Dashboard from "@/react-app/pages/Dashboard";
import AdminLogin from "@/react-app/pages/AdminLogin";
import Login from "@/react-app/pages/Login";
import Cadastro from "@/react-app/pages/Cadastro";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import AdminTestSale from "@/react-app/pages/AdminTestSale";
import Checkout from "@/react-app/pages/Checkout";
import PaymentSuccess from "@/react-app/pages/PaymentSuccess";
import PaymentFailure from "@/react-app/pages/PaymentFailure";
import CheckoutCallback from "@/react-app/pages/CheckoutCallback";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/testar-venda" element={<AdminTestSale />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/callback" element={<CheckoutCallback />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
      </Routes>
    </Router>
  );
}
