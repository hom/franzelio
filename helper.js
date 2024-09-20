// helper.js

// Generate a random integer between min and max inclusive
export const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Calculate the Euclidean distance between two points
export const distance = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);

// Calculate the length of a line
export const getLineLength = (line) => distance([line.x1, line.y1], [line.x2, line.y2]);

// Calculate the magnitude of a vector
export const magnitude = ({ x, y }) => Math.hypot(x, y);

// Create a vector from two points
export const makeVector = ([x1, y1], [x2, y2]) => ({ x: x2 - x1, y: y2 - y1 });

// Create a unit vector from a vector
export const unitVector = (vector) => {
  const mag = magnitude(vector);
  if (mag === 0) {
    console.warn('Attempted to create unit vector from zero-length vector, defaulting to {x:0, y:0}');
    return { x: 0, y: 0 }; // Return a default vector
  }
  return { x: vector.x / mag, y: vector.y / mag };
};

// Calculate the dot product of two vectors
export const vectorDotProduct = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

// Check if a point is out of bounds
export const isOutOfBounds = (point, world) => {
  const [x, y] = point;
  return x < 0 || x > world.width || y < 0 || y > world.height;
};

// Clamp a value between min and max
export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Adjust point to be within canvas bounds
export const clampPoint = ([x, y], world) => [
  clamp(x, 0, world.width),
  clamp(y, 0, world.height),
];
