import { IExpressionSourceItem } from "src/app/expression-designer/data-access/expression-source-api/expression-source-service.service";
import { DataValueType } from "src/app/expression-designer/util/enums/data-value-type.enum";
import { ExpressionNodeType } from "src/app/expression-designer/util/enums/expression-node-type.enum";
import { ExpressionUtilities } from "src/app/expression-designer/util/expression-utilities/expression-utilities";
import { ExpressionArgument } from "../expression-argument/expression-argument";
import { ExpressionDisplayElement } from "../expression-display-element/expression-display-element";

export class ExpressionNode {
	private _type: ExpressionNodeType;
	private _dataValueType: DataValueType;
	private _title: string;
	private _metaPath: string;
	private _arguments: ExpressionArgument[];
	private _extKey: string;
	private _inEditStatus: boolean;
	private _backup: ExpressionNode | null;
	private _code: string;
	private _isMarkedToDelete: boolean;

	public get title() {
		return this._title;
	}

	public set title(value: string) {
		this._title = value;
	}

	public get code() {
		return this._code;
	}

	public set code(value: string) {
		this._code = value;
	}

	public get metaPath() {
		return this._metaPath;
	}

	public set metaPath(metaPath: string) {
		this._metaPath = metaPath;
	}

	public get inEditStatus(): boolean {
		return this._inEditStatus;
	}

	public set inEditStatus(value: boolean) {
		if (value != this._inEditStatus) {
			this._inEditStatus = value;
			if (value) {
				this._backupExpressionNodeContent();
			}
		}
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
		return this.title.length;
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
		this._title = "";
		this._metaPath = "";
		this._arguments = [];
		this._isMarkedToDelete = false;
		this._extKey = ExpressionUtilities.generateGUID();
		this._inEditStatus = false;
		this._backup = null;
		this._code = "";
	}

	private _backupExpressionNodeContent() {
		this._backup = this.clone();
		this._clear();
	}

	public applyNodeData(sourceNode: IExpressionSourceItem) {
		this.title = sourceNode.title;
		this.code = sourceNode.code;
		this.type = sourceNode.type;
		this.dataValueType = sourceNode.dataValueType;
		this.arguments = [...(sourceNode.arguments || [])];
		this._backup = null;
		this.inEditStatus = false;
	}

	public restoreNodeData() {
		if (this._backup !== null) {
			this.title = this._backup.title;
			this.code = this._backup.code;
			this.type = this._backup.type;
			this.dataValueType = this._backup.dataValueType;
			this.arguments = [...this._backup.arguments];
		} else {
			this.title = "";
			this._clear();
		}
		this._backup = null;
		this.inEditStatus = false;
	}

	private _clear() {
		this.code = "";
		this.type = ExpressionNodeType.UNSETTED;
		this.dataValueType = DataValueType.UNSETTED;
		this.arguments = [];
	}

	public generateDisplayElement(): ExpressionDisplayElement {
		var displayElement = new ExpressionDisplayElement(this.title, this.type, this.dataValueType);
		displayElement.markedToDelete = this._isMarkedToDelete;
		return displayElement;
	}

	public canChangeType(): boolean {
		if (this.type === ExpressionNodeType.UNSETTED) {
			return false;
		}
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
		if (this.type === ExpressionNodeType.UNSETTED) {
			return false;
		}
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
		this.title += char;
	}

	public insertAt(char: string, position: number): void {
		if (position > this.title.length) {
			return this.append(char);
		}
		this.title = [this.title.slice(0, position), char, this.title.slice(position)].join('');
	}

	public removeByBackspace(position: number): boolean {
		if (position > 0) {
			this.title = [this.title.slice(0, position-1), this.title.slice(position)].join('');
			return true;
		}
		return false;
	}

	public removeByDelete(position: number): boolean {
		if (position < this.contentLength) {
			this.title = [this.title.slice(0, position), this.title.slice(position + 1)].join('');
			return true;
		}
		return false;
	}

	public clone() {
		var clone = new ExpressionNode();
		clone.title = this.title;
		clone.code = this.code;
		clone.type = this.type;
		clone.dataValueType = this.dataValueType;
		clone.arguments = [...this.arguments];
		clone.arguments = [...this.arguments];
		return clone;
	}

	public split(position: number): ExpressionNode | null {
		if (position > 0 && position < this.contentLength) {
			var leftContent = this.title.slice(0, position);
			var rightContent = this.title.slice(position);
			var clone = this.clone();
			clone.title = rightContent;
			this.title = leftContent;
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
		return this.title === null || this.title === undefined || this.title === "";
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
		this.title += source.title;
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
