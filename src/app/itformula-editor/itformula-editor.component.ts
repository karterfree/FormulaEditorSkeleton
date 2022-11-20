import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TitleStrategy } from '@angular/router';
import { DataValueType } from './enums';
import { FormulaDisplayElement, FormulaElementArgument, FormulaManager } from './formula-construction';
import { IKeyboardProcessorResponse, KeyboardProcessEvent, KeyboardProcessor } from './keyboard-processor';

@Component({
	selector: 'app-itformula-editor',
	templateUrl: './itformula-editor.component.html',
	styleUrls: ['./itformula-editor.component.less']
})
export class ITFormulaEditorComponent implements OnInit {
	@ViewChild('visualizator') visualizator!: ElementRef;
	@ViewChild('elementsLog') elementsLog!: ElementRef;
	
	caretIndex: number;
	cursorIndex: number;
	cursorX: number;
	cursorY: number;


	private previousFormulaContent: string = '';
	
	formulaDisplayElements: FormulaDisplayElement[];

	private _keyboardProcessor: KeyboardProcessor;

	constructor() { 
		this.cursorIndex = 0;
		this.caretIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this._keyboardProcessor = this._initKeyboardProcessor();
		this.formulaDisplayElements = [];
		this.subscribeOnKeyboardProcessorEvents();
	}

	_initKeyboardProcessor(): KeyboardProcessor {
		var keyboardProcessor = new KeyboardProcessor();
		return keyboardProcessor;
	}

	subscribeOnKeyboardProcessorEvents(): void {
		this._keyboardProcessor.subscribe(KeyboardProcessEvent.FINISH, (item: IKeyboardProcessorResponse) => this.onFinishHandler(item));
		this._keyboardProcessor.subscribe(KeyboardProcessEvent.COMMAND, (config: any, callback: Function) => this.onCommandHandler(config, callback));
		this._keyboardProcessor.subscribe(KeyboardProcessEvent.EXTENDENT, (config: any, callback: Function) => this.onExtendendHandler(config, callback));
	}

	onFinishHandler(item: IKeyboardProcessorResponse): void {
		this.formulaDisplayElements = item.displayList;
		setTimeout(()=>{
			this.updateCaretPosition(item.elementIndex, item.elementCaretIndex);
			this.elementsLog.nativeElement.innerHTML = this._keyboardProcessor.getSerializedElements();
		}, 4);
	}

	onCommandHandler(config: any, callback: Function): void {
		callback({
			"items": [
				FormulaManager.generateColumnFormulaElement('Account', '7daf20bc-b4d3-470b-b5d0-1e94f55e6561', DataValueType.LOOKUP)
			]
		});
		/*callback({
			"items": FormulaManager.generateCustomFunctionFormulaElementGroup("DATEDIFF", DataValueType.INTEGER, [
				new FormulaElementArgument("fromDate", DataValueType.DATE),
				new FormulaElementArgument("toDate", DataValueType.DATE),
				new FormulaElementArgument("interval", DataValueType.TEXT),
			]),
			"caretIndexShift": 9
		});*/

	}

	onExtendendHandler(config: any, callback: Function): void {
		callback({
			"content": "Account.Amount",
			"metaPath": config.rootMetaPath + '.8daf20bc-b4d3-470b-b5d0-1e94f55e6562',
			"dataValueType": DataValueType.FLOAT
		});
	}

	ngOnInit(): void {
	}

	onKeyDown(event: KeyboardEvent): void {
		this._keyboardProcessor.register(event);
	}

	isEmpty(value: any): boolean {
		return value === null || value === undefined || value === '' || (Array.isArray(value) && !value.length);
	}

	backupFormulaContent(): void {
		this.previousFormulaContent = this.visualizator.nativeElement.innerHTML;
	}

	finalizedWork(): void {
		
		
	}

	onKeyUp(event: KeyboardEvent): void {
		this.updateCursorPosition(event.currentTarget);
	}

	updateCaretPosition(elementIndex: number, elementCaretIndex: number): void {
		var el = this.visualizator.nativeElement;
		var sel = window.getSelection();
		var range = document.createRange()
		var startWrap = el.childNodes[elementIndex] || el;
		var startEl = startWrap.childNodes[0] || startWrap;
		range.setStart(startEl, elementCaretIndex)
		range.collapse(true)
		if (sel != null) {
			sel.removeAllRanges();
			sel.addRange(range)
		}
	}

	updateCursorPosition(target: any): void {
		var coords = this.getCaretCoordinates();
		this.cursorX = coords.x;
		this.cursorY = coords.y;
		this.cursorIndex = this.caretIndex;
	}

	onPaste(event: any): void {
		event.preventDefault();
		// Get the copied text from the clipboard
		var clipboardData = (event.originalEvent || event).clipboardData;
		const cleared = clipboardData.getData('text/plain');
		const selection = window.getSelection();
		if (selection) {
			if (!selection.rangeCount) return;
			selection.deleteFromDocument();
			selection.getRangeAt(0).insertNode(document.createTextNode(cleared));
		}
	}

	onMouseUp(event: MouseEvent): void {
		this.updateCursorPosition(event.currentTarget);
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

	getCaretCoordinates(): any {
		let x = 0,
			y = 0;
		const isSupported = typeof window.getSelection !== "undefined";
		if (isSupported) {
			const selection = window.getSelection();
			if (selection && selection.rangeCount !== 0) {
				const range = selection.getRangeAt(0).cloneRange();
				range.collapse(true);
				const rect = range.getClientRects()[0];
				if (rect) {
					x = rect.left;
					y = rect.top;
				}
			}
		}
		return { x, y };
	}
}
