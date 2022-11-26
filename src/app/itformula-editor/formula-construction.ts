import { Data } from "@angular/router";
import { DataValueType } from "./enums";
import { KeyboardKey } from "./key-construction";
import { FormulaUtilities } from "./utils";

export enum FormulaElementType {
	UNSETTED,
	CONSTANT,
	SINGLEOPERATION,
	COLUMN,
	FUNCTION
}

export class FormulaDisplayElement {
	content: string;
	type: FormulaElementType;
	dataValueType: DataValueType;
	markedToDelete: boolean;

	constructor(content: string, type: FormulaElementType, dataValueType: DataValueType) {
		this.content = content;
		this.type = type;
		this.dataValueType = dataValueType;
		this.markedToDelete = false;
	}

	public generateVisualizatorStyleClass(): string {
		return [this._generateDateAndTypeStyleClass(), this._generateMarkedToDeleteStyleClass()].join(" ");
	}

	private _generateDateAndTypeStyleClass(): string {
		switch (this.type) {
			case FormulaElementType.COLUMN:
				return "dvt-column";
			case FormulaElementType.COLUMN:
				return "dvt-function";
		}
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
	private _generateMarkedToDeleteStyleClass(): string {
		return this.markedToDelete
			? "marked-to-delete"
			: ""
		}
}

export class FormulaElementArgument {
	name: string;
	dataValueType: DataValueType;
	description: string;
	isRequired: boolean;

	constructor(name: string, dataValueType: DataValueType, isRequired: boolean = true) {
		this.name = name;
		this.dataValueType = dataValueType;
		this.isRequired = isRequired;
		this.description = "";
	}

}

export class FormulaElement {
	private _type: FormulaElementType;
	private _dataValueType: DataValueType;
	private _content: string;
	private _metaPath: string;
	private _arguments: FormulaElementArgument[];
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

	public get arguments(): FormulaElementArgument[] {
		return this._arguments;
	}

	public set arguments(functionArguments: FormulaElementArgument[]) {
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
		this._type = FormulaElementType.UNSETTED;
		this._dataValueType = DataValueType.UNSETTED;
		this._content = "";
		this._metaPath = "";
		this._arguments = [];
		this._isMarkedToDelete = false;
		this._deleteFrom = 0;
		this._extKey = "";
	}

	public generateDisplayElement(): FormulaDisplayElement {
		var displayElement = new FormulaDisplayElement(this.content, this.type, this.dataValueType);
		displayElement.markedToDelete = this._isMarkedToDelete;
		return displayElement;
	}

	public canChangeType(): boolean {
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		if (this.type === FormulaElementType.FUNCTION) {
			return false;
		}
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

	public canChangeDataValueType(): boolean {
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		if (this.type === FormulaElementType.FUNCTION) {
			return false;
		}
		if (this.type === FormulaElementType.COLUMN) {
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

	public canBeSplitted(): boolean {
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		if (this.type === FormulaElementType.FUNCTION) {
			return false;
		}
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		return true;
	}

	public mayBeExtendent(): boolean {
		return this.type === FormulaElementType.COLUMN && this.dataValueType === DataValueType.LOOKUP;
	}

	public isEmpty(): boolean {
		return this.content === null || this.content === undefined || this.content === "";
	}

	public merge(source: FormulaElement | null): boolean {
		if (!source) {
			return false;
		}
		if (source.type === FormulaElementType.SINGLEOPERATION || this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		if (source.type === FormulaElementType.FUNCTION || this.type === FormulaElementType.FUNCTION) {
			return false;
		}
		if (source.type === FormulaElementType.COLUMN || this.type === FormulaElementType.COLUMN) {
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
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		if (this.type === FormulaElementType.FUNCTION) {
			return false;
		}
		if (this.type === FormulaElementType.SINGLEOPERATION) {
			return false;
		}
		return true;
	}

	public isColumn(): boolean {
		return this.type === FormulaElementType.COLUMN;
	}

	public isExtendent(): boolean {
		return !FormulaUtilities.isEmpty(this.metaPath) && this.metaPath.indexOf(".") >= 0;
	}

	public isJoinedWith(nextFormulaElement: FormulaElement): boolean {
		return nextFormulaElement != null && !FormulaUtilities.isEmpty(this.extKey) && nextFormulaElement.extKey === this.extKey;
	}

	public markToDelete(): void {
		this._isMarkedToDelete = true;
		
	}

	public unMarkToDelete(): void {
		this._isMarkedToDelete = false;
		this._deleteFrom = 0;
	}

	public canRemoveOperationWithoutMark(): boolean {
		if (this.type === FormulaElementType.COLUMN) {
			return false;
		}
		if (this.type === FormulaElementType.FUNCTION) {
			return false;
		}
		return true;
	}

	

	public froceGetExtKey(): string {
		if (FormulaUtilities.isEmpty(this.extKey)) {
			this.extKey = FormulaUtilities.generateGUID();
		}
		return this.extKey;
	}

}

