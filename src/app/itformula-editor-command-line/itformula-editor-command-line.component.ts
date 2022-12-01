import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

export interface ICommandLineCommand {

}

@Component({
	selector: 'app-itformula-editor-command-line',
	templateUrl: './itformula-editor-command-line.component.html',
	styleUrls: ['./itformula-editor-command-line.component.less']
})
export class ITFormulaEditorCommandLineComponent implements OnInit {

	@ViewChild('commandLine') commandLine!: ElementRef;

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

	constructor() { 
		this._command = null;
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

	onBlur(event:any): void {
		
	}
}
