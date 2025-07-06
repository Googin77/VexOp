import React from "react";
// REMOVED: No need to import ContactForm here anymore
import { useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faCalculator, faUsers, faShieldAlt, faChartLine, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const FeatureCard = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 text-center sm:text-left">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-accent-secondary text-white mb-4 mx-auto sm:mx-0">
        <FontAwesomeIcon icon={icon} size="lg" />
      </div>
      <h3 className="text-xl font-bold text-brand-dark mb-2">{title}</h3>
      <p className="text-gray-600">{children}</p>
    </div>
);

const Homepage = () => {
    // SIMPLIFIED: We only need the click handler from the context now
    const { handleContactClick } = useOutletContext();

    return (
        <>
            {/* Hero Section */}
            <div className="relative bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                        <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                            <div className="sm:text-center lg:text-left">
                                <h1 className="text-4xl tracking-tight font-extrabold text-brand-dark sm:text-5xl md:text-6xl">
                                    <span className="block xl:inline">The Operating System for</span>{' '}
                                    <span className="block text-brand-accent xl:inline">Your Trade Business</span>
                                </h1>
                                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                                    From startup to established enterprise, VexOp+ provides the tools and expert guidance to streamline operations, ensure compliance, and drive growth.
                                </p>
                                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                                    <div className="rounded-md shadow">
                                        <button onClick={handleContactClick} className="w-full flex items-center justify-center px-8 py-3 border-transparent text-base font-medium rounded-md text-white bg-brand-dark hover:bg-opacity-90 md:py-4 md:text-lg md:px-10">
                                            Register Interest
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
                <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
                    <img className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full" src="https://www.dtf.vic.gov.au/sites/default/files/2024-10/Two-people-in-high-vis-clothing-looking-at-a-laptop.jpg" alt="Engineer with Tablet" />
                </div>
            </div>

            {/* Feature Section */}
            <div id="features" className="py-12 sm:py-20 bg-brand-bg scroll-mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base text-brand-accent font-semibold tracking-wide uppercase">Why VexOp+</h2>
                        <p className="mt-2 text-3xl font-extrabold text-brand-dark tracking-tight sm:text-4xl">
                            Everything you need. More than you expect.
                        </p>
                    </div>
                    <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureCard icon={faBriefcase} title="Job Management">Track jobs from lead to final payment. Keep your team on schedule and your clients informed.</FeatureCard>
                        <FeatureCard icon={faCalculator} title="Quoting & Invoicing">Create professional quotes in minutes and convert them to invoices with one click. Get paid faster.</FeatureCard>
                        <FeatureCard icon={faUsers} title="Startup to Enterprise">Whether you're a sole trader or an established company, our workflows scale to your needs.</FeatureCard>
                        <FeatureCard icon={faShieldAlt} title="Compliance & Safety">Our standout feature. Access risk profiles, compliance guides, and safety workflows to protect your business.</FeatureCard>
                        <FeatureCard icon={faChartLine} title="Business Advisory">Go beyond operations with guidance on company setup, financial management, and strategic growth.</FeatureCard>
                        <FeatureCard icon={faArrowRight} title="Seamless Integration">Connect with popular accounting software like Xero and MYOB to streamline your entire workflow.</FeatureCard>
                    </div>
                </div>
            </div>
            
            {/* REMOVED: The conditional rendering of the form is no longer here. */}
        </>
    );
};

export default Homepage;