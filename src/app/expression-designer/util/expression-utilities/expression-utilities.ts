import { ExpressionNodeType } from "../enums/expression-node-type.enum";

export class ExpressionUtilities {
    public static isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	public static isArray(value: any): boolean {
		return Array.isArray(value);
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

	public static areArrayEqual(first: any[] | null | undefined, second: any[] | null | undefined): boolean {
		if (first === second) {
			return true;
		}
		if (first == null || first === undefined || second == null || second === undefined) {
			return false;
		}
		if (first.length != second.length) {
			return false;
		}
		for (let i = 0; i < first.length; i++) {
			let fCount = first.filter(x=>x === first[i]).length;
			let sCount = second.filter(x=>x === first[i]).length;
			if (fCount === 0 || sCount === 0 || fCount !== sCount) {
				return false;
			}
		}
		return true;
	}

}
