import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        const encryptedBlob = await decryptFile(
          "/models/character.enc?v=2",
          "MyCharacter12"
        );
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            character = gltf.scene;
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                const meshName = mesh.name.toLowerCase();

                if (mesh.material) {
                  if (mesh.name === "BODY.SHIRT") {
                    // Black polo shirt
                    const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                    newMat.color = new THREE.Color("#0a0a0a");
                    mesh.material = newMat;
                  } else if (mesh.name === "Pant") {
                    // Light blue jeans
                    const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                    newMat.color = new THREE.Color("#B8CCE0");
                    mesh.material = newMat;
                  } else if (
                    meshName.includes("hair") ||
                    meshName.includes("beard") ||
                    meshName.includes("brow") ||
                    meshName.includes("mustache") ||
                    meshName.includes("eyelash")
                  ) {
                    // Black hair and facial hair
                    const newMat = (mesh.material as THREE.Material).clone() as THREE.MeshStandardMaterial;
                    newMat.color = new THREE.Color("#0d0d0d");
                    mesh.material = newMat;
                  } else {
                    // Auto-detect skin-toned meshes by color range and apply dark Indian skin tone
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat && mat.color) {
                      const r = mat.color.r;
                      const g = mat.color.g;
                      const b = mat.color.b;
                      // Skin tones: high red, medium green, lower blue, red > green > blue
                      if (r > 0.55 && g > 0.3 && g < 0.78 && b > 0.18 && b < 0.62 && r > g && g > b) {
                        const newMat = mat.clone();
                        newMat.color = new THREE.Color("#6B3A2A");
                        mesh.material = newMat;
                      }
                    }
                  }
                }

                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;
              }
            });
            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;

            // Monitor scale is handled by GsapScroll.ts animations

            dracoLoader.dispose();
          },
          undefined,
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
