


JPath is a tool for riding through json using an XPath syntax.


Install for Node.js
-------------------

    npm install JPath

Travis CI tracker: http://travis-ci.org/j-san/JPath
[![Build Status](https://secure.travis-ci.org/j-san/JPath.png?branch=master)](http://travis-ci.org/j-san/JPath)


Usage
-----

JPath improve Array method set, you just need to add elements in arrays
to start using JPath.

    Array.query([path]) or Array.q([path])
Return a subset of the array containig each matching elements.

    Array.count([path])
Return the number of matching elements by path.
 
    Array.sum([path])
Return the sum of matched values.

    Array.exists([path])
Return true if any element match the path.

    Array.valueOf([path])
Return a string containig each literal values of the array.

    Array.copyOf([path])
Return a string representation of the array.
 
 
Supported XPath syntax
----------------------
    path/to/somewhere
    path//deep//inside/and/*/all/children
    with[contains/path]/and/index[123]/selection
    computing[(1+2)*123=5]
    /any[combining]/of//different/*[0]/syntax
	...


Supported XPath operators
-------------------------
/ child
// descendant
% modulo'
/ divide
* multiply
+ add
- substract
| union
= equal
and and
or or

