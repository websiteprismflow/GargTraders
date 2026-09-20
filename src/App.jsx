import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminModal from './components/AdminModal';
import HomePage from './pages/HomePage';
import CollectionPage from './pages/CollectionPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import { ToastProvider } from './context/ToastContext';

// Automatically scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function MainLayout() {
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <Header onOpenAdminModal={() => setAdminModalOpen(true)} />

      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/collection/:categoryId" element={<CategoryPage />} />
          <Route path="/collection/:categoryId/:productId" element={<ProductDetailPage />} />
          <Route
            path="/admin"
            element={<AdminDashboard onOpenLoginModal={() => setAdminModalOpen(true)} />}
          />
          {/* Fallback to Home */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />

      {/* Hidden Admin Access Modal */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </ToastProvider>
  );
}
