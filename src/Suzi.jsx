import * as THREE from "three";
import { forwardRef, useLayoutEffect } from "react";
import { applyProps } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useControls } from "leva";

import { FlakesTexture } from "three/examples/jsm/textures/FlakesTexture";

const Suzi = forwardRef((props, ref) => {
  const { scene, materials } = useGLTF(
    "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/models/suzanne-high-poly/model.gltf"
  );

  const color = "orange";
  // const { color } = useControls({
  //   color: "orange",
  // });

  useLayoutEffect(() => {
    scene.traverse(
      (obj) => obj.isMesh && (obj.receiveShadow = obj.castShadow = true)
    );
    applyProps(materials.default, {
      color,
      roughness: 0,
      normalMap: new THREE.CanvasTexture(
        new FlakesTexture(),
        THREE.UVMapping,
        THREE.RepeatWrapping,
        THREE.RepeatWrapping
      ),
      "normalMap-flipY": false,
      "normalMap-repeat": [40, 40],
      normalScale: [0.05, 0.05],
    });
  }, [scene, materials, color]);
  return <primitive object={scene} {...props} />;
});

export default Suzi;
