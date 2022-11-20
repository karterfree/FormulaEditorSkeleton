import { DataValueType } from "./enums";
import { FormulaElement, FormulaElementType, FormulaManager } from "./formula-construction";
import { KeyboardKey, KeyItem, KeyManager } from "./key-construction";
import { ICommandOperationResponse, IExtendColumnResponse, KeyboardProcessEvent } from "./keyboard-processor";
import { FormulaUtilities } from "./utils";

export class KeyboardKeyProcessor {
	private _formulaManager: FormulaManager;
	private _keyManager: KeyManager;
	private _caretIndex: number;
	private _subscribes: {[key: string]: Function};
	
	public get caretIndex(): number {
		return this._caretIndex;
	}

	public set caretIndex(value: number) {
		this._caretIndex = value;
	}

	constructor(formulaManager: FormulaManager) {
		this._caretIndex = 0;
		this._keyManager = new KeyManager();
		this._formulaManager = formulaManager;
		this._subscribes = {};
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
		var prevFormulaElement = this._formulaManager.getPrevElement(formulaElement);
		var nextFormulaElement = this._formulaManager.getNextElement(formulaElement);
		if (keyItem.key === KeyboardKey.Backspace) {
			formulaElement = this._processRemoveByBackspaceOpertion(formulaElement);
		} else if (keyItem.key === KeyboardKey.Delete) {
			formulaElement = this._processRemoveByDeleteOpertion(formulaElement);
		}
		if (formulaElement === null || formulaElement.isEmpty()) {
			this._formulaManager.tryJoinElements(prevFormulaElement, nextFormulaElement)
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
		var currentElement = this._formulaManager.getCurrentElement(this.caretIndex);
		var formulaElement = this._getEditableElement();
		if (currentElement !== formulaElement) {
			var innerCaretIndex = this._formulaManager.getElementPosition(formulaElement) < this._formulaManager.getElementPosition(currentElement)
				? formulaElement.contentLength
				: 0;
			this.caretIndex =  this._formulaManager.getActualFormulaElementCaretIndex(formulaElement, innerCaretIndex);
			
		}
		var formulaElementCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
		var prevFormulaElement = this._formulaManager.getPrevElement(formulaElement);
		if (keyItem.key === '.' && formulaElement.IsFirstCaretIndex(formulaElementCaretIndex) && prevFormulaElement?.mayBeExtendent()) {
			this.processExtendendOpertion(keyItem, prevFormulaElement);
			return;
		}
		if (keyItem.key === '"' && formulaElement.isEmpty() && (formulaElement.type === FormulaElementType.UNSETTED || (formulaElement.type === FormulaElementType.CONSTANT && (formulaElement.dataValueType === DataValueType.UNSETTED || formulaElement.dataValueType === DataValueType.TEXT)))) {
			formulaElement.insertAt('""', formulaElementCaretIndex);
		} else {
			formulaElement.insertAt(keyItem.key, formulaElementCaretIndex);
		}
		this.caretIndex =  this._formulaManager.getActualFormulaElementCaretIndex(formulaElement, formulaElementCaretIndex + keyItem.key.length);
	}

	public processSingleOpertion(keyItem: KeyItem): void {
		var operationFormulaElement = FormulaManager.generateSingleOperationFormulaElement(keyItem.key);
		var formulaElement = this._formulaManager.forceGetCurrentElement(this.caretIndex);
		var innerCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex)
		if (innerCaretIndex === 0) {
			this._formulaManager.insertBefore(operationFormulaElement, formulaElement);
		} else if (innerCaretIndex >= formulaElement.contentLength) {
			this._formulaManager.insertAfter(operationFormulaElement, formulaElement);
		} else {
			this._formulaManager.insertAfter(operationFormulaElement, formulaElement);
			if (formulaElement.canBeSplitted()) {
				var rightFormulaElement = formulaElement.split(innerCaretIndex);
				if (rightFormulaElement != null) {
					this._formulaManager.insertAfter(rightFormulaElement, operationFormulaElement);
				}
			} else {
				this.caretIndex += (formulaElement.contentLength - innerCaretIndex);
			}
		}
		this.caretIndex += keyItem.key.length;
	}

	public canProcessCommandKey(): boolean {
		var formulaElement = this._formulaManager.forceGetCurrentElement(this.caretIndex);
		var innerCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
		return formulaElement.IsFirstCaretIndex(innerCaretIndex) || formulaElement.IsLastCaretIndex(innerCaretIndex);
	}

	public processCommandOpertion(keyItem: KeyItem): void {
		this._callHandler(KeyboardProcessEvent.COMMAND, null, (response: ICommandOperationResponse) => {
			var formulaElement = this._formulaManager.getCurrentElement(this.caretIndex);
			var innerCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
			if (!FormulaUtilities.isEmpty(response.items)) {
				var contentShift: number = 0;
				if (formulaElement.IsFirstCaretIndex(innerCaretIndex)) {
					response.items.forEach((item: FormulaElement) => {
						contentShift += item.contentLength;
						this._formulaManager.insertBefore(item, formulaElement);
					});
				} else {
					response.items.reverse().forEach((item: FormulaElement) => {
						contentShift += item.contentLength;
						this._formulaManager.insertAfter(item, formulaElement);
					});
				}
				this.caretIndex += response.caretIndexShift ?? contentShift;
			}
		});
	}

	processExtendendOpertion(keyItem: KeyItem, formulaElement: FormulaElement): void {
		this._callHandler(KeyboardProcessEvent.EXTENDENT, {
			"rootMetaPath": formulaElement.metaPath 
		}, (response: IExtendColumnResponse) => {
			var oldContentLength = formulaElement.contentLength;
			formulaElement.content = response.content;
			formulaElement.metaPath = response.metaPath;
			formulaElement.dataValueType = response.dataValueType;
			this.caretIndex += formulaElement.contentLength - oldContentLength;
		});
	}

	public dispatchEvent(event: KeyboardEvent): boolean {
		const keyItem: KeyItem = KeyItem.fromKeyboardEvent(event);
		if (this._keyManager.isDeniedKey(keyItem)) {
			return true;
		}
		if (this._keyManager.isRemoveKey(keyItem)) {
			this.processRemoveOpertion(keyItem);
		} else if (this._keyManager.isChangelessKey(keyItem)) {
			this.processMoveCaretOpertion(keyItem);
		} else if (this._keyManager.isSingleOperationKey(keyItem) && !this._isInString()) {
			this.processSingleOpertion(keyItem);
		} else {
			if (this._keyManager.isCommandKey(keyItem) && this.canProcessCommandKey()) {
				this.processCommandOpertion(keyItem);
			} else {
				this.processCommonOpertion(keyItem);
			}
		}
		return true;
	}

	public subscribe(processEvent: KeyboardProcessEvent, fn: Function) {
		this._subscribes[processEvent] = fn;
	}

	public unSubscribe(processEvent: KeyboardProcessEvent) {
		delete this._subscribes[processEvent];
	}

	private _callHandler(processEvent: KeyboardProcessEvent, ...args: any[]) {
		var handler = this._subscribes[processEvent];
		if (handler != null) {
			handler(...args);
		}
	}

	private _getEditableElement(): FormulaElement {
		var formulaElement: FormulaElement = this._formulaManager.forceGetCurrentElement(this.caretIndex);
		if (!this._isEditabledElement(formulaElement)) {
			var innerCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
			if (formulaElement.IsFirstCaretIndex(innerCaretIndex)) {
				var prevFormulaElement = this._formulaManager.getPrevElement(formulaElement);
				if (prevFormulaElement != null && this._isEditabledElement(prevFormulaElement)) {
					return prevFormulaElement;
				} else  {
					var newFormulaElement = FormulaManager.generateEmptyFormulaElement();
					this._formulaManager.insertBefore(newFormulaElement, formulaElement);
					return newFormulaElement;
				}
			} else {
				var nextFormulaElement = this._formulaManager.getNextElement(formulaElement);
				if (nextFormulaElement != null && this._isEditabledElement(nextFormulaElement)) {
					return nextFormulaElement;
				} else  {
					var newFormulaElement = FormulaManager.generateEmptyFormulaElement();
					this._formulaManager.insertAfter(newFormulaElement, formulaElement);
					return newFormulaElement;
				}
			}
		}
		return formulaElement;
	}

	private _isInString(): boolean {
		var formulaElement = this._formulaManager.getCurrentElement(this.caretIndex);
		if (formulaElement == null || !formulaElement.isEditableString()) {
			return false;
		}
		var innerCaretIndex = this._formulaManager.getFormulaElementCaretIndex(formulaElement, this.caretIndex);
		if (formulaElement.IsFirstCaretIndex(innerCaretIndex) || formulaElement.IsLastCaretIndex(innerCaretIndex)) {
			return false;
		}
		return true;
	}

	private _isEditabledElement(formulaElement: FormulaElement): boolean {
		return formulaElement.canKeyEdit();
	}
}