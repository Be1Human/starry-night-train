float travel(float t) { return t*uSpeed*.085; }
float cameraAt(float t) { return -travel(t)*uFollow; }
float headAt(float t) {
  // Whole train is outside the image when the fixed-camera loop wraps.
  return uFollow>.5 ? 1.67-travel(t) : mod(1.67-travel(t)+.9,ASPECT+1.8)-.9;
}
