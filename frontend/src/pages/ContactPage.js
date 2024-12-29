import React from "react";
import "./ContactPage.css";
import qrCodeImage from "../assets/whatsapp-qr.png";

const ContactPage = () => {
  return (
    <div className="contact-page">
      <div className="contact-container">
        <h1>Contact Us</h1>
        <div className="contact-content">
          <div className="contact-item">
            <h2>WhatsApp</h2>
            <img src={qrCodeImage} alt="WhatsApp QR Code" className="qr-code" />
            <a
              href="https://wa.me/+27656765175"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              Chat with us on WhatsApp
            </a>
          </div>
          <div className="contact-item">
            <h2>Email</h2>
            <p>
              <a href="mailto:sarabrochbiz@gmail.com" className="contact-link">
                sarabrochbiz@gmail.com
              </a>
            </p>
          </div>
          <div className="contact-item">
            <h2>Phone</h2>
            <p>
              <a href="tel:+27656765175" className="contact-link">
                +27(65)6765175
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
