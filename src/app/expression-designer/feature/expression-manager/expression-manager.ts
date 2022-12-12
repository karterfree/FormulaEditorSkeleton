import { DataValueType } from "../../util/enums/data-value-type.enum";
import { ExpressionNodeType } from "../../util/enums/expression-node-type.enum";
import { ExpressionUtilities } from "../../util/expression-utilities/expression-utilities";
import { ExpressionDisplayElement } from "../common/models/expression-display-element/expression-display-element";
import { ExpressionNode } from "../common/models/expression-node/expression-node";
import { ExpressionNodeGenerator } from "../expression-node-generator/expression-node-generator";

export interface ICaretDomPosition {
	elementIndex: number;
	elementCaretIndex: number;
}

export class ExpressionManager {
	private _expressionNodes: ExpressionNode[];

	private _activeNode: ExpressionNode | null;

	public get activeNode(): ExpressionNode | null {
		return this._activeNode;
	}

	public set activeNode(value: ExpressionNode | null) {
		this._activeNode = value;
	}

	constructor() {
		this._expressionNodes = [];
		this._activeNode = null;
	}


	public getCurrentElement(caretIndex: number): ExpressionNode {
		var startFrom: number = 0;
		var isFounded: boolean = false;
		var selectedNode: ExpressionNode = this._expressionNodes[this._expressionNodes.length-1] || null;
		this._expressionNodes.forEach((element)=> {
			if (!isFounded) {
				if (caretIndex >= startFrom && caretIndex < (startFrom + element.contentLength)) {
					selectedNode = element;
					isFounded = true;
				} else {
					startFrom += element.contentLength;
				}
			}
		});
		if (this.activeNode != null && selectedNode != null) {
			var innerCaretIndex = this.getExpressionNodeCaretIndex(selectedNode, caretIndex);
			var prevNode = this.getPrevElement(selectedNode);
			var nextNode = this.getNextElement(selectedNode);
			if (innerCaretIndex === 0 && prevNode == this.activeNode) {
				selectedNode = this.activeNode;
			} else if (innerCaretIndex === selectedNode.contentLength && nextNode == this.activeNode) {
				selectedNode = this.activeNode;
			}
		}

		return selectedNode;
	}

	public forceGetCurrentElement(caretIndex: number): ExpressionNode {
		var expressionNode = this.getCurrentElement(caretIndex);
		if (!expressionNode) {
			expressionNode = ExpressionNodeGenerator.generateEmptyConstantExpressionNode()
			this.add(expressionNode);
		}
		return expressionNode;
	}

	public getFirstElement(): ExpressionNode | null {
		return this._expressionNodes.length
			? this._expressionNodes[0]
			: null;
	}

	public getLastElement(): ExpressionNode | null {
		return this._expressionNodes.length
			? this._expressionNodes[this._expressionNodes.length - 1]
			: null;
	}

	public getElementByIndex(index: number): ExpressionNode | null {
		return index >= 0 && index < this._expressionNodes.length
			? this._expressionNodes[index]
			: null;
	}

	public getElementPosition(element: ExpressionNode): number {
		return this._expressionNodes.indexOf(element);
	}

	public getNextElement(element: ExpressionNode): ExpressionNode | null {
		var position = this.getElementPosition(element);
		if (position < 0 || element === this.getLastElement()) {
			return null;
		}
		return this.getElementByIndex(position + 1);
	}

	public hasPrevElement(element: ExpressionNode): boolean {
		var position = this.getElementPosition(element);
		if (position < 0 || element === this.getFirstElement()) {
			return false;
		}
		return true;
	}

	public getPrevElement(element: ExpressionNode): ExpressionNode | null {
		var position = this.getElementPosition(element);
		if (position < 0 || element === this.getFirstElement()) {
			return null;
		}
		return this.getElementByIndex(position - 1);
	}

	public insertAtPosition(element: ExpressionNode, position: number) {
		var correctedPosition = Math.max(Math.min(position, this._expressionNodes.length), 0)
		this._expressionNodes.splice(correctedPosition, 0, element);
	}

	public add(element: ExpressionNode) {
		this._expressionNodes.push(element);
	}

	public insertBefore(insertedElement: ExpressionNode, targetElement: ExpressionNode) {
		var position = this.getElementPosition(targetElement);
		this.insertAtPosition(insertedElement, position);
	}

	public insertAfter(insertedElement: ExpressionNode, targetElement: ExpressionNode) {
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

	public getPositionForInsertAfter(expressionNode: ExpressionNode): number {
		if (this._expressionNodes.length <= 0) {
			return 0;
		}
		var position = this.getElementPosition(expressionNode);
		for (let i = position; i < this._expressionNodes.length; i++) {
			if (this.canInsertAfter(expressionNode)) {
				return i;
			}
		}
		return this._expressionNodes.length - 1;
	}

	public canInsertBefore(expressionNode: ExpressionNode): boolean {
		var position = this.getElementPosition(expressionNode);
		return this.canInsertAtPosition(position);
	}

	public canInsertAfter(expressionNode: ExpressionNode): boolean {
		var position = this.getElementPosition(expressionNode);
		return this.canInsertAtPosition(position + 1);
	}

	public generateExpressionDisplayElementList(): ExpressionDisplayElement[] {
		var response: ExpressionDisplayElement[] = [];
		this._expressionNodes.forEach(item => response.push(item.generateDisplayElement()));
		return response;
	}

	public getExpressionNodeCaretIndex(element: ExpressionNode, caretIndex: number): number {
		var totalElementStartPosition: number = 0;
		for (var i = 0; i < this.getElementPosition(element); i++) {
			totalElementStartPosition+= this._expressionNodes[i].contentLength;
		}
		return caretIndex - totalElementStartPosition;
	}

	public getActualExpressionNodeCaretIndex(element: ExpressionNode, innerCaretIndex: number = 0): number {
		var totalElementStartPosition: number = 0;
		for (var i = 0; i < this.getElementPosition(element); i++) {
			totalElementStartPosition+= this._expressionNodes[i].contentLength;
		}
		return totalElementStartPosition + innerCaretIndex;
	}

	public actualizeExpressionNodesDataValueType(): void {
		this._expressionNodes.forEach(x=>{
			if (x.canChangeDataValueType()) {
				x.dataValueType = this._parseDataValueType(x.title);
			}
		});
	}

	public removeEmptyElements() {
		for (let i = this._expressionNodes.length -1; i >= 0; i--) {
			var node = this._expressionNodes[i];
			if (node.isEmpty() && !this.canBeEmpty(node)) {
				this._expressionNodes.splice(i, 1);
			}
		}
	}

	public canBeEmpty(node: ExpressionNode): boolean {
		return node === this.activeNode && ExpressionUtilities.isComplexType(node.type);
	}

	public removeElement(expressionNode: ExpressionNode | null) {
		if (expressionNode) {
			var positon = this.getElementPosition(expressionNode);
			this._expressionNodes.splice(positon, 1);
			if (this.activeNode === expressionNode) {
				this.activeNode = null;
			}
		}
	}

	public getSerializedElements(): string {
		return JSON.stringify(this._expressionNodes) + " |||| " + JSON.stringify(this.activeNode);
	}

	public tryJoinElements(leftElement: ExpressionNode | null, rightElement: ExpressionNode | null): boolean {
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
		this._expressionNodes.forEach((x) => length+=x.contentLength);
		return length;
	}

	public hasMarkToDelete(): boolean {
		return this._expressionNodes.filter(x=>x.isMarkedToDelete).length > 0;
	}

	public removeAllMarksToDelete(): void {
		this._expressionNodes.filter(x=>x.isMarkedToDelete).forEach(x=>x.unMarkToDelete());
	}

	public getMarkedToDeleteElements(): ExpressionNode[]  {
		return this._expressionNodes.filter(x=>x.isMarkedToDelete)
	}

	public getExtChainElementsFrom(element: ExpressionNode): ExpressionNode[]  {
		if (ExpressionUtilities.isEmpty(element.extKey)) {
			return [];
		}
		var startPosition = this.getElementPosition(element);
		return this._expressionNodes.filter(x=>this.getElementPosition(x) > startPosition && x.extKey === element.extKey);
	}

	public getCaretDomPosition(caretIndex: number): ICaretDomPosition {
		var elementIndex = 0;
		var elementCaretIndex = 0;
		var expressionNode = this.getCurrentElement(caretIndex);
		if (expressionNode != null) {
			elementIndex = this.getElementPosition(expressionNode);
			elementCaretIndex = this.getExpressionNodeCaretIndex(expressionNode, caretIndex);
			var prevExpressionNode = this.getPrevElement(expressionNode);
			if (elementCaretIndex < 0 && prevExpressionNode != null) {
				elementIndex = this.getElementPosition(expressionNode);
				expressionNode = prevExpressionNode;
				elementCaretIndex =  this.getExpressionNodeCaretIndex(expressionNode, caretIndex);
			}
		}
		return {
			"elementIndex": elementIndex,
			"elementCaretIndex": elementCaretIndex
		};
	}

	

	

}