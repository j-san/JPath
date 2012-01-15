(function()
{

	var Operation = function(left,operator,right)
	{
		this.l = left;
		this.o = operator;
		this.r = right;
//		return this.resolvePriority();
	}
	
	Operation.prototype.resolvePriority = function()
	{
		if(typeof this.l == 'object')
		{
			this.l.resolvePriority();
			
			if(this.l instanceof Operation && priority[this.o] - priority[this.l.o] < 0)
			{
				//console.log('switch', this.l.toString(), this.o, this.r.toString());
			    this.r = new Operation(this.l.r,this.o,this.r);
			    this.o = this.l.o;
			    this.l = this.l.l;
			}
		}
		return this;
	}
	
	Operation.prototype.toString = function()
	{
		return '(' + this.l + ' ' + this.o + ' ' + this.r + ')';
	}

	var Parenthese = function(operation,type,operand)
	{
		this.l = operand;
		this.o = operation;
		this.t = type;
	}
	
	Parenthese.prototype.resolvePriority = function()
	{
		if(typeof this.o == 'object')
		{
			this.o.resolvePriority();
		}
	}
	
	Parenthese.prototype.toString = function()
	{
		if(this.t == '(' && this.l) {
			return this.l + '(' +  this.o + ')';
		}
		if(this.t == '(') {
			return '<' +  this.o + '>';
		}
		if(this.t == '[') {
			return this.l + '[' +  this.o + ']';
		}
	}

	var Expression = function(text){
		this.expression = text;
		this.lastMatch = -1;
		this.currPos = -1;
	}

	Expression.prototype.addOperation = function(separator,operand)
	{
		this.lastMatch = this.currPos;
		if(this.operator)
		{
			this.operation = new Operation(this.operation, this.operator, operand);
		}
		else if(!this.operation)
		{
			this.operation = operand;
		}
		
		this.operator = separator;
	}

	Expression.prototype.parse = function(closeChar)
	{
		this.operator = null;
		this.operation = null;
		this.currPos++;
		for(;this.currPos < this.expression.length; this.currPos++)
		{
			var operand = this.expression.substring(this.lastMatch + 1, this.currPos).trim();
			var remaining = this.expression.substring(this.currPos + 1).trim();
			if(this.expression[this.currPos] in separators.tokens)
			{
				var separator = this.expression[this.currPos];

				if(separator == ' ')
				{
					var str;
					if(str = remaining.substring(remaining.indexOf(' ')) in separators.strtokens)
					{
						this.addOperation(str,operand);
					}
				}
				else if(separator == '(' || separator == '[')
				{
					var close = ')';
					if(separator == '['){
						close = ']';
					}
					this.lastMatch = this.currPos;
					// it does not use addOperation because this.parse need to be called inside this sequence, not before
					if(this.operator) {
						this.operation = new Operation(this.operation, this.operator, new Parenthese(this.parse(close),separator,operand));
					} else if(!this.operation) {
						this.operation = new Parenthese(this.parse(close),separator,operand);
					}
					this.operator = null;
				}
				else if(separator == closeChar)
				{
					this.addOperation(null,operand);
					return this.operation;
				}
				else if(separator == '/')
				{
					if(remaining[0] == '/')
					{
						separator = '//';
						this.currPos++;
					}
					
					if(!operand.trim())
					{
						operand = 'root';
					}
					this.addOperation(separator,operand);
				}
				else
				{
					if(operand.trim())
					{
						this.addOperation(separator,operand);
					}
					else
					{
						if(this.operation && !this.operator)
						{
							// after a parenthese
							this.lastMatch = this.currPos;
							this.operator = separator;
						}
						else if(separator != '*')
						{
							var s = '';
							for(var j=0;j<this.currPos;j++){s+=' ';}
							console.log(this.expression);
							console.log(s + '^');
							console.log(operand, separator, this.operation);
							throw Error('Unexpected opeator "'+separator+'"');
						}
					}
				}
			}
		}
		this.addOperation(null, this.expression.substring(this.lastMatch + 1).trim());

		if(typeof this.operation == 'object') {
			this.operation.resolvePriority();
		}
		return this.operation;
	}

	Expression.prototype.execute = function(data,root)
	{
		if(typeof operation == 'string')
		{
		    var i = parseInt(operation);

		    if(isNaN(i) || i.toString() != operation)
		    {
				return evaluatePath(operation,this.data,this.root);
		    }
		    return i;
		}
		else
		{
		    return this[operateFunctions[operation.operator]](operation.left,operation.right);
		}
	}
	var operators = {
		'predicate':{priority:1},
		'parenthese':{priority:2},
		'child':{priority:4},
		'deepChild':{priority:4},
		'modulo':{priority:6},
		'divide':{priority:8},
		'multiply':{priority:8},
		'add':{priority:10},
		'substract':{priority:10},
		'union':{priority:12},
		'equals':{priority:15},
		'and':{priority:18},
		'or':{priority:20},
	}

	// http://saxon.sourceforge.net/saxon6.5/expressions.html
    var separators = {
		tokens: {
			'+': operators.add,
			'-': operators.substract,
			'*': operators.multiply,
			'/': operators.child,
			'=': operators.equals,
			'|': operators.union,
			' ': null,
			'[': operators.predicate,
			']': null,
			'(': operators.parenthese,
			')': null
		},
		strtokens: {
			'mod': operators.modulo,
			'div': operators.divide,
			'and': operators.and,
			'or':  operators.or,
			'//':  operators.descendant
		}
    };

/*
    Query.prototype.operateAdd = function(left,right)
    {
		return castInt(this.operate(left)) + castInt(this.operate(right));
    }
    
    Query.prototype.operateMult = function(left,right)
    {
		return castInt(this.operate(left)) * castInt(this.operate(right));
    }
    
    Query.prototype.operateDiv = function(left,right)
    {
	return castInt(this.operate(left)) / castInt(this.operate(right));
    }
    
    Query.prototype.operateMod = function(left,right)
    {
	return castInt(this.operate(left)) % castInt(this.operate(right));
    }
    
    Query.prototype.operateSub = function(left,right)
    {
	return castInt(this.operate(left)) - castInt(this.operate(right));
    }
    
    Query.prototype.operateEquals = function(left,right)
    {
		var resLeft = this.operate(left);
		if (resLeft instanceof Array)
	    {
	        for (var i = 0; i < resLeft.length; i++)
	        {
				if(operateEquals(resLeft,right))
				{
				    return true;
				}
		    }
		    return false;
		}
		else
		{
		    var resRight = this.operate(right);
		    if (resRight instanceof Array)
		    {
				for (var i = 0; i < resRight.length; i++)
				{
				    if(operateEquals(resLeft,resRight))
				    {
						return true;
				    }
				}
				return false;
		    }
		    return resLeft == resRight;
		}
    }

    Query.prototype.operateJoin = function(left,right)
    {
		return this.operate(left).concat(this.operate(right));
    }


    var operateFunctions = {
	'+':'operateAdd',
	'-':'operateSub',
	'*':'operateMult',
	'div':'operateDiv',
	'/':'operateDiv',
	'mod':'operateMod',
	'=':'operateEquals',
	'|':'operateJoin'
	// and
	// or
    };


    

    var castInt = function(value)
    {
	if(value instanceof Array)
	{
	    return value[0];
	}
	return value;
    }

    var castBool = function(value)
    {
	if(value instanceof Array)
	{
	    return value.length;
	}
	return value;
    }
*/






	
    var analyseExpression = function(expression/*,root*/){
		//console.log(expression);
		var separators = /^([\/\w\*\[\]]*)\s+(\+|\/|-|\*|div|mod|\||or|and|\(|\[|=)\s+(.*)$/;
		var parts = expression.match(separators);
	
		if(parts && parts.length>1)
		{
		    //console.log('path',parts);
		    var separator = parts[2].trim();
		    if(separator == '[' || separator == '(')
		    {
				//console.log('cond',parts);
				var pos = parts[1].length + 1;
				var c = 1;
				while((c > 0 || parts[2] != '[') && parts[3]){
				    parts = parts[3].match(/^([\/\w]*)\s*(\]|\[)\s*(.*)$/);
				    console.log(parts);
				    if(parts && parts.length > 2)
				    {
						pos += parts[1].length + 1;
						if(parts[2] == ']')
						{
						    c--;
						}
						else
						{
						    c++;
						}
						console.log(c);
				    }
				    else
				    {
						throw Error('Syntax error:'+expression);
				    }
				}
			
				if(c != 0)
				{
				    throw Error('Syntax error');
				}
			
				var path = expression.substring(0, pos);
				console.log(path,parts);
				if(parts[3])
				{
				    parts = expression.match(parts[3]);
				    if(!parts[2])
				    {
						throw Error('Syntax error ' + expression);
				    }
				    var operation = {
						left : path,
						operator : parts[1].trim(),
						right : analyseExpression(parts[2])
				    }
				    //console.log(expression,JSON.stringify(operation));
		    
				    operation = resolvePriority(operation);
	    
				    //console.log(expression,JSON.stringify(operation));
				   return operation;
				}
				else
				{
				    return path;
				}
		    }
		    if(!parts[3])
		    {
				throw Error('Syntax error ' + expression);
		    }
		    var operation = {
				left : parts[1],
				operator : separator,
				right : analyseExpression(parts[3])
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

    var evaluatePath = function(path, data, rootJPathSet){
        //var m = /$(\/?\/?\w*(?!\[\w*\])?)(.+)?^/.match(p);
        var m = path.match(/^(\/?\/?(?:\w+|\*)(?:\[.*\])*)(\/.*)?$/);
        // console.log('parse', m, data);
        
        if(!m)
		{
            throw Error('syntax error ' + path);
        }
        else if (m[2] && m[2] != '/')
        {
            return evaluatePath(m[2], filterSet(data, m[1]), rootJPathSet);
        }
        else if (m[1])
        {
            return JPath(filterSet(data, m[1]), rootJPathSet);
        }
        return null;
    }

    var filterSet = function(set, filter, deep)
    {
		var results = [];
		var parts = filter.split(/(?:\]|\[)/); 
		var name = parts.shift();
		if(name[1] == '/')
		{
		    name = name.substring(2);
		    deep = true;
		}
		else if (name[0] == '/')
		{
		    name = name.substring(1);
		}

        // console.log('filter', name, set, deep);

		if(name == '*')
		{
		    getInside(set, function(o)
		    {
			if(typeof o == 'object')
			{
			    for(k in o)
			    {
				results.push(o[k]);
				if(deep)
				{
				    results = results.concat(filterSet(o[k], name, true));
				}
			    }
			}
		    });
		}
        else
        {
            getInside(set, function(o)
            {
                if(typeof o == 'object')
                {
                    if(o[name])
                    {
						//todo put in a function "add" and do it recursively
						if(o[name] instanceof Array)
						{
			            	results = results.concat(o[name]);
						}
						else
						{
			             	results.push(o[name]);
						}
                    }
                    if(deep)
                    { // return all match in tree
                        for(k in o)
                        {
                            results = results.concat(filterSet(o[k], name, true));
                        }
                    }
               }
            });
        }
		var cond;
		while((cond = parts.shift()) != null)
		{
		    var results2 = [];
		    if (cond)
		    {
	    		// console.log('cond',cond, set);
				var i = parseInt(cond);
				if(!isNaN(i))
				{
				    if(results[i])
				    {
						results2.push(results[i]);
				    }
				}
				else
				{
				    for (i = 0; i < results.length; i++)
				    {
						var subset = query(cond,results[i]/*,root*/);
						if(subset.length)
						{
						    results2.push(results[i]);
						}
				    }
				}
				results = results2;
		    }
		}
        return results;
    }

    var getInside = function(data, callback)
    {
        if (data instanceof Array)
        {
            for (var i = 0; i < data.length; i++)
            {
                if (data[i] instanceof Array)
                {
                    getInside(data[i],callback);
                }
                else 
                {
                    callback(data[i]);
                }
            }
        }
        else
        {
            callback(data);
        }
    }

    var values = function(set)
    {
		var data = [];
	
		getInside(set, function(o)
		{
		    if(typeof o == 'object')
		    {
				for(k in o)
				{
				    data = data.concat(values(o[k]));
				}
		    }
		    else
		    {
				data.push(o);
		    }
		});

		return data;
    }
    
    var resolvePriority = function(operation)
    {
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

    

    /**** MAIN JPATH OBJECT DECLARATION ****/
    var JPath = function(data,root) {
        var set;
        if (data instanceof Array)
        {
            set = data;
        }
        else
        {
            set = [];
            if (data){ set.push(data); }
        }
	
		if(root){
		    set.root = root;
		}


        set.q = function(path,callback) 
		{
		    var results = query(path,set,root);
		    if(callback)
			{
				for (var i = 0; i < results.length; i++)
				{
				    callback(i,results[i]);
				}
		    }
            return results;
        };
	
		set.query = set.q;

         set.count = function(path) {
            return query(path,set,root).length;
        };

        set.sum = function(path) {
	    var sum = 0;
            set.q(path, function(i,e){
		sum += e;
	    });
	    return sum;
        };

        set.exists = function(path) {
            return query(path,set,root).length > 0;
        };

        set.valueOf = function(path) {
	    return values(query(path,set,root)).join();
        };

        set.copyOf = function(path) {
            return JSON.stringify(query(path,set,root));
        };

        return set;
    };
    
    /**
     * @param path a string
     * @param data an Array or Object to query
     * @param root a JPath object
     */
    var query = function(path,data,root) {
	var q = new Query(data,root);
	return q.exe(path);
    }
    
    var Query = function(data,root){
	this.data = data;
	this.root = root;
    }
    Query.prototype.exe = function(path){
		if(!path)
		{
		    return this.data;
		}
		return this.operate(analyseExpression(path))
    }
    Query.prototype.operate = function(operation)
    {
		if(typeof operation == 'string')
		{
		    var i = parseInt(operation);

		    if(isNaN(i) || i.toString() != operation)
		    {
				return evaluatePath(operation,this.data,this.root);
		    }
		    return i;
		}
		else
		{
		    return this[operateFunctions[operation.operator]](operation.left,operation.right);
		}
    }

    Query.prototype.operateAdd = function(left,right)
    {
		return castInt(this.operate(left)) + castInt(this.operate(right));
    }
    
    Query.prototype.operateMult = function(left,right)
    {
		return castInt(this.operate(left)) * castInt(this.operate(right));
    }
    
    Query.prototype.operateDiv = function(left,right)
    {
	return castInt(this.operate(left)) / castInt(this.operate(right));
    }
    
    Query.prototype.operateMod = function(left,right)
    {
	return castInt(this.operate(left)) % castInt(this.operate(right));
    }
    
    Query.prototype.operateSub = function(left,right)
    {
	return castInt(this.operate(left)) - castInt(this.operate(right));
    }
    
    Query.prototype.operateEquals = function(left,right)
    {
		var resLeft = this.operate(left);
		if (resLeft instanceof Array)
	    {
	        for (var i = 0; i < resLeft.length; i++)
	        {
				if(operateEquals(resLeft,right))
				{
				    return true;
				}
		    }
		    return false;
		}
		else
		{
		    var resRight = this.operate(right);
		    if (resRight instanceof Array)
		    {
				for (var i = 0; i < resRight.length; i++)
				{
				    if(operateEquals(resLeft,resRight))
				    {
						return true;
				    }
				}
				return false;
		    }
		    return resLeft == resRight;
		}
    }

    Query.prototype.operateJoin = function(left,right)
    {
		return this.operate(left).concat(this.operate(right));
    }


    var operateFunctions = {
	'+':'operateAdd',
	'-':'operateSub',
	'*':'operateMult',
	'div':'operateDiv',
	'/':'operateDiv',
	'mod':'operateMod',
	'=':'operateEquals',
	'|':'operateJoin'
	// and
	// or
    };


    

    var castInt = function(value)
    {
	if(value instanceof Array)
	{
	    return value[0];
	}
	return value;
    }

    var castBool = function(value)
    {
	if(value instanceof Array)
	{
	    return value.length;
	}
	return value;
    }

    var priority = {
	'mod':1,
	'*':3,
	'div':3,
	'/':3,
	'+':5,
	'-':5,
	'|':7,
	'=':9,
	'and':12,
	'or':15
    };
	
	window.JPath = JPath;
	JPath.functions = {};
	JPath.functions.parse = function(str){
		var exp = new Expression(str);
		return exp.parse();
		
	}
} ());
