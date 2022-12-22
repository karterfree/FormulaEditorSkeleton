import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ExpressionSourceServiceService, IExpressionSourceItem, IExpressionSourceRequest } from '../../data-access/expression-source-api/expression-source-service.service';
import { DataValueType } from '../../util/enums/data-value-type.enum';
import { ExpressionNodeType } from '../../util/enums/expression-node-type.enum';
import { KeyboardKey } from '../../util/enums/keyboard-key.enum';
import { ExpressionUtilities } from '../../util/expression-utilities/expression-utilities';
import { KeyUtilities } from '../../util/key-utilities/key-utilities';
import { KeyItem } from '../../util/models/key-item';
import { KeyboardProcessEvent } from '../common/enums/keyboard-process-event.enum';
import { ICommandLineCommand } from '../common/interfaces/icommand-line-command';
import { ExpressionArgument } from '../common/models/expression-argument/expression-argument';
import { ExpressionDisplayElement } from '../common/models/expression-display-element/expression-display-element';
import { IKeyboardEventItem, IKeyboardProcessorResponse, KeyboardEventType, KeyboardProcessor } from '../keyboard-processor/keyboard-processor';

class ExpressionComplexListItem implements IExpressionSourceItem {
	uId: string;
	title: string;
	code: string;
	type: ExpressionNodeType;
	dataValueType: DataValueType;
	arguments?: ExpressionArgument[];
	schemaUId?: string;
	referenceSchemaUId?: string;


	focused: boolean = false;

	constructor(item: IExpressionSourceItem) {
		this.uId = item.uId;
		this.title = item.title;
		this.code = item.code;
		this.type = item.type;
		this.dataValueType = item.dataValueType;
		this.schemaUId = item.schemaUId;
		this.referenceSchemaUId = item.referenceSchemaUId;
		if (item.arguments) {
			this.arguments = item.arguments;
		}
	}

	getExpressionSourceItem(): IExpressionSourceItem {
		return {
			uId: this.uId,
			title: this.title,
			code: this.code,
			type: this.type,
			dataValueType: this.dataValueType,
			schemaUId: this.schemaUId,
			referenceSchemaUId: this.referenceSchemaUId,
			arguments: this.arguments
		}
	}
}

@Component({
  selector: 'app-expression-editor',
  templateUrl: './expression-editor.component.html',
  styleUrls: ['./expression-editor.component.less']
})
export class ExpressionEditorComponent implements OnInit {

	@ViewChild('visualizator') visualizator!: ElementRef;
	@ViewChild('elementsLog') elementsLog!: ElementRef;

	caretIndex: number;
	cursorIndex: number;
	cursorX: number;
	cursorY: number;
	complexListTop: number;
	complexListLeft: number;
	complexList: ExpressionComplexListItem[];

	private _complexListRequest: IExpressionSourceRequest | null = null;

	public commandLineCommand: ICommandLineCommand | null;

	public isComplexListVisible: boolean;

	private _keyUtilities: KeyUtilities;

	formulaDisplayElements: ExpressionDisplayElement[];

	private _keyboardProcessor: KeyboardProcessor;
	constructor(private _dataService: ExpressionSourceServiceService) {
		this.cursorIndex = 0;
		this.caretIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this.complexListTop = 0;
		this.complexListLeft = 0;
		this._keyboardProcessor = this._initKeyboardProcessor();
		this.formulaDisplayElements = [];
		this.subscribeOnKeyboardProcessorEvents();
		this.isComplexListVisible = false;
		this.commandLineCommand = null;
		this.complexList = [];
		this._keyUtilities = new KeyUtilities();
	}

	onFocus(event: any): void {

	}

	getFontSize(): number {
		if (!this.visualizator || !this.visualizator.nativeElement) {
			return 0;
		}
		return parseFloat(getComputedStyle(this.visualizator.nativeElement).fontSize);
	}

	getComplexLineStyle(): any {
		return `left: ${this.complexListLeft}px; top: ${this.complexListTop}px;`
	}

	showComplexList(request: IExpressionSourceRequest, elementIndex: number): void {
		this.updateComplexListPosition(elementIndex);
		if (!this.isComplexListVisible) {
			this.isComplexListVisible = true;
		}
		if (this._complexListRequest == null || !this._areComplexListRequestEqual(this._complexListRequest, request)) {
			this._dataService.getList(request).subscribe((response: IExpressionSourceItem[]) => {
				this.complexList =  response.map(item => new ExpressionComplexListItem(item));
				this._complexListRequest = request;
			})
		} else {
			if (!ExpressionUtilities.isEmpty(this.complexList)) {
				var focusedList = this.complexList.filter(x=>x.focused);
				var focusedItem = focusedList && focusedList.length > 0 && focusedList[0];
				if (request.keyItem != null && this._keyUtilities.isEnterKey(request.keyItem) && focusedItem) {
					this.onComplexItemSelect(focusedItem)
					return;
				}
				if (request.keyItem != null && this._keyUtilities.isVerticalMoveKey(request.keyItem)) {
					if (request.keyItem.key === KeyboardKey.ArrowUp) {
						if (focusedItem) {
							if (this.complexList.indexOf(focusedItem) > 0) {
								this.complexList[this.complexList.indexOf(focusedItem) - 1].focused = true;
								focusedItem.focused = false;
							}
						} else {
							this.complexList[0].focused = true;
						}
					}
					if (request.keyItem.key === KeyboardKey.ArrowDown) {
						if (focusedItem) {
							if (this.complexList.indexOf(focusedItem) < this.complexList.length) {
								this.complexList[this.complexList.indexOf(focusedItem) + 1].focused = true;
								focusedItem.focused = false;
							}
						} else {
							this.complexList[0].focused = true;
						}
					}

					if (request.keyItem.key === KeyboardKey.PageUp) {
						if (focusedItem) {
							focusedItem.focused = false;
						}
						this.complexList[0].focused = true;
					}

					if (request.keyItem.key === KeyboardKey.PageDown) {
						if (focusedItem) {
							focusedItem.focused = false;
						}
						this.complexList[this.complexList.length - 1].focused = true;
					}
				}
			}
		}
	}

	_areComplexListRequestEqual(left: IExpressionSourceRequest, right: IExpressionSourceRequest): boolean {
		return left.titlePart === right.titlePart;
	}

	hideComplexList(): void {
		if (this.isComplexListVisible) {
			this.isComplexListVisible = false;
		}
		this._complexListRequest = null;
	}

	_initKeyboardProcessor(): KeyboardProcessor {
		var keyboardProcessor = new KeyboardProcessor();
		return keyboardProcessor;
	}

	subscribeOnKeyboardProcessorEvents(): void {
		this._keyboardProcessor.subscribe(KeyboardProcessEvent.FINISH, (item: IKeyboardProcessorResponse) => this.onFinishHandler(item));
	}

	onFinishHandler(response: IKeyboardProcessorResponse): void {
		var controlCaretIndex = this._getCaretIndex(this.visualizator.nativeElement)
		if (!this._areFormulaDisplayElementsEqual(this.formulaDisplayElements, response.displayList)) {
			this._unSelectCursor();
			this.formulaDisplayElements = response.displayList;
		}

		setTimeout(()=>{
			if (controlCaretIndex !== response.caretIndex) {
				this.updateCaretPosition(response.elementIndex, response.elementCaretIndex);
			}
			if (response.complexListRequest != null) {
				this.showComplexList(response.complexListRequest, response.elementIndex)
			} else {
				this.hideComplexList();
			}
			this.elementsLog.nativeElement.innerHTML = this._keyboardProcessor.getSerializedElements();
		}, 4);
	}

	_areFormulaDisplayElementsEqual(expected: ExpressionDisplayElement[], actual: ExpressionDisplayElement[]): boolean {
		if (expected.length !== actual.length) {
			return false;
		}
		var response: boolean = true;
		actual.forEach(item => {
			if (!response) {
				return;
			}
			var expectedItem = expected.filter(x=>x.uId === item.uId)[0];
			if (!expectedItem || !item.isEqual(expectedItem)) {
				response = false;
			}
		});
		return response;
	}

	ngOnInit(): void {
	}

	onKeyDown(event: KeyboardEvent): void {
		if (!this._isPasteEvent(event)) {
			this._keyboardProcessor.registerEvent({
				type: KeyboardEventType.KeyPress,
				keyItem: KeyItem.fromKeyboardEvent(event),
				keyEvent: event,
				caretIndex: this._getCaretIndex(event.currentTarget)
			});
		}
	}

	_isPasteEvent(event: KeyboardEvent): boolean {
		return this._keyUtilities.isPasteKey(KeyItem.fromKeyboardEvent(event))
	}

	isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	finalizedWork(): void {


	}

	onKeyUp(event: KeyboardEvent): void {
		this.logCursorPosition();
	}

	updateCaretPosition(elementIndex: number, elementCaretIndex: number): void {
		var el = this.visualizator.nativeElement;
		var sel = window.getSelection();
		var range = document.createRange();
		var startWrap = el.childNodes[elementIndex] || el;
		var startEl = startWrap.childNodes[0] || startWrap;
		range.setStart(startEl, elementCaretIndex)
		range.collapse(true)
		if (sel != null) {
			sel.removeAllRanges();
			sel.addRange(range)
		}
		var coordinates =  this.getCaretCoordinates(elementIndex, elementCaretIndex);
		this.cursorX = coordinates.left;
		this.cursorY = coordinates.top;
		this.logCursorPosition();
	}

	updateComplexListPosition(elementIndex: number): void {
		var fontSize = this.getFontSize();
		var coordinates =  this.getCaretCoordinates(elementIndex, 0);
		this.complexListLeft = coordinates.left;
		this.complexListTop = coordinates.top + fontSize + 3;
	}

	getCaretCoordinates(elementIndex: number, elementCaretIndex: number): any {
		var el = this.visualizator.nativeElement;
		var targetElement: any = Array.from(el.childNodes).filter((x:any)=>x.nodeName === "PRE")[elementIndex];
		var temporaryElement:any = null;
		if (!targetElement) {
			temporaryElement = targetElement = document.createElement("span");
			el.appendChild(temporaryElement)
		}
		var response = null;
		let range = new Range();
		range.selectNode(this.visualizator.nativeElement);
		const rectWrap = range.getClientRects()[0];
		if (elementCaretIndex > 0 && targetElement.childNodes.length) {
			range.setStart(targetElement.childNodes[0], elementCaretIndex);
		} else {
			range.selectNode(targetElement);
		}

		const rect = range.getClientRects()[0];
		if (rect) {
			response = {
				"left": Math.max(rect.left - rectWrap.left, 0),
				"top": Math.max(rect.top - rectWrap.top, 0)
			}
		}
		if (temporaryElement) {
			el.removeChild(temporaryElement)
		}
		return response;
	}

	logCursorPosition(): void {
		console.log("x: " + this.cursorX + "; y: " + this.cursorY + "; index: " + this.cursorIndex);
	}

	onPaste(event: any): void {
		this.processPasteData(event);
		// Get the copied text from the clipboard
		console.log("paste2");
		event = document.createEvent('KeyboardEvent');
		/*const selection = window.getSelection();
		if (selection) {
			if (!selection.rangeCount) return;
			selection.deleteFromDocument();
			selection.getRangeAt(0).insertNode(document.createTextNode(cleared));
		}*/
	}

	processPasteData(event: any): void {
		var clipboardData = (event.originalEvent || event).clipboardData;
		const cleared: string = clipboardData.getData('text/plain') || "";
		var content = cleared.split("");
		var caretIndex = this._getCaretIndex(event.currentTarget);
		var keyEvents: IKeyboardEventItem[] = [];
		content.forEach(x=>{
			var event = new KeyboardEvent(x, {key: x});
			keyEvents.push({
				type: KeyboardEventType.KeyPress,
				keyItem: KeyItem.fromKeyboardEvent(event),
				keyEvent: event,
				caretIndex: caretIndex
			})
		})

		this._keyboardProcessor.registerEventBunch(keyEvents);
		event.preventDefault();
	}

	onMouseUp(event: MouseEvent): void {
		this.logCursorPosition();
	}

	getCaretIndex(element: any): number {
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
			}
		}
		return position;
	}

	getComplexListItemClass(item: ExpressionComplexListItem): string {
		var classes: string[] = [];
		if (item.type === ExpressionNodeType.COLUMN) {
			classes.push("column");
		} else if (item.type === ExpressionNodeType.FUNCTION) {
			classes.push("function");
		}
		if (item.focused) {
			classes.push("focused");
		}
		return classes.join(" ");
	}

	onMouseOverComplexItem(item: ExpressionComplexListItem): void {
		if (item.focused) {
			return;
		}
		this.complexList.filter(x=>x.focused).forEach(x=>x.focused = false);
		item.focused = true;
	}

	onComplexItemSelect(complexItem: ExpressionComplexListItem): void {
		this._keyboardProcessor.registerEvent({
			type: KeyboardEventType.SelectComplex,
			complexItem: complexItem,
			caretIndex: this._getCaretIndex()
		});
		this.hideComplexList();
	}

	private _getCaretIndex(element: any = null, withUnSelect: boolean = false): number {
		if (element == null) {
			return this._keyboardProcessor.getProcessedCaretIndex();
		}
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
				position = this._keyboardProcessor.getProcessedCaretIndex();
			}
		} else {
			position = this._keyboardProcessor.getProcessedCaretIndex();
		}
		if (withUnSelect) {
			var selection = window.getSelection();
			if (selection != null) {
				selection.removeAllRanges();
			}
		}
		return position;
	}

	private _unSelectCursor(): void{
		const isSupported = typeof window.getSelection !== "undefined";
		if (isSupported) {
			var selection = window.getSelection();
			if (selection != null) {
				selection.removeAllRanges();
			}
		}
	}
}
