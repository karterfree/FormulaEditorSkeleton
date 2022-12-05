import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IExpressionSourceItem } from '../../data-access/expression-source-api/expression-source-service.service';
import { DataValueType } from '../../util/enums/data-value-type.enum';
import { ExpressionNodeType } from '../../util/enums/expression-node-type.enum';
import { KeyboardProcessEvent } from '../common/enums/keyboard-process-event.enum';
import { ICommandLineCommand } from '../common/interfaces/icommand-line-command';
import { ExpressionArgument } from '../common/models/expression-argument/expression-argument';
import { ExpressionDisplayElement } from '../common/models/expression-display-element/expression-display-element';
import { ExpressionNodeGenerator } from '../expression-node-generator/expression-node-generator';
import { ICommandOperationRequest, IKeyboardProcessorResponse, KeyboardProcessor } from '../keyboard-processor/keyboard-processor';

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

	public commandLineCommand: ICommandLineCommand | null;

	public isCommandLineVisible: boolean;

	private previousFormulaContent: string = '';
	
	formulaDisplayElements: ExpressionDisplayElement[];

	private _keyboardProcessor: KeyboardProcessor;

	private _commandLineResponseHandler: Function | null = null;

	constructor() { 
		this.cursorIndex = 0;
		this.caretIndex = 0;
		this.cursorX = 0;
		this.cursorY = 0;
		this._keyboardProcessor = this._initKeyboardProcessor();
		this.formulaDisplayElements = [];
		this.subscribeOnKeyboardProcessorEvents();
		this.isCommandLineVisible = false;
		this.commandLineCommand = null;
	}

	onFocus(event: any): void {
		this.hideCommandLine();
	}

	showCommandLine(elementIndex: number, elementCaretIndex: number): Promise<IExpressionSourceItem | null> {
		return new Promise((resolve, reject) => {
			setTimeout(()=>{
				var coordinates = this.caretCaretCoordinates(elementIndex, elementCaretIndex);
				if (coordinates) {
					this.cursorX = coordinates.left;
					this.cursorY = coordinates.top;
				}
				
				this.isCommandLineVisible = true;
				this.visualizator.nativeElement.blur();
				this.commandLineCommand = {};
				this._commandLineResponseHandler = (response: IExpressionSourceItem | null) => {
					resolve(response);
				}
			}, 4);
		});
	}

	onCommandLineResponse(response: IExpressionSourceItem | null): void {
		this.hideCommandLine();
		if (this._commandLineResponseHandler) {
			this._commandLineResponseHandler.call(this, response);
		}
	}

	getCommandLineStyle(): any {
		return {
			"left": this.cursorX,
			"top": this.cursorY
		};
	}

	hideCommandLine(): void {
		this.isCommandLineVisible = false;
	}

	setVisualizatorFocus(): any {
		this.visualizator.nativeElement.focus();
		setTimeout(()=> {
			this.visualizator.nativeElement.blur();
		}, 3000);
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

	onCommandHandler(config: ICommandOperationRequest, callback: Function): void {
		setTimeout(()=>{
			this.showCommandLine(config.elementIndex, config.elementCaretIndex).then((item: IExpressionSourceItem | null) => {

				var items: any[] = [];
				if (item) {
					if (item.type === ExpressionNodeType.COLUMN) {
						items.push(ExpressionNodeGenerator.generateColumnExpressionNode(item.title, '7daf20bc-b4d3-470b-b5d0-1e94f55e6561', item.dataValueType));
					} else if (item.type === ExpressionNodeType.FUNCTION) {
						items = ExpressionNodeGenerator.generateCustomFunctionExpressionNodeGroup(item.title, item.dataValueType, item.arguments?.map(x=> new ExpressionArgument(x.name, x.dataValueType)) || []);
					}
				}
				callback({
					"items": items
				});
			});
			
			/*callback({
				"items": [
					FormulaManager.generateColumnFormulaElement('Account', '7daf20bc-b4d3-470b-b5d0-1e94f55e6561', DataValueType.LOOKUP)
				]
			});*/
		}, 4);

		/*callback({
			"items": [
				FormulaManager.generateColumnFormulaElement('Account', '7daf20bc-b4d3-470b-b5d0-1e94f55e6561', DataValueType.LOOKUP)
			]
		});*/
		
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
			"items": [
				ExpressionNodeGenerator.generateColumnExpressionNode('Amount', '8daf20bc-b4d3-470b-b5d0-1e94f55e6562', DataValueType.FLOAT)
			]
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
		if (this.isCommandLineVisible) {
			return;
		}
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

	caretCaretCoordinates(elementIndex: number, elementCaretIndex: number): any {
		var el = this.visualizator.nativeElement;
		var targetElement: any = Array.from(el.childNodes).filter((x:any)=>x.nodeName === "pre")[elementIndex];
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

	updateCursorPosition(target: any): void {
		var coords = this.getCaretCoordinates();
		this.cursorX = coords.x;
		this.cursorY = coords.y;
		this.cursorIndex = this.caretIndex;
		console.log("x: " + this.cursorX + "; y: " + this.cursorY + "; index: " + this.cursorIndex);
	}

	onCommandEditPaste(event: any): void {
		event.preventDefault();
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