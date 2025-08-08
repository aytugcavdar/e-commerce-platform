import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-10">
      <div>
        <p>Copyright © {new Date().getFullYear()} - Tüm Hakları Saklıdır by E-Commerce Platform</p>
      </div>
    </footer>
  );
};

export default Footer;