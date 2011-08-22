
var operatePlus = function(left,right)
{
    return operate(left) + operate(right);
}

var operateMult = function(left,right)
{
    return operate(left) * operate(right);
}

var operateDiv = function(left,right)
{
    return operate(left) / operate(right);
}

var operateMod = function(left,right)
{
    return operate(left) % operate(right);
}

var operateLess = function(left,right)
{
    return operate(left) - operate(right);
}

var operateEquals = function(left,right)
{
    return operate(left) == operate(right);
}
var operateFunctions = {
    '+':operatePlus,
    '-':operateLess,
    '*':operateMult,
    'div':operateDiv,
    'mod':operateMod,
    '=':operateEquals

};
var priority = {
    'mod':1,
    '*':3,
    'div':3,
    '+':5,
    '-':5,
    '|':7,
    '=':9,
    'and':12,
    'or':15
};



var operate = function(operation)
{
    //console.log(operation,operation.operator,operateFunctions[operation.operator]);
    if(typeof operation == 'string')
    {
        return parseInt(operation);
    }
    else
    {
        //console.log(operation.left+operation.operator+operation.right,operateFunctions[operation.operator](operation.left,operation.right));
        return operateFunctions[operation.operator](operation.left,operation.right);
    }
}

var resolvePriority = function(operation){
    if(priority[operation.operator] - priority[operation.right.operator] <= 0)
    {
        opcopy = operation.right;
        operation.right = opcopy.left;
        opcopy.left = operation;
        operation = opcopy;
        if(typeof operation.left == 'object')
        {
            operation.left = resolvePriority(operation.left);
        }
    }
    return operation;
}

var analyseExpretion = function(expression){
    //console.log(expression);
    var separators = /^(\w*)\s*(\+|-|\*| div | mod |\|| or | and |\(|\[|=)\s*(.*)$/;
    var parts = expression.match(separators);
    
    if(parts && parts.length>1)
    {
        var separator = parts[2].trim(),
            left = parts[1],
            operator = separator,
            right = analyseExpretion(parts[3]);
        if(separator == '[' || separator == '(')
        {
            // evaluate content
        }

        var operation = {
            left : parts[1],
            operator : parts[2].trim(),
            right : analyseExpretion(parts[3])

        }
        //console.log(expression,JSON.stringify(operation));
        
        operation = resolvePriority(operation);

        //console.log(expression,JSON.stringify(operation));
       return operation;
    }
    else
    {
        return expression;
    }
}

test("basic expressions tests", function() {

    tests = [
        {exp:'1+2+3+4',result:10},
        {exp:'4+2=5',result:false},
        {exp:'8+7*2',result:22},
        {exp:'8 * 7 + 2',result:58},
        {exp:'4+2=9-3',result:true},
        {exp:'1+2=5-2',result:true},
        {exp:'2+2=5',result:false},
        {exp:'4+6 div 3+8',result:14},
        {exp:'4+2*9 div 3*2',result:16}
    ]
    
    for(var i=0;i < tests.length;i++){
        equal(operate(analyseExpretion(tests[i].exp)), tests[i].result, tests[i].exp + ' => ' + tests[i].result + ' - ' + JSON.stringify(analyseExpretion(tests[i].exp)));
    }
});