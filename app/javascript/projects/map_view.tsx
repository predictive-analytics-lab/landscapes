import * as React from 'react'
import { Map, View } from 'ol'
import { Control, defaults as defaultControls } from 'ol/control'
import { createEmpty as createEmptyExtent, extend, isEmpty } from 'ol/extent'
import olBaseLayer from 'ol/layer/Base'
import VectorLayer from 'ol/layer/Vector'
import { createIconElement } from './util'
import { Layer } from './state'
import { reifyLayer } from './reify_layer'
import { DBModels } from './db_models'
import { BooleanTileGrid, NumericTileGrid } from './modelling/tile_grid'

function getLayerExtent(layer: olBaseLayer) {
  if (layer instanceof VectorLayer) {
    return layer.getSource().getExtent()
  }
  else {
    return layer.getExtent()
  }
}

class FitViewControl extends Control {
  constructor() {
    const button = document.createElement("button")
    button.appendChild(createIconElement("search-location"))
    button.title = "Zoom to fit"

    const element = document.createElement("div")
    element.className = "ol-unselectable ol-control"
    element.style.left = ".5em"
    element.style.top = "4em"
    element.appendChild(button)

    super({ element })

    button.addEventListener('click', this.handleClick.bind(this), false)
  }

  handleClick() {
    const map = this.getMap()
    const view = map?.getView()
    const extent = createEmptyExtent()
    map?.getLayers().forEach(layer => {
      const layerExtent = getLayerExtent(layer)
      if (layerExtent !== undefined) {
        extend(extent, layerExtent)
      }
    })
    view?.fit(isEmpty(extent) ? view.getProjection().getExtent() : extent)
  }
}

export type ModelOutputCache = Record<number, BooleanTileGrid | NumericTileGrid>

interface MapViewProps {
  layers: Layer[]
  dbModels: DBModels
  
  initialZoom: number
  setZoom: (zoom: number) => void

  initialCenter: [number, number]
  setCenter: (center: [number, number]) => void

  modelOutputCache: ModelOutputCache
}
export const MapView = ({ layers, dbModels, initialZoom, setZoom, initialCenter, setCenter, modelOutputCache }: MapViewProps) => {
  const mapRef = React.useRef<HTMLDivElement>()
  const [map, setMap] = React.useState<Map | null>(null)
  const [allLayersVisible, setAllLayersVisible] = React.useState(true)
  const updateAllLayersVisible = (map: Map) => {
    const zoom = map.getView().getZoom()
    if (zoom !== undefined) {
      const layerMinZooms = map.getLayers().getArray()
        .filter(layer => layer.getVisible())
        .map(layer => layer.getMinZoom())
      setAllLayersVisible(zoom > Math.max(...layerMinZooms))
    }
  }

  React.useEffect(() => {
    const newMap = new Map({
      view: new View({
        center: initialCenter,
        zoom: initialZoom
      }),
      controls: defaultControls({
        zoomOptions: {
          zoomInLabel: createIconElement("search-plus"),
          zoomOutLabel: createIconElement("search-minus")
        }
      }).extend([new FitViewControl()]),
      target: mapRef.current
    });

    newMap.getView().on("change", e => {
      updateAllLayersVisible(newMap)
      const zoom = newMap.getView().getZoom()
      if (zoom !== undefined) { setZoom(zoom) }
      const center = newMap.getView().getCenter()
      if (center !== undefined) { setCenter(center as [number, number]) }
    })

    setMap(newMap)

    return () => {
      newMap.dispose()
      setMap(null)
    }
  }, [])

  React.useEffect(() => map?.setLayers(layers.map(l => reifyLayer(l, dbModels, map, modelOutputCache))), [map, layers])

  React.useEffect(() => {
    if (map === null) { return }

    map.updateSize()
    updateAllLayersVisible(map)
  })

  return <div className="flex-grow-1 position-relative">
    <div className="bg-dark" style={{ width: "100%", height: "100%" }} ref={mapRef as any}/>
    {
      !allLayersVisible &&
        <div className="bg-dark text-light rounded-sm px-3 py-2 position-absolute" style={{ bottom: "1em", left: "50%", transform: "translateX(-50%)" }}>
          <i className="fas fa-info-circle"/> Zoom in further to see all layers
        </div>
    }
  </div>
}
