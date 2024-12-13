import { Input, Node } from "rete"
import { NodeData, WorkerInputs, WorkerOutputs } from "rete/types/core/data"
import { dataSocket, propertySocket } from "../socket_types"
import { BooleanTileGrid, CategoricalTileGrid, NumericTileGrid } from "../tile_grid"
import { BaseComponent } from "./base_component"

export type SaveMapLayer = (id: number, name: string | undefined, tileGrid: BooleanTileGrid | NumericTileGrid | CategoricalTileGrid) => void

export class MapLayerComponent extends BaseComponent {
  callback: SaveMapLayer

  constructor(callback: SaveMapLayer) {
    super("Map layer")
    this.callback = callback
    this.category = "Outputs"
  }

  async builder(node: Node) {
    node.meta.toolTip = "Output a model to the map view."
    node.addInput(new Input("in", "Output", dataSocket))
    node.addInput(new Input("props", "Properties (optional)", propertySocket, true))
  }

  async worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
    const editorNode = this.editor?.nodes.find(n => n.id === node.id)
    if (editorNode === undefined) { return }

    if (inputs['in'].length === 0) {
      editorNode.meta.errorMessage = 'No input'
    }
    else {
      delete editorNode.meta.errorMessage

      const name = editorNode.data.name as string

      let out =  inputs["in"][0] as BooleanTileGrid | NumericTileGrid | CategoricalTileGrid
      const props = inputs["props"]

      out = (out instanceof NumericTileGrid && props.length > 0) ? out.clone() : out

      props.forEach((prop: any) => {
        if (out instanceof NumericTileGrid){
          out.properties[(prop.type as string).toLowerCase()] = prop.unit
        }
      })

      if (out) this.callback(node.id, name ? (name !== "" ? name.trim() : undefined) : undefined, out)
      else editorNode.meta.errorMessage = 'No input'

    }
    editorNode.update()
  }
}
