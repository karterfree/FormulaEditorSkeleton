import { DataValueType } from "../../util/enums/data-value-type.enum";
import { ExpressionNodeType } from "../../util/enums/expression-node-type.enum";
import { KeyboardKey } from "../../util/enums/keyboard-key.enum";
import { ExpressionUtilities } from "../../util/expression-utilities/expression-utilities";
import { KeyUtilities } from "../../util/key-utilities/key-utilities";
import { KeyItem } from "../../util/models/key-item";
import { KeyboardProcessEvent } from "../common/enums/keyboard-process-event.enum";
import { ExpressionNode } from "../common/models/expression-node/expression-node";
import { ExpressionManager } from "../expression-manager/expression-manager";
import { ExpressionNodeGenerator } from "../expression-node-generator/expression-node-generator";
import { ICommandOperationRequest, ICommandOperationResponse, IExtendColumnRequest, IExtendColumnResponse } from "../keyboard-processor/keyboard-processor";

export class KeyboardKeyProcessor {
	private _expressionManager: ExpressionManager;
	private _keyUtilities: KeyUtilities;
	private _caretIndex: number;
	private _subscribes: {[key: string]: Function};

	
	
	public get caretIndex(): number {
		return this._caretIndex;
	}

	public set caretIndex(value: number) {
		this._caretIndex = value;
	}

	constructor(expressionManager: ExpressionManager) {
		this._caretIndex = 0;
		this._keyUtilities = new KeyUtilities();
		this._expressionManager = expressionManager;
		this._subscribes = {};
	}

	public processMoveCaretOpertion(keyItem: KeyItem): void {
		if (keyItem.key === KeyboardKey.ArrowLeft) {
			this.caretIndex = Math.max(this.caretIndex - 1, 0);
		} else if (keyItem.key === KeyboardKey.ArrowRight) {
			this.caretIndex = Math.min(this.caretIndex + 1, this._expressionManager.getTotalContentLength());
		} else if (keyItem.key === KeyboardKey.End) {
			this.caretIndex = this._expressionManager.getTotalContentLength();
		} else if (keyItem.key === KeyboardKey.Home) {
			this.caretIndex = 0;
		}
	}

	public processRemoveOpertion(keyItem: KeyItem): void {
		var expressionNode: ExpressionNode | null = this._expressionManager.getCurrentElement(this.caretIndex);
		if (expressionNode == null) {
			return;
		}
		if (keyItem.key === KeyboardKey.Backspace) {
			expressionNode = this._processRemoveByBackspaceOpertion(expressionNode);
		} else if (keyItem.key === KeyboardKey.Delete) {
			expressionNode = this._processRemoveByDeleteOpertion(expressionNode);
		}
		if (expressionNode !== null && expressionNode.isEmpty()) {
			var prevExpressionNode = this._expressionManager.getPrevElement(expressionNode);
			var nextExpressionNode = this._expressionManager.getNextElement(expressionNode);
			this._expressionManager.tryJoinElements(prevExpressionNode, nextExpressionNode)
		}
	}

	private _processRemoveByBackspaceOpertion(element: ExpressionNode): ExpressionNode | null {
		let expressionNode: ExpressionNode | null = element;
		if (this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex) <= 0) {
			expressionNode = this._expressionManager.getPrevElement(expressionNode);
		}
		if (expressionNode != null) {
			if (expressionNode.isMarkedToDelete) {
				this._removeMarkedElements();
			} else if (this._canRemoveOperationWithoutMark(expressionNode)) {
				expressionNode.removeByBackspace(this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex))
				this.caretIndex--;
			} else {
				this._markToDeleteFrom(expressionNode);
			}
		}
		return expressionNode;
	}

	private _removeMarkedElements(): void {
		var items = this._expressionManager.getMarkedToDeleteElements();
		if (items.length <= 0) {
			return;
		}
		this.caretIndex = this._expressionManager.getActualExpressionNodeCaretIndex(items[0]);
		items.forEach(x=>this._expressionManager.removeElement(x));
	}

	private _canRemoveOperationWithoutMark(expressionNode: ExpressionNode): boolean {
		var nextElement = this._expressionManager.getNextElement(expressionNode);
		if (!expressionNode.canRemoveOperationWithoutMark() || (!ExpressionUtilities.isEmpty(expressionNode.extKey) && nextElement != null && expressionNode.extKey === nextElement.extKey)) {
			return false;
		}
		return true;
	}

	private _markToDeleteFrom(expressionNode: ExpressionNode) {
		var prevExpressionNode = this._expressionManager.getPrevElement(expressionNode);
		if (expressionNode.isColumn() && prevExpressionNode != null && expressionNode.isJoinedWith(prevExpressionNode) && prevExpressionNode.content === KeyboardKey.Dot) {
			expressionNode = prevExpressionNode;
		}
		expressionNode.markToDelete();
		var nextExtChainElements = this._expressionManager.getExtChainElementsFrom(expressionNode);
		nextExtChainElements.forEach(x=>x.markToDelete());
	}

	private _processRemoveByDeleteOpertion(element: ExpressionNode): ExpressionNode | null {
		let expressionNode: ExpressionNode | null = element;
		if (this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex) >= expressionNode.contentLength) {
			expressionNode = this._expressionManager.getNextElement(expressionNode);
		}
		if (expressionNode != null) {
			var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
			if (expressionNode != null) {
				if (expressionNode.isMarkedToDelete) {
					this._removeMarkedElements();
				} else if (this._canRemoveOperationWithoutMark(expressionNode)) {
					expressionNode.removeByDelete(innerCaretIndex);
				} else {
					this._markToDeleteFrom(expressionNode);
				}
			}
		}
		return expressionNode;
	}

	public processCommonOpertion(keyItem: KeyItem): void {
		var currentElement = this._expressionManager.getCurrentElement(this.caretIndex);
		var expressionNode = this._getEditableElement();
		if (currentElement !== expressionNode) {
			var innerCaretIndex = this._expressionManager.getElementPosition(expressionNode) < this._expressionManager.getElementPosition(currentElement)
				? expressionNode.contentLength
				: 0;
			this.caretIndex =  this._expressionManager.getActualExpressionNodeCaretIndex(expressionNode, innerCaretIndex);
			
		}
		var expressionNodeCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
		var prevExpressionNode = this._expressionManager.getPrevElement(expressionNode);
		if (keyItem.key === KeyboardKey.Dot && expressionNode.IsFirstCaretIndex(expressionNodeCaretIndex) && prevExpressionNode?.mayBeExtendent()) {
			this.processExtendendOpertion(keyItem, prevExpressionNode);
			return;
		}
		if (keyItem.key === KeyboardKey.Space && !expressionNode.isEditableString()) {
			return;
		}
		if (keyItem.key === '"' && expressionNode.isEmpty() && (expressionNode.type === ExpressionNodeType.UNSETTED ||
            (expressionNode.type === ExpressionNodeType.CONSTANT && (expressionNode.dataValueType === DataValueType.UNSETTED ||
                expressionNode.dataValueType === DataValueType.TEXT)))) {
			expressionNode.insertAt('""', expressionNodeCaretIndex);
		} else {
			expressionNode.insertAt(keyItem.key, expressionNodeCaretIndex);
		}
		this.caretIndex =  this._expressionManager.getActualExpressionNodeCaretIndex(expressionNode, expressionNodeCaretIndex + keyItem.key.length);
	}

	public processSingleOpertion(keyItem: KeyItem): void {
		var operationExpressionNode = ExpressionNodeGenerator.generateSingleOperationExpressionNode(keyItem.key);
		var expressionNode = this._expressionManager.forceGetCurrentElement(this.caretIndex);
		var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex)
		if (innerCaretIndex === 0 && this._expressionManager.canInsertBefore(expressionNode)) {
			this._expressionManager.insertBefore(operationExpressionNode, expressionNode);
		} else if (innerCaretIndex >= expressionNode.contentLength) {
			var insertPosition = this._expressionManager.getPositionForInsertAfter(expressionNode);
			expressionNode = this._expressionManager.getElementByIndex(insertPosition) || expressionNode;
			this._expressionManager.insertAfter(operationExpressionNode, expressionNode);
		} else {
			if (expressionNode.canBeSplitted()) {
				this._expressionManager.insertAfter(operationExpressionNode, expressionNode);
				var rightExpressionNode = expressionNode.split(innerCaretIndex);
				if (rightExpressionNode != null) {
					this._expressionManager.insertAfter(rightExpressionNode, operationExpressionNode);
				}
			} else {
				var insertPosition = this._expressionManager.getPositionForInsertAfter(expressionNode);
				expressionNode = this._expressionManager.getElementByIndex(insertPosition) || expressionNode;
				this._expressionManager.insertAfter(operationExpressionNode, expressionNode);
			}
		}
		this.caretIndex = this._expressionManager.getActualExpressionNodeCaretIndex(operationExpressionNode, operationExpressionNode.contentLength);
	}

	public canProcessCommandKey(): boolean {
		var expressionNode = this._expressionManager.forceGetCurrentElement(this.caretIndex);
		var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
		return expressionNode.IsFirstCaretIndex(innerCaretIndex) || expressionNode.IsLastCaretIndex(innerCaretIndex);
	}

	public processCommandOpertion(keyItem: KeyItem): void {
		var caretDomPosition = this._expressionManager.getCaretDomPosition(this.caretIndex);
		var request: ICommandOperationRequest = {
			"elementIndex": caretDomPosition.elementIndex,
			"elementCaretIndex": caretDomPosition.elementCaretIndex
		}
		this._callHandler(KeyboardProcessEvent.COMMAND, request, (response: ICommandOperationResponse) => {
			if (ExpressionUtilities.isEmpty(response.items)) {
				return;
			}
			var contentShift: number = 0;
			var expressionNode = this._expressionManager.getCurrentElement(this.caretIndex);
			if (expressionNode !== null && expressionNode.IsFirstCaretIndex(this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex))) {
				response.items.forEach((item: ExpressionNode) => {
					contentShift += item.contentLength;
					this._expressionManager.insertBefore(item, expressionNode);
				});
			} else {
				var position = expressionNode !== null ? this._expressionManager.getElementPosition(expressionNode) + 1 : 0;
				response.items.reverse().forEach((item: ExpressionNode) => {
					contentShift += item.contentLength;
					this._expressionManager.insertAtPosition(item, position);
				});
			}
			this.caretIndex += response.caretIndexShift ?? contentShift;
			this._callHandler(KeyboardProcessEvent.FINISH);
		});
	}

	processExtendendOpertion(keyItem: KeyItem, expressionNode: ExpressionNode): void {
		var caretDomPosition = this._expressionManager.getCaretDomPosition(this.caretIndex);
		var request: IExtendColumnRequest = {
			"elementIndex": caretDomPosition.elementIndex,
			"elementCaretIndex": caretDomPosition.elementCaretIndex,
			"extRootMetaPath": expressionNode.metaPath,
			"extKey": expressionNode.froceGetExtKey()
		};
		this._callHandler(KeyboardProcessEvent.EXTENDENT, request, (response: IExtendColumnResponse) => {
			var contentShift: number = 0;
			response.items.reverse().forEach((item: ExpressionNode) => {
				item.extKey = expressionNode.extKey;
				this._expressionManager.insertAfter(item, expressionNode);
				var dotElement = ExpressionNodeGenerator.generateSingleOperationExpressionNode(KeyboardKey.Dot);
				dotElement.extKey = expressionNode.extKey;
				this._expressionManager.insertAfter(dotElement, expressionNode);
				contentShift += item.contentLength + 1;
			});
			this.caretIndex += contentShift;
			this._callHandler(KeyboardProcessEvent.FINISH);
		});
	}

	public dispatchEvent(event: KeyboardEvent): boolean {
		const keyItem: KeyItem = KeyItem.fromKeyboardEvent(event);
		if (this._keyUtilities.isDeniedKey(keyItem)) {
			return true;
		}
		if (!this._keyUtilities.isRemoveKey(keyItem) && this._expressionManager.hasMarkToDelete()) {
			this._expressionManager.removeAllMarksToDelete();
		}
		if (this._keyUtilities.isRemoveKey(keyItem)) {
			this.processRemoveOpertion(keyItem);
		} else if (this._keyUtilities.isChangelessKey(keyItem)) {
			this.processMoveCaretOpertion(keyItem);
		} else if (this._keyUtilities.isSingleOperationKey(keyItem) && !this._isInString()) {
			this.processSingleOpertion(keyItem);
		} else {
			if (this._keyUtilities.isCommandKey(keyItem) && this.canProcessCommandKey()) {
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

	private _getEditableElement(): ExpressionNode {
		var expressionNode: ExpressionNode = this._expressionManager.forceGetCurrentElement(this.caretIndex);
		if (this._isEditabledElement(expressionNode)) {
			return expressionNode;
		}
		var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
		if (expressionNode.IsFirstCaretIndex(innerCaretIndex)) {
			var prevExpressionNode = this._expressionManager.getPrevElement(expressionNode);
			if (prevExpressionNode != null) {
				if (this._isEditabledElement(prevExpressionNode)) {
					return prevExpressionNode;
				} else if (!prevExpressionNode.isJoinedWith(expressionNode)) {
					var newExpressionNode = ExpressionNodeGenerator.generateEmptyExpressionNode();
					this._expressionManager.insertBefore(newExpressionNode, expressionNode);
					return newExpressionNode;
				}
			} else {
				var newExpressionNode = ExpressionNodeGenerator.generateEmptyExpressionNode();
				this._expressionManager.insertBefore(newExpressionNode, expressionNode);
				return newExpressionNode;
			}
		}
		var nextEditableElement = this._getNextEditableElement(expressionNode);
		if (nextEditableElement != null && this._isEditabledElement(nextEditableElement)) {
			return nextEditableElement;
		} else  {
			var newExpressionNode = ExpressionNodeGenerator.generateEmptyExpressionNode();
			if (nextEditableElement != null) {
				this._expressionManager.insertAfter(newExpressionNode, nextEditableElement);
			} else {
				this._expressionManager.add(newExpressionNode)
			}
			return newExpressionNode;
		}
	}

	private _getNextEditableElement(currentElement: ExpressionNode): ExpressionNode | null {
		var nextElement = this._expressionManager.getNextElement(currentElement);
		if (nextElement == null) {
			return null;
		}
		if (currentElement.isJoinedWith(nextElement)) {
			return this._getNextEditableElement(nextElement);
		}
		return nextElement;
	}


	private _isInString(): boolean {
		var expressionNode = this._expressionManager.getCurrentElement(this.caretIndex);
		if (expressionNode == null || !expressionNode.isEditableString()) {
			return false;
		}
		var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
		if (expressionNode.IsFirstCaretIndex(innerCaretIndex) || expressionNode.IsLastCaretIndex(innerCaretIndex)) {
			return false;
		}
		return true;
	}

	private _isEditabledElement(expressionNode: ExpressionNode): boolean {
		return expressionNode.canKeyEdit();
	}
}