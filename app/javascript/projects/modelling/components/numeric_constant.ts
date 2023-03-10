import { Node, Output } from "rete"
import { NodeData, WorkerInputs, WorkerOutputs } from "rete/types/core/data"
import { TextControl } from "../controls/text"
import { numberSocket } from "../socketTypes"
import { BaseComponent } from "./base_component"

export class NumericConstantComponent extends BaseComponent {
  constructor() {
    super('Numeric constant')
    this.category = 'Inputs & Outputs'
  }
  
  async builder(node: Node) {
    if (!('value' in node.data)) {
      node.data.value = "0"
    }
    node.addControl(new TextControl('value'))
    node.addOutput(new Output('out', this.name, numberSocket))
  }

  worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
  }
}
