import { KeyboardProcessEvent } from "../common/enums/keyboard-process-event.enum";
import { ExpressionDisplayElement } from "../common/models/expression-display-element/expression-display-element";
import { ExpressionNode } from "../common/models/expression-node/expression-node";
import { ExpressionManager } from "../expression-manager/expression-manager";
import { KeyboardKeyProcessor } from "../keyboard-key-processor/keyboard-key-processor";

export interface IBaseProcessorRequest {
	elementIndex: number;
	elementCaretIndex: number;
}

export interface IKeyboardProcessorResponse extends IBaseProcessorRequest {
	displayList: ExpressionDisplayElement[]
}

export interface IExtendColumnRequest extends IBaseProcessorRequest {
	extRootMetaPath: string,
	extKey: string
}

export interface IExtendColumnResponse {
	items: ExpressionNode[],
}

export interface ICommandOperationRequest extends IBaseProcessorRequest {
	
}

export interface ICommandOperationResponse {
	items: ExpressionNode[],
	caretIndexShift?: number;
}

export class KeyboardProcessor {
	private _events: KeyboardEvent[];
	private _inProcess: boolean;
	private _subscribes: {[key: string]: Function};
	
	private _expressionManager: ExpressionManager;
	private _keyboardKeyProcessor: KeyboardKeyProcessor;
	
	constructor() {
		this._events = [];
		this._inProcess = false;
		this._subscribes = {};
		this._expressionManager = new ExpressionManager();
		this._keyboardKeyProcessor = new KeyboardKeyProcessor(this._expressionManager);

		this._subscribeOnKeyboardKeyProcessorEvents();
	}

	private _subscribeOnKeyboardKeyProcessorEvents(): void {
		this._keyboardKeyProcessor.subscribe(KeyboardProcessEvent.FINISH, (...args: any) => this._invokeFinishHendler());
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
		this._expressionManager.removeEmptyElements();
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
		this._expressionManager.actualizeExpressionNodesDataValueType();
		var caretIndex: number = this._keyboardKeyProcessor.caretIndex;
		var caretDomPosition = this._expressionManager.getCaretDomPosition(caretIndex);
		this._callHandler(KeyboardProcessEvent.FINISH, {
			"elementIndex": caretDomPosition.elementIndex,
			"elementCaretIndex": caretDomPosition.elementCaretIndex,
			"displayList": this._expressionManager.generateExpressionDisplayElementList()
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
		return this._expressionManager.getSerializedElements();
	}
}