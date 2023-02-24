import * as React from 'react'
import { Engine, NodeEditor } from 'rete'
import ConnectionPlugin from 'rete-connection-plugin'
import ContextMenuPlugin from 'rete-context-menu-plugin'
import MinimapPlugin from 'rete-minimap-plugin'
import ReactRenderPlugin from 'rete-react-render-plugin'
import { Data } from 'rete/types/core/data'
import { TestComponent } from './modelling/components/test_component'

import "./model_view.css"

// Rete doesn't export `Transform`, so we have to re-define it ourselves
export interface Transform {
  k: number;
  x: number;
  y: number;
}
export interface ModelViewProps {
  initialTransform: Transform
  setTransform: (transform: Transform) => void
  initialModel: Data | null
  setModel: (model: Data) => void
}
export function ModelView({ initialTransform, setTransform, initialModel, setModel }: ModelViewProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (ref.current === null) return

    const editor = new NodeEditor("landscapes@1.0.0", ref.current)
    editor.view.area.transform = initialTransform
    editor.view.area.update()
    const updateTransform = () => setTransform(editor.view.area.transform)
    editor.on("zoomed", updateTransform)
    editor.on("translated", () => updateTransform)
    editor.use(ConnectionPlugin)
    editor.use(MinimapPlugin)
    editor.use(ReactRenderPlugin)
    editor.use(ContextMenuPlugin, {
      searchBar: false, // Too buggy
      delay: 100,
      rename: component => component.contextMenuName || component.name,
      allocate: component => {
        if (component.deprecated) {
          return null
        }
        else {
          return component.category ? [component.category] : []
        }
      },
    })
    const component = new TestComponent()
    editor.register(component)
    //const engine = new Engine("landscapes@1.0.0")

    if (initialModel !== null) {
      editor.fromJSON(initialModel)
    }

    const save = () => {
      // Use JSON.stringify and JSON.parse to perform a deep copy
      setModel(JSON.parse(JSON.stringify(editor.toJSON())))
    }

    editor.on(
      ["nodecreated", "noderemoved", "connectioncreated", "connectionremoved", "nodetranslated", "nodedragged"],
      save
    )

    return () => {
      save()
      editor.destroy()
      //engine.destroy()
    }
  }, [ref])

  return <div className="flex-grow-1" ref={ref}></div>
}
