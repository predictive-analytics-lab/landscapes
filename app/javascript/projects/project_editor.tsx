import * as React from 'react'
import { Data } from 'rete/types/core/data'
import { DBModels } from './db_models'
import { LayerPalette } from './layer_palette'
import { MapView, ModelOutputCache } from './map_view'
import { ModelView, Transform } from './model_view'
import './project_editor.css'
import { reduce } from './reducer'
import { CollapsedSidebar, Sidebar } from './sidebar'
import { defaultProject, Project } from './state'
import { Toolbar } from './toolbar'
import { debounce } from 'lodash'
import { AnalysisPanel } from './analysis_panel'
import { Extent } from 'ol/extent'

export enum Tab {
  MapView,
  ModelView,
}

interface ProjectEditorProps {
  projectId: number
  projectSource: Project
  backButtonPath: string
  dbModels: DBModels
}
export function ProjectEditor({ projectId, projectSource, backButtonPath, dbModels }: ProjectEditorProps) {
  const [state, dispatch] = React.useReducer(reduce, {
    project: { ...defaultProject, ...projectSource },
    hasUnsavedChanges: false,
    autoProcessing: false
  })
  const [sidebarVisible, setSidebarVisible] = React.useState(true)
  const [layerPaletteVisible, setLayerPaletteVisible] = React.useState(false)
  const [currentTab, setCurrentTab] = React.useState(Tab.MapView)

  //hardcoded to the UK, perhaps later base this on the bounding box?

  const [mapViewZoom, setMapViewZoom] = React.useState(6)
  const [mapViewCenter, setMapViewCenter] = React.useState<[number, number]>([-254382.430133, 7083572.285244])


  const [modelViewTransform, setModelViewTransform] = React.useState<Transform>({ x: 0, y: 0, k: 1 })
  const [modelOutputCache, setModelOutputCache] = React.useState<ModelOutputCache>({})
  const [isProcessing, setProcessing] = React.useState(false)
  const [process, setProcess] = React.useState(false)
  const [selectedArea, setSelectedArea] = React.useState<Extent|null>(null)

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
        autoProcessing={state.autoProcessing}
        setAutoProcessing={autoprocessing => dispatch({ type: "SetAutoprocessing", autoprocessing })}
        manualProcessing={() => {
          setProcessing(true)
          const staggeredProcess = debounce(() => {
            setProcess(true)
          }, 750)
          staggeredProcess()
        }}
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
            selectedArea={selectedArea}
            setSelectedArea={setSelectedArea}
          />
          {
            layerPaletteVisible &&
            <LayerPalette
              hide={() => setLayerPaletteVisible(false)}
              addLayer={layer => dispatch({ type: "AddLayer", layer })}
              dbModels={dbModels}
            />
          }
          { 
            selectedArea !== null && 
            <AnalysisPanel 
              selectedArea={selectedArea}
              setSelectedArea={setSelectedArea}
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
                getLayerData={id => modelOutputCache[id] ? modelOutputCache[id].getStats() : { min: 0, max: 0, type: undefined }
                }
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
        />
      </div>
    </div>
  )
}
