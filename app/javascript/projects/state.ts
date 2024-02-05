import { Data } from "rete/types/core/data"
import { NevoLevel, NevoProperty } from "./nevo"
import { Extent } from "ol/extent"

interface BaseLayer {
  name: string
  visible: boolean
  opacity: number
}

export interface ColourMapATI {
  ancient: [r: number, g: number, b: number, a: number]
  veteran: [r: number, g: number, b: number, a: number]
  notable: [r: number, g: number, b: number, a: number]
  public: [r: number, g: number, b: number, a: number]
  private: [r: number, g: number, b: number, a: number]
}

export interface StrokeFill {
  stroke: [r: number, g: number, b: number, a: number]
  fill: [r: number, g: number, b: number, a: number]
}

type fillType = "greyscale" | "heatmap" | "jet" | "hsv" | "hot" | "cool" | "spring" | "summer" | "autumn" | "winter" | "copper" | "WIGnBu" | "greens" | "YIOrRd" | "bluered" | "RdBu" | "picnic" | "rainbow" | "portland" | "blackbody" | "earth" | "electric" | "viridis" | "inferno" | "magma" | "plasma" | "warm" | "cool" | "rainbow-soft" | "bathymetry" | "cdom" | "chlorophyll" | "density" | "freesurface-blue" | "freesurface-red" | "oxygen" | "par" | "phase" | "salinity" | "temperature" | "turbidity" | "velocity-blue" | "velocity-green" | "cubehelix"

export interface OsmLayer extends BaseLayer {
  type: "OsmLayer"
}

export interface MapTileLayer extends BaseLayer {
  type: "MapTileLayer"
  id: number
}

export interface OverlayLayer extends BaseLayer {
  type: "OverlayLayer"
  id: number
  strokeWidth: number
  fillOpacity: number
}

export interface AtiLayer extends BaseLayer {
  type: "AtiLayer"
  colors: ColourMapATI
}

export interface ShapeLayer extends BaseLayer {
  type: "ShapeLayer"
  identifier: string
  colors: StrokeFill
}

export interface BoundaryLayer extends BaseLayer {
  type: "BoundaryLayer"
  identifier: string
}


export interface NevoLayer extends BaseLayer {
  type: "NevoLayer"
  level: NevoLevel
  property: NevoProperty
  fill: "greyscale" | "heatmap"
}

export interface CehLandCoverLayer extends BaseLayer {
  type: "CehLandCoverLayer"
  year: 2021 // TODO: allow the user to customise this
}

export interface CropMapLayer extends BaseLayer {
  type: "CropMapLayer"
  year: number
}

export interface ModelOutputLayer extends BaseLayer {
  type: "ModelOutputLayer"
  nodeId: number
  fill: fillType
  colors?: Array<[number, number, number, number]>
  overrideBounds: boolean
  bounds: [min: number, max: number] | undefined
}

export interface DatasetLayer extends BaseLayer {
  type: "DatasetLayer"
  id: number
  fill: fillType
  colors?: Array<[number, number, number, number]>
  overrideBounds: boolean
  bounds: [min: number, max: number] | undefined
  deleted?: boolean
}

export type Layer = OsmLayer | MapTileLayer | OverlayLayer | NevoLayer | CehLandCoverLayer | ModelOutputLayer | DatasetLayer | CropMapLayer | AtiLayer | ShapeLayer | BoundaryLayer

export interface Project {
  name: string
  extent?: Extent
  layers: Record<number, Layer>
  allLayers: number[]
  model: Data | null
}

export interface State {
  project: Project
  selectedLayer?: number
  hasUnsavedChanges: boolean
  autoProcessing: boolean
}

export const defaultProject: Project = {
  name: "Untitled project",
  layers: {
    1: { type: "OsmLayer", name: "OpenStreetMap", visible: true, opacity: 1 },
  },
  allLayers: [1],
  model: null
}
