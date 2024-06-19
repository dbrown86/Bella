type BuiltInFunction = (...args: Value[]) => Value;
type UserFunction = [Identifier[], Expression];
export type Value = number | boolean | Value[] | BuiltInFunction | UserFunction;

type Memory = Map<string, Value>;
type Output = Value[];
type State = [Memory, Output];

// Custom type guards

function isUserFunction(v: Value): v is UserFunction {
  return Array.isArray(v) && Array.isArray(v[0]) && v[0].length === 2;
}

function isBuiltInFunction(v: Value): v is BuiltInFunction {
  return typeof v === "function";
}

function isArray(x: Value): x is Value[] {
  return Array.isArray(x);
}

// Expressions

export interface Expression {
  interpret(m: Memory): Value;
}

export class Numeral implements Expression {
  constructor(public value: number) {}
  interpret(_: Memory): Value {
    return this.value;
  }
}

export class BooleanLiteral implements Expression {
  constructor(public value: boolean) {}
  interpret(_: Memory): Value {
    return this.value;
  }
}

export class Identifier implements Expression {
  constructor(public name: string) {}
  interpret(m: Memory): Value {
    const value = m.get(this.name);
    if (value == undefined) {
        throw new Error("Identifier was undeclared");
    }
    return value
  }
}

export class UnaryExpression implements Expression {
  constructor(public operator: string, public expression: Expression) {}
  interpret(m: Memory): Value {
    // TODO -- if the operator is "-", return the negation of the expression
    //otherwise if the operator is "!" return the NOT of the expression
    if (this.operator === "-") {
      if(typeof this.expression.interpret(m) !== "number") {
        throw new Error("Invalid operand type for '-' operator");
      }
      return -Number(this.expression.interpret(m)) as Value;
    }
    else if (this.operator === "!") {
      return !this.expression.interpret(m);
    }
    else {
      throw new Error("Invalid operator");
    }
  }
}

export class BinaryExpression implements Expression {
  constructor(
    public operator: string,
    public left: Expression,
    public right: Expression
  ) {}
  interpret(m: Memory): Value {
    const leftValue = this.left.interpret(m);
    const rightValue = this.right.interpret(m);

    console.log(`BinaryExpression: ${leftValue} ${this.operator} ${rightValue}`);

    if (this.operator === "+") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue + rightValue;
      } else {
        throw new Error("Invalid operand types for '+' operator");
      }
    }
    else if (this.operator === "-") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue - rightValue;
      } else {
        throw new Error("Invalid operand types for '-' operator");
      }
    }
    else if (this.operator === "*") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue * rightValue;
      } else {
        throw new Error("Invalid operand types for '*' operator");
      }
    }
    else if (this.operator === "/") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        if (rightValue === 0) {
          throw new Error("Division by zero");
        }
        return leftValue / rightValue;
      } else {
        throw new Error("Invalid operand types for '/' operator");
      }
    }
    else if (this.operator === "%") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        if (rightValue === 0) {
          throw new Error("Division by zero");
        }
        return leftValue % rightValue;
      } else {
        throw new Error("Invalid operand types for '%' operator");
      }
    }
    else if (this.operator === "<") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue < rightValue;
      } else {
        throw new Error("Invalid operand types for '<' operator");
      }
    }
    else if (this.operator === "<=") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue <= rightValue;
      } else {
        throw new Error("Invalid operand types for '<=' operator");
      }
    }
    else if (this.operator === ">") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue > rightValue;
      } else {
        throw new Error("Invalid operand types for '>' operator");
      }
    }
    else if (this.operator === ">=") {
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return leftValue >= rightValue;
      } else {
        throw new Error("Invalid operand types for '>=' operator");
      }
    }
    else if (this.operator === "==") {
      //strict equality for comparison 
      if (typeof leftValue === typeof rightValue) {
        return leftValue === rightValue;
      } else {
        throw new Error("Invalid operand types for '==' operator");
      }
    }
    else if (this.operator === "!==") {
      if (typeof leftValue === typeof rightValue){
      return leftValue !== rightValue; 
      
    } else {
        throw new Error("Invalid operand types for '!== operator");
      }
    } else if (this.operator === "&&") {
      if(typeof leftValue !== "boolean" || typeof rightValue !== "boolean") {{
        throw new Error("Invalid operand types for '&&' operator");
      }
      return Boolean(leftValue) && Boolean(rightValue);
      }
    } else if (this.operator === "||") {
      if(typeof leftValue !== "boolean" || typeof rightValue !== "boolean") {
        throw new Error("Invalid operand types for '||' operator");
      }
      return Boolean(leftValue) || Boolean(rightValue);
    }
    throw new Error("Unknown operator");
  }

}
export class Call implements Expression {
  constructor(public callee: Identifier, public args: Expression[]) {}
  interpret(m: Memory): Value {
    const functionValue = m.get(this.callee.name);
    const argValues = this.args.map((arg) => arg.interpret(m));
    if (functionValue === undefined) {
      throw new Error("Identifier was undeclared");
    } else if (isUserFunction(functionValue)) {
      const [parameters, expression] = functionValue;
      if (parameters.length !== this.args.length) {
        throw new Error("Wrong number of arguments");
      }
      const locals = parameters.map((p, i) => [p.name, argValues[i]] as const);
      return expression.interpret(new Map([...m, ...locals]));
    } else if (isBuiltInFunction(functionValue)) {
      return functionValue(...argValues);
    } else {
      throw new Error("Not a function");
    }
  }
}

export class ConditionalExpression implements Expression {
  constructor(
    public test: Expression,
    public consequent: Expression,
    public alternate: Expression
  ) {}
  interpret(m: Memory): Value {
    if (this.test.interpret(m)) {
      return this.consequent.interpret(m);
    } else {
      return this.alternate.interpret(m);
    }     
  }
}



export class ArrayLiteral implements Expression {
  constructor(public elements: Expression[]) {}
  interpret(m: Memory): Value {
    return this.elements.map((e) => e.interpret(m));
  }
}

export class SubscriptExpression implements Expression {
  constructor(public array: Expression, public subscript: Expression) {}
  interpret(m: Memory): Value {
    const arrayValue = this.array.interpret(m);
    const subscriptValue = this.subscript.interpret(m);
    if (isArray(arrayValue) && typeof subscriptValue === "number") {
      return arrayValue[subscriptValue];
    } else {
      throw new Error("Invalid subscript expression");
    }
  }
}

// Statements

export interface Statement {
  interpret([m, o]: State): State;
}

export class VariableDeclaration implements Statement {
  constructor(public id: Identifier, public expression: Expression) {}
  interpret([m, o]: State): State {
    // TODO -- add the identifier and its value to the memory 
    const value = this.expression.interpret(m);
    return [new Map([...m, [this.id.name, value]]), o];

  }
}

export class FunctionDeclaration implements Statement {
  constructor(
    public id: Identifier,
    public parameters: Identifier[],
    public expression: Expression
  ) {}
  interpret([m, o]: State): State {
    // TODO -- add the identifier and its value to the memory
    const value: UserFunction = [this.parameters, this.expression];
    return [new Map([...m, [this.id.name, value]]), o];
  }
}

export class Assignment implements Statement {
  constructor(public id: Identifier, public expression: Expression) {}
  interpret([m, o]: State): State {
    // TODO -- update the value of the identifier in the memory
    const value = this.expression.interpret(m);
    m.set(this.id.name, value);
    return [m, o];
  }
}

export class PrintStatement implements Statement {
  constructor(public expression: Expression) {}
  interpret([m, o]: State): State {
    return [m, [...o, this.expression.interpret(m)]];
  }
}

export class WhileStatement implements Statement {
  constructor(public expression: Expression, public block: Block) {}
  interpret([m, o]: State): State {
    // TODO -- repeatedly interpret the block while the expression is true
    let state: State = [m, o];
    while (this.expression.interpret(m)) {
      state = this.block.interpret(state);
    }
    return state;
  }
}

// Block

export class Block {
  constructor(public statements: Statement[]) {}
  interpret([m, o]: State): State {
    let state: State = [m, o];
    for (let statement of this.statements) {
      state = statement.interpret(state);
    }
    return state;
  }
}

// Program

export class Program {
  constructor(public block: Block) {}
  interpret(): Output {
    const initialMemory: Memory = new Map<string, Value>([
      ["pi", Math.PI as Value],
      ["sqrt", Math.sqrt as Value],
      ["sin", Math.sin as Value],
      ["cos", Math.cos as Value],
      ["ln", Math.log as Value],
      ["exp", Math.exp as Value],
      ["hypot", Math.hypot as Value],
    ]);
    const [_, o] = this.block.interpret([initialMemory, []]);
    return o;
  }
}

export function interpret(p: Program) {
  return p.interpret();
}