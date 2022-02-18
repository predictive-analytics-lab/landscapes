class LabelsController < ApplicationController
  layout 'label_schema'
  before_action :set_label_schema, only: [:index, :new, :create]
  before_action :set_label, only: [:edit, :update, :destroy]
  
  def index
    respond_to do |format|
      format.html
      format.json { render json: @label_schema.labels.order(:index) }
    end
  end

  def new
    @label = @label_schema.labels.new
  end

  def create
    @label = @label_schema.labels.new(label_params)

    if @label.save
      redirect_to label_schema_labels_url(@label_schema)
    else
      render json: @label.errors, status: :unprocessable_entity
    end
  end

  def edit
    @label_schema = @label.label_schema
  end

  def update
    if @label.update(label_params)
      redirect_to label_schema_labels_url(@label.label_schema)
    else
      render json: @label.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @label.destroy
    redirect_to label_schema_labels_url(@label.label_schema)
  end

  private

    def set_label_schema
      @label_schema = LabelSchema.find params[:label_schema_id]
      @team = @label_schema.team
      authorize_for! @team
    end

    def set_label
      @label = Label.find(params[:id])
      @label_schema = @label.label_schema
      @team = @label_schema.team
      authorize_for! @team
    end

    def label_params
      params.require(:label).permit(:index, :label, :name, :colour)
    end
end
