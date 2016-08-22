//Takes cares of removing the spaces from the start of an expression
//if a user has just added a bunch of them for whatever reason
function skipSpace(string) {
  return string.replace(/(#.*\n|\s)/g, "");
}

function parseExpression(program){
    program = skipSpace(program);

    var match;
    var expression;

    //Parsing for atomic types:
    //String - Starts and ends with ""
    if (match = /^"([^"]*)"/.exec(program)) {
        expression = {type: "value", value: match[1]};
    } //Numbers - starts and 'boundary ends' with digits
    else if(match = /^\d+\b/.exec(program)) {
        expression = {type: "value", value: Number(match[0])};
    } //Words i.e. Variable names - String that doesn't start with double quotes
    else if(match = /^[^\s(),"]+/.exec(program)) {
        expression = {type: "word", name: match[0] };
    }
    else {
        throw new SyntaxError("Unexpected Syntax: " + program);
    }

    //Cut off the number of characters that were 'matched' and send off the next portion
    return parseApply(expression, program.slice(match[0].length))
    
}

function parseApply(expression, program){
    program = skipSpace(program);

    //Check to see if expression starts with parantheses
    if(program[0] == "("){
        //Trimming whitespace after skipping the opening parantheses
        program = skipSpace(program.slice(1));
        expression = {type: "apply", operator: expression, args: []};

        while(program[0] != ")"){

            //Following will result in recursion until a datatype(see below) is returned
            var argument = parseExpression(program);

            expression.args.push(argument.expression);
            program = skipSpace(argument.rest);

            if(program[0] == ","){
                program = skipSpace(program.slice(1));
            }
            else if(program[0] != ")"){
                throw new SyntaxError("Expected ',' or ')'");
            }
        }

        //The following line will execute after the ')' is hit
        //The entire expression has been rolled into 'expression'
        //and the 'program.slice(1)' exists to check if, beyond
        //the ')', there lies more '(something)' to compute
        //Otherwise, the call to parseApply with the program
        //argument as "" i.e. ")".slice(1) results in a final object of
        //  {expression: ..., rest: ""}
        //being evaluated by the 'parse' function, below.
        return parseApply(expression, program.slice(1));
    }
    else{
        //If expression doesn't start with parantheses, return as data type
        return {expression: expression, rest: program};
    }
}

//Will make sure that the 'rest' property is "", as explained above
function parse(program){
    var result = parseExpression(program);
    if(skipSpace(result.rest).length > 0){
        throw new SyntaxError("Unexpected test after program");
    }
    return result.expression;
}

function evaluate(expression, environment){
    switch(expression.type){
        case "value":
            return expression.value;
        case "word":
            if(expression.name in environment){
                return environment[expression.name];
            }
            else{
                throw new ReferenceError("Undefined variable: " + expression.name);
            }
        case "apply":
            var operator = expression.operator;

            //For things like if, else...
            if(operator.type == "word" && operator.name in specialForms){
                return specialForms[operator.name](expression.args, environment);
            }

            //for normal calls...
            var op = evaluate(operator, environment)
            if(typeof op != "function"){
                throw new TypeError("Applying a non-function.")
            }

            //applies function op to every argument in the expression, but first makes sure that
            //all those arguments have been recursively dealt with
            return op.apply(null, expression.args.map(function(arg){return evaluate(arg, environment)}));
    }
}

var specialForms = Object.create(null);
specialForms["if"] = function(args, env){
    if(args.length != 3){
        throw new SyntaxError("Bad number of args to if");
    }
    if (evaluate(args[0], env) !== false){
        return evaluate(args[1], env);
    }
    else{
        return evaluate(args[2], env);
    }
};

specialForms["while"] = function(args, env){
    if(args.length != 2){
        throw new SyntaxError("Bad number of args to while");
    }

    while(evaluate(args[0], env) !== false){
        evaluate(args[1], env);
    }

    return false;
}

specialForms["do"] = function(args, env){
    var value = false;
    args.forEach(function(arg){
        value = evaluate(arg, env);
    });
    return value;
}

specialForms["define"] = function(args, env){
    if(args.length != 2 || args[0].type != "word"){
        throw new SyntaxError("Bad use of define");
    }
    var value = evaluate(args[1], env);
    env[args[0].name] = value;
    return value;
}

specialForms["set"] = function(args, env) {
    if(args.length != 2 || args[0].type != "word"){
        throw new SyntaxError("Bad use of set");
    }

    var value = evaluate(args[1], env);

    var name = args[0].name;
    
    if(!Object.prototype.hasOwnProperty.call(env, name)){
        var parentEnv = Object.getPrototypeOf(env);
        if(!Object.prototype.hasOwnProperty.call(parentEnv, name)){
            throw new ReferenceError();
        } 
        else{
            parentEnv[name] = value;
        }
    }
    else{
        env[name] = value;
    }
    
    return value;
}

specialForms["fun"] = function(args, env){
    if(!args.length){
        throw new SyntaxError("Functions need a body");
    }

    function name(expression){
        if(expression.type != "word"){
            throw new SyntaxError("Argument names must be words");
        }
        return expression.name;
    }

    //'slices' the 'arguments' provided to the 'fun' and confirms
    //that they are words
    var argumentNames = args.slice(0, args.length - 1).map(name)
    var body = args[args.length - 1];

    return function(){
        //Don't get confused: the following line is for when
        //the function is being called, not when it's being
        //defined, like the check above
        if(arguments.length != argumentNames.length){
            throw new TypeError("Wrong number of arguments");
        }
        var localEnv = Object.create(env);
        for(var i = 0; i < arguments.length; i++){
            localEnv[argumentNames[i]] = arguments[i];
        }

        return evaluate(body, localEnv);
    }
}

var topEnv = Object.create(null);
topEnv["true"] = true;
topEnv["false"] = false;

//dynamically creates functions
["+","-","*","/","==","<",">"].forEach(function(operator){
    topEnv[operator] = new Function("a, b", "return a " + operator + " b;");
});

topEnv["print"] = function(value){
    console.log(value);
    return value;
};

topEnv["array"] = function(){
    var length = arguments.length; 
    if(!length){
        throw new SyntaxError("Cannot have empty array");
    }
    var array = [];
    for(var i = 0; i < length; i++){
        array[i] = arguments[i];
    }
    return array;
};

topEnv["length"] = function(array){
    return array.length;
};

topEnv["element"] = function(array, n){
    if(n < 0){
        throw new SyntaxError("Index number cannot be less than 0")
    }
    if(n >= array.length){
        throw new SyntaxError("Index number higher than number of elements in array")
    }
    return array[n];
}

function run(){
    var env = Object.create(topEnv);
    var program = Array.prototype.slice.call(arguments, 0).join("\n");
    return evaluate(parse(program), env);
}
//=== MAIN ===

// run("do(define(total, 0),",
//     "   define(count, 1),",
//     "   while(<(count, 11),",
//     "       do(define(total, +(total,count)),",
//     "          define(count, +(count,1)))),",
//     "   print(total))");

// run(
//     "do(define(plusOne,fun(a,+(a,1))),",
//     "   print(plusOne(10)))"
//     );

// run(
//     "do(",
//     "   define(pow,",
//     "          fun(base, exp,",
//     "              if(==(exp,0),",
//     "                   1,",
//     "                   *(base, pow(base, -(exp, 1)))",
//     "              )",
//     "          )",
//     "   ),",
//     "   print(pow(2, 10))",
//     ")"
// );

// run("do(define(sum, fun(array,",
//     "     do(define(i, 0),",
//     "        define(sum, 0),",
//     "        while(<(i, length(array)),",
//     "          do(define(sum, +(sum, element(array, i))),",
//     "             define(i, +(i, 1)))),",
//     "        sum))),",
//     "   print(sum(array(1, 2, 3))))");
// → 6

run(
    "do(",
    "   define(x, 10),",
    "   define(func, fun(val, set(x, val))),",
    "   func(5),",
    "   print(x)", 
    ")"
);
//5

run(
    "do(",
    "   define(x, 10),",
    "   define(func, fun(val, fun(toAddBy, set(x, +(val, toAddBy))))),",
    "   func(5)(3),",
    "   print(x)", 
    ")"
);
//ReferenceError

//============