import { DataValueType } from "src/app/expression-designer/util/enums/data-value-type.enum";
import { ExpressionNodeType } from "src/app/expression-designer/util/enums/expression-node-type.enum";

export class ExpressionDisplayElement {
	content: string;
	type: ExpressionNodeType;
	dataValueType: DataValueType;
	markedToDelete: boolean;

	constructor(content: string, type: ExpressionNodeType, dataValueType: DataValueType) {
		this.content = content;
		this.type = type;
		this.dataValueType = dataValueType;
		this.markedToDelete = false;
	}

	public generateVisualizatorStyleClass(): string {
		return [this._generateDateAndTypeStyleClass(), this._generateMarkedToDeleteStyleClass()].join(" ");
	}

	private _generateDateAndTypeStyleClass(): string {
		switch (this.type) {
			case ExpressionNodeType.COLUMN:
				return "dvt-column";
			case ExpressionNodeType.FUNCTION:
				return "dvt-function";
            case ExpressionNodeType.VARIABLE:
                return "dvt-function";
		}
		switch (this.dataValueType) {
			case DataValueType.FLOAT:
			case DataValueType.INTEGER:
				return "dvt-number";
			case DataValueType.TEXT:
				return "dvt-text";
			default:
				return "dvt-undefined";
		}
	}
	private _generateMarkedToDeleteStyleClass(): string {
		return this.markedToDelete
			? "marked-to-delete"
			: ""
		}
}