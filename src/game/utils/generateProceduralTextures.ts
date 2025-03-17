export function generateProceduralTextures(scene: Phaser.Scene) {
  // Generate a simple weapon texture if not loaded
  if (!scene.textures.exists('weapon')) {
    const weaponGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
    weaponGraphics.fillStyle(0xaaaaaa);
    weaponGraphics.fillRect(0, 0, 10, 30);
    weaponGraphics.fillStyle(0x666666);
    weaponGraphics.fillRect(0, 30, 10, 10);
    weaponGraphics.generateTexture('weapon', 10, 40);
    weaponGraphics.destroy();
  }
  
  // Generate effect textures
  const effectNames = ['attack-effect', 'hit-effect', 'pickup-effect', 'drop-effect'];
  const effectColors = [0xff0000, 0xffff00, 0x00ff00, 0x0000ff];
  
  effectNames.forEach((name, index) => {
    if (!scene.textures.exists(name)) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(effectColors[index], 0.8);
      graphics.fillCircle(16, 16, 16);
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeCircle(16, 16, 14);
      graphics.generateTexture(name, 32, 32);
      graphics.destroy();
    }
  });
  
  // Generate tile textures
  if (!scene.textures.exists('grass-tile')) {
    const grassGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
    grassGraphics.fillStyle(0x33aa33);
    grassGraphics.fillRect(0, 0, 32, 32);
    // Add some texture to the grass
    grassGraphics.fillStyle(0x44bb44);
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(2, 30);
      const y = Phaser.Math.Between(2, 30);
      grassGraphics.fillRect(x, y, 2, 2);
    }
    grassGraphics.generateTexture('grass-tile', 32, 32);
    grassGraphics.destroy();
  }
  
  if (!scene.textures.exists('stone-tile')) {
    const stoneGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
    stoneGraphics.fillStyle(0x888888);
    stoneGraphics.fillRect(0, 0, 32, 32);
    // Add some texture to the stone
    stoneGraphics.fillStyle(0x666666);
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(2, 30);
      const y = Phaser.Math.Between(2, 30);
      stoneGraphics.fillRect(x, y, 3, 3);
    }
    stoneGraphics.generateTexture('stone-tile', 32, 32);
    stoneGraphics.destroy();
  }
  
  if (!scene.textures.exists('wall-tile')) {
    const wallGraphics = scene.make.graphics({ x: 0, y: 0, add: false });
    wallGraphics.fillStyle(0x555555);
    wallGraphics.fillRect(0, 0, 32, 32);
    // Add brick pattern
    wallGraphics.lineStyle(1, 0x444444, 1);
    wallGraphics.strokeRect(0, 0, 32, 32);
    wallGraphics.strokeRect(0, 16, 32, 0);
    wallGraphics.strokeRect(16, 0, 0, 16);
    wallGraphics.strokeRect(8, 16, 0, 16);
    wallGraphics.strokeRect(24, 16, 0, 16);
    wallGraphics.generateTexture('wall-tile', 32, 32);
    wallGraphics.destroy();
  }
  
  return {
    weapon: 'weapon',
    effects: effectNames,
    tiles: ['grass-tile', 'stone-tile', 'wall-tile']
  };
}
