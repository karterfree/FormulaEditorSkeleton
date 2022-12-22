import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ExpressionArgument } from '../../feature/common/models/expression-argument/expression-argument';
import { ComparisonType } from '../../util/enums/comparison-type.enum';
import { DataValueType } from '../../util/enums/data-value-type.enum';
import { ExpressionNodeType } from '../../util/enums/expression-node-type.enum';
import { ExpressionUtilities } from '../../util/expression-utilities/expression-utilities';
import { KeyItem } from '../../util/models/key-item';

export interface IExpressionSourceItem {
	[key: string]: any,
	uId: string,
	title: string,
	code: string,
	type: ExpressionNodeType,
	dataValueType: DataValueType,
	schemaUId?: string,
	referenceSchemaUId?: string,
	arguments?: ExpressionArgument[]
}
export enum ExpressionSourceRequestFilterType {
	ComparisonFilter,
	FilterGroup,
	InFilter,
}
export enum ExpressionSourceRequestFilterLogicalOperation {
	AND,
	OR,
}
export interface IExpressionSourceRequestFilter {
	propertyName?: string,
	comparisonType?: ComparisonType,
	value?: any,
	type: ExpressionSourceRequestFilterType,
	logicalOperation?: ExpressionSourceRequestFilterLogicalOperation,
	items?: IExpressionSourceRequestFilter[]
}
export interface IExpressionSourceRequest {
	titlePart: string,
	filter: IExpressionSourceRequestFilter,
	keyItem: KeyItem | null
}

@Injectable({
  providedIn: 'root'
})
export class ExpressionSourceServiceService {

	mockList: IExpressionSourceItem[] = [{
		uId: "ae0e45ca-c495-4fe7-a39d-3ab7278e1617",
		title: "Id",
		code: "Id",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.GUID,
		schemaUId: "25d7c1ab-1de0-4501-b402-02e0e5a72d6e"
	}, {
		uId: "7c81a01e-f59b-47df-830c-8e830f1bf889",
		title: "Name",
		code: "Name",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.TEXT,
		schemaUId: "25d7c1ab-1de0-4501-b402-02e0e5a72d6e"
	}, {
		uId: "165072a8-b718-4490-ab89-223f30390d81",
		title: "Primary contact",
		code: "PrimaryContact",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.LOOKUP,
		schemaUId: "25d7c1ab-1de0-4501-b402-02e0e5a72d6e",
		referenceSchemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "d60a9c06-1170-4cd6-9dc1-c972bc451533",
		title: "Type",
		code: "Type",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.LOOKUP,
		schemaUId: "25d7c1ab-1de0-4501-b402-02e0e5a72d6e",
		referenceSchemaUId: "26be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "1e0e45ca-c495-4fe7-a39d-3ab7278e1617",
		title: "Id",
		code: "Id",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.GUID,
		schemaUId: "26be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "1c81a01e-f59b-47df-830c-8e830f1bf889",
		title: "Name",
		code: "Name",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.TEXT,
		schemaUId: "26be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "ae0e45ca-c495-4fe7-a39d-3ab7278e1617",
		title: "Id",
		code: "Id",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.GUID,
		schemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "a5cca792-47dd-428a-83fb-5c92bdd97ff8",
		title: "Name",
		code: "Name",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.TEXT,
		schemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "5c6ca10e-1180-4c1e-8a50-55a72ff9bdd4",
		title: "Account",
		code: "Account",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.LOOKUP,
		schemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3",
		referenceSchemaUId: "25d7c1ab-1de0-4501-b402-02e0e5a72d6e"
	}, {
		uId: "3f08db69-6d2f-4b1c-87a4-acddc6c3b9d6",
		title: "Birth date",
		code: "BirthDate",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.DATE_TIME,
		schemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "4f08db69-6d2f-4b1c-87a4-acddc6c3b9d5",
		title: "Age",
		code: "Age",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.INTEGER,
		schemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3"
	}, {
		uId: "a49571cc-a9a9-4c3e-a346-46c466e9a0d3",
		title: "Type",
		code: "Type",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.LOOKUP,
		schemaUId: "16be3651-8fe2-4159-8dd0-a803d4683dd3",
		referenceSchemaUId: "35d7c1ab-1de0-4501-b402-02e0e5a72d6e"
	}, {
		uId: "ae0e45ca-c495-4fe7-a39d-3ab7278e1617",
		title: "Id",
		code: "Id",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.GUID,
		schemaUId: "35d7c1ab-1de0-4501-b402-02e0e5a72d6e"
	}, {
		uId: "a5cca792-47dd-428a-83fb-5c92bdd97ff8",
		title: "Name",
		code: "Name",
		type: ExpressionNodeType.COLUMN,
		dataValueType: DataValueType.TEXT,
		schemaUId: "35d7c1ab-1de0-4501-b402-02e0e5a72d6e"
	}, {
		uId: "2d5986c7-ba30-417f-8cf6-bf8bf1257d16",
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
		uId: "6b912278-dfbf-4c5b-9426-542103bf90fe",
		title: "DATETIME",
		code: "DATETIME",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.INTEGER,
		arguments: [
			new ExpressionArgument("source", DataValueType.TEXT)
		]
	}, {
		uId: "3a675f57-b91e-468c-a044-a00531de0a9a",
		title: "GUID",
		code: "GUID",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.GUID,
		arguments: [
			new ExpressionArgument("source", DataValueType.TEXT)
		]
	}, {
		uId: "4a675f57-b91e-468c-a044-a00531de0a9a",
		title: "CONCAT",
		code: "CONCAT",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.TEXT,
		arguments: [
			new ExpressionArgument("source1", DataValueType.TEXT),
			new ExpressionArgument("source2", DataValueType.TEXT)
		]
	}, {
		uId: "5a675f57-b91e-468c-a044-a00531de0afa",
		title: "IF",
		code: "IF",
		type: ExpressionNodeType.FUNCTION,
		dataValueType: DataValueType.UNSETTED,
		arguments: [
			new ExpressionArgument("condition", DataValueType.TEXT),
			new ExpressionArgument("ifTrue", DataValueType.UNSETTED),
			new ExpressionArgument("ifFalse", DataValueType.UNSETTED)
		]
	}]

	constructor() { }

	private _andLogicalFilterOperation(left: any, right: any): boolean {
		return left && right;
	}

	private _orLogicalFilterOperation(left: any, right: any): boolean {
		return left || right;
	}

	private _testMockItemByFilterGroup(item: IExpressionSourceItem, filters: IExpressionSourceRequestFilter[],
		logicalOperation: ExpressionSourceRequestFilterLogicalOperation): boolean {
		var response: boolean = logicalOperation === ExpressionSourceRequestFilterLogicalOperation.AND;
		let fn: Function = logicalOperation === ExpressionSourceRequestFilterLogicalOperation.OR
			? this._orLogicalFilterOperation
			: this._andLogicalFilterOperation;
		filters.forEach(filter => {
			response = fn(response, this._testMockItemByFilter(item, filter));
		});
		return response;
	}

	private _containsFilterOperation(left: any, right: any): boolean {
		return left.indexOf(right) >= 0;
	}

	private _startWithFilterOperation(left: any, right: any): boolean {
		return left.indexOf(right) === 0;
	}

	private _equalFilterOperation(left: any, right: any): boolean {
		return left === right;
	}

	private _testMockItemByComparisonFilter(item: IExpressionSourceItem, filter: IExpressionSourceRequestFilter) {
		let propertyValue: any = item[filter.propertyName ?? ""];
		let response: boolean = true;
		let fn: Function = (left: any, right: any) => false;
		if (filter.comparisonType === ComparisonType.CONTAINS) {
			fn = this._containsFilterOperation;
		} else if (filter.comparisonType === ComparisonType.EQUAL) {
			fn = this._equalFilterOperation;
		} else if (filter.comparisonType === ComparisonType.START_WITH) {
			fn = this._startWithFilterOperation;
		}
		if (ExpressionUtilities.isArray(filter.value)) {
			filter.value.forEach((element: any) => {
				response = response && fn(propertyValue, element);
			});
		} else {
			response = response && fn(propertyValue, filter.value);
		}
		return response;
	}

	private _testMockItemByFilter(item: IExpressionSourceItem, filter: IExpressionSourceRequestFilter): boolean {
		if (filter.type === ExpressionSourceRequestFilterType.FilterGroup) {
			return this._testMockItemByFilterGroup(item, filter.items || [], filter.logicalOperation ?? ExpressionSourceRequestFilterLogicalOperation.AND);
		}
		if (filter.type === ExpressionSourceRequestFilterType.ComparisonFilter) {
			return this._testMockItemByComparisonFilter(item, filter);
		}
		return false;
	}

	public getList(request: IExpressionSourceRequest): Observable<IExpressionSourceItem[]> {
		var filteredList = this.mockList.filter(x=>{
			return (x.title.toLowerCase().indexOf(request.titlePart.toLowerCase()) >= 0 || x.code.toLowerCase().indexOf(request.titlePart.toLowerCase()) >= 0) &&
				this._testMockItemByFilter(x, request.filter);
		});
		return of([...filteredList]);
	}
}
