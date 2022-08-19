import { kdTree } from 'kd-tree-javascript'
import { NumericTileGrid } from '../TileGrid'

type Coordinate = {
  x: number
  y: number
}

export function generateDistanceMap(input) {
  const result = new NumericTileGrid(
    input.zoom, input.x, input.y, input.width, input.height
  )

  const points: Coordinate[] = []
  for (let x = input.x; x < input.x + input.width; ++x) {
    for (let y = input.y; y < input.y + input.height; ++y) {
      if (input.get(x, y)) {
        points.push({ x, y })
      }
    }
  }

  const tree = new kdTree(
    points,
    (a, b) => Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
    ),
    ['x', 'y']
  )

  const tileSize = 20000000 / Math.pow(2, input.zoom)
  for (let x = result.x; x < result.x + result.width; ++x) {
    for (let y = result.y; y < result.y + result.height; ++y) {
      const [point, distance] = tree.nearest({ x, y }, 1)[0]
      result.set(x, y, distance * tileSize)
    }
  }

  return result
}
