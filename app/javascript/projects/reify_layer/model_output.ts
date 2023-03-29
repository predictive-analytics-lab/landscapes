import BaseLayer from "ol/layer/Base"
import TileLayer from "ol/layer/Tile"
import WebGLTileLayer from "ol/layer/WebGLTile"
import DataTileSource from "ol/source/DataTile"
import { ModelOutputCache } from "../map_view"
import { BooleanTileGrid, NumericTileGrid } from "../modelling/tile_grid"
import { ModelOutputLayer } from "../state"

class ModelOutputSource extends DataTileSource {
  readonly tileLayer: BooleanTileGrid | NumericTileGrid

  constructor(tileLayer: BooleanTileGrid | NumericTileGrid) {
    super({
      loader: (z, x, y) => {
        const [min, max] = tileLayer instanceof NumericTileGrid ? tileLayer.getMinMax() : [0, 1]
        const image = new Float32Array(256 * 256)
        for (let pixelX = 0; pixelX < 256; ++pixelX) {
          for (let pixelY = 0; pixelY < 256; ++pixelY) {
            const tileX = (x + (pixelX / 256)) * Math.pow(2, tileLayer.zoom - z)
            const tileY = (y + (pixelY / 256)) * Math.pow(2, tileLayer.zoom - z)
            const tile = tileLayer.get(tileX, tileY)
            const val = typeof tile === "number" ? tile : (tile ? 1 : 0)
            image[pixelY * 256 + pixelX] = (val - min) / (max - min)
          }
        }
        return image
      },
      maxZoom: tileLayer.zoom,
      bandCount: 1,
      transition: 0,
    })
    this.tileLayer = tileLayer
  }
}

export function reifyModelOutputLayer(layer: ModelOutputLayer, existingLayer: BaseLayer | null, modelOutputCache: ModelOutputCache) {
  if (!(layer.nodeId in modelOutputCache)) {
    return new TileLayer()
  }

  const tileLayer = modelOutputCache[layer.nodeId]

  if (existingLayer instanceof WebGLTileLayer) {
    const source = existingLayer.getSource()
    if (source instanceof ModelOutputSource && source.tileLayer === tileLayer) {
      return existingLayer
    }
  }

  return new WebGLTileLayer({
    source: new ModelOutputSource(tileLayer),
    style: {
      color: [ // TODO: add heatmap rendering option
        'array',
        ['band', 1],
        ['band', 1],
        ['band', 1],
        1
      ],
    },
  })
}