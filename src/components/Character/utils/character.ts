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
        console.log("[Character] Starting decryption...");
        const encryptedBlob = await decryptFile(
          "/models/character.enc?v=2",
          "MyCharacter12"
        );
        console.log("[Character] Decryption done, size:", encryptedBlob.byteLength);
        const blobUrl = URL.createObjectURL(new Blob([encryptedBlob]));

        let character: THREE.Object3D;
        loader.load(
          blobUrl,
          async (gltf) => {
            console.log("[Character] GLTF loaded, meshes:", gltf.scene.children.length);
            character = gltf.scene;
            console.log("[Character] Compiling shaders...");
            await renderer.compileAsync(character, camera, scene);
            console.log("[Character] Shaders compiled");
            character.traverse((child: any) => {
              if (child.isMesh) {
                const mesh = child as THREE.Mesh;
                child.castShadow = true;
                child.receiveShadow = true;
                mesh.frustumCulled = true;
              }
            });
            character.scale.set(4.5, 4.5, 4.5);
            character.position.set(0, 7.5, 0);
            console.log("[Character] Scale/position set, resolving...");
            resolve(gltf);
            try {
              setCharTimeline(character, camera);
              setAllTimeline();
            } catch (tlErr) {
              console.error("[Character] Timeline setup error:", tlErr);
            }
            dracoLoader.dispose();
          },
          (progress) => {
            if (progress.total) {
              console.log("[Character] Loading:", Math.round(progress.loaded / progress.total * 100) + "%");
            }
          },
          (error) => {
            console.error("[Character] GLTF load error:", error);
            reject(error);
          }
        );
      } catch (err) {
        console.error("[Character] Decryption/setup error:", err);
        reject(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
