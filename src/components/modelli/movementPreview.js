import { Quaternion } from "three";

// Expand the subtle exported test movement relative to its initial pose.
export function createMovementPreview(clip) {
  const preview = clip.clone();
  if (clip.name !== "Respiro_di_prova") return preview;
  const start = new Quaternion();
  const current = new Quaternion();
  for (const track of preview.tracks) {
    if (!track.name.endsWith(".quaternion")) continue;
    start.fromArray(track.values, 0);
    for (let i = 0; i < track.values.length; i += 4) {
      current.fromArray(track.values, i);
      current.slerpQuaternions(start, current.clone(), 8).normalize();
      current.toArray(track.values, i);
    }
  }
  return preview;
}
