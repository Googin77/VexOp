import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from '@emailjs/browser';
import ReCAPTCHA from "react-google-recaptcha";



const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9a",
  platinum: "#d9d9d9",
};

// ContactForm Component
const ContactForm = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [captcha, setCaptcha] = useState(null);

  const serviceId = 'service_vug8zg7';
  const templateId = 'template_fzqn41o';
  const publicKey = 'u6u4zgH2v5fV8GUJO';
  const formRef = useRef(null);

  const handleCaptchaChange = (value) => {
    setCaptcha(value);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionResult(null);

      if (!captcha) {
      setSubmissionResult({ success: false, message: 'Please complete the reCAPTCHA.' });
      setIsSubmitting(false);
      return;
    }

    const templateParams = {
      from_name: name,
      from_email: email,
      message: message,
      company: company,
    };
    emailjs
      .send(serviceId, templateId, templateParams, publicKey)
      .then((result) => {
        console.log(result.text);
        setSubmissionResult({ success: true, message: "Thank you! Your message has been sent." });
        setName('');
        setEmail('');
        setMessage('');
        setCompany('');
        setIsSubmitting(false); // Reset the submission state
        setCaptcha(null);
      })
      .catch((error) => {
        console.error(error);
        setSubmissionResult({ success: false, message: "Oops! There was an error submitting your message." });
        setIsSubmitting(false); // Ensure isSubmitting is set to false even in the event of an error
      });
  };

    useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

    return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-500 bg-opacity-75 flex items-center justify-center z-50" >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8" ref={formRef}>
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Contact Us</h2>

        {submissionResult && (
          <div className={`mb-4 p-3 rounded ${submissionResult.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {submissionResult.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="name"
              type="text"
              placeholder="Your Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder="Your Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
             <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="company">
              Company
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="company"
              type="text"
              placeholder="Your company"
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
              Message
            </label>
            <textarea
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="message"
              placeholder="Your Message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="6"
              required
            />
          </div>
    <div className="flex flex-col items-center mt-4">
            <ReCAPTCHA
              sitekey="6Ld3dWIrAAAAABBYrwcC3D25whZQb2WuH1qz8v4u"
              onChange={handleCaptchaChange}
            />
        {!captcha && submissionResult && !submissionResult.success && (
          <div className="text-red-500 mt-2">Please complete the reCAPTCHA.</div>
        )}
        </div>

          <div className="flex justify-between mt-6">
          <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};

const Homepage = () => {
  const navigate = useNavigate();
  const [showContactForm, setShowContactForm] = useState(false);

  const handleRegisterInterestClick = () => {
    setShowContactForm(true);
  };

  const handleContactFormClose = () => {
    setShowContactForm(false);
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        backgroundColor: colors.platinum,
        color: colors.richBlack,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
         <header className="w-full py-0 px-4" style={{ backgroundColor: colors.richBlack }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo with Adjusted Styling */}
          <div
            
          >
            <img
              src="/zoomedlogo.png"
              alt="VexOp+ Logo"
              style={{
                height: "120px",
                width: "auto",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Sign In Button (Right) */}
          <button
            onClick={() => navigate("/login")}
            className="bg-yinmnBlue text-platinum font-bold py-2 px-4 rounded"
            style={{
              backgroundColor: colors.yinmnBlue,
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.silverLakeBlue)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.yinmnBlue)}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content Section */}
      <main className="flex flex-col items-center py-16">
        {/* Hero Text */}
        <h1 className="text-4xl font-bold mb-4" style={{ color: colors.oxfordBlue }}>
          The Modern Solution for Trade Companies
        </h1>
        <p
          className="text-gray-700 mb-8 text-center max-w-3xl px-4"
          style={{ fontSize: "1.2rem", lineHeight: "1.6" }}
        >
          VexOp+ is the easiest way for building, trade and construction companies to stay organised, grow profitability, reduce waste, and deliver greater client satisfaction.
        </p>
        {/* Register Interest Button (Center) */}
        <button
          onClick={handleRegisterInterestClick}
          className="bg-yinmnBlue text-platinum font-bold py-2 px-4 rounded"
          style={{
            backgroundColor: colors.yinmnBlue,
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.silverLakeBlue)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.yinmnBlue)}
        >
          Register Interest
        </button>
      </main>

      {/* Shadow Divider */}
      <div className="w-full h-1 shadow-md" style={{ backgroundColor: "transparent" }} />

      {/* White Content Below */}
      <div className="flex-grow p-8" style={{ backgroundColor: "white" }}>
        {/* Your Content Here */}
        <p className="text-gray-700">
          more information to come...
        </p>
      </div>
          {showContactForm && <ContactForm onClose={handleContactFormClose} />}
    </div>
  );
};

export default Homepage;
