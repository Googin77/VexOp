import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMinus } from '@fortawesome/free-solid-svg-icons';
import { useOutletContext } from 'react-router-dom';

const Check = () => <FontAwesomeIcon icon={faCheck} className="text-green-500" />;
const Minus = () => <FontAwesomeIcon icon={faMinus} className="text-gray-400" />;

const PricingTier = ({ title, price, description, features, isPopular = false }) => (
    <div className={`border rounded-lg p-6 flex flex-col ${isPopular ? 'border-brand-accent-secondary shadow-xl' : 'border-gray-200'}`}>
        {isPopular && <div className="text-center mb-4"><span className="bg-brand-accent-secondary text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span></div>}
        <h3 className="text-2xl font-bold text-brand-dark text-center">{title}</h3>
        <p className="text-center mt-2 text-gray-500">{description}</p>
        <div className="text-center my-6">
            <span className="text-5xl font-extrabold text-brand-dark">${price}</span>
            <span className="text-base font-medium text-gray-500">/ month</span>
        </div>
        <button className={`w-full py-3 rounded-md font-bold ${isPopular ? 'bg-brand-accent-secondary text-white' : 'bg-brand-dark text-white'}`}>
            Get Started
        </button>
        <ul className="mt-6 space-y-4 flex-grow">
            {features.map((feature, index) => (
                <li key={index} className="flex items-center space-x-3">
                    {feature.included ? <Check /> : <Minus />}
                    <span className="text-gray-600">{feature.name}</span>
                </li>
            ))}
        </ul>
    </div>
);


const Pricing = () => {
    const { handleContactClick } = useOutletContext();
    const tiers = {
        starter: [
            { name: 'Core Job Management', included: true },
            { name: 'Quoting & Invoicing', included: true },
            { name: 'Client Management (CRM)', included: true },
            { name: 'Basic Compliance Checklists', included: true },
            { name: 'Business Startup Guides', included: true },
            { name: 'Xero/MYOB Integration', included: false },
            { name: 'Advanced Reporting', included: false },
        ],
        pro: [
            { name: 'Core Job Management', included: true },
            { name: 'Quoting & Invoicing', included: true },
            { name: 'Client Management (CRM)', included: true },
            { name: 'Full Compliance & Safety Module', included: true },
            { name: 'Business Startup Guides', included: true },
            { name: 'Xero/MYOB Integration', included: true },
            { name: 'Advanced Reporting & Analytics', included: true },
        ],
        enterprise: [
            { name: 'Everything in Pro, plus:', included: true },
            { name: 'Dedicated Account Manager', included: true },
            { name: 'Custom Workflow Development', included: true },
            { name: 'API Access', included: true },
            { name: 'Priority Support', included: true },
        ]
    }
    return (
        <div className="bg-brand-bg py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark">Simple, Transparent Pricing</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">Choose the plan that's right for your business stage.</p>
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <PricingTier title="Starter" price="49" description="For sole traders and new businesses." features={tiers.starter} />
                    <PricingTier title="Pro" price="99" description="For growing companies that need more power." features={tiers.pro} isPopular={true} />
                    <PricingTier title="Enterprise" price="Custom" description="For established businesses with custom needs." features={tiers.enterprise} />
                </div>
                 <div className="text-center mt-12">
                    <p className="text-gray-600">Need a custom solution? <button onClick={handleContactClick} className="font-bold text-brand-accent-secondary hover:underline">Contact us</button>.</p>
                </div>
            </div>
        </div>
    );
}

export default Pricing;