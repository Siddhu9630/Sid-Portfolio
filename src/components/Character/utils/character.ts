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

  const loadGLTF = (url: string): Promise<GLTF> =>
    new Promise((resolve, reject) =>
      loader.load(url, resolve, undefined, reject)
    );

  const loadCharacter = () => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        // Load Avaturn model and animation file in parallel
        const [avaturnBlob, animBlob] = await Promise.all([
          decryptFile("/models/character.enc?v=3", "MyCharacter12"),
          decryptFile("/models/character_anim.enc", "MyCharacter12"),
        ]);

        const avaturnUrl = URL.createObjectURL(new Blob([avaturnBlob]));
        const animUrl = URL.createObjectURL(new Blob([animBlob]));

        const [avaturnGltf, animGltf] = await Promise.all([
          loadGLTF(avaturnUrl),
          loadGLTF(animUrl),
        ]);

        // Attach retargeted animations to the Avaturn model
        avaturnGltf.animations = animGltf.animations;

        const character = avaturnGltf.scene;
        await renderer.compileAsync(character, camera, scene);

        character.traverse((child: any) => {
          if (child.isMesh) {
            const mesh = child as THREE.Mesh;
            child.castShadow = true;
            child.receiveShadow = true;
            mesh.frustumCulled = true;
          }
        });

        character.scale.set(8, 8, 8);
        character.position.set(0, 1, 0);

        resolve(avaturnGltf);

        try {
          setCharTimeline(character, camera);
          setAllTimeline();
        } catch (tlErr) {
          console.error("[Character] Timeline setup error:", tlErr);
        }

        dracoLoader.dispose();
        URL.revokeObjectURL(avaturnUrl);
        URL.revokeObjectURL(animUrl);
      } catch (err) {
        console.error("[Character] Load error:", err);
        reject(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;
