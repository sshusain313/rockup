/**
 * Utility functions for design positioning and conversion between absolute and percentage-based coordinates
 */

/**
 * Represents a rectangle with absolute pixel coordinates
 */
export interface PlaceholderRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a rectangle with percentage-based coordinates
 */
export interface PercentagePlaceholder {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

/**
 * Converts absolute pixel coordinates to percentage-based coordinates
 * @param rect The rectangle with absolute coordinates
 * @param canvasWidth Optional canvas width (defaults to 400)
 * @param canvasHeight Optional canvas height (defaults to 400)
 * @returns The rectangle with percentage-based coordinates
 */
export function convertToPercentage(
  rect: PlaceholderRect,
  canvasWidth: number = 400,
  canvasHeight: number = 400
): PercentagePlaceholder {
  return {
    xPercent: (rect.x / canvasWidth) * 100,
    yPercent: (rect.y / canvasHeight) * 100,
    widthPercent: (rect.width / canvasWidth) * 100,
    heightPercent: (rect.height / canvasHeight) * 100
  };
}

/**
 * Converts percentage-based coordinates back to absolute pixel coordinates
 * @param percentRect The rectangle with percentage-based coordinates
 * @param canvasWidth The target canvas width
 * @param canvasHeight The target canvas height
 * @returns The rectangle with absolute pixel coordinates
 */
export function convertFromPercentage(
  percentRect: PercentagePlaceholder,
  canvasWidth: number,
  canvasHeight: number
): PlaceholderRect {
  return {
    x: (percentRect.xPercent / 100) * canvasWidth,
    y: (percentRect.yPercent / 100) * canvasHeight,
    width: (percentRect.widthPercent / 100) * canvasWidth,
    height: (percentRect.heightPercent / 100) * canvasHeight
  };
}

/**
 * Calculates the center point of a rectangle
 * @param rect The rectangle
 * @returns The center point {x, y}
 */
export function getCenter(rect: PlaceholderRect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

/**
 * Creates a rectangle centered at the specified point with the given dimensions
 * @param centerX Center X coordinate
 * @param centerY Center Y coordinate
 * @param width Width of the rectangle
 * @param height Height of the rectangle
 * @returns A rectangle centered at the specified point
 */
export function createCenteredRect(
  centerX: number,
  centerY: number,
  width: number,
  height: number
): PlaceholderRect {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
  };
}

/**
 * Scales a rectangle by the specified factor
 * @param rect The original rectangle
 * @param scaleFactor The scale factor
 * @returns The scaled rectangle
 */
export function scaleRect(
  rect: PlaceholderRect,
  scaleFactor: number
): PlaceholderRect {
  const center = getCenter(rect);
  const newWidth = rect.width * scaleFactor;
  const newHeight = rect.height * scaleFactor;
  
  return createCenteredRect(center.x, center.y, newWidth, newHeight);
}
