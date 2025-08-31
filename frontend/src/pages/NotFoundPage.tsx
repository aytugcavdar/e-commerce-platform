import React from "react";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">Aradığınız sayfa bulunamadı.</p>
      <Link to="/" className="text-blue-600 hover:underline">
        Ana sayfaya dön
      </Link>
    </div>
  );
}

export default NotFoundPage;
