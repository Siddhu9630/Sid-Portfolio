import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { eyebrowBoneNames, typingBoneNames } from "../../../data/boneData";

const setAnimations = (gltf: GLTF) => {
  let character = gltf.scene;
  let mixer = new THREE.AnimationMixer(character);

  // Typing animation disabled — retargeted arm rotations from sitting pose
  // cause severe bone deformation on the Avaturn standing model

  function startIntro() {
    if (!gltf.animations || gltf.animations.length === 0) return;
    // Start blink immediately instead of intro animation
    const blink = gltf.animations.find((c) => c.name === "Blink");
    if (blink) mixer.clipAction(blink).play().fadeIn(0.5);
  }

  function hover(gltf: GLTF, hoverDiv: HTMLDivElement) {
    const eyeBrowUpAction = createBoneAction(gltf, mixer, "browup", eyebrowBoneNames);
    let isHovering = false;
    if (eyeBrowUpAction) {
      eyeBrowUpAction.setLoop(THREE.LoopOnce, 1);
      eyeBrowUpAction.clampWhenFinished = true;
      eyeBrowUpAction.enabled = true;
    }
    const onHoverFace = () => {
      if (eyeBrowUpAction && !isHovering) {
        isHovering = true;
        eyeBrowUpAction.reset();
        eyeBrowUpAction.enabled = true;
        eyeBrowUpAction.setEffectiveWeight(4);
        eyeBrowUpAction.fadeIn(0.5).play();
      }
    };
    const onLeaveFace = () => {
      if (eyeBrowUpAction && isHovering) {
        isHovering = false;
        eyeBrowUpAction.fadeOut(0.6);
      }
    };
    if (!hoverDiv) return;
    hoverDiv.addEventListener("mouseenter", onHoverFace);
    hoverDiv.addEventListener("mouseleave", onLeaveFace);
    return () => {
      hoverDiv.removeEventListener("mouseenter", onHoverFace);
      hoverDiv.removeEventListener("mouseleave", onLeaveFace);
    };
  }

  return { mixer, startIntro, hover };
};

const createBoneAction = (
  gltf: GLTF,
  mixer: THREE.AnimationMixer,
  clipName: string,
  boneNames: string[]
): THREE.AnimationAction | null => {
  const clip = THREE.AnimationClip.findByName(gltf.animations, clipName);
  if (!clip) return null;
  if (!boneNames.length) return mixer.clipAction(clip);
  const filtered = new THREE.AnimationClip(
    clip.name + "_filtered",
    clip.duration,
    clip.tracks.filter((t) => boneNames.some((b) => t.name.includes(b)))
  );
  return mixer.clipAction(filtered);
};

export default setAnimations;
