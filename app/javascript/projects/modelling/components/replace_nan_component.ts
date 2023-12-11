import { BaseComponent } from "./base_component"
import { NodeData, WorkerInputs, WorkerOutputs } from 'rete/types/core/data'
import { Input, Node, Output } from 'rete'
import { numericDataSocket, numericNumberDataSocket } from "../socket_types"
import { NumericTileGrid } from "../tile_grid"
import { NumericConstant } from "../numeric_constant"
import { isEqual } from "lodash"

export class ReplaceNaNComponent extends BaseComponent {

    constructor() {
        super("Fill")
        this.category = "Arithmetic"
    }
    
    async builder(node: Node) {
        node.meta.toolTip = "Replace missing values with a constant"
        
        node.addInput(new Input('in', 'Input', numericDataSocket))
        node.addInput(new Input('replace', 'Replacement', numericNumberDataSocket))
        node.addOutput(new Output('out', 'Output', numericDataSocket))
    }

    
    async worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
        const editorNode = this.editor?.nodes.find(n => n.id === node.id)
        if (editorNode === undefined) { return }

        const input = inputs['in'][0] as unknown as NumericTileGrid
        const replace = inputs['replace'][0] as unknown as NumericConstant

        if(isEqual([input, replace], editorNode.meta.previousInputs)) {
            outputs['out'] = editorNode.meta.output
        }else{
            const output = outputs['out'] =  new NumericTileGrid(
                input.zoom,
                input.x,
                input.y,
                input.width,
                input.height
            )
    
            input.iterate((x, y, value) => output.set(x, y, isNaN(value) ? replace.value : value))
            editorNode.meta.previousInputs = [input, replace]
            editorNode.meta.output = output
        }

    }
}