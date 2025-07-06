import React, { useState } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import Footer from './Footer';
// NEW: Import the ContactForm here
import ContactForm from './ContactForm';

const Header = ({ onContactClick }) => {
    const navigate = useNavigate();
    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-0.5">
                    <Link to="/" className="flex-shrink-0">
                         <img className="h-20" src="/Hlogo.png" alt="VexOp+ Logo" />
                    </Link>
                    <div className="flex items-center space-x-6">
                        <Link to="/" className="text-base font-medium text-gray-600 hover:text-brand-dark">Home</Link>
                        <Link to="/solutions" className="text-base font-medium text-gray-600 hover:text-brand-dark">Solutions</Link>
                        <Link to="/pricing" className="text-base font-medium text-gray-600 hover:text-brand-dark">Pricing</Link>
                        <button onClick={onContactClick} className="text-base font-medium text-gray-600 hover:text-brand-dark">Contact Us</button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-brand-accent text-brand-dark font-bold py-2 px-5 rounded-md hover:bg-opacity-90 transition text-base"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const PublicLayout = () => {
    const [showContactForm, setShowContactForm] = useState(false);
    const handleContactClick = () => setShowContactForm(true);
    const handleContactFormClose = () => setShowContactForm(false);

    return (
        <div className="bg-brand-bg font-sans flex flex-col min-h-screen">
            <Header onContactClick={handleContactClick} />
            <main className="flex-grow">
                {/* The context now only needs to pass the click handler */}
                <Outlet context={{ handleContactClick }}/>
            </main>
            <Footer onContactClick={handleContactClick} />

            {/* NEW: Render the form here, in the layout */}
            {showContactForm && <ContactForm onClose={handleContactFormClose} />}
        </div>
    );
};

export default PublicLayout;