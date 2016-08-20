//Takes cares of removing the spaces from the start of an expression
//if a user has just added a bunch of them for whatever reason
function skipSpace(string) {
  var first = string.search(/\S/);
  if (first == -1) return "";
  return string.slice(first);
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

//=== MAIN ===

console.log(parse("+(a, 10)"));

//============