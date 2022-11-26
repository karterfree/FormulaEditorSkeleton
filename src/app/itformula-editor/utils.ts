export class FormulaUtilities {
    public static isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	public static generateGUID(): string {
		return FormulaUtilities.uuidPart() + FormulaUtilities.uuidPart() + '-' + FormulaUtilities.uuidPart() + '-' + FormulaUtilities.uuidPart() + '-' +
			FormulaUtilities.uuidPart() + '-' + FormulaUtilities.uuidPart() + FormulaUtilities.uuidPart() + FormulaUtilities.uuidPart();
	}

	private static uuidPart(): string {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}


}