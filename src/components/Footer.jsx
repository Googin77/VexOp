// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// Note: We are using <Link> from react-router-dom for internal navigation.
const Footer = ({ onContactClick }) => (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
                 <img className="h-15 mb-4" src="/WHlogo.png" alt="VexOp+ Logo" />
                 <p className="text-gray-400 text-base">The all-in-one platform for modern construction and trade businesses.</p>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Solutions</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link to="/#features" className="text-base text-gray-400 hover:text-white">Features</Link></li>
                  <li><Link to="/#features" className="text-base text-gray-400 hover:text-white">Quoting & Invoicing</Link></li>
                  <li><Link to="/#features" className="text-base text-gray-400 hover:text-white">Compliance & Advisory</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Company</h3>
                <ul className="mt-4 space-y-4">
                  <li><a href="#" className="text-base text-gray-400 hover:text-white">About Us</a></li>
                  {/* The contact button remains a button to trigger the modal */}
                  <li><button onClick={onContactClick} className="text-base text-gray-400 hover:text-white text-left">Contact</button></li>
                  
                </ul>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                  <li><Link to="/privacy-policy" className="text-base text-gray-400 hover:text-white">Privacy Policy</Link></li>
                  <li><Link to="/terms-of-service" className="text-base text-gray-400 hover:text-white">Terms of Service</Link></li>
                </ul>
            </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">&copy; {new Date().getFullYear()} VexOp+. All rights reserved.</p>
        </div>
      </div>
    </footer>
);

export default Footer;