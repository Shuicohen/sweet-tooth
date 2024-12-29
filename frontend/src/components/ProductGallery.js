import React, { useState } from "react";
import "./ProductGallery.css";

const ProductGallery = ({ images }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const toggleFullscreen = (image) => {
    setIsFullscreen(!isFullscreen);
    setSelectedImage(image);
  };

  return (
    <div className="product-gallery">
      {!isFullscreen && (
        <div className="gallery-images">
          {Array.isArray(images) ? (
            images.map((image, index) => (
              <div
                key={index}
                className="gallery-image-container"
                onClick={() => toggleFullscreen(image)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && toggleFullscreen(image)}
              >
                <img src={image} alt={`Product ${index + 1}`} className="gallery-image" />
              </div>
            ))
          ) : (
            <div
              className="gallery-image-container"
              onClick={() => toggleFullscreen(images)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && toggleFullscreen(images)}
            >
              <img src={images} alt="Product" className="gallery-image" />
            </div>
          )}
        </div>
      )}

      {isFullscreen && (
        <div
          className="fullscreen-overlay"
          onClick={() => toggleFullscreen(null)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === "Enter" && toggleFullscreen(null)}
        >
          <img src={selectedImage || images} alt="Fullscreen Product" className="fullscreen-image" />
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
