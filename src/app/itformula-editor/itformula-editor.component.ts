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

	public forceGetCurrentElement(caretIndex: number): FormulaElement {
		var formulaElement = this.getCurrentElement(caretIndex);
		if (!formulaElement) {
			formulaElement = this.generateEmptyFormulaElement();
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

	public getTotalContentLength(): number {
		var length = 0;
		this._formulaElements.forEach((x) => length+=x.contentLength);
		return length;
	}

	public generateEmptyFormulaElement(): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.UNSETTED;
		element.content = '';
		return element;
	}

	public generateSingleOperationFormulaElement(operation: string): FormulaElement {
		var element = new FormulaElement();
		element.type = FormulaElementType.SINGLEOPERATION;
		element.content = operation;
		return element;
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

class KeyItem {
	key: string = '';
	ctrMode: KeyMode;
	altMode: KeyMode;
	shiftMode: KeyMode;
	numlockMode: KeyMode;

	constructor(key: string, 
		ctrMode: KeyMode = KeyMode.IGNORED,
		altMode: KeyMode = KeyMode.IGNORED,
		shiftMode: KeyMode = KeyMode.IGNORED,
		numlockMode: KeyMode = KeyMode.IGNORED) {
		this.key = key;
		this.ctrMode = ctrMode;
		this.altMode = altMode;
		this.shiftMode = shiftMode;
		this.numlockMode = numlockMode;
	}

	static fromKeyboardEvent(event: KeyboardEvent): KeyItem {
		var keyItem = new KeyItem(event.key);
		keyItem.ctrMode = event.ctrlKey ? KeyMode.ENABLED : KeyMode.DISABLED;
		keyItem.altMode = event.altKey ? KeyMode.ENABLED : KeyMode.DISABLED;
		keyItem.shiftMode = event.shiftKey ? KeyMode.ENABLED : KeyMode.DISABLED;
		keyItem.numlockMode = event.getModifierState("NumLock") ? KeyMode.ENABLED : KeyMode.DISABLED;
		return keyItem;
	}

	public equal(templateEventItem: KeyItem): boolean {
		var response = this.key === templateEventItem.key;
		if (templateEventItem.ctrMode !== KeyMode.IGNORED) {
			response = response && this.ctrMode == templateEventItem.ctrMode;
		}
		if (templateEventItem.shiftMode !== KeyMode.IGNORED) {
			response = response && this.shiftMode == templateEventItem.shiftMode;
		}
		if (templateEventItem.altMode !== KeyMode.IGNORED) {
			response = response && this.altMode == templateEventItem.altMode;
		}
		if (templateEventItem.numlockMode !== KeyMode.IGNORED) {
			response = response && this.numlockMode == templateEventItem.numlockMode;
		}
		return response;
	}
}

enum KeyboardKey {
	b = "b",
	i = "i",
	u = "u",
	s = "s",
	o = "o",
	v = "v",
	x = "x",
	z = "z",
	Control = "Control",
	Shift = "Shift",
	Alt = "Alt",
	ScrollLock = "ScrollLock",
	Meta = "Meta",
	ContextMenu = "ContextMenu",
	NumLock = "NumLock",
	PageUp = "PageUp",
	PageDown = "PageDown",
	Clear = "Clear",
	Insert = "Insert",
	Pause = "Pause",
	Tab = "Tab",
	CapsLock = "CapsLock",
	ArrowLeft = "ArrowLeft",
	ArrowRight = "ArrowRight",
	ArrowUp = "ArrowUp",
	ArrowDown = "ArrowDown",
	End = "End",
	Home = "Home",
	F1 = "F1",
	F2 = "F2",
	F3 = "F3",
	F4 = "F4",
	F5 = "F5",
	F6 = "F6",
	F7 = "F7",
	F8 = "F8",
	F9 = "F9",
	F10 = "F10",
	F11 = "F11",
	F12 = "F12",
	Delete = "Delete",
	Backspace = "Backspace",
	BracketOpen = "(",
	BracketClose = ")",
	Add = "+",
	Subtract = "-",
	Divide = "/",
	Multiply = "*",
	Greater = ">",
	Less = "<",
	Equal = "=",
	Not = "!",
}


class KeyManager {
	private _deniedKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.b, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.i, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.u, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.z, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.Control),
		new KeyItem(KeyboardKey.Shift),
		new KeyItem(KeyboardKey.Alt),
		new KeyItem(KeyboardKey.ScrollLock),
		new KeyItem(KeyboardKey.Meta),
		new KeyItem(KeyboardKey.ContextMenu),
		new KeyItem(KeyboardKey.NumLock),
		new KeyItem(KeyboardKey.PageUp),
		new KeyItem(KeyboardKey.PageDown),
		new KeyItem(KeyboardKey.Insert),
		new KeyItem(KeyboardKey.ScrollLock),
		new KeyItem(KeyboardKey.Pause),
		new KeyItem(KeyboardKey.Tab),
		new KeyItem(KeyboardKey.CapsLock),

		new KeyItem(KeyboardKey.o, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.s, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.x, KeyMode.ENABLED),
		new KeyItem(KeyboardKey.v, KeyMode.ENABLED),
	];

	private _moveKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.ArrowLeft),
		new KeyItem(KeyboardKey.ArrowRight),
		new KeyItem(KeyboardKey.ArrowUp),
		new KeyItem(KeyboardKey.ArrowDown),
		new KeyItem(KeyboardKey.End),
		new KeyItem(KeyboardKey.Home),
	];

	private _fKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.F1),
		new KeyItem(KeyboardKey.F2),
		new KeyItem(KeyboardKey.F3),
		new KeyItem(KeyboardKey.F4),
		new KeyItem(KeyboardKey.F5),
		new KeyItem(KeyboardKey.F6),
		new KeyItem(KeyboardKey.F7),
		new KeyItem(KeyboardKey.F8),
		new KeyItem(KeyboardKey.F9),
		new KeyItem(KeyboardKey.F10),
		new KeyItem(KeyboardKey.F11),
		new KeyItem(KeyboardKey.F12),
	];

	private _removedKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Delete),
		new KeyItem(KeyboardKey.Backspace)
	];

	private _bracketKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.BracketOpen),
		new KeyItem(KeyboardKey.BracketClose)
	];

	private _mathKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Add),
		new KeyItem(KeyboardKey.Subtract),
		new KeyItem(KeyboardKey.Multiply),
		new KeyItem(KeyboardKey.Divide),
	];

	private _conditionKeys: KeyItem[] = [
		new KeyItem(KeyboardKey.Greater),
		new KeyItem(KeyboardKey.Less),
		new KeyItem(KeyboardKey.Equal),
		new KeyItem(KeyboardKey.Not),
	];

	private has(keyItem: KeyItem, list: KeyItem[]): boolean {
		return list.filter(x=>keyItem.equal(x)).length > 0;
	}

	public isDeniedKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._deniedKeys);
	}

	public isMoveKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._moveKeys);
	}

	public isFKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._fKeys);
	}

	public isRemoveKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._removedKeys);
	}

	public isChangelessKey(keyItem: KeyItem): boolean {
		return this.isMoveKey(keyItem) || this.isFKey(keyItem);
	}

	public isMathKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._mathKeys);
	}

	public isBracketKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._bracketKeys);
	}

	public isConditionKey(keyItem: KeyItem): boolean {
		return this.has(keyItem, this._conditionKeys);
	}

	public isSingleOperationKey(keyItem: KeyItem): boolean {
		return this.isMathKey(keyItem) ||
			this.isBracketKey(keyItem) ||
			this.isConditionKey(keyItem);
	}
}

class KeyboardKeyProcessor {
	private _formulaManager: FormulaManager;
	private _caretIndex: number;
	
	public get caretIndex(): number {
		return this._caretIndex;
	}

	public set caretIndex(value: number) {
		this._caretIndex = value;
	}

	constructor(formulaManager: FormulaManager) {
		this._caretIndex = 0;
		this._formulaManager = formulaManager;
	}

	public processMoveCaretOpertion(keyItem: KeyItem): void {
		if (keyItem.key === KeyboardKey.ArrowLeft) {
			this.caretIndex = Math.max(this.caretIndex - 1, 0);
		} else if (keyItem.key === KeyboardKey.ArrowRight) {
			this.caretIndex = Math.min(this.caretIndex + 1, this._formulaManager.getTotalContentLength());
		} else if (keyItem.key === KeyboardKey.End) {
			this.caretIndex = this._formulaManager.getTotalContentLength();
		} else if (keyItem.key === KeyboardKey.Home) {
			this.caretIndex = 0;
		}
	}

	public processRemoveOpertion(keyItem: KeyItem): void {
		var formulaElement: FormulaElement | null = this._formulaManager.getCurrentElement(this.caretIndex);
		if (formulaElement == null) {
			return;
		}
		if (keyItem.key === KeyboardKey.Backspace) {
			formulaElement = this._processRemoveByBackspaceOpertion(formulaElement);
		} else if (keyItem.key === KeyboardKey.Delete) {
			formulaElement = this._processRemoveByDeleteOpertion(formulaElement);
		}
		if (formulaElement != null && formulaElement.isEmpty()) {
			this._formulaManager.tryJoinElements(this._formulaManager.getPrevElement(formulaElement), this._formulaManager.getNextElement(formulaElement))
		}
	}

	private _processRemoveByBackspaceOpertion(element: FormulaElement): FormulaElement | null {
		let formulaElement: FormulaElement | null = element;
		if (this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex) <= 0) {
			formulaElement = this._formulaManager.getPrevElement(formulaElement);
		}
		if (formulaElement != null && formulaElement.removeByBackspace(this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex))) {
			this.caretIndex--;
		}
		return formulaElement;
	}

	private _processRemoveByDeleteOpertion(element: FormulaElement): FormulaElement | null {
		let formulaElement: FormulaElement | null = element;
		if (this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex) >= formulaElement.contentLength) {
			formulaElement = this._formulaManager.getNextElement(formulaElement);
		}
		if (formulaElement != null && formulaElement.removeByDelete(this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex))) {
		}
		return formulaElement;
	}

	public processCommonOpertion(keyItem: KeyItem): void {
		var formulaElement = this._getEditableElement();
		var formulaElementCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
		if (keyItem.key === '"' && formulaElement.isEmpty() && (formulaElement.type === FormulaElementType.UNSETTED || (formulaElement.type === FormulaElementType.CONSTANT && (formulaElement.dataValueType === DataValueType.UNSETTED || formulaElement.dataValueType === DataValueType.TEXT)))) {
			formulaElement.insertAt('""', formulaElementCaretIndex);
		} else {
			formulaElement.insertAt(keyItem.key, formulaElementCaretIndex);
		}
		
		this.caretIndex += keyItem.key.length;
	}

	public processSingleOpertion(keyItem: KeyItem): void {
		var operationFormulaElement = this._formulaManager.generateSingleOperationFormulaElement(keyItem.key);
		var formulaElement = this._formulaManager.forceGetCurrentElement(this.caretIndex);
		var innerCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex)
		if (innerCaretIndex === 0) {
			this._formulaManager.insertBefore(operationFormulaElement, formulaElement);
		} else if (innerCaretIndex >= formulaElement.contentLength) {
			this._formulaManager.insertAfter(operationFormulaElement, formulaElement);
		} else {
			this._formulaManager.insertAfter(operationFormulaElement, formulaElement);
			var rightFormulaElement = formulaElement.split(innerCaretIndex);
			if (rightFormulaElement != null) {
				this._formulaManager.insertAfter(rightFormulaElement, operationFormulaElement);
			}
		}
		this.caretIndex += keyItem.key.length;
	}

	private _getEditableElement(): FormulaElement {
		var formulaElement = this._formulaManager.forceGetCurrentElement(this.caretIndex);
		if (formulaElement.type === FormulaElementType.SINGLEOPERATION) {
			var nextFormulaElement = this._formulaManager.getNextElement(formulaElement);
			if (nextFormulaElement == null || nextFormulaElement.type === FormulaElementType.SINGLEOPERATION) {
				nextFormulaElement = this._formulaManager.generateEmptyFormulaElement();
				this._formulaManager.insertAfter(nextFormulaElement, formulaElement);
			}
			formulaElement = nextFormulaElement;
		}
		return formulaElement;
	}
}

class KeyboardProcessor {
	private _events: KeyboardEvent[];
	private _inProcess: boolean;
	private _handlerFn: Function;
	private _formulaManager: FormulaManager;
	private _keyManager: KeyManager;
	private _keyboardKeyProcessor: KeyboardKeyProcessor;

	constructor() {
		this._events = [];
		this._inProcess = false;
		this._handlerFn = this._emptyHandler;
		this._formulaManager = new FormulaManager();
		this._keyManager = new KeyManager();
		this._keyboardKeyProcessor = new KeyboardKeyProcessor(this._formulaManager)
	}

	isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	public getFormulaManager(): FormulaManager {
		return this._formulaManager;
	}

	private _emptyHandler() {}

	private _dispatchNextEvent(iterator: number = 0) {
		if (this._inProcess) {
			return;
		}
		if (!this._events.length) {
			this._invokeHendler();
			return;
		}
		this._inProcess = true;
		var event = this._events.shift();
		if (event != null && event != undefined) {
			if (iterator === 0) {
				this._keyboardKeyProcessor.caretIndex = this._getCaretIndex(event.currentTarget);
			}
			if (this._dispatchEvent(event)) {
				event.preventDefault();
				event.stopPropagation();
			}
			this._formulaManager.removeEmptyElements();
		}
		this._inProcess = false;
		this._dispatchNextEvent(iterator + 1);
	}

	private _getCaretIndex(element: any, withUnSelect: boolean = true): number {
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
			} else {
				position = this._keyboardKeyProcessor.caretIndex;
			}
		} else {
			position = this._keyboardKeyProcessor.caretIndex;
		}
		if (withUnSelect) {
			var selection = window.getSelection();
			if (selection != null) {
				selection.removeAllRanges();
			}
		}
		return position;
	}

	private _dispatchEvent(event: KeyboardEvent): boolean {
		const keyItem: KeyItem = KeyItem.fromKeyboardEvent(event);
		if (this._keyManager.isDeniedKey(keyItem)) {
			return true;
		} else if (this._keyManager.isRemoveKey(keyItem)) {
			this._keyboardKeyProcessor.processRemoveOpertion(keyItem);
		} else if (this._keyManager.isChangelessKey(keyItem)) {
			this._keyboardKeyProcessor.processMoveCaretOpertion(keyItem);
		} else if (this._keyManager.isSingleOperationKey(keyItem)) {
			this._keyboardKeyProcessor.processSingleOpertion(keyItem);
		} else {
			this._keyboardKeyProcessor.processCommonOpertion(keyItem);
		}
		return true;
	}

	private _invokeHendler() {
		this._formulaManager.actualizeFormulaElementsDataValueType();
		var caretIndex: number = this._keyboardKeyProcessor.caretIndex;
		var elementPosition = 0;
		var elementCaretIndex = 0;
		var formulaElement = this._formulaManager.getCurrentElement(caretIndex);
		if (formulaElement != null) {
			elementPosition = this._formulaManager.getElementPosition(formulaElement);
			elementCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, caretIndex);
			var prevFormulaElement = this._formulaManager.getPrevElement(formulaElement);
			if (elementCaretIndex < 0 && prevFormulaElement != null) {
				elementPosition = this._formulaManager.getElementPosition(formulaElement);
				formulaElement = prevFormulaElement;
				elementCaretIndex =  this._formulaManager.getFormulaElementCaretIndex(formulaElement, caretIndex);
			}
		}

		this._handlerFn({
			"elementIndex": elementPosition,
			"elementCaretIndex": elementCaretIndex,
			"displayList": this._formulaManager.generateFormulaDisplayElementList()
		});
	}

	public subscribe(fn: Function) {
		this._handlerFn = fn;
	}

	public register(event: KeyboardEvent): void {
		this._events.push(event);
		this._dispatchNextEvent();
	}
}

interface IKeyboardProcessorResponse {
	elementIndex: number;
	elementCaretIndex: number;
	displayList: FormulaDisplayElement[]
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


	private previousFormulaContent: string = '';
	
	formulaDisplayElements: FormulaDisplayElement[];

	private _keyboardProcessor: KeyboardProcessor;

	constructor() { 
		this.cursorIndex = 0;
		this.caretIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this._keyboardProcessor = this._initKeyboardProcessor();
		this.formulaDisplayElements = [];
	}

	_initKeyboardProcessor(): KeyboardProcessor {
		var keyboardProcessor = new KeyboardProcessor();
		keyboardProcessor.subscribe((item: IKeyboardProcessorResponse) => {
			this.formulaDisplayElements = item.displayList;
			setTimeout(()=>{
				this.updateCaretPosition(item.elementIndex, item.elementCaretIndex);
				this.elementsLog.nativeElement.innerHTML = this._keyboardProcessor.getFormulaManager().getSerializedElements();
			}, 4);
		});
		return keyboardProcessor;
	}

	ngOnInit(): void {
	}

	onKeyDown(event: KeyboardEvent): void {
		this._keyboardProcessor.register(event);
	}

	isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	backupFormulaContent(): void {
		this.previousFormulaContent = this.visualizator.nativeElement.innerHTML;
	}

	finalizedWork(): void {
		
		
	}

	onKeyUp(event: KeyboardEvent): void {
		
	}

	updateCaretPosition(elementIndex: number, elementCaretIndex: number): void {
		var el = this.visualizator.nativeElement;
		var sel = window.getSelection();
		var range = document.createRange()
		var startWrap = el.childNodes[elementIndex] || el;
		var startEl = startWrap.childNodes[0] || startWrap;
		range.setStart(startEl, elementCaretIndex)
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
