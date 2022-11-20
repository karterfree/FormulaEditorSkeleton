import { DataValueType } from "./enums";

export enum FormulaElementType {
	UNSETTED,
	CONSTANT,
	SINGLEOPERATION,
	COLUMN
}

export class FormulaDisplayElement {
	content: string;
	type: FormulaElementType;
	dataValueType: DataValueType;

	constructor(content: string, type: FormulaElementType, dataValueType: DataValueType) {
		this.content = content;
		this.type = type;
		this.dataValueType = dataValueType;
	}

	public generateVisualizatorStyleClass(): string {
		switch (this.type) {
			case FormulaElementType.COLUMN:
				return "dvt-column";
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
}

export class FormulaElement {
	private _type: FormulaElementType = FormulaElementType.UNSETTED;
	private _dataValueType: DataValueType = DataValueType.UNSETTED;
	private _content: string = '';
	private _metaPath: string = '';

	public get content() {
		return this._content;
	}

	public set content(content: string) {
		this._content = content;
	}

	public get metaPath() {
		return this._metaPath;
	}

	public set metaPath(metaPath: string) {
		this._metaPath = metaPath;
	}

	public get type(): FormulaElementType {
		return this._type;
	}

	public set type(type: FormulaElementType) {
		if (type != this._type) {
			this._type = type;
		}
	}

	public get dataValueType(): DataValueType {
		return this._dataValueType;
	}

	public set dataValueType(dataValueType: DataValueType) {
		if (dataValueType != this._dataValueType) {
			this._dataValueType = dataValueType;
		}
	}

	public get contentLength(): number {
		return this.content.length;
	}

	public generateDisplayElement(): FormulaDisplayElement {
		return new FormulaDisplayElement(this.content, this.type, this.dataValueType);
	}

	public canChangeType(): boolean {
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

	public canChangeDataValueType(): boolean {
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		return true;
	}

	public append(char: string): void {
		this._content += char;
	}

	public insertAt(char: string, position: number): void {
		if (position > this.content.length) {
			return this.append(char);
		}
		this.content = [this.content.slice(0, position), char, this.content.slice(position)].join('');
	}

	public removeByBackspace(position: number): boolean {
		if (position > 0) {
			this.content = [this.content.slice(0, position-1), this.content.slice(position)].join('');
			return true;
		}
		return false;
	}

	public removeByDelete(position: number): boolean {
		if (position < this.contentLength) {
			this.content = [this.content.slice(0, position), this.content.slice(position + 1)].join('');
			return true;
		}
		return false;
	}

	public clone() {
		var clone = new FormulaElement();
		clone.content = this.content;
		clone.type = this.type;
		clone.dataValueType = this.dataValueType;
		return clone;
	}

	public split(position: number): FormulaElement | null {
		if (position > 0 && position < this.contentLength) {
			var leftContent = this.content.slice(0, position);
			var rightContent = this.content.slice(position);
			var clone = this.clone();
			clone.content = rightContent;
			this.content = leftContent;
			return clone;
		}
		return null;
	}

	public canBeSplitted(): boolean {
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		return true;
	}

	public mayBeExtendent(): boolean {
		return this.type === FormulaElementType.COLUMN && this.dataValueType === DataValueType.LOOKUP;
	}

	public isEmpty(): boolean {
		return this.content === null || this.content === undefined || this.content === "";
	}

	public merge(source: FormulaElement | null): boolean {
		if (!source) {
			return false;
		}
		if (source.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		this.content += source.content;
		return true;
	}

	public IsFirstCaretIndex(caretIndex: number): boolean {
		return caretIndex == 0;
	}

	public IsLastCaretIndex(caretIndex: number): boolean {
		return caretIndex >= this.contentLength;
	}

	public isEditableString(): boolean {
		return this.canKeyEdit() && this.dataValueType === DataValueType.TEXT;
	}

	public canKeyEdit(): boolean {
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

}

export class FormulaManager {
	private _formulaElements: FormulaElement[];

	constructor() {
		this._formulaElements = [];
	}

	public getCurrentElement(caretIndex: number): FormulaElement {
		var startFrom: number = 0;
		var isFounded: boolean = false;
		var selectedElement: FormulaElement = this._formulaElements[this._formulaElements.length-1];
		this._formulaElements.forEach((element)=> {
			if (!isFounded) {
				if (caretIndex >= startFrom && caretIndex < (startFrom + element.contentLength)) {
					selectedElement = element;
					isFounded = true;
				} else {
					startFrom += element.contentLength;
				}
			}
		})
		return selectedElement;
	}

	public forceGetCurrentElement(caretIndex: number): FormulaElement {
		var formulaElement = this.getCurrentElement(caretIndex);
		if (!formulaElement) {
			formulaElement = FormulaManager.generateEmptyFormulaElement();
			this.add(formulaElement);
		}
		return formulaElement;
	}

	public getFirstElement(): FormulaElement | null {
		return this._formulaElements.length
			? this._formulaElements[0]
			: null;
	}

	public getLastElement(): FormulaElement | null {
		return this._formulaElements.length
			? this._formulaElements[this._formulaElements.length - 1]
			: null;
	}

	public getElementByIndex(index: number): FormulaElement | null {
		return index >= 0 && index < this._formulaElements.length
			? this._formulaElements[index]
			: null;
	}

	public getElementPosition(element: FormulaElement): number {
		return this._formulaElements.indexOf(element);
	}

	public getNextElement(element: FormulaElement): FormulaElement | null {
		var position = this.getElementPosition(element);
		if (position < 0 || element === this.getLastElement()) {
			return null;
		}
		return this.getElementByIndex(position + 1);
	}

	public hasPrevElement(element: FormulaElement): boolean {
		var position = this.getElementPosition(element);
		if (position < 0 || element === this.getFirstElement()) {
			return false;
		}
		return true;
	}

	public getPrevElement(element: FormulaElement): FormulaElement | null {
		var position = this.getElementPosition(element);
		if (position < 0 || element === this.getFirstElement()) {
			return null;
		}
		return this.getElementByIndex(position - 1);
	}

	public insertAtPosition(element: FormulaElement, position: number) {
		var correctedPosition = Math.max(Math.min(position, this._formulaElements.length), 0)
		this._formulaElements.splice(correctedPosition, 0, element);
	}

	public add(element: FormulaElement) {
		this._formulaElements.push(element);
	}

	public insertBefore(insertedElement: FormulaElement, targetElement: FormulaElement) {
		var position = this.getElementPosition(targetElement);
		this.insertAtPosition(insertedElement, position);
	}

	public insertAfter(insertedElement: FormulaElement, targetElement: FormulaElement) {
		var position = this.getElementPosition(targetElement);
		this.insertAtPosition(insertedElement, position + 1);
	}

	public generateFormulaDisplayElementList(): FormulaDisplayElement[] {
		var response: FormulaDisplayElement[] = [];
		this._formulaElements.forEach(item => response.push(item.generateDisplayElement()));
		return response;
	}

	public getFormulaElementCaretIndex(element: FormulaElement, caretIndex: number): number {
		var totalElementStartPosition: number = 0;
		for (var i = 0; i < this.getElementPosition(element); i++) {
			totalElementStartPosition+= this._formulaElements[i].contentLength;
		}
		return caretIndex - totalElementStartPosition;
	}

	public getActualFormulaElementCaretIndex(element: FormulaElement, innerCaretIndex: number): number {
		var totalElementStartPosition: number = 0;
		for (var i = 0; i < this.getElementPosition(element); i++) {
			totalElementStartPosition+= this._formulaElements[i].contentLength;
		}
		return totalElementStartPosition + innerCaretIndex;
	}

	public actualizeFormulaElementsDataValueType(): void {
		this._formulaElements.forEach(x=>{
			if (x.canChangeType()) {
				x.type = FormulaElementType.CONSTANT;
			}
			if (x.canChangeDataValueType()) {
				x.dataValueType = this._parseDataValueType(x.content);
			}
		});
	}

	public removeEmptyElements() {
		for (let i = this._formulaElements.length -1; i >= 0; i--) {
			var element = this._formulaElements[i];
			if (element.isEmpty()) {
				this._formulaElements.splice(i, 1);
			}
		}
	}

	public removeElement(formulaElement: FormulaElement | null) {
		if (formulaElement) {
			var positon = this.getElementPosition(formulaElement);
			this._formulaElements.splice(positon, 1);
		}
	}

	public getSerializedElements(): string {
		return JSON.stringify(this._formulaElements);
	}

	public tryJoinElements(leftElement: FormulaElement | null, rightElement: FormulaElement | null): boolean {
		if (leftElement && leftElement.merge(rightElement)) {
			this.removeElement(rightElement);
		}
		return false;
	}

	private _parseDataValueType(value: any): DataValueType {
		value = value.trim();
		if (parseInt(value) == value) {
			return DataValueType.INTEGER;
		}
		if (parseFloat(value) == value) {
			return DataValueType.FLOAT;
		}
		if (value.length && value[0] === '"') {
			return DataValueType.TEXT;
		}
		return DataValueType.UNSETTED;
	}

	public getTotalContentLength(): number {
		var length = 0;
		this._formulaElements.forEach((x) => length+=x.contentLength);
		return length;
	}

	public static generateEmptyFormulaElement(): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.UNSETTED;
		element.content = '';
		return element;
	}

	public static generateSingleOperationFormulaElement(operation: string): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.SINGLEOPERATION;
		element.content = operation;
		return element;
	}

	public static generateColumnFormulaElement(caption: string, metaPath: string, dataValueType: DataValueType): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.COLUMN;
		element.content = caption;
		element.metaPath = metaPath;
		element.dataValueType = dataValueType;
		return element;
	}

}