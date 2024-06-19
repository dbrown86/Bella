import * as assert from "assert/strict";
import * as bella from "../bella.js";
import { describe, it } from "node:test";
const id = (i) => new bella.Identifier(i);
const num = (n) => new bella.Numeral(n);
const bool = (x) => new bella.BooleanLiteral(x);
const unary = (op, x) => new bella.UnaryExpression(op, x);
const binary = (op, x, y) => new bella.BinaryExpression(op, x, y);
const print = (x) => new bella.PrintStatement(x);
const vardec = (i, e) => new bella.VariableDeclaration(i, e);
const block = (s) => new bella.Block(s);
const program = (b) => new bella.Program(b);
describe("The interpreter", () => {
    it("interprets numerals ok", () => {
        assert.equal(num(8).interpret(new Map()), 8);
    });
    it("interprets boolean literals ok", () => {
        const m = new Map([
            ["x", 1],
            ["y", 2],
        ]);
        assert.equal(id("x").interpret(m), 1);
        assert.equal(id("y").interpret(m), 2);
        assert.throws(() => id("z").interpret(m));
    });
    it("interprets unary expressions ok", () => {
        const m = new Map(([
            ["x", 1],
            ["y", 2],
        ]));
        assert.equal(unary("-", num(8)).interpret(m), -8);
        assert.equal(unary("!", bool(true)).interpret(m), false);
    });
    it("interprets unary expressions ok", () => {
        const m = new Map([
            ["x", 1],
            ["a", true],
            ["b", false],
        ]);
        assert.equal(unary("-", num(8)).interpret(m), -8);
        assert.equal(unary("-", id("x")).interpret(m), -1);
        assert.throws(() => unary("-", id("y")).interpret(m));
        assert.equal(unary("!", bool(true)).interpret(m), false);
        assert.equal(unary("!", bool(false)).interpret(m), true);
        assert.equal(unary("!", id("a")).interpret(m), false);
        assert.equal(unary("!", id("b")).interpret(m), true);
    });
    it("interprets binary expressions ok", () => {
        const m = new Map([
            ["x", 1],
            ["y", 2],
            ["a", true],
            ["b", false],
        ]);
        assert.equal(binary("+", id("x"), num(8)).interpret(m), 9);
        assert.throws(() => binary("+", id("x"), id("z")).interpret(m));
        assert.equal(binary("-", id("x"), num(8)).interpret(m), -7);
        assert.throws(() => binary("-", id("x"), id("z")).interpret(m));
        assert.equal(binary("*", id("x"), num(8)).interpret(m), 8);
        assert.throws(() => binary("*", id("x"), id("z")).interpret(m));
        assert.equal(binary("/", num(8), id("y")).interpret(m), 8);
        assert.throws(() => binary("/", id("x"), id("z")).interpret(m));
        assert.equal(binary("%", id("y"), num(9)).interpret(m), 2 % 9);
        assert.throws(() => binary("%", id("x"), id("z")).interpret(m));
        assert.equal(binary("==", num(8), num(9)).interpret(m), false);
        assert.equal(binary("!=", num(8), num(9)).interpret(m), true);
        assert.equal(binary("<=", num(8), num(9)).interpret(m), true);
        assert.equal(binary("<", num(8), num(9)).interpret(m), true);
        assert.equal(binary(">", num(8), num(9)).interpret(m), false);
        assert.equal(binary(">=", num(8), num(9)).interpret(m), false);
        assert.equal(binary("&&", bool(true), bool(false)).interpret(m), false);
        assert.equal(binary("||", bool(true), bool(false)).interpret(m), true);
    });
    it("interprets print statements ok", () => {
        const m = new Map([]);
        assert.deepEqual(print(num(8)).interpret([m, [1]]), [m, [1, 8]]);
    });
    it("interprets small programs ok", () => {
        let p = program(block([vardec(id("x"), num(5)), print(id("x"))]));
        assert.deepEqual(p.interpret(), [5]);
        p = program(block([print(unary("-", num(5))), print(binary("*", num(5), num(8)))]));
        assert.deepEqual(p.interpret(), [-5, 40]);
    });
});
