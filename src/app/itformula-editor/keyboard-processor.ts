import { DataValueType } from "./enums";
import { FormulaDisplayElement, FormulaManager } from "./formula-construction";
import { KeyboardKeyProcessor } from "./keyboard-key-processor";


export enum KeyboardProcessEvent {
	FINISH = "Finish",
	COMMAND = "Command",
	EXTENDENT = "Extendent"
}

export interface IKeyboardProcessorResponse {
	elementIndex: number;
	elementCaretIndex: number;
	displayList: FormulaDisplayElement[]
}

export interface IExtendColumnResponse {
	content: string;
	metaPath: string;
	dataValueType: DataValueType
}

export class KeyboardProcessor {
	private _events: KeyboardEvent[];
	private _inProcess: boolean;
	private _subscribes: {[key: string]: Function};
	
	private _formulaManager: FormulaManager;
	private _keyboardKeyProcessor: KeyboardKeyProcessor;
	
	constructor() {
		this._events = [];
		this._inProcess = false;
		this._subscribes = {};
		this._formulaManager = new FormulaManager();
		this._keyboardKeyProcessor = new KeyboardKeyProcessor(this._formulaManager);

		this._subscribeOnKeyboardKeyProcessorEvents();
	}

	private _subscribeOnKeyboardKeyProcessorEvents(): void {
		this._keyboardKeyProcessor.subscribe(KeyboardProcessEvent.COMMAND, (...args: any) => this._callHandler(KeyboardProcessEvent.COMMAND, ...args));
		this._keyboardKeyProcessor.subscribe(KeyboardProcessEvent.EXTENDENT, (...args: any) => this._callHandler(KeyboardProcessEvent.EXTENDENT, ...args));
	}

	private _dispatchNextEvent(iterator: number = 0) {
		if (this._inProcess) {
			return;
		}
		if (!this._events.length) {
			this._invokeFinishHendler();
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
		}
		this._onEventDispatched(iterator)
	}

	private _onEventDispatched(iterator: number) {
		this._formulaManager.removeEmptyElements();
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
		return this._keyboardKeyProcessor.dispatchEvent(event);
	}

	private _invokeFinishHendler() {
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
		this._callHandler(KeyboardProcessEvent.FINISH, {
			"elementIndex": elementPosition,
			"elementCaretIndex": elementCaretIndex,
			"displayList": this._formulaManager.generateFormulaDisplayElementList()
		});
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

	public register(event: KeyboardEvent): void {
		this._events.push(event);
		this._dispatchNextEvent();
	}

	public getSerializedElements(): string {
		return this._formulaManager.getSerializedElements();
	}
}