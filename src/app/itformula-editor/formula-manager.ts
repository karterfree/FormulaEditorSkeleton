import { DataValueType } from "./enums";
import { FormulaDisplayElement, FormulaElement, FormulaElementArgument, FormulaElementType } from "./formula-construction";
import { KeyboardKey } from "./key-construction";
import { FormulaUtilities } from "./utils";

export interface ICaretDomPosition {
	elementIndex: number;
	elementCaretIndex: number;
}

export class FormulaManager {
	private _formulaElements: FormulaElement[];

	constructor() {
		this._formulaElements = [];
	}

	public getCurrentElement(caretIndex: number): FormulaElement {
		var startFrom: number = 0;
		var isFounded: boolean = false;
		var selectedElement: FormulaElement = this._formulaElements[this._formulaElements.length-1] || null;
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

	public canInsertAtPosition(position: number): boolean {
		var leftElement = this.getElementByIndex(position -1);
		var rightElement = this.getElementByIndex(position);
		if (leftElement != null && rightElement != null && leftElement.isJoinedWith(rightElement)) {
			return false;
		}
		return true;
	}

	public getPositionForInsertAfter(formulaElement: FormulaElement): number {
		if (this._formulaElements.length <= 0) {
			return 0;
		}
		var position = this.getElementPosition(formulaElement);
		for (let i = position; i < this._formulaElements.length; i++) {
			if (this.canInsertAfter(formulaElement)) {
				return i;
			}
		}
		return this._formulaElements.length - 1;
	}

	public canInsertBefore(formulaElement: FormulaElement): boolean {
		var position = this.getElementPosition(formulaElement);
		return this.canInsertAtPosition(position);
	}

	public canInsertAfter(formulaElement: FormulaElement): boolean {
		var position = this.getElementPosition(formulaElement);
		return this.canInsertAtPosition(position + 1);
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

	public getActualFormulaElementCaretIndex(element: FormulaElement, innerCaretIndex: number = 0): number {
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

	public hasMarkToDelete(): boolean {
		return this._formulaElements.filter(x=>x.isMarkedToDelete).length > 0;
	}

	public removeAllMarksToDelete(): void {
		this._formulaElements.filter(x=>x.isMarkedToDelete).forEach(x=>x.unMarkToDelete());
	}

	public getMarkedToDeleteElements(): FormulaElement[]  {
		return this._formulaElements.filter(x=>x.isMarkedToDelete)
	}

	public getExtChainElementsFrom(element: FormulaElement): FormulaElement[]  {
		if (FormulaUtilities.isEmpty(element.extKey)) {
			return [];
		}
		var startPosition = this.getElementPosition(element);
		return this._formulaElements.filter(x=>this.getElementPosition(x) > startPosition && x.extKey === element.extKey);
	}

	public getCaretDomPosition(caretIndex: number): ICaretDomPosition {
		var elementIndex = 0;
		var elementCaretIndex = 0;
		var formulaElement = this.getCurrentElement(caretIndex);
		if (formulaElement != null) {
			elementIndex = this.getElementPosition(formulaElement);
			elementCaretIndex = this.getFormulaElementCaretIndex(formulaElement, caretIndex);
			var prevFormulaElement = this.getPrevElement(formulaElement);
			if (elementCaretIndex < 0 && prevFormulaElement != null) {
				elementIndex = this.getElementPosition(formulaElement);
				formulaElement = prevFormulaElement;
				elementCaretIndex =  this.getFormulaElementCaretIndex(formulaElement, caretIndex);
			}
		}
		return {
			"elementIndex": elementIndex,
			"elementCaretIndex": elementCaretIndex
		};
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

	public static generateCustomFunctionFormulaElement(caption: string, dataValueType: DataValueType, functionArguments: FormulaElementArgument[]): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.COLUMN;
		element.content = caption;
		element.arguments = functionArguments;
		element.dataValueType = dataValueType;
		return element;
	}

	public static generateCustomFunctionFormulaElementGroup(caption: string, dataValueType: DataValueType, functionArguments: FormulaElementArgument[]): FormulaElement[] {
		var response: FormulaElement[] = [];
		var element = new FormulaElement();
		element.type = FormulaElementType.FUNCTION;
		element.content = caption;
		element.arguments = functionArguments;
		element.dataValueType = dataValueType;
		response.push(element);
		response.push(FormulaManager.generateSingleOperationFormulaElement(KeyboardKey.BracketOpen));
		for (var i = 0; i < functionArguments.length - 1; i++) {
			response.push(FormulaManager.generateSingleOperationFormulaElement(KeyboardKey.Comma));
		}
		response.push(FormulaManager.generateSingleOperationFormulaElement(KeyboardKey.BracketClose));
		return response;
	}

	

}