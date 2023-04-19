import * as THREE from "three";
import { memo, useState, useRef, useMemo, useEffect, useCallback } from "react";
import styled from "@emotion/styled";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Grid,
  Center,
  AccumulativeShadows,
  RandomizedLight,
  Environment,
  PerspectiveCamera,
  CameraControls,
  Box,
} from "@react-three/drei";

import Suzi from "./Suzi";
import Facetrack from "./Facetrack";

export default function App() {
  return (
    <>
      <Canvas shadows>
        <Scene />
      </Canvas>
    </>
  );
}

function Scene() {
  const meshRef = useRef();
  const cameraControlsRef = useRef();

  const { camera } = useThree();

  return (
    <>
      <Center top position-z={0.1}>
        <Suzi ref={meshRef} rotation={[-0.63, 0, 0]} scale={0.1} />
      </Center>

      {/* <Box
        args={[0.1, 0.1, 0.1]}
        position={[0, 0.1 / 2, 0.1 / 2]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color="red" />
      </Box> */}

      {/* <Box args={[0.7, 0.7, 0.7]} position={[0, -0.35, 0.35]}>
        <meshStandardMaterial color="white" />
      </Box> */}

      <Facetrack />

      <Ground />
      <Shadows />

      {/* <CameraControls ref={cameraControlsRef} /> */}
      <Environment preset="city" />
    </>
  );
}

function Ground() {
  const gridConfig = {
    cellSize: 0.125,
    cellThickness: 0.5,
    cellColor: "#6f6f6f",
    sectionSize: 1,
    sectionThickness: 1,
    // sectionColor: "#9d4b4b",
    fadeDistance: 10,
    fadeStrength: 2,
    followCamera: false,
    infiniteGrid: true,
  };
  return <Grid position={[0, -0.01, 0]} args={[10.5, 10.5]} {...gridConfig} />;
}

const Shadows = memo(() => (
  <AccumulativeShadows
    temporal
    frames={100}
    color="#9d4b4b"
    colorBlend={0.5}
    alphaTest={0.9}
    scale={2}
  >
    <RandomizedLight amount={8} radius={4} position={[5, 5, -10]} />
  </AccumulativeShadows>
));
