import * as React from 'react'
import { Data } from 'rete/types/core/data'
import { DBModels } from './db_models'
import { LayerPalette } from './layer_palette'
import { DatasetCache, MapView, ModelOutputCache } from './map_view'
import { ModelView, Transform } from './model_view'
import './project_editor.css'
import { reduce } from './reducer'
import { CollapsedSidebar, Sidebar } from './sidebar'
import { DatasetLayer, defaultProject, Layer, ModelOutputLayer, Project } from './state'
import { Toolbar } from './toolbar'
import { debounce } from 'lodash'
import { getDataset, getDatasets, saveModelOutput } from './saved_dataset'
import { TileGridJSON } from './modelling/tile_grid'
import { AnalysisPanel } from './analysis_panel'
import { Extent } from 'ol/extent'
import { currentExtent, zoomFromExtent } from './modelling/bounding_box'

export enum Tab {
  MapView,
  ModelView,
}

interface ProjectEditorProps {
  projectId: number
  projectSource: Project
  backButtonPath: string
  dbModels: DBModels
  teamId: number
  teamName: string
}
export function ProjectEditor({ projectId, projectSource, backButtonPath, dbModels, teamId, teamName }: ProjectEditorProps) {
  const [state, dispatch] = React.useReducer(reduce, {
    project: { ...defaultProject, ...projectSource },
    hasUnsavedChanges: false,
    autoProcessing: false
  })

  // Retrieve the project extent from the project source, or use the current extent if not present. Calculate the zoom level from the extent.
  const projectExtent: Extent = projectSource.extent ? projectSource.extent : currentExtent
  const projectZoom: number = zoomFromExtent(projectExtent)

  const [sidebarVisible, setSidebarVisible] = React.useState(true)
  const [layerPaletteVisible, setLayerPaletteVisible] = React.useState(false)
  const [currentTab, setCurrentTab] = React.useState(Tab.MapView)

  const [showAP, setShowAP] = React.useState(false)
  const [selectedArea, setSelectedArea] = React.useState<Extent | null>(null)
  const [selectedLayer, setSelectedLayer] = React.useState<Layer | null>(null)

  // Set the initial map view zoom and center to the project extent.
  const [mapViewZoom, setMapViewZoom] = React.useState(9)
  const [mapViewCenter, setMapViewCenter] = React.useState<[number, number]>([(projectExtent[0]+projectExtent[2])/2, (projectExtent[1]+projectExtent[3])/2])
  const [showExtent, setShowExtent] = React.useState(false)


  const [modelViewTransform, setModelViewTransform] = React.useState<Transform>({ x: 0, y: 0, k: 1 })
  const [modelOutputCache, setModelOutputCache] = React.useState<ModelOutputCache>({})
  const [datasetOutputCache, setDatasetOutputCache] = React.useState<DatasetCache>({})

  const [isProcessing, setProcessing] = React.useState(false)
  const [isLoading, setLoading] = React.useState(false)
  const [process, setProcess] = React.useState(false)

  const saveProject = async () => {
    const method = 'PATCH'

    const headers = new Headers()
    headers.set('X-CSRF-Token', (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement).content)

    const body = new FormData()
    body.set('project[source]', JSON.stringify(state.project))

    const response = await fetch(`/projects/${projectId}`, { method, headers, body })

    if (response.ok) {
      dispatch({ type: "FinishSave" })
    }
    else {
      throw new Error(response.statusText)
    }
  }

  return (
    <div style={{ height: "calc(100vh - 3.5rem)" }} className="d-flex flex-column">
      <Toolbar
        backButtonPath={backButtonPath}
        projectName={state.project.name}
        hasUnsavedChanges={state.hasUnsavedChanges}
        setProjectName={name => dispatch({ type: "SetProjectName", name })}
        saveProject={saveProject}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isProcessing={isProcessing}
        isLoading={isLoading}
        autoProcessing={state.autoProcessing}
        setAutoProcessing={autoprocessing => dispatch({ type: "SetAutoprocessing", autoprocessing })}
        manualProcessing={() => {
          setProcessing(true)
          const staggeredProcess = debounce(() => {
            setProcess(true)
          }, 750)
          staggeredProcess()
        }}
        setShowAP={() => setShowAP(!showAP)}
        showAP={showAP}
        setShowExtent={setShowExtent}
        zoomLevel={projectZoom}
      />
      <div className="flex-grow-1 d-flex">
        {currentTab == Tab.MapView && <>
          <MapView
            layers={state.project.allLayers.map(id => state.project.layers[id])}
            dbModels={dbModels}
            initialZoom={mapViewZoom}
            setZoom={setMapViewZoom}
            initialCenter={mapViewCenter}
            setCenter={setMapViewCenter}
            modelOutputCache={modelOutputCache}
            datasetCache={datasetOutputCache}
            loadTeamDataset={(layer: DatasetLayer) => {
              if (isLoading) return // prevent spamming the server
              if (layer.deleted) return // prevent loading deleted layers

              setLoading(true)
              getDataset(layer.id, teamId, (err, out) => {
                if (out && !err) {
                  datasetOutputCache[layer.id] = out
                  setLoading(false)
                }
                else {

                  layer.deleted = true
                  setLoading(false)
                }
              })
            }}
            setSelectedArea={setSelectedArea}
            selectedArea={selectedArea}
            selected={showAP}
            setSelected={setShowAP}
            projectExtent={projectExtent}
            showProjectExtent={showExtent}
          />
          {
            layerPaletteVisible &&
            <LayerPalette
              hide={() => setLayerPaletteVisible(false)}
              addLayer={layer => dispatch({ type: "AddLayer", layer })}
              dbModels={dbModels}
              getTeamDatasets={() => getDatasets(teamId)}
              teamName={teamName}
            />
          }
          {
            showAP &&
            <AnalysisPanel
              setShowAP={() => setShowAP(false)}
              selectedArea={selectedArea}
              selectedLayer={selectedLayer}
              layerStats={(layer: ModelOutputLayer | DatasetLayer) => {
                const cache = layer.type === "ModelOutputLayer" ? modelOutputCache : datasetOutputCache
                const id = layer.type === "ModelOutputLayer" ? layer.nodeId : layer.id
                return cache[id] ? cache[id] : null
              }}
              currentTab={currentTab}
            />
          }
          {
            sidebarVisible
              ? <Sidebar
                state={state}
                selectLayer={id => dispatch({ type: "SelectLayer", id })}
                mutateLayer={(id, data) => dispatch({ type: "MutateLayer", id, data })}
                deleteLayer={id => dispatch({ type: "DeleteLayer", id })}
                setLayerOrder={order => dispatch({ type: "SetLayerOrder", order })}
                showLayerPalette={() => setLayerPaletteVisible(true)}
                hide={() => setSidebarVisible(false)}
                getLayerData={(layer: ModelOutputLayer | DatasetLayer) => {
                  const cache = layer.type === "ModelOutputLayer" ? modelOutputCache : datasetOutputCache
                  const id = layer.type === "ModelOutputLayer" ? layer.nodeId : layer.id
                  return cache[id] ? cache[id].getStats() : { min: 0, max: 0, type: undefined }
                }}
                setSelectedLayer={setSelectedLayer}
                selectedLayer={selectedLayer}
              />
              : <CollapsedSidebar show={() => setSidebarVisible(true)} />
          }
        </>}
        <ModelView
          visible={currentTab === Tab.ModelView}
          initialTransform={modelViewTransform}
          setTransform={setModelViewTransform}
          initialModel={state.project.model}
          setModel={(model: Data) => dispatch({ type: "SetModel", model })}
          createOutputLayer={(nodeId: number) => dispatch({
            type: "AddLayer",
            layer: {
              name: "Untitled model output",
              visible: true,
              opacity: 1,
              type: "ModelOutputLayer",
              nodeId,
              fill: "greyscale",
              colors: [],
              overrideBounds: false,
              bounds: undefined
            }
          })}
          deleteOutputLayer={(nodeId: number) =>
            dispatch({ type: "DeleteModelOutputLayer", nodeId })
          }
          saveMapLayer={(id, tileGrid) => {
            const cache = modelOutputCache
            cache[id] = tileGrid
            setModelOutputCache(cache)
          }}
          setProcessing={setProcessing}
          autoProcessing={state.autoProcessing}
          process={process}
          setProcess={setProcess}
          saveModel={(name: string, json: TileGridJSON) => saveModelOutput(name, json, teamId)}
          getDatasets={() => getDatasets(teamId)}
          extent={projectExtent}
          zoom={projectZoom}
        />
      </div>
    </div>
  )
}
