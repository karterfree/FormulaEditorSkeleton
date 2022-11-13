import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

enum FormulaElementType {
	UNSETTED,
	CONSTANT,
	SINGLEOPERATION
}

enum DataValueType {
	UNSETTED = -1,
	GUID = 0,
	TEXT = 1,
	INTEGER = 4,
	FLOAT = 5,
	DATE_TIME = 7,
	DATE = 8,
	TIME = 9,
	LOOKUP = 10,
	BOOLEAN = 12
}

class FormulaElement {
	private _type: FormulaElementType = FormulaElementType.UNSETTED;
	private _dataValueType: DataValueType = DataValueType.UNSETTED;
	private _content: string = '';

	public get content() {
		return this._content;
	}

	public set content(content: string) {
		this._content = content;
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

	public generateVisualizatorPart(): string {
		return '<span class="' + this.generateVisualizatorStyleClass() + '">' + this._content + '</span>'
	}

	public generateVisualizatorStyleClass(): string {
		switch (this.dataValueType) {
			case DataValueType.FLOAT:
			case DataValueType.INTEGER:
				return "dvt-number";
			default:
				return "dvt-undefined";
		}
	}

	public canChangeType(): boolean {
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

	public canChangeDataValueType(): boolean {
		if (this.type === FormulaElementType.SINGLEOPERATION) {
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
		if (position > 0 && position < this.contentLength -1) {
			var leftContent = this.content.slice(0, position);
			var rightContent = this.content.slice(position);
			var clone = this.clone();
			clone.content = rightContent;
			this.content = leftContent;
			return clone;
		}
		return null;
	}

	public isEmpty(): boolean {
		return this.content === null || this.content === undefined || this.content === "";
	}

}

enum KeyMode {
	IGNORED = 0,
	DISABLED = 1,
	ENABLED = 2
}

class KeyCodeItem {
	code: string = '';
	ctrMode: KeyMode;
	altMode: KeyMode;
	shiftMode: KeyMode;
	numlockMode: KeyMode;

	constructor(code: string, 
		ctrMode: KeyMode = KeyMode.IGNORED,
		altMode: KeyMode = KeyMode.IGNORED,
		shiftMode: KeyMode = KeyMode.IGNORED,
		numlockMode: KeyMode = KeyMode.IGNORED) {
		this.code = code;
		this.ctrMode = ctrMode;
		this.altMode = altMode;
		this.shiftMode = shiftMode;
		this.numlockMode = numlockMode;
	}

}



@Component({
	selector: 'app-itformula-editor',
	templateUrl: './itformula-editor.component.html',
	styleUrls: ['./itformula-editor.component.less']
})
export class ITFormulaEditorComponent implements OnInit {
	@ViewChild('visualizator') visualizator!: ElementRef;
	@ViewChild('elementsLog') elementsLog!: ElementRef;
	
	caretIndex: number;
	cursorIndex: number;
	cursorX: number;
	cursorY: number;

	private deniedKeys: KeyCodeItem[] = [
		new KeyCodeItem("KeyB", KeyMode.ENABLED),
		new KeyCodeItem("KeyI", KeyMode.ENABLED),
		new KeyCodeItem("KeyU", KeyMode.ENABLED),
		new KeyCodeItem("KeyZ", KeyMode.ENABLED),
		new KeyCodeItem("ShiftLeft"),
		new KeyCodeItem("ShiftRight"),
		new KeyCodeItem("ControlLeft"),
		new KeyCodeItem("ControlRight"),
		new KeyCodeItem("AltLeft"),
		new KeyCodeItem("AltRight"),
		new KeyCodeItem("Alt"),
		new KeyCodeItem("Meta"),
		new KeyCodeItem("ContextMenu"),
		new KeyCodeItem("KeyO", KeyMode.ENABLED),
		new KeyCodeItem("KeyS", KeyMode.ENABLED),
		new KeyCodeItem("KeyV", KeyMode.ENABLED)
	];

	private changelessKeys: KeyCodeItem[] = [
		new KeyCodeItem("ArrowRight"),
		new KeyCodeItem("ArrowLeft"),
		new KeyCodeItem("ArrowUp"),
		new KeyCodeItem("ArrowDown")
	];

	private removedKeys: KeyCodeItem[] = [
		new KeyCodeItem("Backspace"),
		new KeyCodeItem("Delete")
	];

	private singleOperators: KeyCodeItem[] = [
		new KeyCodeItem("Equal", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED), // +
		new KeyCodeItem("NumpadAdd"), // +
		new KeyCodeItem("Minus", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // -
		new KeyCodeItem("NumpadSubtract"), // -
		new KeyCodeItem("Digit9", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED), // (
		new KeyCodeItem("Digit0",  KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED), // )
		new KeyCodeItem("Slash", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // /
		new KeyCodeItem("NumpadDivide"), // /
		new KeyCodeItem("NumpadMultiply"), // *
		new KeyCodeItem("Period",  KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED), // >
		new KeyCodeItem("Comma",  KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED), // <
		new KeyCodeItem("Equal", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // =
		new KeyCodeItem("Digit1",  KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.ENABLED), // !
	];

	private previousFormulaContent: string = '';
	formulaElements: FormulaElement[] = [];

	constructor() { 
		this.cursorIndex = 0;
		this.caretIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this.formulaElements.push(this.getEmptyFormulaElement());
		this.updateVisualizatorContent();
	}

	ngOnInit(): void {
	}

	updateVisualizatorContent(): void {
		var content = '';
		this.formulaElements.forEach((formulaElementItem) => {
			content
		})
	}

	onKeyDown(event: KeyboardEvent): void {
		this.caretIndex = this.getCaretIndex(event.currentTarget);
		var selection = window.getSelection();
		if (selection != null) {
			selection.removeAllRanges();
		}
		this.backupFormulaContent();
		if (this.containKeyInCollection(this.deniedKeys, event)) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (this.containKeyInCollection(this.changelessKeys, event)) {
			this.processChangelessOperation(event);
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (this.containKeyInCollection(this.removedKeys, event)) {
			this.processRemoveOperation(event);
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		if (this.containKeyInCollection(this.singleOperators, event)) {
			this.processSingleOperation(event);
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		this.processKeyboardEvent(event);
		event.preventDefault();
		event.stopPropagation();
	}

	processKeyboardEvent(event: KeyboardEvent): void {
		var formulaElement = this.getCurrentFormulaElement(this.caretIndex);
		if (formulaElement === null || formulaElement === undefined) {
			formulaElement = this.getEmptyFormulaElement();
			this.formulaElements.push(formulaElement);
		}
		var formulaElementIndex = this.formulaElements.indexOf(formulaElement);
		var formulaElementCursorPosition = this.getFormulaElementCursorPosition(formulaElement, this.caretIndex);
		if (formulaElement.type === FormulaElementType.SINGLEOPERATION) {
			if (formulaElementCursorPosition === 0) {
				if (formulaElementIndex === 0) {
					formulaElement = this.getEmptyFormulaElement();
					this.formulaElements.splice(0, 0, formulaElement);
				} else {
					formulaElement = this.formulaElements[formulaElementIndex - 1];
				}
				formulaElementCursorPosition = this.getFormulaElementCursorPosition(formulaElement, this.caretIndex);
			} else {
				if (formulaElementIndex >= this.formulaElements.length - 1) {
					formulaElement = this.getEmptyFormulaElement();
					this.formulaElements.push(formulaElement);
				} else {
					formulaElement = this.formulaElements[formulaElementIndex + 1];
				}
				formulaElementCursorPosition = this.getFormulaElementCursorPosition(formulaElement, this.caretIndex);
			}
		}
		formulaElement.insertAt(event.key, formulaElementCursorPosition);
		this.caretIndex += event.key.length;
	}

	getFormulaElementCursorPosition(formulaElement: FormulaElement, cursorIndex: number): number {
		var totalelementStartPosition: number = 0;
		for (var i = 0; i < this.formulaElements.indexOf(formulaElement); i++) {
			totalelementStartPosition+= this.formulaElements[i].contentLength;
		}
		return cursorIndex - totalelementStartPosition;
	}

	processChangelessOperation(event: KeyboardEvent): void {
		if (event.code === "ArrowLeft") {
			this.caretIndex = Math.max(this.caretIndex - 1, 0);
		}
		if (event.code === "ArrowRight") {
			
			this.caretIndex = Math.min(this.caretIndex + 1, this.getTotalContentLength());
		}
	}

	getTotalContentLength(): number {
		return this.visualizator.nativeElement.innerText.length;
	}

	processRemoveOperation(event: KeyboardEvent): void {
		var formulaElement = this.getCurrentFormulaElement(this.caretIndex);
		var formulaElementIndex = this.formulaElements.indexOf(formulaElement);
		var prevFormulaElement = formulaElementIndex > 0 ? this.formulaElements[formulaElementIndex - 1] : null;
		var nextFormulaElement = formulaElementIndex < this.formulaElements.length ? this.formulaElements[formulaElementIndex + 1] : null;
		if (event.code === "Backspace") {
			if (formulaElement.removeByBackspace(this.getFormulaElementCursorPosition(formulaElement, this.caretIndex)) ||
				(prevFormulaElement != null && prevFormulaElement.removeByBackspace(this.getFormulaElementCursorPosition(prevFormulaElement, this.caretIndex)))) {
				this.caretIndex--;
			}
		}

		if (event.code === "Delete") {
			if (formulaElement.removeByDelete(this.getFormulaElementCursorPosition(formulaElement, this.caretIndex)) ||
				(nextFormulaElement != null && nextFormulaElement.removeByDelete(this.getFormulaElementCursorPosition(nextFormulaElement, this.caretIndex)))) {
			}
		}
	}

	processSingleOperation(event: KeyboardEvent): void {
		var formulaElement = this.getCurrentFormulaElement(this.caretIndex);
		var formulaElementIndex = this.formulaElements.indexOf(formulaElement);
		var innerCaretPosition = this.getFormulaElementCursorPosition(formulaElement, this.caretIndex);
		var operationFormulaElement = this.getSingleOperationFormulaElement(event.key);
		if (innerCaretPosition === 0) {
			this.formulaElements.splice(formulaElementIndex, 0, operationFormulaElement);
			this.caretIndex++;
		} else if (innerCaretPosition >= formulaElement.contentLength) {
			if (formulaElementIndex < this.formulaElements.length) {
				this.formulaElements.splice(formulaElementIndex + 1, 0, operationFormulaElement);
			} else {
				this.formulaElements.push(operationFormulaElement);
			}
			this.caretIndex++;
		} else {
			if (formulaElementIndex < this.formulaElements.length) {
				this.formulaElements.splice(formulaElementIndex + 1, 0, operationFormulaElement);
			} else {
				this.formulaElements.push(operationFormulaElement);
			}
			var rightFormulaElement = formulaElement.split(innerCaretPosition);
			if (rightFormulaElement != null) {
				if (formulaElementIndex < this.formulaElements.length) {
					this.formulaElements.splice(formulaElementIndex + 2, 0, rightFormulaElement);
				} else {
					this.formulaElements.push(rightFormulaElement);
				}
			}
			this.caretIndex++;
		}
	}

	containKeyInCollection(collection:KeyCodeItem[], event: KeyboardEvent) {
		var filtered = collection.filter((item) => this.equalKeyCode(event, item));
		return filtered.length;
	}

	equalKeyCode(event: KeyboardEvent, keyCode: KeyCodeItem) {
		var response = event.code === keyCode.code;
		if (keyCode.ctrMode !== KeyMode.IGNORED) {
			response = response && keyCode.ctrMode === KeyMode.ENABLED && event.ctrlKey;
		}
		if (keyCode.shiftMode !== KeyMode.IGNORED) {
			response = response && keyCode.shiftMode === KeyMode.ENABLED && event.shiftKey;
		}
		if (keyCode.altMode !== KeyMode.IGNORED) {
			response = response && keyCode.altMode === KeyMode.ENABLED && event.altKey;
		}
		if (keyCode.numlockMode !== KeyMode.IGNORED) {
			response = response && keyCode.numlockMode === KeyMode.ENABLED && event.getModifierState("NumLock");
		}
		return response;
	}

	equalKeyCodeMode(eventModeEnabled: boolean, keyMode: KeyMode) {
		return keyMode !== KeyMode.IGNORED && keyMode === KeyMode.ENABLED && eventModeEnabled;
	}

	getCurrentFormulaElement(cursorIndex: number): FormulaElement {
		var startFrom: number = 0;
		var isFounded: boolean = false;
		var selectedElement: FormulaElement = this.formulaElements[this.formulaElements.length-1];
		this.formulaElements.forEach((element)=> {
			if (!isFounded) {
				if (cursorIndex >= startFrom && cursorIndex < (startFrom + element.contentLength)) {
					selectedElement = element;
					isFounded = true;
				} else {
					startFrom += element.contentLength;
				}
			}
		})
		return selectedElement;
	}

	getEmptyFormulaElement(): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.UNSETTED;
		element.content = '';
		return element;
	}

	getSingleOperationFormulaElement(operation: string): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.SINGLEOPERATION;
		element.content = operation;
		return element;
	}

	backupFormulaContent(): void {
		this.previousFormulaContent = this.visualizator.nativeElement.innerHTML;
	}

	onKeyUp(event: KeyboardEvent): void {
		this.removeEmptyItems();
		this.actualizeFormulaElementsDataValueType();
		this.updateCaretPosition();
		this.elementsLog.nativeElement.innerHTML = JSON.stringify(this.formulaElements);
	}

	removeEmptyItems(): void {
		for (let i = this.formulaElements.length -1; i >= 0; i--) {
			var element = this.formulaElements[i];
			if (element.isEmpty()) {
				this.formulaElements.splice(i, 1);
			}
		}
	}

	updateCaretPosition(): void {
		var formulaElement = this.getCurrentFormulaElement(this.caretIndex);
		var formulaElementCursorPosition = this.getFormulaElementCursorPosition(formulaElement, this.caretIndex);
		var formulaElementIndex = this.formulaElements.indexOf(formulaElement);
		if (formulaElementCursorPosition < 0) {
			formulaElement = this.formulaElements[formulaElementIndex - 1];
			formulaElementIndex = this.formulaElements.indexOf(formulaElement);
			formulaElementCursorPosition = this.getFormulaElementCursorPosition(formulaElement, this.caretIndex) + formulaElementCursorPosition;
		}

		var el = this.visualizator.nativeElement;
		var sel = window.getSelection();
		
		try {
			var range = document.createRange()
			range.setStart(el.childNodes[formulaElementIndex].childNodes[0], formulaElementCursorPosition)
			range.collapse(true)
			if (sel != null) {
				sel.removeAllRanges();
				sel.addRange(range)
			}
		} catch {
			var sel = window.getSelection();
		}
		
		
		
	}

	updateCursorPosition(target: any): void {
		var coords = this.getCaretCoordinates();
		this.cursorX = coords.x;
		this.cursorY = coords.y;
		this.cursorIndex = this.getCaretIndex(target);
	}


	onPaste(event: any): void {
		event.preventDefault();
		// Get the copied text from the clipboard
		var clipboardData = (event.originalEvent || event).clipboardData;
		const cleared = clipboardData.getData('text/plain');
		const selection = window.getSelection();
		if (selection) {
			if (!selection.rangeCount) return;
			selection.deleteFromDocument();
			selection.getRangeAt(0).insertNode(document.createTextNode(cleared));
		}
	}

	onMouseUp(event: MouseEvent): void {
		this.updateCursorPosition(event.currentTarget);
	}

	actualizeFormulaElementsDataValueType(): void {
		this.formulaElements.forEach(x=>{
			if (x.canChangeType()) {
				x.type = FormulaElementType.CONSTANT;
			}
			if (x.canChangeDataValueType()) {
				x.dataValueType = this.parseDataValueType(x.content);
			}
		});
	}

	parseDataValueType(value: any): DataValueType {
		if (parseInt(value) == value) {
			return DataValueType.INTEGER;
		}
		if (parseFloat(value) == value) {
			return DataValueType.FLOAT;
		}
		return DataValueType.UNSETTED;
	}

	setCaretIndex() {
		
	}

	getCaretIndex(element: any): number {
		let position = 0;
		const isSupported = typeof window.getSelection !== "undefined";
		if (isSupported) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount !== 0) {
				const range = selection.getRangeAt(0);
				const preCaretRange = range.cloneRange();
				preCaretRange.selectNodeContents(element);
				preCaretRange.setEnd(range.endContainer, range.endOffset);
				position = preCaretRange.toString().length;
			}
		}
		return position;
	}

	getCaretCoordinates(): any {
		let x = 0,
			y = 0;
		const isSupported = typeof window.getSelection !== "undefined";
		if (isSupported) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount !== 0) {
				const range = selection.getRangeAt(0).cloneRange();
				range.collapse(true);
				const rect = range.getClientRects()[0];
				if (rect) {
					x = rect.left;
					y = rect.top;
				}
			}
		}
		return { x, y };
	}
}

