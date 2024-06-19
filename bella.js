// Custom type guards
function isUserFunction(v) {
    return Array.isArray(v) && Array.isArray(v[0]) && v[0].length === 2;
}
function isBuiltInFunction(v) {
    return typeof v === "function";
}
function isArray(x) {
    return Array.isArray(x);
}
export class Numeral {
    value;
    constructor(value) {
        this.value = value;
    }
    interpret(_) {
        return this.value;
    }
}
export class BooleanLiteral {
    value;
    constructor(value) {
        this.value = value;
    }
    interpret(_) {
        return this.value;
    }
}
export class Identifier {
    name;
    constructor(name) {
        this.name = name;
    }
    interpret(m) {
        const value = m.get(this.name);
        if (value == undefined) {
            throw new Error("Identifier was undeclared");
        }
        return value;
    }
}
export class UnaryExpression {
    operator;
    expression;
    constructor(operator, expression) {
        this.operator = operator;
        this.expression = expression;
    }
    interpret(m) {
        // TODO -- if the operator is "-", return the negation of the expression
        //otherwise if the operator is "!" return the NOT of the expression
        if (this.operator === "-") {
            if (typeof this.expression.interpret(m) !== "number") {
                throw new Error("Invalid operand type for '-' operator");
            }
            return -Number(this.expression.interpret(m));
        }
        else if (this.operator === "!") {
            return !this.expression.interpret(m);
        }
        else {
            throw new Error("Invalid operator");
        }
    }
}
export class BinaryExpression {
    operator;
    left;
    right;
    constructor(operator, left, right) {
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    interpret(m) {
        const leftValue = this.left.interpret(m);
        const rightValue = this.right.interpret(m);
        console.log(`BinaryExpression: ${leftValue} ${this.operator} ${rightValue}`);
        if (this.operator === "+") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue + rightValue;
            }
            else {
                throw new Error("Invalid operand types for '+' operator");
            }
        }
        else if (this.operator === "-") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue - rightValue;
            }
            else {
                throw new Error("Invalid operand types for '-' operator");
            }
        }
        else if (this.operator === "*") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue * rightValue;
            }
            else {
                throw new Error("Invalid operand types for '*' operator");
            }
        }
        else if (this.operator === "/") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                if (rightValue === 0) {
                    throw new Error("Division by zero");
                }
                return leftValue / rightValue;
            }
            else {
                throw new Error("Invalid operand types for '/' operator");
            }
        }
        else if (this.operator === "%") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                if (rightValue === 0) {
                    throw new Error("Division by zero");
                }
                return leftValue % rightValue;
            }
            else {
                throw new Error("Invalid operand types for '%' operator");
            }
        }
        else if (this.operator === "<") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue < rightValue;
            }
            else {
                throw new Error("Invalid operand types for '<' operator");
            }
        }
        else if (this.operator === "<=") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue <= rightValue;
            }
            else {
                throw new Error("Invalid operand types for '<=' operator");
            }
        }
        else if (this.operator === ">") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue > rightValue;
            }
            else {
                throw new Error("Invalid operand types for '>' operator");
            }
        }
        else if (this.operator === ">=") {
            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return leftValue >= rightValue;
            }
            else {
                throw new Error("Invalid operand types for '>=' operator");
            }
        }
        else if (this.operator === "==") {
            //strict equality for comparison 
            if (typeof leftValue === typeof rightValue) {
                return leftValue === rightValue;
            }
            else {
                throw new Error("Invalid operand types for '==' operator");
            }
        }
        else if (this.operator === "!==") {
            if (typeof leftValue === typeof rightValue) {
                return leftValue !== rightValue;
            }
            else {
                throw new Error("Invalid operand types for '!== operator");
            }
        }
        else if (this.operator === "&&") {
            return Boolean(leftValue) && Boolean(rightValue);
        }
        else if (this.operator === "||") {
            return Boolean(leftValue) || Boolean(rightValue);
        }
        else {
            throw new Error("Invalid operator");
        }
    }
}
export class Call {
    callee;
    args;
    constructor(callee, args) {
        this.callee = callee;
        this.args = args;
    }
    interpret(m) {
        const functionValue = m.get(this.callee.name);
        const argValues = this.args.map((arg) => arg.interpret(m));
        if (functionValue === undefined) {
            throw new Error("Identifier was undeclared");
        }
        else if (isUserFunction(functionValue)) {
            const [parameters, expression] = functionValue;
            if (parameters.length !== this.args.length) {
                throw new Error("Wrong number of arguments");
            }
            const locals = parameters.map((p, i) => [p.name, argValues[i]]);
            return expression.interpret(new Map([...m, ...locals]));
        }
        else if (isBuiltInFunction(functionValue)) {
            return functionValue(...argValues);
        }
        else {
            throw new Error("Not a function");
        }
    }
}
export class ConditionalExpression {
    test;
    consequent;
    alternate;
    constructor(test, consequent, alternate) {
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
    interpret(m) {
        if (this.test.interpret(m)) {
            return this.consequent.interpret(m);
        }
        else {
            return this.alternate.interpret(m);
        }
    }
}
export class ArrayLiteral {
    elements;
    constructor(elements) {
        this.elements = elements;
    }
    interpret(m) {
        return this.elements.map((e) => e.interpret(m));
    }
}
export class SubscriptExpression {
    array;
    subscript;
    constructor(array, subscript) {
        this.array = array;
        this.subscript = subscript;
    }
    interpret(m) {
        const arrayValue = this.array.interpret(m);
        const subscriptValue = this.subscript.interpret(m);
        if (isArray(arrayValue) && typeof subscriptValue === "number") {
            return arrayValue[subscriptValue];
        }
        else {
            throw new Error("Invalid subscript expression");
        }
    }
}
export class VariableDeclaration {
    id;
    expression;
    constructor(id, expression) {
        this.id = id;
        this.expression = expression;
    }
    interpret([m, o]) {
        // TODO -- add the identifier and its value to the memory 
        const value = this.expression.interpret(m);
        return [new Map([...m, [this.id.name, value]]), o];
    }
}
export class FunctionDeclaration {
    id;
    parameters;
    expression;
    constructor(id, parameters, expression) {
        this.id = id;
        this.parameters = parameters;
        this.expression = expression;
    }
    interpret([m, o]) {
        // TODO -- add the identifier and its value to the memory
        const value = [this.parameters, this.expression];
        return [new Map([...m, [this.id.name, value]]), o];
    }
}
export class Assignment {
    id;
    expression;
    constructor(id, expression) {
        this.id = id;
        this.expression = expression;
    }
    interpret([m, o]) {
        // TODO -- update the value of the identifier in the memory
        const value = this.expression.interpret(m);
        m.set(this.id.name, value);
        return [m, o];
    }
}
export class PrintStatement {
    expression;
    constructor(expression) {
        this.expression = expression;
    }
    interpret([m, o]) {
        return [m, [...o, this.expression.interpret(m)]];
    }
}
export class WhileStatement {
    expression;
    block;
    constructor(expression, block) {
        this.expression = expression;
        this.block = block;
    }
    interpret([m, o]) {
        // TODO -- repeatedly interpret the block while the expression is true
        let state = [m, o];
        while (this.expression.interpret(m)) {
            state = this.block.interpret(state);
        }
        return state;
    }
}
// Block
export class Block {
    statements;
    constructor(statements) {
        this.statements = statements;
    }
    interpret([m, o]) {
        let state = [m, o];
        for (let statement of this.statements) {
            state = statement.interpret(state);
        }
        return state;
    }
}
// Program
export class Program {
    block;
    constructor(block) {
        this.block = block;
    }
    interpret() {
        const initialMemory = new Map([
            ["pi", Math.PI],
            ["sqrt", Math.sqrt],
            ["sin", Math.sin],
            ["cos", Math.cos],
            ["ln", Math.log],
            ["exp", Math.exp],
            ["hypot", Math.hypot],
        ]);
        const [_, o] = this.block.interpret([initialMemory, []]);
        return o;
    }
}
export function interpret(p) {
    return p.interpret();
}
