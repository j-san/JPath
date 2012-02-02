
JPath is a tool for riding through json using an XPath syntax.


usage
-----

    var d = new JPath(data)
Create a new examinable data set.

    d.q(path, function) or JPath.query([path][, function])
Return a subset of JPath, if callback is specified, callback is called for each matching elements.

    d.count([path])
Return the number of matching elements by path.
 
    d.sum([path])
Return the sum of matched values.

    d.exists([path])
Return true if any element match the path.

    d.valueOf([path])
Return each literal values of the set.

    d.copyOf([path])
Return a string representation of the set.
 
 
Supported XPath syntax
----------------------
    path/to/somewhere
    path//deep//inside/and/*/all/children
    with[contains/path]/and/index[123]/selection
    computing[(1+2)*123=5]
    /any[combining]/of//different/*[0]/syntax
	...