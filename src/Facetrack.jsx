import * as THREE from "three";
import { useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { PerspectiveCamera, Html } from "@react-three/drei";
import { useControls, button, buttonGroup, folder } from "leva";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
// import * as faceDetection from "@tensorflow-models/face-detection";

import Facemesh from "./Facemesh";

//
// face detection
//

// const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
const detectorConfig = {
  runtime: "mediapipe",
  solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
};
const detector = await faceLandmarksDetection.createDetector(
  model,
  detectorConfig
);

const $video = document.createElement("video");
const stream = await navigator.mediaDevices.getUserMedia({
  audio: false,
  video: {
    facingMode: "user",
    // width: 9999, // ask for max res
  },
});
console.log("stream=", stream);
// const streamSettings = stream.getTracks()[0].getSettings(); // https://stackoverflow.com/a/47613536/133327
// console.log("streamSettings=", streamSettings);
$video.onloadedmetadata = () => {
  console.log($video.videoWidth, $video.videoHeight);
  $video.play();
};
// $video.oncanplay = () => $video.play();
$video.srcObject = stream;

let faces = [];
window.faces = faces;
async function loop() {
  if (!$video.paused) {
    faces = await detector
      .estimateFaces($video)
      .catch((err) => console.error(err));
    // console.log("faces=", faces);
  }

  requestAnimationFrame(loop);
}
loop();

// {x: 464.33902740478516, y: 258.05660247802734, z: 7.337772846221924, name: 'leftEye'}
// {x: 351.0555648803711, y: 250.44084548950195, z: 4.3555402755737305, name: 'rightEye'}

const { DEG2RAD } = THREE.MathUtils;

//
//
//

export default function Facetrack({ ipd = 66, children }) {
  const [webcamConfig, setWebcamConfig] = useControls(() => ({
    webcam: folder({
      resolution: [640, 480],
      fov: { value: 24.5, min: 0, max: 180 },
      eyeL: [464, 258, 7],
      eyeR: [351, 250, 4],
      // forehead
      // chin
      zero: button((get) => {
        setWebcamConfig({ eyeL0: [...get("webcam.eyeL")] });
        setWebcamConfig({ eyeR0: [...get("webcam.eyeR")] });
      }),
      update: button((get) => {
        // console.log(JSON.stringify(faces[0]));
        const eyeL = faces[0]?.keypoints[386];
        console.log("eyeL", eyeL);
        const eyeR = faces[0]?.keypoints[159];
        console.log("eyeR", eyeR);
        if (eyeL) setWebcamConfig({ eyeL: [eyeL.x, eyeL.y, eyeL.z] });
        if (eyeR) setWebcamConfig({ eyeR: [eyeR.x, eyeR.y, eyeR.z] });
      }),

      eyeL0: [0, 0, 0],
      eyeR0: [0, 0, 0],
    }),
  }));
  // console.log("webcamConfig=", webcamConfig);

  //

  // Une pomme de 8cm s'affiche 50px, avec une web cam 70° 640x480)
  // distance = ((480 / 50) * 8) / (2 * tan(70 / 2))
  const distFromWebcam = useCallback(
    (diamPx) => {
      return (
        ((webcamConfig.resolution[1] / diamPx) * (ipd / 1000)) /
        (2 * Math.tan((webcamConfig.fov / 2) * DEG2RAD))
      );
    },
    [webcamConfig.resolution, webcamConfig.fov, ipd]
  );
  window.dist = distFromWebcam;

  // const [offset, setOffset] = useState([0, 0, 0]);
  const [{ offset, sensitivity }, set] = useControls(() => ({
    offset: { value: [0, 0, 0], step: 0.05 },
    sensitivity: { value: 0.08, min: 0.0001, max: 2 },
  }));

  useEffect(() => {
    const _eyeL0 = new THREE.Vector3(...webcamConfig.eyeL0);
    const _eyeR0 = new THREE.Vector3(...webcamConfig.eyeR0);

    if (_eyeL0.length() > 0 && _eyeR0.length() > 0) {
      const _eyeL = new THREE.Vector3(...webcamConfig.eyeL);
      const _eyeR = new THREE.Vector3(...webcamConfig.eyeR);

      const sub0 = _eyeR0.sub(_eyeL0);
      // console.log("sub0", sub0);
      const center0 = sub0.clone().divideScalar(2).add(_eyeL0);
      // console.log("center0", center0);
      const l0 = sub0.length();
      console.log("l0", l0);

      const d0 = distFromWebcam(l0);
      console.log("d0", d0);

      const sub = _eyeR.sub(_eyeL);
      // console.log("sub", sub);
      const center = sub.clone().divideScalar(2).add(_eyeL);
      // console.log("center", center);
      const l = sub.length();
      console.log("l", l);

      const d = distFromWebcam(l);
      console.log("d", d);

      const deltaCenter = center0.sub(center);
      const { x, y } = deltaCenter;
      console.log("deltaCenter=", deltaCenter);

      const z = d0 - d;
      console.log("z", z);

      const ratio = d / l;

      set({
        offset: [x * ratio * sensitivity, y * ratio * sensitivity, -z],
      });
    }
  }, [
    webcamConfig.eyeL,
    webcamConfig.eyeR,
    webcamConfig.eyeL0,
    webcamConfig.eyeR0,
    set,
    distFromWebcam,
    sensitivity,
  ]);

  return (
    <>
      <Facemesh face={faces[0]} width={0.5}>
        <meshStandardMaterial side={THREE.DoubleSide} flatShading={true} />
      </Facemesh>
      <group position={offset}>{children}</group>
      <Html wrapperClass="toto">
        <Webcam {...webcamConfig}>
          <div className="eyeL" />
          <div className="eyeR" />
        </Webcam>
      </Html>
    </>
  );
}

export const Webcam = styled.div`
  color: yellowgreen;
  position: fixed;
  bottom: 0;
  right: 0;
  border: 1px solid;
  aspect-ratio: ${({ resolution = [1080, 720] }) =>
    `${resolution[0]} / ${resolution[1]}`};
  width: ${({ resolution }) => resolution[0]}px;
  transform: scale(0.25);
  transform-origin: bottom right;

  background-color: rgba(0, 255, 0, 0.2);
  .eyeL,
  .eyeR {
    display: inline-block;
    outline: 5px solid;
    position: absolute;
  }

  .eyeL {
    color: blue;
    left: ${({ eyeL }) => eyeL[0]}px;
    top: ${({ eyeL }) => eyeL[1]}px;
  }
  .eyeR {
    color: red;
    left: ${({ eyeR }) => eyeR[0]}px;
    top: ${({ eyeR }) => eyeR[1]}px;
  }
`;
