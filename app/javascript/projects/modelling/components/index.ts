import { booleanDataSocket, numericDataSocket, numericNumberDataSocket } from "../socket_types"
import { BaseComponent } from "./base_component"
import { BinaryOpComponent } from "./binary_op_component"
import { MapLayerComponent, SaveMapLayer } from "./map_layer_component"
import { NumericConstantComponent } from "./numeric_constant_component"
import { UnaryOpComponent } from "./unary_op_component"
import { VariadicOpComponent } from "./variadic_op_component"
import { MaskNumericDataComponent } from "./mask_numeric_data_component"
import { NumberToNumericDatasetComponent } from "./number_to_numeric_dataset_component"
import { NevoLayerComponent } from "./nevo_layer_component"
import { OSMLandUseComponent } from "./osm_land_use_component"
import { AreaComponent } from "./area_component"
import { BarChartComponent } from "./bar_chart_component"
import { DistanceMapComponent } from "./distance_map_component"
import { CategoricalComponent } from "./categorical_component"
import { DigitalModelComponent } from "./digital_model_component"
import { ExpressionComponent, getExpressionsType } from "./expression_component"
import { NumericDatasetToNumberComponent } from "./numeric_dataset_to_numeric_component"
import { SaveModelOutputComponent, SaveModel } from "./save_model_component"
import { PrecompiledModelComponent, getDatasets } from "./dataset_component"
import { UkcehLandCoverComponent } from "./ukceh_land_cover_component"
import { CensusComponent } from "./census_component"
import { OSGreenSpacesComponent } from "./os_greenspaces_component"
import { CellAreaComponent } from "./cell_area_component"
import { ScaleFactorComponent } from "./scale_factor_component"
import { CROMEComponent } from "./crome_component"
import { RescaleComponent } from "./rescale_component"
import { Extent } from "ol/extent"
import { ReplaceNaNComponent } from "./replace_nan_component"
import { BiodiversityComponent } from "./biodiversity_component"
import { LehLandCoverComponent } from "./leh_land_cover_component"
import { MlTreeHedgeComponent } from "./ml_tree_hedge_component"
import { ATIComponent } from "./ati_component"
import { DesignationsComponent } from "./designations_component"
import { ORValComponent } from "./orval_component"
import { IMDComponent } from "./imd_component"
import { HedgerowComponent } from "./hedgerow_component"
import { ProjectPermissions } from "../../project_editor"
import { SoilComponent } from "./soil_component"
import { SegmentComponent } from "./segment_component"

export interface ProjectProperties {
  extent: Extent
  zoom: number
  mask: boolean
  maskLayer: string
  maskCQL: string
}

export function createDefaultComponents(saveMapLayer: SaveMapLayer, saveModel: SaveModel, getDatasets: getDatasets, extent: Extent, zoom: number, mask: boolean, maskLayer: string, maskCQL: string, permissions: ProjectPermissions, getCustomExpressions: getExpressionsType): BaseComponent[] {

    const projectProps: ProjectProperties = { extent, zoom, mask, maskLayer, maskCQL }

    const restrictedComponents: BaseComponent[] = []

    // Team permissions restrict some components. Add them here.
    if (permissions.DefraHedgerows) restrictedComponents.push(new HedgerowComponent(projectProps))

    // Freely available components here.
    const components : BaseComponent[] = [
      // Inputs
      new NumericConstantComponent(),
      new UkcehLandCoverComponent(projectProps),
      new LehLandCoverComponent(projectProps),
      new IMDComponent(projectProps),
      new MlTreeHedgeComponent(projectProps),
      new BiodiversityComponent(projectProps),
      new NevoLayerComponent(projectProps),
      new ORValComponent(projectProps),
      new OSMLandUseComponent(projectProps),
      new DigitalModelComponent(projectProps),
      new PrecompiledModelComponent(getDatasets, projectProps),
      new CensusComponent(projectProps),
      new OSGreenSpacesComponent(projectProps),
      new CROMEComponent(projectProps),
      new ATIComponent(projectProps),
      new DesignationsComponent(projectProps),
      new SoilComponent(projectProps),
      new SegmentComponent(projectProps),

      // Outputs
      new MapLayerComponent(saveMapLayer),
      new SaveModelOutputComponent(saveModel),

      // Conversions
      new NumberToNumericDatasetComponent(),
      new NumericDatasetToNumberComponent(),
      new CategoricalComponent(),

      // Calculations
      new AreaComponent(),
      new DistanceMapComponent(projectProps),
      new ScaleFactorComponent(),

      // Charts
      new BarChartComponent(),

      // Set operations
      new VariadicOpComponent('Union', '⋃', booleanDataSocket, booleanDataSocket, 'Set operations'),
      new VariadicOpComponent('Intersection', '⋂', booleanDataSocket, booleanDataSocket, 'Set operations'),
      new BinaryOpComponent('Set difference', '−', booleanDataSocket, booleanDataSocket, 'Set operations', projectProps),
      new VariadicOpComponent('Symmetric difference', 'Δ', booleanDataSocket, booleanDataSocket, 'Set operations'),
      new UnaryOpComponent('Complement', '′', 'postfix', booleanDataSocket, booleanDataSocket, 'Set operations', projectProps),

      // Arithmetic
      new MaskNumericDataComponent(),
      new ExpressionComponent(projectProps, getCustomExpressions),
      new BinaryOpComponent('Min', '', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Max', '', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new VariadicOpComponent('Sum', '∑', numericDataSocket, numericDataSocket, 'Arithmetic', 'Sum all inputs'),
      new VariadicOpComponent('Merge', '', numericDataSocket, numericDataSocket, 'Arithmetic', 'Merge all inputs into a single dataset, NaN logic is overridden'),
      new VariadicOpComponent('Product', '∏', numericDataSocket, numericDataSocket, 'Arithmetic'),
      new BinaryOpComponent('Add', '+', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Subtract', '−', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Multiply', '×', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Divide', '÷', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Power', '^', numericNumberDataSocket, numericNumberDataSocket, 'Arithmetic', projectProps),
      new UnaryOpComponent('Negate', '−', 'prefix', numericDataSocket, numericDataSocket, 'Arithmetic', projectProps),
      new UnaryOpComponent('Reciprocal', '⁻¹', 'postfix', numericDataSocket, numericDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Less', '<', numericNumberDataSocket, booleanDataSocket, 'Arithmetic', projectProps),
      new BinaryOpComponent('Greater', '>', numericNumberDataSocket, booleanDataSocket, 'Arithmetic', projectProps),
      new ReplaceNaNComponent(),

      // DEBUG TOOLS
      new CellAreaComponent(),
      new RescaleComponent(),

    ]
    
    return components.concat(restrictedComponents)
}
