import { useEffect, useRef } from 'react';
import { getImageContentBounds } from '../util/imageContent';

const DeviceImage = ({ src, className, alt }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active || !canvasRef.current) {
        return;
      }
      const bounds = getImageContentBounds(image);
      const canvas = canvasRef.current;
      canvas.width = bounds.width;
      canvas.height = bounds.height;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, bounds.width, bounds.height);
      context.drawImage(
        image,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        0,
        0,
        bounds.width,
        bounds.height,
      );
    };
    image.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} />;
};

export default DeviceImage;
