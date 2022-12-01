import { DataValueType } from "src/app/expression-designer/util/enums/data-value-type.enum";
import { ExpressionNodeType } from "src/app/expression-designer/util/enums/expression-node-type.enum";
import { ExpressionUtilities } from "src/app/expression-designer/util/expression-utilities/expression-utilities";
import { ExpressionArgument } from "../expression-argument/expression-argument";
import { ExpressionDisplayElement } from "../expression-display-element/expression-display-element";

export class ExpressionNode {
	private _type: ExpressionNodeType;
	private _dataValueType: DataValueType;
	private _content: string;
	private _metaPath: string;
	private _arguments: ExpressionArgument[];
	private _extKey: string;

	private _isMarkedToDelete: boolean;
	private _deleteFrom: number;

	public get content() {
		return this._content;
	}

	public set content(content: string) {
		this._content = content;
	}

	public get metaPath() {
		return this._metaPath;
	}

	public set metaPath(metaPath: string) {
		this._metaPath = metaPath;
	}

	public get type(): ExpressionNodeType {
		return this._type;
	}

	public set type(type: ExpressionNodeType) {
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

	public get arguments(): ExpressionArgument[] {
		return this._arguments;
	}

	public set arguments(functionArguments: ExpressionArgument[]) {
		this._arguments = functionArguments;
	}

	public get contentLength(): number {
		return this.content.length;
	}

	public get isMarkedToDelete(): boolean {
		return this._isMarkedToDelete;
	}

	public get extKey(): string {
		return this._extKey;
	}

	public set extKey(value: string) {
		if (value !== this._extKey) {
			this._extKey = value;
		}
	}

	constructor() {
		this._type = ExpressionNodeType.UNSETTED;
		this._dataValueType = DataValueType.UNSETTED;
		this._content = "";
		this._metaPath = "";
		this._arguments = [];
		this._isMarkedToDelete = false;
		this._deleteFrom = 0;
		this._extKey = "";
	}

	public generateDisplayElement(): ExpressionDisplayElement {
		var displayElement = new ExpressionDisplayElement(this.content, this.type, this.dataValueType);
		displayElement.markedToDelete = this._isMarkedToDelete;
		return displayElement;
	}

	public canChangeType(): boolean {
		if (this.type === ExpressionNodeType.COLUMN) {
			return false;
		}
		if (this.type === ExpressionNodeType.FUNCTION) {
			return false;
		}
		if (this.type === ExpressionNodeType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

	public canChangeDataValueType(): boolean {
		if (this.type === ExpressionNodeType.SINGLEOPERATION) {
			return false;
		}
		if (this.type === ExpressionNodeType.FUNCTION) {
			return false;
		}
		if (this.type === ExpressionNodeType.COLUMN) {
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
		var clone = new ExpressionNode();
		clone.content = this.content;
		clone.type = this.type;
		clone.dataValueType = this.dataValueType;
		return clone;
	}

	public split(position: number): ExpressionNode | null {
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

	public canBeSplitted(): boolean {
		if (this.type === ExpressionNodeType.SINGLEOPERATION) {
			return false;
		}
		if (this.type === ExpressionNodeType.FUNCTION) {
			return false;
		}
		if (this.type === ExpressionNodeType.COLUMN) {
			return false;
		}
		return true;
	}

	public mayBeExtendent(): boolean {
		return this.type === ExpressionNodeType.COLUMN && this.dataValueType === DataValueType.LOOKUP;
	}

	public isEmpty(): boolean {
		return this.content === null || this.content === undefined || this.content === "";
	}

	public merge(source: ExpressionNode | null): boolean {
		if (!source) {
			return false;
		}
		if (source.type === ExpressionNodeType.SINGLEOPERATION || this.type === ExpressionNodeType.SINGLEOPERATION) {
			return false;
		}
		if (source.type === ExpressionNodeType.FUNCTION || this.type === ExpressionNodeType.FUNCTION) {
			return false;
		}
		if (source.type === ExpressionNodeType.COLUMN || this.type === ExpressionNodeType.COLUMN) {
			return false;
		}
		this.content += source.content;
		return true;
	}

	public IsFirstCaretIndex(caretIndex: number): boolean {
		return caretIndex == 0;
	}

	public IsLastCaretIndex(caretIndex: number): boolean {
		return caretIndex >= this.contentLength;
	}

	public isEditableString(): boolean {
		return this.canKeyEdit() && this.dataValueType === DataValueType.TEXT;
	}

	public canKeyEdit(): boolean {
		if (this.type === ExpressionNodeType.COLUMN) {
			return false;
		}
		if (this.type === ExpressionNodeType.FUNCTION) {
			return false;
		}
		if (this.type === ExpressionNodeType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

	public isColumn(): boolean {
		return this.type === ExpressionNodeType.COLUMN;
	}

	public isExtendent(): boolean {
		return !ExpressionUtilities.isEmpty(this.metaPath) && this.metaPath.indexOf(".") >= 0;
	}

	public isJoinedWith(nextExpressionNode: ExpressionNode): boolean {
		return nextExpressionNode != null && !ExpressionUtilities.isEmpty(this.extKey) && nextExpressionNode.extKey === this.extKey;
	}

	public markToDelete(): void {
		this._isMarkedToDelete = true;
		
	}

	public unMarkToDelete(): void {
		this._isMarkedToDelete = false;
		this._deleteFrom = 0;
	}

	public canRemoveOperationWithoutMark(): boolean {
		if (this.type === ExpressionNodeType.COLUMN) {
			return false;
		}
		if (this.type === ExpressionNodeType.FUNCTION) {
			return false;
		}
		return true;
	}

	public froceGetExtKey(): string {
		if (ExpressionUtilities.isEmpty(this.extKey)) {
			this.extKey = ExpressionUtilities.generateGUID();
		}
		return this.extKey;
	}

}