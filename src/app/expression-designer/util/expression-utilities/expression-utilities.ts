import { ExpressionNodeType } from "../enums/expression-node-type.enum";

export class ExpressionUtilities {
    public static isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	public static generateGUID(): string {
		return ExpressionUtilities.uuidPart() + ExpressionUtilities.uuidPart() + '-' + ExpressionUtilities.uuidPart() + '-' + ExpressionUtilities.uuidPart() + '-' +
            ExpressionUtilities.uuidPart() + '-' + ExpressionUtilities.uuidPart() + ExpressionUtilities.uuidPart() + ExpressionUtilities.uuidPart();
	}

	private static uuidPart(): string {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}

	public static isComplexType(type: ExpressionNodeType): boolean {
		switch (type) {
			case ExpressionNodeType.UNSETTED:
			case ExpressionNodeType.COLUMN:
			case ExpressionNodeType.FUNCTION:
			case ExpressionNodeType.SYSTEM_SETTING:
			case ExpressionNodeType.SYSTEM_VALUE:
			case ExpressionNodeType.VARIABLE:
				return true;
			default:
				return false;
		}
	}
}
