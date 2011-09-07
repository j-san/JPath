(function()
{
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
    window.JPath = function(data,root) {
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


        set.q = function(path,callback) {
	    var results = query(path,set,root);
	    if(callback){
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
	if(!path)
	{
	    return data;
	}

	var operate = function(operation)
	{
	    if(typeof operation == 'string')
	    {
		var i = parseInt(operation);
    
		if(isNaN(i) || i.toString() != operation)
		{
		    return evaluatePath(operation,data,root);
		}
		return i;
	    }
	    else
	    {
		return operateFunctions[operation.operator](operation.left,operation.right);
	    }
	}
    
	var operateAdd = function(left,right)
	{
	    return castInt(operate(left)) + castInt(operate(right));
	}
	
	var operateMult = function(left,right)
	{
	    return castInt(operate(left)) * castInt(operate(right));
	}
	
	var operateDiv = function(left,right)
	{
	    return castInt(operate(left)) / castInt(operate(right));
	}
	
	var operateMod = function(left,right)
	{
	    return castInt(operate(left)) % castInt(operate(right));
	}
	
	var operateSub = function(left,right)
	{
	    return castInt(operate(left)) - castInt(operate(right));
	}
	
	var operateEquals = function(left,right)
	{
	    return operate(left) == operate(right);
	}
    
	var operateJoin = function(left,right)
	{
	    return operate(left).concat(operate(right));
	}


	var operateFunctions = {
	    '+':operateAdd,
	    '-':operateSub,
	    '*':operateMult,
	    'div':operateDiv,
	    '/':operateDiv,
	    'mod':operateMod,
	    '=':operateEquals,
	    '|':operateJoin
	    // and
	    // or
	};
	
	return operate(analyseExpression(path))
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

} ());
