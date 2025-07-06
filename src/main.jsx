import React from "react";
import './index.css'; 
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import ScrollToTop from './components/ScrollToTop'; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
         <ScrollToTop /> 
        <App />
        </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
