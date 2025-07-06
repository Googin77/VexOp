import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase, faCalculator, faFileInvoiceDollar, faShieldAlt, faChartLine, faRocket } from '@fortawesome/free-solid-svg-icons';
import { useOutletContext } from 'react-router-dom';

const FeatureDetail = ({ icon, title, children }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-brand-accent-secondary text-white">
            <FontAwesomeIcon icon={icon} size="lg" />
        </div>
        <div>
            <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
            <p className="mt-1 text-base text-gray-600">{children}</p>
        </div>
    </div>
);


const Solutions = () => {
    const { handleContactClick } = useOutletContext();
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="text-center py-16 md:py-24 bg-brand-bg">
                <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark">A Complete System for Your Success</h1>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 px-4">
                    VexOp+ is more than just software. It's a comprehensive platform designed to manage your operations, guide your growth, and secure your compliance.
                </p>
            </div>

            {/* Core Software Section */}
            <div className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-base text-brand-accent font-semibold tracking-wide uppercase">The All-in-One Tool</h2>
                        <p className="mt-2 text-3xl font-extrabold text-brand-dark sm:text-4xl">Streamline Your Entire Workflow</p>
                    </div>

                    <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                        <FeatureDetail icon={faBriefcase} title="Job & Project Tracking">
                            Manage everything from the initial quote to the final invoice. Track time, materials, and progress to keep projects on schedule and profitable.
                        </FeatureDetail>
                        <FeatureDetail icon={faCalculator} title="Quoting & Estimating">
                            Create fast, accurate, and professional quotes that impress clients. Use templates to save time and win more bids.
                        </FeatureDetail>
                        <FeatureDetail icon={faFileInvoiceDollar} title="Invoicing & Payments">
                           Turn completed jobs into invoices with a single click. Integrate with accounting software like Xero or MYOB to simplify bookkeeping.
                        </FeatureDetail>
                    </div>
                </div>
            </div>

             {/* Advisory Services Section */}
            <div className="bg-brand-bg py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                     <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
                        <div>
                            <h2 className="text-base text-brand-accent font-semibold tracking-wide uppercase">Beyond the Software</h2>
                            <p className="mt-2 text-3xl font-extrabold text-brand-dark">Your Partner in Business Growth</p>
                            <p className="mt-4 text-xl text-gray-500">
                                Our unique value is providing the expert guidance you need to not just run your business, but to build it correctly and safely from the ground up.
                            </p>
                        </div>
                        <div className="mt-10 lg:mt-0 space-y-8">
                            <FeatureDetail icon={faShieldAlt} title="Compliance & Safety Guides">
                                Navigate the complexities of workplace safety with confidence. Access industry-specific risk profiles, compliance checklists, and safety workflows.
                            </FeatureDetail>
                             <FeatureDetail icon={faRocket} title="Business Startup Advisory">
                                Perfect for sole traders. We provide workflows and guides for everything from registering your company and setting up your ABN to managing your finances.
                            </FeatureDetail>
                            <FeatureDetail icon={faChartLine} title="Strategic Growth & Risk">
                                For established companies looking to scale, we provide tools to analyze profitability, manage risk, and make data-driven decisions for sustainable growth.
                            </FeatureDetail>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-white">
                <div className="max-w-4xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-brand-dark sm:text-4xl">
                        <span className="block">Ready to see the solution in action?</span>
                    </h2>
                    <p className="mt-4 text-lg leading-6 text-gray-500">
                        Let's discuss how VexOp+ can be tailored to your specific business needs.
                    </p>
                    <button onClick={handleContactClick} className="mt-8 w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-dark hover:bg-opacity-90 sm:w-auto">
                        Book a Free Demo
                    </button>
                </div>
            </div>

        </div>
    );
}

export default Solutions;