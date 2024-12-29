import React from "react";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>
          © {new Date().getFullYear()} Built by{" "}
          <a
            href="https://portfolio-page-kdqi.onrender.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Shui
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
