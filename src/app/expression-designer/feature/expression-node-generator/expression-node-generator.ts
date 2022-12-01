import { DataValueType } from "../../util/enums/data-value-type.enum";
import { ExpressionNodeType } from "../../util/enums/expression-node-type.enum";
import { KeyboardKey } from "../../util/enums/keyboard-key.enum";
import { ExpressionArgument } from "../common/models/expression-argument/expression-argument";
import { ExpressionNode } from "../common/models/expression-node/expression-node";

export class ExpressionNodeGenerator {

    public static generateEmptyExpressionNode(): ExpressionNode {
		var element = new ExpressionNode();
		element.type = ExpressionNodeType.UNSETTED;
		element.content = '';
		return element;
	}

	public static generateSingleOperationExpressionNode(operation: string): ExpressionNode {
		var element = new ExpressionNode();
		element.type = ExpressionNodeType.SINGLEOPERATION;
		element.content = operation;
		return element;
	}

	public static generateColumnExpressionNode(caption: string, metaPath: string, dataValueType: DataValueType): ExpressionNode {
		var element = new ExpressionNode();
		element.type = ExpressionNodeType.COLUMN;
		element.content = caption;
		element.metaPath = metaPath;
		element.dataValueType = dataValueType;
		return element;
	}

	public static generateCustomFunctionExpressionNode(caption: string, dataValueType: DataValueType, functionArguments: ExpressionArgument[]): ExpressionNode {
		var element = new ExpressionNode();
		element.type = ExpressionNodeType.COLUMN;
		element.content = caption;
		element.arguments = functionArguments;
		element.dataValueType = dataValueType;
		return element;
	}

	public static generateCustomFunctionExpressionNodeGroup(caption: string, dataValueType: DataValueType, functionArguments: ExpressionArgument[]): ExpressionNode[] {
		var response: ExpressionNode[] = [];
		var element = new ExpressionNode();
		element.type = ExpressionNodeType.FUNCTION;
		element.content = caption;
		element.arguments = functionArguments;
		element.dataValueType = dataValueType;
		response.push(element);
		response.push(ExpressionNodeGenerator.generateSingleOperationExpressionNode(KeyboardKey.BracketOpen));
		for (var i = 0; i < functionArguments.length - 1; i++) {
			response.push(ExpressionNodeGenerator.generateSingleOperationExpressionNode(KeyboardKey.Comma));
		}
		response.push(ExpressionNodeGenerator.generateSingleOperationExpressionNode(KeyboardKey.BracketClose));
		return response;
	}
}