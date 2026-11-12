export async function importGlbFile(file, scene, BABYLON, camera) {
  if (!file || !/\.(glb|gltf)$/i.test(file.name)) {
    throw new Error("Выбери файл .glb или .gltf");
  }
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("Файл больше 50 МБ — выбери модель поменьше");
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", objectUrl, scene);
    const imported = result.meshes.filter(mesh => mesh && mesh.getTotalVertices && mesh.getTotalVertices() > 0);
    if (!imported.length) throw new Error("В файле не найдена 3D-геометрия");
    const root = new BABYLON.TransformNode("imported-" + Date.now(), scene);
    imported.forEach(mesh => {
      mesh.parent = root;
      mesh.isPickable = true;
      mesh.checkCollisions = true;
    });
    const forward = camera.getDirection(BABYLON.Axis.Z);
    root.position = camera.position.add(forward.scale(4));
    root.position.y = Math.max(0, root.position.y - 1);
    root.rotationQuaternion = null;
    root.rotation.y = camera.rotation.y;
    return { root, meshes: imported };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
