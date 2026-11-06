import { MathUtils, Quaternion, Vector3 } from "three";

export function createLegSpread(root) {
  const left = root.getObjectByName("Castell_Thigh_L");
  const right = root.getObjectByName("Castell_Thigh_R");
  const kneeLeft = root.getObjectByName("Castell_Knee_L");
  const kneeRight = root.getObjectByName("Castell_Knee_R");
  const hips = root.getObjectByName("Castell_Hips");
  if (![left, right, kneeLeft, kneeRight, hips].every((bone) => bone?.isBone)) {
    return null;
  }
  root.updateMatrixWorld(true);
  const baseHips = hips.position.clone();
  const modelRotation = root.getWorldQuaternion(new Quaternion());
  const legs = [
    [left, kneeLeft, 1],
    [right, kneeRight, -1],
  ].map(([thigh, knee, side]) => {
    const direction = knee
      .getWorldPosition(new Vector3())
      .sub(thigh.getWorldPosition(new Vector3()))
      .normalize();
    const outward = new Vector3(side, 0, 0).applyQuaternion(modelRotation);
    const axis = new Vector3().crossVectors(direction, outward).normalize();
    axis.applyQuaternion(
      thigh.parent.getWorldQuaternion(new Quaternion()).invert(),
    );
    return {
      thigh,
      base: thigh.quaternion.clone(),
      axis,
      angle: direction.angleTo(outward),
    };
  });
  let legLength = kneeLeft.position.length() + 0.69;
  root.traverse((object) => {
    const length = object.userData.castellLegLength;
    if (Number.isFinite(length) && length > 0) legLength = length;
  });
  const rotation = new Quaternion();
  let target = 0;
  let current = 0;
  return {
    setDegrees(degrees) {
      target = MathUtils.clamp(degrees, 0, 180) / 180;
    },
    update(delta) {
      current = MathUtils.damp(current, target, 5, delta);
      for (const leg of legs) {
        leg.thigh.quaternion
          .copy(leg.base)
          .premultiply(
            rotation.setFromAxisAngle(leg.axis, leg.angle * current),
          );
      }
      // Lower the pelvis as the legs open; preserve the original pose when closed.
      hips.position.copy(baseHips);
      hips.position.y -= legLength * (1 - Math.cos(legs[0].angle * current));
    },
  };
}
