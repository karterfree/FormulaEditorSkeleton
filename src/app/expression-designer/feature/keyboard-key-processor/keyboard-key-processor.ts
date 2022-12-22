import { ExpressionSourceRequestFilterLogicalOperation, ExpressionSourceRequestFilterType, IExpressionSourceItem, IExpressionSourceRequest } from "../../data-access/expression-source-api/expression-source-service.service";
import { ComparisonType } from "../../util/enums/comparison-type.enum";
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

export class KeyboardKeyProcessor {
	private _expressionManager: ExpressionManager;
	private _keyUtilities: KeyUtilities;
	private _caretIndex: number;
	private _subscribes: {[key: string]: Function};
	private _rootSchemaUId: string = "25d7c1ab-1de0-4501-b402-02e0e5a72d6e";

	private _keyPressItem: KeyItem | null = null;


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
		var activeNode = this._expressionManager.activeNode;
		var newActiveNode = this._expressionManager.getCurrentElement(this.caretIndex);
		if (activeNode != null && activeNode !== newActiveNode) {
			if (this._isActiveNodeInEditStatus() && !activeNode.isEmpty()) {
				this._unsetActiveNode();
			}
			this._expressionManager.activeNode = newActiveNode;
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
		this._expressionManager.activeNode = expressionNode;
		if (expressionNode !== null && !this._expressionManager.canBeEmpty(expressionNode)) {
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
		this._expressionManager.activeNode = expressionNode;
		if (expressionNode != null) {
			if (ExpressionUtilities.isComplexType(expressionNode.type) && !expressionNode.inEditStatus) {
				expressionNode.inEditStatus = true;
				this._markNextChainNodesToDelete(expressionNode);
			}
			expressionNode.removeByBackspace(this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex))
			this.caretIndex--;
		}
		return expressionNode;
	}

	private _markNextChainNodesToDelete(expressionNode: ExpressionNode) {
		var next = this._expressionManager.getNextElement(expressionNode);
		if (next != null && expressionNode.isJoinedWith(next)) {
			next.markToDelete();
			this._markNextChainNodesToDelete(next);
		}
	}

	private _unmarkNextChainNodesToDelete(expressionNode: ExpressionNode) {
		var next = this._expressionManager.getNextElement(expressionNode);
		if (next != null && expressionNode.isJoinedWith(next)) {
			next.unMarkToDelete();
			this._unmarkNextChainNodesToDelete(next);
		}
	}

	private _removeMarkedElements(): void {
		var items = this._expressionManager.getMarkedToDeleteElements();
		if (items.length <= 0) {
			return;
		}
		this.caretIndex = this._expressionManager.getActualExpressionNodeCaretIndex(items[0]);
		items.forEach(x=>this._expressionManager.removeElement(x));
	}

	private _processRemoveByDeleteOpertion(element: ExpressionNode): ExpressionNode | null {
		let expressionNode: ExpressionNode | null = element;
		if (this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex) >= expressionNode.contentLength) {
			expressionNode = this._expressionManager.getNextElement(expressionNode);
		}
		this._expressionManager.activeNode = expressionNode;
		if (expressionNode != null) {
			var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
			if (ExpressionUtilities.isComplexType(expressionNode.type) && !expressionNode.inEditStatus) {
				expressionNode.inEditStatus = true;
				this._markNextChainNodesToDelete(expressionNode);
			}
			expressionNode.removeByDelete(innerCaretIndex);
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
		this._expressionManager.activeNode = expressionNode;
		var expressionNodeCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
		var prevExpressionNode = this._expressionManager.getPrevElement(expressionNode);
		if (keyItem.key === KeyboardKey.Dot && expressionNode.IsFirstCaretIndex(expressionNodeCaretIndex) && prevExpressionNode?.mayBeExtendent()) {
			this.processExtendendOpertion(keyItem, prevExpressionNode);
			return;
		}
		if (keyItem.key === KeyboardKey.Space && !expressionNode.isEditableString() && !this._isActiveNodeInEditStatus()) {
			return;
		}
		if (keyItem.key === KeyboardKey.Quotation && expressionNode.isEmpty() && (expressionNode.type === ExpressionNodeType.CONSTANT && (expressionNode.dataValueType === DataValueType.UNSETTED ||
			expressionNode.dataValueType === DataValueType.TEXT))) {
			expressionNode.insertAt(KeyboardKey.Quotation + KeyboardKey.Quotation, expressionNodeCaretIndex);
		} else {
			expressionNode.insertAt(keyItem.key, expressionNodeCaretIndex);
		}
		this._expressionManager.activeNode = expressionNode;
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
		this._expressionManager.activeNode = operationExpressionNode;
		this.caretIndex = this._expressionManager.getActualExpressionNodeCaretIndex(operationExpressionNode, operationExpressionNode.contentLength);
	}

	public canProcessCommandKey(): boolean {
		var expressionNode = this._expressionManager.forceGetCurrentElement(this.caretIndex);
		var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);
		return expressionNode.IsFirstCaretIndex(innerCaretIndex) || expressionNode.IsLastCaretIndex(innerCaretIndex);
	}

	public getComplexListRequest(): IExpressionSourceRequest | null {
		if (this._expressionManager.activeNode == null || !this._expressionManager.activeNode.inEditStatus) {
			return null;
		}
		var prevNode = this._expressionManager.getPrevElement(this._expressionManager.activeNode);
		if (prevNode != null && prevNode.isJoinedWith(this._expressionManager.activeNode)) {
			return {
				titlePart: this._expressionManager.activeNode.title,
				filter: {
					logicalOperation: ExpressionSourceRequestFilterLogicalOperation.AND,
					type: ExpressionSourceRequestFilterType.FilterGroup,
					items: [{
						type: ExpressionSourceRequestFilterType.ComparisonFilter,
						propertyName: "schemaUId",
						comparisonType: ComparisonType.EQUAL,
						value: prevNode.referenceSchemaUId
					}, {
						type: ExpressionSourceRequestFilterType.ComparisonFilter,
						propertyName: "type",
						comparisonType: ComparisonType.EQUAL,
						value: ExpressionNodeType.COLUMN
					}]
				},
				keyItem: this._keyPressItem
			}
		}
		return {
			titlePart: this._expressionManager.activeNode.title,
			filter: {
				logicalOperation: ExpressionSourceRequestFilterLogicalOperation.OR,
				type: ExpressionSourceRequestFilterType.FilterGroup,
				items: [{
					logicalOperation: ExpressionSourceRequestFilterLogicalOperation.AND,
					type: ExpressionSourceRequestFilterType.FilterGroup,
					items: [{
						type: ExpressionSourceRequestFilterType.ComparisonFilter,
						propertyName: "schemaUId",
						comparisonType: ComparisonType.EQUAL,
						value: this._rootSchemaUId
					}, {
						type: ExpressionSourceRequestFilterType.ComparisonFilter,
						propertyName: "type",
						comparisonType: ComparisonType.EQUAL,
						value: ExpressionNodeType.COLUMN
					}]
				}, {
					type: ExpressionSourceRequestFilterType.ComparisonFilter,
					propertyName: "type",
					comparisonType: ComparisonType.EQUAL,
					value: ExpressionNodeType.FUNCTION
				}, {
					type: ExpressionSourceRequestFilterType.ComparisonFilter,
					propertyName: "type",
					comparisonType: ComparisonType.EQUAL,
					value: ExpressionNodeType.SYSTEM_SETTING
				}]
			},
			keyItem: this._keyPressItem
		}
	}

	public processCommandOpertion(keyItem: KeyItem): void {
		var expressionNode = this._expressionManager.getCurrentElement(this.caretIndex);
		var commandNode = ExpressionNodeGenerator.generateEmptyExpressionNode();
		if (expressionNode !== null && expressionNode.IsFirstCaretIndex(this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex))) {
			this._expressionManager.insertBefore(commandNode, expressionNode);
		} else {
			var position = expressionNode !== null ? this._expressionManager.getElementPosition(expressionNode) + 1 : 0;
			this._expressionManager.insertAtPosition(commandNode, position);
		}
		this._setCommandNodeToEditable(commandNode);
		this._expressionManager.activeNode = commandNode;
	}

	_setCommandNodeToEditable(expressionNode: ExpressionNode): void {
		expressionNode.inEditStatus = true;
	}

	processExtendendOpertion(keyItem: KeyItem, expressionNode: ExpressionNode): void {
		var commandNode = ExpressionNodeGenerator.generateEmptyExpressionNode();
		var dotElement = ExpressionNodeGenerator.generateSingleOperationExpressionNode(KeyboardKey.Dot);
		commandNode.extKey = dotElement.extKey = expressionNode.extKey;
		dotElement.schemaUId = expressionNode.schemaUId;
		dotElement.referenceSchemaUId = expressionNode.referenceSchemaUId;
		this._expressionManager.insertAfter(dotElement, expressionNode);
		this._expressionManager.insertAfter(commandNode, dotElement);
		this._setCommandNodeToEditable(commandNode);
		this._expressionManager.activeNode = commandNode;
		this.caretIndex++;
	}

	public dispatchSelectComplexEvent(complexItem: IExpressionSourceItem): boolean {
		var activeNode = this._expressionManager.activeNode;
		if (activeNode == null || !activeNode.inEditStatus) {
			return false;
		}
		var targetPosition = this._expressionManager.getActualExpressionNodeCaretIndex(activeNode, 0);
		if (activeNode.uId === complexItem.uId) {
			activeNode.rollbackChanges();
			this._unmarkNextChainNodesToDelete(activeNode);
		} else {
			activeNode.applyNodeData(complexItem);
			this._removeMarkedElements();
		}
		this.caretIndex = targetPosition + activeNode.contentLength;
		if (activeNode.type === ExpressionNodeType.FUNCTION) {
			var additionalNodes = ExpressionNodeGenerator.generateCustomFunctionArgumentsExpressionNodeGroup(activeNode.arguments);
			if (!ExpressionUtilities.isEmpty(activeNode.arguments)) {
				this.caretIndex++;
			} else {
				this.caretIndex += 2;
			}
			additionalNodes.reverse().forEach(x=>activeNode != null && this._expressionManager.insertAfter(x, activeNode));
		}
		return true;
	}

	public dispatchKeyPressEvent(keyItem: KeyItem): boolean {
		this._keyPressItem = keyItem;
		if (this._keyUtilities.isDeniedKey(keyItem)) {
			return true;
		}
		if (this._isActiveNodeInEditStatus()) {
			if (this._keyUtilities.isCancelKey(keyItem)) {
				this._unsetActiveNode();
				return true;
			}
		}
		if (this._keyUtilities.isVerticalMoveKey(keyItem) || this._keyUtilities.isEnterKey(keyItem)) {
			return true;
		}
		if (this._keyUtilities.isRemoveKey(keyItem)) {
			this.processRemoveOpertion(keyItem);
			return true;
		} else if (this._keyUtilities.isChangelessKey(keyItem)) {
			return false;
		} else if (this._keyUtilities.isHorizontalMoveKey(keyItem)) {
			this.processMoveCaretOpertion(keyItem);
			return false;
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

	private _isActiveNodeInEditStatus(): boolean {
		var activeNode = this._expressionManager.activeNode;
		return activeNode !== null && activeNode.inEditStatus;
	}

	private _unsetActiveNode(): boolean {
		var activeNode = this._expressionManager.activeNode;
		if (activeNode !== null) {
			activeNode.rollbackChanges();
			var zeroPosition = this._expressionManager.getActualExpressionNodeCaretIndex(activeNode, 0);
			if (zeroPosition < this._caretIndex) {
				this._caretIndex = zeroPosition + activeNode.contentLength;
			}
			this._unmarkNextChainNodesToDelete(activeNode);
			this._expressionManager.activeNode = null;
			return true;
		}
		return false;
	}

	private _getEditableElement(): ExpressionNode {
		var expressionNode: ExpressionNode = this._expressionManager.forceGetCurrentElement(this.caretIndex);
		if (this._isEditabledElement(expressionNode)) {
			return expressionNode;
		}
		var innerCaretIndex = this._expressionManager.getExpressionNodeCaretIndex(expressionNode, this.caretIndex);

		if (expressionNode.IsFirstCaretIndex(innerCaretIndex)) {
			var prevExpressionNode = this._expressionManager.getPrevElement(expressionNode);
			if (prevExpressionNode != null && this._isEditabledElement(prevExpressionNode)) {
				return prevExpressionNode;
			} else if (prevExpressionNode == null || !prevExpressionNode.isJoinedWith(expressionNode)) {
				var newExpressionNode = ExpressionNodeGenerator.generateEmptyConstantExpressionNode();
				this._expressionManager.insertBefore(newExpressionNode, expressionNode);
				return newExpressionNode;
			}
		}
		var nextEditableElement = this._getNextAfterChainElement(expressionNode);
		if (nextEditableElement != null && this._isEditabledElement(nextEditableElement)) {
			return nextEditableElement;
		} else  {
			var newExpressionNode = ExpressionNodeGenerator.generateEmptyConstantExpressionNode();
			if (nextEditableElement != null) {
				this._expressionManager.insertBefore(newExpressionNode, nextEditableElement);
			} else {
				this._expressionManager.add(newExpressionNode)
			}
			return newExpressionNode;
		}
	}

	private _getNextAfterChainElement(currentElement: ExpressionNode): ExpressionNode | null {
		var nextElement = this._expressionManager.getNextElement(currentElement);
		if (nextElement == null) {
			return null;
		}
		if (currentElement.isJoinedWith(nextElement)) {
			return this._getNextAfterChainElement(nextElement);
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
