import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import RequireAdmin from './components/RequireAdmin';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import SizeGuidePage from './pages/SizeGuidePage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminProducts from './pages/admin/AdminProducts';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminCustomers from './pages/admin/AdminCustomers';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ShopRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="doanh-thu" element={<AdminRevenue />} />
            <Route path="san-pham" element={<AdminProducts />} />
            <Route path="kho" element={<AdminInventory />} />
            <Route path="don-hang" element={<AdminOrders />} />
            <Route path="voucher" element={<AdminVouchers />} />
            <Route path="khach-hang" element={<AdminCustomers />} />
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/gian-hang" element={<ShopRedirect />} />
          <Route path="/huong-dan-size" element={<SizeGuidePage />} />
          <Route path="/san-pham/:slug" element={<ProductPage />} />
          <Route path="/dang-nhap" element={<LoginPage />} />
          <Route path="/dang-ky" element={<RegisterPage />} />
          <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/thanh-toan" element={<CheckoutPage />} />
          <Route path="/dat-hang/:id" element={<OrderSuccessPage />} />
          <Route path="/don-hang" element={<MyOrdersPage />} />
          <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
