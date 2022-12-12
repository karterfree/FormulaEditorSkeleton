import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ExpressionArgument } from '../../feature/common/models/expression-argument/expression-argument';
import { ComparisonType } from '../../util/enums/comparison-type.enum';
import { DataValueType } from '../../util/enums/data-value-type.enum';
import { ExpressionNodeType } from '../../util/enums/expression-node-type.enum';
import { ExpressionUtilities } from '../../util/expression-utilities/expression-utilities';

export interface IExpressionSourceItem {
	title: string,
	code: string,
	type: ExpressionNodeType,
	dataValueType: DataValueType,
	arguments?: ExpressionArgument[]
}

export interface IExpressionSourceRequest {
	titlePart: string,
	comparisonType: ComparisonType,
	availableTypes?: ExpressionNodeType[]
	referenceSchemaUId?: string
}

@Injectable({
  providedIn: 'root'
})
export class ExpressionSourceServiceService {

	mockList: IExpressionSourceItem[] = [{
		title: "Account",
		code: "Account",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.LOOKUP
	}, {
		title: "Contact",
		code: "Contact",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.LOOKUP
	}, {
		title: "DATEPART",
		code: "DATEPART",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.INTEGER,
		arguments: [
			new ExpressionArgument("from", DataValueType.DATE_TIME),
			new ExpressionArgument("to", DataValueType.DATE_TIME),
			new ExpressionArgument("interval", DataValueType.TEXT),
		]
	}, {
		title: "DATETIME",
		code: "DATETIME",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.INTEGER,
		arguments: [
			new ExpressionArgument("source", DataValueType.TEXT)
		]
	}, {
		title: "GUID",
		code: "GUID",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.GUID,
		arguments: [
			new ExpressionArgument("source", DataValueType.TEXT)
		]
	}]

	constructor() { }

	private _titlePartFilter(request: IExpressionSourceRequest, item: IExpressionSourceItem): boolean {
		if (ExpressionUtilities.isEmpty(request.titlePart)) {
			return true;
		}
		if (request.comparisonType === ComparisonType.START_WITH) {
			return item.title.toLowerCase().indexOf(request.titlePart.toLowerCase()) === 0;
		}
		return item.title.indexOf(request.titlePart) >= 0;
	}

	private _typeFilter(request: IExpressionSourceRequest, item: IExpressionSourceItem): boolean {
		if (ExpressionUtilities.isEmpty(request.availableTypes)) {
			return true;
		}
		return (request.availableTypes?.indexOf(item.type) || -1) >= 0
	}

	public getList(request: IExpressionSourceRequest): Observable<IExpressionSourceItem[]> {
		var filters: Function[] = [
			this._titlePartFilter,
			this._typeFilter
		];

		var filteredList = this.mockList.filter((item) => {
			var available = true;
			filters.forEach(filter=> {
				available = available && filter(request, item);
			})
			return available;
		})
		return of([...filteredList]);
	}
}
