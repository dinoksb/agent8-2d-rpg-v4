/**
 * Generates a simple 2D map with grass, stone, and walls
 * @param width Map width in tiles
 * @param height Map height in tiles
 * @returns 2D array representing the map (0 = grass, 1 = stone, 2 = wall)
 */
export function generateMap(width: number, height: number): number[][] {
  const map: number[][] = [];
  
  // Initialize map with grass
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = 0; // Default to grass
    }
  }
  
  // Add border walls
  for (let x = 0; x < width; x++) {
    map[0][x] = 2; // Top wall
    map[height - 1][x] = 2; // Bottom wall
  }
  
  for (let y = 0; y < height; y++) {
    map[y][0] = 2; // Left wall
    map[y][width - 1] = 2; // Right wall
  }
  
  // Add some random stone patches
  const numStoneClusters = Math.floor(width * height * 0.01);
  for (let i = 0; i < numStoneClusters; i++) {
    const clusterX = Math.floor(Math.random() * (width - 4)) + 2;
    const clusterY = Math.floor(Math.random() * (height - 4)) + 2;
    const clusterSize = Math.floor(Math.random() * 5) + 3;
    
    for (let y = clusterY; y < clusterY + clusterSize && y < height - 1; y++) {
      for (let x = clusterX; x < clusterX + clusterSize && x < width - 1; x++) {
        if (Math.random() < 0.7) {
          map[y][x] = 1; // Stone
        }
      }
    }
  }
  
  // Add some random walls
  const numWallClusters = Math.floor(width * height * 0.005);
  for (let i = 0; i < numWallClusters; i++) {
    const wallX = Math.floor(Math.random() * (width - 4)) + 2;
    const wallY = Math.floor(Math.random() * (height - 4)) + 2;
    const wallLength = Math.floor(Math.random() * 6) + 3;
    const isHorizontal = Math.random() < 0.5;
    
    if (isHorizontal) {
      for (let x = wallX; x < wallX + wallLength && x < width - 1; x++) {
        map[wallY][x] = 2; // Wall
      }
    } else {
      for (let y = wallY; y < wallY + wallLength && y < height - 1; y++) {
        map[y][wallX] = 2; // Wall
      }
    }
  }
  
  // Ensure the center area is clear for player spawn
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const clearRadius = 3;
  
  for (let y = centerY - clearRadius; y <= centerY + clearRadius; y++) {
    for (let x = centerX - clearRadius; x <= centerX + clearRadius; x++) {
      if (y > 0 && y < height - 1 && x > 0 && x < width - 1) {
        map[y][x] = 0; // Clear to grass
      }
    }
  }
  
  return map;
}
