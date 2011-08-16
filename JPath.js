(function()
{
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
                        results.push(o[name]);
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
			var subset = query(results[i],cond);
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

    var query = function(data, path) {
	if(!path){
	    return JPath(data);
	}
        //var m = /$(\/?\/?\w*(?!\[\w*\])?)(.+)?^/.match(p);
        var m = path.match(/^(\/?\/?(?:\w+|\*)(?:\[.*\])*)(\/.*)?$/);
        // console.log('parse', m, data);
        
        if(!m)
	{
            throw Error('syntax error');
        }
        else if (m[2] && m[2] != '/')
        {
            return query(filterSet(data, m[1]), m[2]);
        }
        else if (m[1])
        {
            return JPath(filterSet(data, m[1]));
        }
        return null;
    };

    window.JPath = function(data) {
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


        set.q = function(path,callback) {
	    var results = query(set, path);
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
            return query(set, path).length;
        };

        set.sum = function(path) {
	    var sum = 0;
            set.q(path, function(i,e){
		sum += e;
	    });
	    return sum;
        };

         set.exists = function(path) {
            return query(set, path).length > 0;
        };

         set.valueOf = function(path) {
	    return values(query(set, path)).join();
        };

         set.copyOf = function(path) {
            return JSON.stringify(query(set, path));
        };


        return set;
    };
} ());
