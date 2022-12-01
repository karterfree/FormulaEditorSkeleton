import { DataValueType } from "src/app/expression-designer/util/enums/data-value-type.enum";

export class ExpressionArgument {
	name: string;
	dataValueType: DataValueType;
	description: string;
	isRequired: boolean;

	constructor(name: string, dataValueType: DataValueType, isRequired: boolean = true) {
		this.name = name;
		this.dataValueType = dataValueType;
		this.isRequired = isRequired;
		this.description = "";
	}

}