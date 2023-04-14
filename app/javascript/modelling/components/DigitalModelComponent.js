import { Component, Output } from 'rete'
import { mapSocket } from '../sockets'
import { SelectControl } from '../controls/SelectControl'
import { PreviewControl } from '../controls/PreviewControl'
import { fromArrayBuffer } from 'geotiff'
import { getSize } from 'ol/extent'
import { NumericTileGrid } from '../../projects/modelling/tile_grid'
import { createXYZ } from "ol/tilegrid"

export class DigitalModelComponent extends Component {

    constructor() {

        super("Input digital model")
        this.category = "Inputs & Outputs"
        this.modelsList = [
            {
                id: 0, name: 'Digital Surface Model', source: 'lidar:116807-4_DSM'
            },
            {
                id: 1, name: 'Digital Terrian Model', source: 'lidar:116807-5_DTM'
            }
        ]
        this.geoServer = "https://landscapes.wearepal.ai/geoserver/wms?"

    }

    builder(node) {



        node.addControl(
            new SelectControl(
                'sourceId',
                () => this.modelsList,
                () => [],
                'Model'
            )
        )

        node.addControl(new PreviewControl(() =>
            node.meta.output || new NumericTileGrid(0, 0, 0, 1, 1)
        ))

        node.addOutput(new Output('dm', 'Output', mapSocket))

    }

    async retrieveModelData(extent, source, tileRange) {

        const [width, height] = [tileRange.getWidth(), tileRange.getHeight()]
        const bbox = `${extent.join(",")},EPSG:3857`

        const response = await fetch(
            this.geoServer +
            new URLSearchParams(
                {
                    service: 'WMS',
                    version: '1.3.0',
                    request: 'GetMap',
                    layers: source,
                    styles: '',
                    format: 'image/geotiff',
                    transparent: 'true',
                    width,
                    height,
                    crs: 'EPSG:3857',
                    bbox
                }
            )
        )

        const arrayBuffer = await response.arrayBuffer()
        const tiff = await fromArrayBuffer(arrayBuffer)


        return tiff

    }

    async worker(node, inputs, outputs) {

        const editorNode = this.editor.nodes.find(n => n.id === node.id)

        const digitalModel = this.modelsList.find(a => a.id === node.data.sourceId)?.source

        if (digitalModel) {

            const extent = [-20839.008676500813, 6579722.087031, 12889.487811, 6640614.986501137]

            const zoom = 20

            const tileGrid = createXYZ()
            const outputTileRange = tileGrid.getTileRangeForExtentAndZ(extent, zoom)

            const geotiff = await this.retrieveModelData(extent, digitalModel, outputTileRange)

            const image = await geotiff.getImage()

            const rasters = await geotiff.readRasters()

            const out = editorNode.meta.output = outputs['dm'] = new NumericTileGrid(zoom, outputTileRange.minX, outputTileRange.minY, outputTileRange.getWidth(), outputTileRange.getHeight(), null)

            for (let i = 0; i < rasters[0].length; i++) {

                let y = (outputTileRange.minY + Math.floor(i / image.getWidth()))
                let x = (outputTileRange.minX + i % image.getWidth())


                out.set(x, y, rasters[0][i])

            }

            out.name = node.data.name || 'dm'

            editorNode.controls.get('preview').update()
        }

    }

}