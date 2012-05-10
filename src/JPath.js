(function () {

	// http://saxon.sourceforge.net/saxon6.5/expressions.html
	var operators = {
		'child': {priority: 40, str: '/'},
		'deepChild': {priority: 40, str: '//'},
		'predicate': {priority: 37, str: '#'},
		'modulo': {priority: 35, str: '%'},
		'divide': {priority: 30, str: '/'},
		'multiply': {priority: 30, str: '*'},
		'add': {priority: 20, str: '+'},
		'substract': {priority: 20, str: '-'},
		'union': {priority: 15, str: '|'},
		'equal': {priority: 10, str: '='},
		'and': {priority: 5, str: 'and'},
		'or': {priority: 1, str: 'or'}
	}, separators = {
			tokens: {
				'+': operators.add,
				'-': operators.substract,
				'*': operators.multiply,
				'/': operators.child,
				'=': operators.equal,
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
				'//':  operators.deepChild
			}
	    };


	function Operation(left, operator, right) {
		this.l = left;
		this.o = operator;
		this.r = right;
	}

	Operation.prototype.resolvePriority = function () {
		if (typeof this.l === 'object') {
			this.l.resolvePriority();

			if (this.l instanceof Operation && this.o.priority > this.l.o.priority) {
			    this.r = new Operation(this.l.r, this.o, this.r);
			    this.o = this.l.o;
			    this.l = this.l.l;
			}

			/*if(this.r instanceof Operation && this.o.priority > this.r.o.priority)
			{
			    this.r = new Operation(this.l.r,this.o,this.r);
			    this.o = this.l.o;
			    this.l = this.l.l;
			}*/
		}
		return this;
	};

	Operation.prototype.toString = function () {
		return '(' + this.l + ' ' + this.o.str + ' ' + this.r + ')';
	};

	Operation.prototype.result = function (data, root) {
		var left = this.l, right = this.r;
		if (typeof left === 'object') {
		    left = left.result(data, root);
		}

		if (typeof right === 'object' && this.o !== operators.predicate) {
		    right = right.result(data, root);
		}
		
		return this.o.operate(left, right, data, root);
	};

	function Parenthese(operation, type) {
		this.o = operation;
		this.t = type;
	}

	Parenthese.prototype.resolvePriority = function () {
		if (typeof this.o === 'object') {
			this.o.resolvePriority();
		}
	};

	Parenthese.prototype.toString = function () {
		if (this.t === '(' && this.l) {
			return this.l + '(' +  this.o + ')';
		}
		if (this.t === '(') {
			return '<' +  this.o + '>';
		}
		if (this.t === '[') {
			return '[' +  this.o + ']';
		}
	};

	Parenthese.prototype.result = function (data, root) {
		if (typeof this.o === 'object') {
			return this.o.result(data, root);
		}
		return this.o;
	};


	function Expression(text) {
		this.expression = text;
		this.lastMatch = -1;
		this.currPos = -1;
	}

	Expression.prototype.addOperation = function (separator, operand) {
		this.lastMatch = this.currPos;
		if (this.operator && operand !== null) {
			this.operation = new Operation(this.operation, this.operator, operand);
		} else if (!this.operation &&  operand !== null) {
			this.operation = operand;
		}

		if (separator && separator.length === 1) {
			this.operator = separators.tokens[separator];
		} else if (separator) {
			this.operator = separators.strtokens[separator];
		} else {
			this.operator = null;
		}
	};

	Expression.prototype.parse = function (closeChar) {
		this.operator = null;
		this.operation = null;
		this.currPos += 1;
		while (this.currPos < this.expression.length) {
			var operand = this.expression.substring(this.lastMatch + 1, this.currPos).trim(),
				remaining = this.expression.substring(this.currPos + 1).trim(),
				separator = this.expression[this.currPos];
			if (separators.tokens.hasOwnProperty(separator)) {

				if (separator === ' ') {
					var str = remaining.substring(0, remaining.indexOf(' '));
					if (separators.strtokens.hasOwnProperty(str)) {
						this.currPos += str.length + 1;
						this.addOperation(str, operand);
					}
				} else if (separator === '(' || separator === '[') {
					var close = (separator === '[' ? ']':')'),
						exp = new Expression(remaining),
						operation = exp.parse(close);

					this.currPos += exp.currPos + 1;
					this.lastMatch = this.currPos;

					var parenthese = new Parenthese(operation, separator);
					if (separator === '[') {
						this.addOperation('[', operand);
						//parenthese = new Operation(operand,operators.predicate,parenthese);
					}
					this.addOperation(separator, parenthese);
					this.operator = null;
				} else if (separator === closeChar) {
					this.addOperation(null, operand);
					return this.operation;
				} else if (separator === '/') {
					if (remaining[0] === '/') {
						separator = '//';
						this.currPos += 1;
					}
					this.addOperation(separator, operand);
				} else {
					if (operand.trim()) {
						this.addOperation(separator, operand);
					} else {
						if (this.operation && !this.operator) {
							this.addOperation(separator, operand);
						} else if (separator !== '*') {
							var s = '', j;

							for (j = 0; j < this.currPos; j += 1) {s += ' '; }
							console.log(this.expression);
							console.log(s + '^');
							console.log(operand, separator, this.operation);
							throw new Error('Unexpected opeator "' + separator + '"');
						}
					}
				}
			}
			this.currPos += 1;
		}
		this.addOperation(null, this.expression.substring(this.lastMatch + 1).trim());

		if (typeof this.operation === 'object') {
			this.operation.resolvePriority();
		}
		return this.operation;
	};


    function castInt(value) {
		if (value instanceof Array) {
		    value = value[0];
		}
	    var i = parseInt(value);
	    if (isNaN(i) || i.toString() !== value.toString()) {
			throw new Error('value "' + value + '" is not a int')
		}
		return i;
    }

    function castBool(value) {
		if (value instanceof Array) {
		    return value.length;
		}
		return value;
    }


    function getInside(data, callback) {
		var i;
        if (data instanceof Array) {
            for (i = 0; i < data.length; i += 1) {
                if (data[i] instanceof Array) {
                    getInside(data[i], callback);
                } else {
                    callback(data[i]);
                }
            }
        } else {
            callback(data);
        }
    }

    function filterSet(set, filter, deep) {
		var results = [];
		if(filter === '*') {
		    getInside(set, function (o) {
				if (typeof o === 'object') {
				    for (k in o) {
						results.push(o[k]);
						if (deep && (typeof o[k] === 'object' || typeof o[k] === 'array')) {
						    results = results.concat(filterSet(o[k], filter, true));
						}
				    }
				}
		    });
		} else {
            getInside(set, function (o) {
                if (typeof o === 'object') {
                    if (filter in o) {
						//todo put in a function "add" and do it recursively
						if(o[filter] instanceof Array) {
			            	results = results.concat(o[filter]);
						} else {
			             	results.push(o[filter]);
						}
                    }
                    if (deep) { // return all match in tree
                        for (k in o) {
                            results = results.concat(filterSet(o[k], filter, true));
                        }
                    }
               }
            });
        }
        return results;
    }


    operators.add.operate = function (left, right) {
		return castInt(left) + castInt(right);
    };

    operators.substract.operate = function (left, right) {
		return castInt(left) - castInt(right);
    };

    operators.multiply.operate = function (left, right) {
		return castInt(left) * castInt(right);
    };

    operators.divide.operate = function (left, right) {
		return castInt(left) / castInt(right);
    };

    operators.modulo.operate = function (left, right) {
		return castInt(left) % castInt(right);
    };

    operators.equal.operate = function (left, right) {
		var i;
		if (left instanceof Array) {
	        for (i = 0; i < left.length; i += 1) {
				if (operators.equal.operate(left, right)) {
				    return true;
				}
		    }
		    return false;
		}

	    if (right instanceof Array) {
			for (i = 0; i < right.length; i += 1) {
			    if (operators.equal.operate(left, right)) {
					return true;
			    }
			}
			return false;
	    }
	    return left == right;
    };

    operators.union.operate = function (left, right) {
		return left.concat(right);
    };

    operators.child.operate = function (left, right, data, root) {
		if (typeof left === 'string' && left !== '') {
			left = filterSet(data, left, false);
		}
		if (!right) {
			return left;
		}

		if (left) {
			return filterSet(left, right, false);
		}
		return filterSet(root, right, false);
    };

    operators.deepChild.operate = function (left, right, data, root) {
		if (typeof left === 'string' && left !== '') {
			left = filterSet(data, left, false);
		}
		if (!right) {
			throw new Error('A path can not terminate with //');
		}

		if (left) {
			return filterSet(left, right, true);
		}
		return filterSet(root, right, true);
    };

    operators.predicate.operate = function (left, right, data, root) {
		var  result = [], e, i;
		if (typeof left === 'string' && left !== '') {
			left = filterSet(data, left, false);
		}
		if (!right) {
			throw new Error('Syntax error, content of [???]');
		}

		if (left) {
			if (typeof right.o === 'object') {
				for (i in left) {
					e = right.result(left[i], root);
					if (e && e.length) {
						result.push(left[i]);
					}
				}
			} else if (typeof right.o === 'string') {
				try {
					i = castInt(right.o);
					if (i in left) {
						result.push(left[i]);
					}
				} catch (err) {
					for (i in left) {
						e = operators.child.operate(left[i], right.o, data, root);
						if (e && e.length) {
							result.push(left[i]);
						}
					}
				}
			}
		}
		return result;
    };


    function values(set) {
		var data = [];
	
		getInside(set, function(o) {
		    if (typeof o === 'object') {
				for (k in o) {
				    data = data.concat(values(o[k]));
				}
		    } else {
				data.push(o);
		    }
		});

		return data;
    }



	
    /**** MAIN JPATH OBJECT DECLARATION ****/
    function JPath(data,root) {
		if (data instanceof JPath) {
			return data;
		}
        if (data instanceof Array) {
			for (var i in data) {
				this.push(data[i]);
			}
            //this.concat(data)
        } else if (data !== null) {
			this.push(data);
        }

        if (root instanceof Array) {
		    this.root = root;
		} else {
            if (root) {
            	this.root = [];
	 			this.root.push(root);
	 		} else {
				this.root = this;// this.root.concat(this);
			}
        }
    };
	JPath.prototype = new Array();

    JPath.prototype.q = function (path, callback) {
		if (!path) {
		    if(callback) {
				for (var i = 0; i < this.length; i += 1) {
				    callback(i, this[i]);
				}
		    }
			return this;
		}
		var results, i, operation = new Expression(path).parse();

		if (typeof operation === 'string') {
			results = filterSet(this, operation, false);
		} else {
			results = operation.result(this, this.root);
		}
	    if (callback) {
			for (i = 0; i < results.length; i += 1) {
			    callback(i, results[i]);
			}
	    }
		return new JPath(results);
        // return results;
    };

	JPath.prototype.query = JPath.prototype.q;

    JPath.prototype.count = function (path) {
        return this.query(path).length;
    };

    JPath.prototype.sum = function (path) {
    	var sum = 0;
        this.query(path, function(i, e) {
			sum += e;
    	});
   		return sum;
    };

    JPath.prototype.exists = function (path) {
        return this.query(path).length > 0;
    };

    JPath.prototype.valueOf = function(path) {
    	return values(this.query(path)).join();
    };

    JPath.prototype.copyOf = function(path) {
        return JSON.stringify(this.query(path).asArray());
    };

    JPath.prototype.asArray = function() {
		return this.slice(0);
    };

	//JPath.prototype.sort = function(path) {}
	//JPath.prototype.distinct = function(path) {}
	if(typeof(window) !== 'undefined') {
		window.Expression = Expression;
		window.JPath = JPath;
	}
	if(typeof(exports) !== 'undefined') {
		exports.Expression = Expression;
		exports.JPath = JPath;
	}

}());