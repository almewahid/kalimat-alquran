import React, { useState, useEffect, useRef } from 'react';

/**
 * 🖼️ Lazy Loading Image Component
 * يؤخر تحميل الصور حتى تظهر في viewport
 */

export default function LazyImage({ src, alt, className, placeholderSrc, ...props }) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const [imageRef, setImageRef] = useState(null);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    
    if (imgRef.current && imageSrc !== src) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imgRef.current);
            }
          });
        },
        {
          rootMargin: '50px',
        }
      );

      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, imageSrc]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${imageSrc === src ? 'opacity-100' : 'opacity-50'} ${className}`}
      loading="lazy"
      {...props}
    />
  );
}