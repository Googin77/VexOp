import React from "react";
import { useNavigate } from "react-router-dom";

const colors = {
  richBlack: "#343434",
  oxfordBlue: "#1b263b",
  yinmnBlue: "#415a77",
  silverLakeBlue: "#778da9a",
  platinum: "#d9d9d9",
};

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{
        backgroundColor: colors.platinum,
        color: colors.richBlack,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* Logo */}
      <img
        src="/zoomedlogo.png"
        alt="VexOp+ Logo"
        style={{
          height: "150px",
          width: "auto",
          objectFit: "contain",
          marginBottom: "2rem",
        }}
      />

      {/* Marketing Content */}
      <h1 className="text-4xl font-bold mb-4" style={{ color: colors.oxfordBlue }}>
        Welcome to VexOp
      </h1>
      <p
        className="text-gray-700 mb-8 text-center max-w-3xl px-4"
        style={{ fontSize: "1.2rem", lineHeight: "1.6" }}
      >
        VexOp empowers small to medium construction, building, and trade companies to focus on
        what they do best – building. We handle the backend tasks like accounting, invoicing,
        HR, marketing, and more, so you can concentrate on your projects and clients.
      </p>

      {/* Client Login Button */}
      <button
        onClick={() => navigate("/login")}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded"
        style={{
          backgroundColor: colors.yinmnBlue,
          transition: "background-color 0.3s ease",
          color: colors.platinum,
          fontSize: "1.1rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.silverLakeBlue)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.yinmnBlue)}
      >
        Client Login
      </button>
    </div>
  );
};

export default Homepage;
