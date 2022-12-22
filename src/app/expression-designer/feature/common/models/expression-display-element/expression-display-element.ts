import { DataValueType } from "src/app/expression-designer/util/enums/data-value-type.enum";
import { ExpressionNodeType } from "src/app/expression-designer/util/enums/expression-node-type.enum";
import { ExpressionUtilities } from "src/app/expression-designer/util/expression-utilities/expression-utilities";

export class ExpressionDisplayElement {
	content: string;
	type: ExpressionNodeType;
	dataValueType: DataValueType;
	markedToDelete: boolean;
	isActive: boolean;

	constructor(content: string, type: ExpressionNodeType, dataValueType: DataValueType) {
		this.content = content;
		this.type = type;
		this.dataValueType = dataValueType;
		this.markedToDelete = false;
		this.isActive = false;
	}

	public generateVisualizatorStyleClass(): string {
		var response = [this._generateMarkedToDeleteStyleClass()];
		response.push(this._generateTypeStyleClass());
		response.push(this._generateOperationStyleClass());
		if (this.type === ExpressionNodeType.CONSTANT) {
			response.push(this._generateDataValueTypeStyleClass());
		}
		response.push(this._generateActiveStyleClass());
		
		return response.join(" ");
	}

	private _generateActiveStyleClass(): string {
		if (this.isActive) {
			return "active";
		}
		return "";
	}

	private _generateOperationStyleClass(): string {
		if (this.type === ExpressionNodeType.SINGLEOPERATION) {
			return "s-op";
		}
		return "";
	}

	private _generateTypeStyleClass(): string {
		switch (this.type) {
			case ExpressionNodeType.COLUMN:
				return "nt nt-column";
			case ExpressionNodeType.FUNCTION:
				return "nt nt-function";
			case ExpressionNodeType.VARIABLE:
				return "nt nt-variable";
			case ExpressionNodeType.SYSTEM_SETTING:
				return "nt nt-syssetting";
			case ExpressionNodeType.SYSTEM_VALUE:
				return "nt nt-sysvalue";
			case ExpressionNodeType.UNSETTED:
				return "nt nt-undefined";
		}
		return ""
	}

	private _generateDataValueTypeStyleClass(): string {
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