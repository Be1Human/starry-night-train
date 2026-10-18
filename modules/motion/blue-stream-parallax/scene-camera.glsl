float travel(float t){return t*uSpeed*.028;}
float cameraAt(float t){return -travel(t)*uFollow;}
float headAt(float t){return uFollow>.5?1.573-travel(t):mod(1.573-travel(t)+.5,ASPECT+1.0)-.5;}
// The reused locomotive geometry operates in its original local units.
float trainLocalTravel(float t){return travel(t)/TRAIN_SCALE.x;}
