// src/components/ContactForm.jsx
import React, { useState, useRef, useEffect } from "react";
import emailjs from '@emailjs/browser';
import ReCAPTCHA from "react-google-recaptcha";

const ContactForm = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [captcha, setCaptcha] = useState(null);

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
    // Your emailjs credentials
    emailjs.send('service_vug8zg7', 'template_fzqn41o', templateParams, 'u6u4zgH2v5fV8GUJO')
      .then((result) => {
        setSubmissionResult({ success: true, message: "Thank you! Your message has been sent." });
        setName('');
        setEmail('');
        setMessage('');
        setCompany('');
        setCaptcha(null); 
      })
      .catch((error) => {
        setSubmissionResult({ success: false, message: "Oops! There was an error submitting your message." });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div ref={formRef} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-brand-dark text-center">Register Your Interest</h2>

        {submissionResult && (
          <div className={`mb-4 p-3 rounded-md text-center text-sm ${submissionResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {submissionResult.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="name">Name</label>
            <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent-secondary focus:border-transparent transition" id="name" type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="email">Email</label>
            <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent-secondary focus:border-transparent transition" id="email" type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="company">Company</label>
            <input className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent-secondary focus:border-transparent transition" id="company" type="text" placeholder="Your Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="message">Message</label>
            <textarea className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-accent-secondary focus:border-transparent transition" id="message" placeholder="Tell us about your needs..." value={message} onChange={(e) => setMessage(e.target.value)} rows="4" required />
          </div>
          <div className="flex justify-center pt-2">
            <ReCAPTCHA sitekey="6Ld3dWIrAAAAABBYrwcC3D25whZQb2WuH1qz8v4u" onChange={handleCaptchaChange} />
          </div>
          <div className="flex justify-between items-center pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-brand-dark text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition disabled:bg-gray-400">{isSubmitting ? "Submitting..." : "Submit"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;