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

class FormulaManager {
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
		this.insertAtPosition(insertedElement, position - 1);
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

}

class FormulaDisplayElement {
	content: string;
	type: FormulaElementType;
	dataValueType: DataValueType;

	constructor(content: string, type: FormulaElementType, dataValueType: DataValueType) {
		this.content = content;
		this.type = type;
		this.dataValueType = dataValueType;
	}

	public generateVisualizatorStyleClass(): string {
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

	public generateDisplayElement(): FormulaDisplayElement {
		return new FormulaDisplayElement(this.content, this.type, this.dataValueType);
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
		new KeyCodeItem("Shift"),
		new KeyCodeItem("ShiftLeft"),
		new KeyCodeItem("ShiftRight"),
		new KeyCodeItem("Control"),
		new KeyCodeItem("ControlLeft"),
		new KeyCodeItem("ControlRight"),
		new KeyCodeItem("Alt"),
		new KeyCodeItem("AltLeft"),
		new KeyCodeItem("AltRight"),
		new KeyCodeItem("Meta"),
		new KeyCodeItem("MetaLeft"),
		new KeyCodeItem("MetaRight"),
		new KeyCodeItem("ContextMenu"),
		new KeyCodeItem("NumLock"),
		new KeyCodeItem("PageDown"),
		new KeyCodeItem("PageUp"),
		new KeyCodeItem("Numpad5", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), //Clear
		new KeyCodeItem("Numpad9", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), //PageUp
		new KeyCodeItem("Numpad3", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), //PageUp
		new KeyCodeItem("Insert"),
		new KeyCodeItem("ScrollLock"),
		new KeyCodeItem("Pause"),
		new KeyCodeItem("KeyO", KeyMode.ENABLED),
		new KeyCodeItem("KeyS", KeyMode.ENABLED),
		new KeyCodeItem("KeyV", KeyMode.ENABLED),
		new KeyCodeItem("Tab"),
		new KeyCodeItem("CapsLock"),
		
		
	];

	private changelessKeys: KeyCodeItem[] = [
		new KeyCodeItem("ArrowRight"),
		new KeyCodeItem("ArrowLeft"),
		new KeyCodeItem("ArrowUp"),
		new KeyCodeItem("ArrowDown"),
		new KeyCodeItem("End"),
		new KeyCodeItem("Home"),

		new KeyCodeItem("Numpad6", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // ArrowRight
		new KeyCodeItem("Numpad4", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // ArrowLeft
		new KeyCodeItem("Numpad8", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // ArrowUp
		new KeyCodeItem("Numpad2", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // ArrowDown
		new KeyCodeItem("Numpad1", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // End
		new KeyCodeItem("Numpad7", KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.IGNORED, KeyMode.DISABLED), // Home
		
		new KeyCodeItem("F1"),
		new KeyCodeItem("F2"),
		new KeyCodeItem("F3"),
		new KeyCodeItem("F4"),
		new KeyCodeItem("F5"),
		new KeyCodeItem("F6"),
		new KeyCodeItem("F7"),
		new KeyCodeItem("F8"),
		new KeyCodeItem("F9"),
		new KeyCodeItem("F10"),
		new KeyCodeItem("F11"),
		new KeyCodeItem("F12"),
		
		
		
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
	
	formulaDisplayElements: FormulaDisplayElement[];
	formulaManager: FormulaManager;

	constructor() { 
		this.cursorIndex = 0;
		this.caretIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this.formulaManager = new FormulaManager();
		this.formulaDisplayElements = [];
		this.updateVisualizatorContent();
	}

	ngOnInit(): void {
	}

	updateVisualizatorContent(): void {
		this.formulaDisplayElements = this.formulaManager.generateFormulaDisplayElementList();
	}

	onKeyDown(event: KeyboardEvent): void {
		this.caretIndex = this.getCaretIndex(event.currentTarget);
		this.backupFormulaContent();
		if (this.containKeyInCollection(this.deniedKeys, event)) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		var selection = window.getSelection();
		if (selection != null) {
			selection.removeAllRanges();
		}
		
		if (this.containKeyInCollection(this.changelessKeys, event)) {
			if (this.processChangelessOperation(event)) {
				event.preventDefault();
				event.stopPropagation();
			}
		} else if (this.containKeyInCollection(this.removedKeys, event)) {
			this.processRemoveOperation(event);
		} else if (this.containKeyInCollection(this.singleOperators, event)) {
			this.processSingleOperation(event);
		} else {
			this.processCommonOperation(event);
		}
		
		this.formulaManager.removeEmptyElements();
		this.formulaManager.actualizeFormulaElementsDataValueType();
		this.updateVisualizatorContent();
		this.finalizedWork();
		
	}

	isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	processCommonOperation(event: KeyboardEvent): void {
		var formulaElement = this.formulaManager.getCurrentElement(this.caretIndex);
		if (this.isEmpty(formulaElement)) {
			formulaElement = this.generateEmptyFormulaElement();
			this.formulaManager.add(formulaElement);
		}
		if (formulaElement.type === FormulaElementType.SINGLEOPERATION) {
			var nextFormulaElement = this.formulaManager.getNextElement(formulaElement);
			if (nextFormulaElement == null || nextFormulaElement.type === FormulaElementType.SINGLEOPERATION) {
				nextFormulaElement = this.generateEmptyFormulaElement();
				this.formulaManager.insertAfter(nextFormulaElement, formulaElement);
			}
			formulaElement = nextFormulaElement;
		}
		var formulaElementCaretIndex = this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
		if (event.key === '"' && formulaElement.isEmpty() && (formulaElement.type === FormulaElementType.UNSETTED || (formulaElement.type === FormulaElementType.CONSTANT && (formulaElement.dataValueType === DataValueType.UNSETTED || formulaElement.dataValueType === DataValueType.TEXT)))) {
			formulaElement.insertAt('""', formulaElementCaretIndex);
		} else {
			formulaElement.insertAt(event.key, formulaElementCaretIndex);
		}
		
		this.caretIndex += event.key.length;
	}

	processChangelessOperation(event: KeyboardEvent): boolean {
		if (event.key === "ArrowLeft") {
			this.caretIndex = Math.max(this.caretIndex - 1, 0);
			return true;
		}
		if (event.key === "ArrowRight") {
			this.caretIndex = Math.min(this.caretIndex + 1, this.getTotalContentLength());
			return true;
		}
		if (event.key === "End") {
			this.caretIndex = this.getTotalContentLength();
			return true;
		}
		if (event.key === "Home") {
			this.caretIndex = 0;
			return true;
		}
		return false;
	}

	getTotalContentLength(): number {
		return this.visualizator.nativeElement.innerText.length;
	}

	processRemoveOperation(event: KeyboardEvent): void {
		var formulaElement: FormulaElement | null = this.formulaManager.getCurrentElement(this.caretIndex);
		if (formulaElement == null) {
			return;
		}
		if (event.code === "Backspace") {
			if (this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex) <= 0) {
				formulaElement = this.formulaManager.getPrevElement(formulaElement);
			}
			if (formulaElement != null && formulaElement.removeByBackspace(this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex))) {
				this.caretIndex--;
			}
		} else if (event.code === "Delete") {
			if (this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex) >= formulaElement.contentLength) {
				formulaElement = this.formulaManager.getNextElement(formulaElement);
			}
			if (formulaElement != null && formulaElement.removeByDelete(this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex))) {
			}
		}
		if (formulaElement != null && formulaElement.isEmpty()) {
			this.formulaManager.tryJoinElements(this.formulaManager.getPrevElement(formulaElement), this.formulaManager.getNextElement(formulaElement))
		}
	}

	processSingleOperation(event: KeyboardEvent): void {
		var operationFormulaElement = this.generateSingleOperationFormulaElement(event.key);

		var formulaElement = this.formulaManager.getCurrentElement(this.caretIndex);
		if (formulaElement === null || formulaElement === undefined) {
			formulaElement = this.generateEmptyFormulaElement();
			this.formulaManager.add(formulaElement);
		}
		var innerCaretIndex = this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex)
		if (innerCaretIndex === 0) {
			this.formulaManager.insertBefore(operationFormulaElement, formulaElement);
		} else if (innerCaretIndex >= formulaElement.contentLength) {
			this.formulaManager.insertAfter(operationFormulaElement, formulaElement);
		} else {
			this.formulaManager.insertAfter(operationFormulaElement, formulaElement);
			var rightFormulaElement = formulaElement.split(innerCaretIndex);
			if (rightFormulaElement != null) {
				this.formulaManager.insertAfter(rightFormulaElement, operationFormulaElement);
			}
		}
		this.caretIndex++;
	}

	containKeyInCollection(collection:KeyCodeItem[], event: KeyboardEvent) {
		var filtered = collection.filter((item) => this.equalKeyCode(event, item));
		return filtered.length;
	}

	equalKeyCode(event: KeyboardEvent, keyCode: KeyCodeItem) {
		var response = event.code === keyCode.code;
		if (keyCode.ctrMode !== KeyMode.IGNORED) {
			response = response && (keyCode.ctrMode === KeyMode.ENABLED && event.ctrlKey || keyCode.ctrMode === KeyMode.DISABLED && !event.ctrlKey);
		}
		if (keyCode.shiftMode !== KeyMode.IGNORED) {
			response = response && (keyCode.shiftMode === KeyMode.ENABLED && event.shiftKey || keyCode.shiftMode === KeyMode.DISABLED && !event.shiftKey);
		}
		if (keyCode.altMode !== KeyMode.IGNORED) {
			response = response && (keyCode.altMode === KeyMode.ENABLED && event.altKey || keyCode.altMode === KeyMode.DISABLED && !event.altKey);
		}
		if (keyCode.numlockMode !== KeyMode.IGNORED) {
			response = response && (keyCode.numlockMode === KeyMode.ENABLED && event.getModifierState("NumLock") || keyCode.numlockMode === KeyMode.DISABLED && !event.getModifierState("NumLock"));
		}
		return response;
	}

	equalKeyCodeMode(eventModeEnabled: boolean, keyMode: KeyMode) {
		return keyMode !== KeyMode.IGNORED && keyMode === KeyMode.ENABLED && eventModeEnabled;
	}

	generateEmptyFormulaElement(): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.UNSETTED;
		element.content = '';
		return element;
	}

	generateSingleOperationFormulaElement(operation: string): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.SINGLEOPERATION;
		element.content = operation;
		return element;
	}

	backupFormulaContent(): void {
		this.previousFormulaContent = this.visualizator.nativeElement.innerHTML;
	}

	finalizedWork(): void {
		
		
	}

	onKeyUp(event: KeyboardEvent): void {
		this.updateCaretPosition();
		this.elementsLog.nativeElement.innerHTML = this.formulaManager.getSerializedElements();
		this.updateCursorPosition(event.currentTarget);
	}

	updateCaretPosition(): void {
		var elementPosition = 0;
		var formulaElementCursorPosition = 0;
		var formulaElement = this.formulaManager.getCurrentElement(this.caretIndex);
		if (formulaElement != null) {
			elementPosition = this.formulaManager.getElementPosition(formulaElement);
			formulaElementCursorPosition = this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
			var prevFormulaElement = this.formulaManager.getPrevElement(formulaElement);
			if (formulaElementCursorPosition < 0 && prevFormulaElement != null) {
				elementPosition = this.formulaManager.getElementPosition(formulaElement);
				formulaElement = prevFormulaElement;
				formulaElementCursorPosition =  this.formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
			}
		}
		

		var el = this.visualizator.nativeElement;
		var sel = window.getSelection();
		
		var range = document.createRange()
		var startWrap = el.childNodes[elementPosition] || el;
		var startEl = startWrap.childNodes[0] || startWrap;
		range.setStart(startEl, formulaElementCursorPosition)
		range.collapse(true)
		if (sel != null) {
			sel.removeAllRanges();
			sel.addRange(range)
		}
	}

	updateCursorPosition(target: any): void {
		var coords = this.getCaretCoordinates();
		this.cursorX = coords.x;
		this.cursorY = coords.y;
		this.cursorIndex = this.caretIndex;
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

