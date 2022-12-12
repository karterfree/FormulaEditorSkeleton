import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ExpressionSourceServiceService, IExpressionSourceItem } from '../../data-access/expression-source-api/expression-source-service.service';
import { ComparisonType } from '../../util/enums/comparison-type.enum';
import { DataValueType } from '../../util/enums/data-value-type.enum';
import { ExpressionNodeType } from '../../util/enums/expression-node-type.enum';
import { ICommandLineCommand } from '../common/interfaces/icommand-line-command';
import { ExpressionArgument } from '../common/models/expression-argument/expression-argument';

class ExpressionCommandLineItem implements IExpressionSourceItem {
	title: string;
	code: string;
	type: ExpressionNodeType;
	dataValueType: DataValueType;
	arguments?: ExpressionArgument[];

	focused: boolean = false;

	constructor(title: string, type: ExpressionNodeType, dataValueType: DataValueType, expressionArguments: ExpressionArgument[] | null = null) {
		this.title = title;
		this.code = title;
		this.type = type;
		this.dataValueType = dataValueType;
		if (expressionArguments) {
			this.arguments = expressionArguments;
		}
	}
}

@Component({
  selector: 'app-expression-command-line',
  templateUrl: './expression-command-line.component.html',
  styleUrls: ['./expression-command-line.component.less']
})
export class ExpressionCommandLineComponent implements OnInit {

	@ViewChild('commandLine') commandLine!: ElementRef;
	
	public list: ExpressionCommandLineItem[]

	private _command: ICommandLineCommand | null;
	@Input()
	set command(value: ICommandLineCommand | null) {
		this._command = value;
		if (this.command != null) {
			this.focusCommandLine();
		}
	}

	get command(): ICommandLineCommand | null {
		return this._command;
	}

	@Output() selectEvent = new EventEmitter<IExpressionSourceItem | null>();

	constructor(private _dataService: ExpressionSourceServiceService) { 
		this._command = null;
		this.list = [];
	}

	focusCommandLine(): void{
		setTimeout(() => {
			this.commandLine.nativeElement.focus();
		}, 4);
	}

	ngOnInit(): void {
	}

	onPaste(event:any): void {

	}


	onKeyDown(event: KeyboardEvent): void {
		
	}

	onKeyUp(event: KeyboardEvent): void {
		var titlePart = this.commandLine.nativeElement.innerText;
		this._dataService.getList({
			titlePart: titlePart,
			comparisonType: ComparisonType.START_WITH
		}).subscribe((response: IExpressionSourceItem[]) => {
			this.list = response.map(item => new ExpressionCommandLineItem(item.title, item.type, item.dataValueType, item.arguments));
		})
	}

	onBlur(event:any): void {
		
	}

	getListItemClass(item: ExpressionCommandLineItem): string {
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

	onMouseOverItem(item: ExpressionCommandLineItem): void {
		if (item.focused) {
			return;
		}
		this.list.filter(x=>x.focused).forEach(x=>x.focused = false);
		item.focused = true;
	}

	getItemClass(item: ExpressionCommandLineItem): string {
		if (item.focused) {
			return "focused";
		}
		return "";
	}

	onSelect(item: ExpressionCommandLineItem) {
		this.selectEvent.emit(item);
	}

}
