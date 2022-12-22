import { IExpressionSourceItem, IExpressionSourceRequest } from "../../data-access/expression-source-api/expression-source-service.service";
import { KeyItem } from "../../util/models/key-item";
import { KeyboardProcessEvent } from "../common/enums/keyboard-process-event.enum";
import { ExpressionDisplayElement } from "../common/models/expression-display-element/expression-display-element";
import { ExpressionNode } from "../common/models/expression-node/expression-node";
import { ExpressionManager } from "../expression-manager/expression-manager";
import { KeyboardKeyProcessor } from "../keyboard-key-processor/keyboard-key-processor";

export interface IBaseProcessorRequest {
	caretIndex: number;
	elementIndex: number;
	elementCaretIndex: number;
}

export interface IKeyboardProcessorResponse extends IBaseProcessorRequest {
	displayList: ExpressionDisplayElement[],
	complexListRequest?: IExpressionSourceRequest
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

export enum KeyboardEventType {
	KeyPress,
	SelectComplex,
	Paste
}

export interface IKeyboardEventItem {
	type: KeyboardEventType,
	caretIndex: number,
	keyItem?: KeyItem,
	keyEvent?: KeyboardEvent,
	complexItem?: IExpressionSourceItem,
	content?: string
}

export interface ICommandOperationResponse {
	items: ExpressionNode[],
	caretIndexShift?: number;
}

export class KeyboardProcessor {
	private _events: IKeyboardEventItem[];
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
			if (event.type === KeyboardEventType.KeyPress && event.keyItem != null) {
				this._dispatchKeyPressEvent(event, iterator);
			} else if (event.type === KeyboardEventType.SelectComplex && event.complexItem != null) {
				this._dispatchComplexItemEvent(event.complexItem);
			} else if (event.type === KeyboardEventType.Paste && event.content != null) {
				this._dispatchPasteEvent(event.content);
			}
		}
		this._onEventDispatched(iterator)
	}

	private _onEventDispatched(iterator: number) {
		this._expressionManager.removeEmptyElements();
		this._inProcess = false;
		this._dispatchNextEvent(iterator + 1);
	}

	private _dispatchKeyPressEvent(event: IKeyboardEventItem, iterator: number): void {
		if (iterator === 0) {
			this._keyboardKeyProcessor.caretIndex = event.caretIndex;
		}
		if (event.keyItem && this._keyboardKeyProcessor.dispatchKeyPressEvent(event.keyItem) && event.keyEvent) {
			event.keyEvent.preventDefault();
			event.keyEvent.stopPropagation();
		}
	}

	private _dispatchComplexItemEvent(complexItem: IExpressionSourceItem): void {
		this._keyboardKeyProcessor.dispatchSelectComplexEvent(complexItem)
	}

	private _dispatchPasteEvent(content: string): void {

	}

	private _invokeFinishHendler() {
		this._expressionManager.actualizeExpressionNodesDataValueType();
		var caretIndex: number = this._keyboardKeyProcessor.caretIndex;
		var caretDomPosition = this._expressionManager.getCaretDomPosition(caretIndex);
		var complexListRequest = this._keyboardKeyProcessor.getComplexListRequest();
		this._callHandler(KeyboardProcessEvent.FINISH, {
			"caretIndex": caretIndex,
			"elementIndex": caretDomPosition.elementIndex,
			"elementCaretIndex": caretDomPosition.elementCaretIndex,
			"displayList": this._expressionManager.generateExpressionDisplayElementList(),
			"complexListRequest": complexListRequest
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
	public registerEvent(event: IKeyboardEventItem): void {
		this._events.push(event);
		this._dispatchNextEvent();
	}

	public registerEventBunch(events: IKeyboardEventItem[]): void {
		this._events.push(...events);
		this._dispatchNextEvent();
	}

	public getSerializedElements(): string {
		return this._expressionManager.getSerializedElements();
	}

	public getProcessedCaretIndex(): number {
		return this._keyboardKeyProcessor.caretIndex;
	}
}
