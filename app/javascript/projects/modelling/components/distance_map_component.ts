import { Input, Node, Output } from 'rete'
import { BaseComponent } from './base_component'
import { NodeData, WorkerInputs, WorkerOutputs } from 'rete/types/core/data'
import { PreviewControl } from '../controls/preview'
import { BooleanTileGrid, NumericTileGrid } from '../tile_grid'
import { booleanDataSocket, numericDataSocket } from '../socket_types'
import { workerPool } from '../../../modelling/workerPool'
import { currentExtent } from '../bounding_box'

export class DistanceMapComponent extends BaseComponent {
    cache: Map<BooleanTileGrid, NumericTileGrid>

    constructor() {
        super('Distance map')
        this.category = "Calculations"
        this.cache = new Map()
    }

    async builder(node: Node) {
        node.addControl(new PreviewControl(() =>
            node.meta.output as any || new NumericTileGrid(0, 0, 0, 1, 1)
        ))
        node.addInput(new Input('in', 'Input', booleanDataSocket))
        node.addOutput(new Output('out', 'Distance Map', numericDataSocket))
    }

    async worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]) {
        let editorNode = this.editor?.nodes.find(n => n.id === node.id)
        if (editorNode === undefined) { return }

        if (inputs['in'].length === 0) {
            editorNode.meta.errorMessage = 'No input'
        } else {
            delete editorNode.meta.errorMessage

            let input = inputs['in'][0] as BooleanTileGrid

            if (this.cache.has(input)) {
                editorNode.meta.output = outputs['out'] = this.cache.get(input)
            } else {
                if (input.zoom > 20) input = input.rescale(20, currentExtent)

                if (input === editorNode.meta.previousInput) {
                    outputs['out'] = editorNode.meta.output
                } else {
                    editorNode.meta.previousInput = input
                    editorNode.meta.output = outputs['out'] = await workerPool.queue(async worker =>
                        worker.generateDistanceMap(input)
                    )
                }
                this.cache.set(inputs['in'][0] as BooleanTileGrid, editorNode.meta.output as NumericTileGrid)
            }


        }

        const previewControl: any = editorNode.controls.get('Preview')
        previewControl.update()
        editorNode.update()
    }

}