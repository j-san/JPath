(function() {
	console.log(JPath);
	var data = {
		hello: {
			bar: 'bar',
			baz: 'baz',
			foobar: {
				foo: 'foo1',
				bar: 'bar',
				baz: 'baz'
			}
		},
		a: [
			{ aa: 1 },
			{ aa: 2, ab: 3 },
			{ ac: 'a', ad: 'b', ae: 'c' },
			{
			    a: { p:'p', q:'q', r:'r', foo:'foo2' },
			    b: 'b', x: 'x'
			},
			{ c: 'c' }
		],
		b: [
			{ ba: [1,2,3,4,5,6] },
			{ ba: 2, bb: 3 },
			{ bc: 'a', bd: 'b', be: 'c' }
		],
		toto: { foo: 'foo3', fifi: 'fifi' }
	};

	var set = new JPath(data);
	var tests = new JPath({
		assertEquals:[
			{ path:'toto', expected:[{ foo: 'foo3', fifi: 'fifi' }],values:'foo3,fifi' },
			{ path:'toto/foo', expected:['foo3'], count:1, values:'foo3' },
			{ path:'/toto/foo', expected:['foo3'], count:1, values:'foo3' },
			{ path:'/toto/foo/', expected:['foo3'], count:1, values:'foo3' },
			{ path:'toto/foo/', expected:['foo3'], count:1, values:'foo3' },
			{ path:'a/aa', expected:[1,2], count:2, sum:3, values:'1,2' },
			{ path:'a/ab', expected:[3] , count:1, sum:3, values:'3'},
			{ path:'//foo/', expected:['foo1','foo2','foo3'] , count:3},
			{ path:'a/*', expected:[1,2,3,'a','b','c',{ p:'p', q:'q', r:'r', foo:'foo2' },'b','x','c'], count:10 },
			{ path:'a//*', expected:[1,2,3,'a','b','c',{ p:'p', q:'q', r:'r', foo:'foo2' },'p','q','r','foo2','b','x','c'] , count:14},
			{ path:'a/a/*', expected:['p','q','r','foo2'],values:'p,q,r,foo2' },
			//{ path:'//*', expected:[{"bar": "bar","baz": "baz","foobar": {"foo": "foo1","bar": "bar","baz": "baz"}},"bar","baz",{"foo": "foo1","bar": "bar","baz": "baz"},"foo1","bar","baz",[{"aa": 1},{"aa": 2,"ab": 3},{"ac": "a","ad": "b","ae": "c"},{"a": {"p": "p","q": "q","r": "r","foo": "foo2"},"b": "b","x": "x"},{"c": "c"}],1,2,3,"a","b","c",{"p": "p","q": "q","r": "r","foo": "foo2"},"p","q","r","foo2","b","x","c",{"foo": "foo3","fifi": "fifi"},"foo3","fifi"] },
 			{ path:'//foo/', expected:['foo1','foo2','foo3'] , count:3},
			{ path:'hello[bar]', expected:[{bar: 'bar',baz: 'baz',foobar: {foo: 'foo1',bar: 'bar',baz: 'baz'}}] , count:1},
			{ path:'a/a[p]', expected:[{ p:'p', q:'q', r:'r', foo:'foo2' }] , count:1},
			{ path:'hello[foobar/foo]', expected:[{bar: 'bar',baz: 'baz',foobar: {foo: 'foo1',bar: 'bar',baz: 'baz'}}] , count:1},
			{ path:'//hello[foobar/foo]', expected:[{bar: 'bar',baz: 'baz',foobar: {foo: 'foo1',bar: 'bar',baz: 'baz'}}] , count:1},
			//{ path:'//foo[.//foo]', expected:[] , count:0},
			{ path:'a/*[2]', expected:[3] , count:1},
			{ path:'a/a[0]', expected:[{ p:'p', q:'q', r:'r', foo:'foo2' }] , count:1},
			//{ path:'//foo[.//foo][1]', expected:[] , count:0},
			{ path:'a', expected:[{ aa: 1 },{ aa: 2, ab: 3 },{ ac: 'a', ad: 'b', ae: 'c' },{a: { p:'p', q:'q', r:'r', foo:'foo2' },b: 'b', x: 'x'},{ c: 'c' }] , count:5},
			{ path:'a[a]', expected:[{a: { p:'p', q:'q', r:'r', foo:'foo2' },b: 'b', x: 'x'}] , count:1},
			//{ path:'//a[//a][0]', expected:[{a: { p:'p', q:'q', r:'r', foo:'foo2' },b: 'b', x: 'x'}] , count:1},
			{ path:'a/*[2] + 2', expected:[5]}
		],
		assertErrors:[
			{ path:'toto//'},
			{ path:'//'}
		]
	});
	test("q(path) test", function() {
		expect(tests[0].assertEquals.length);
		tests.q('/assertEquals',function(i,test){
			var results = set.q(test.path);
			deepEqual(results.asArray(), test.expected, "set.q(" + test.path + ")");

		});

	});
	
  	test("count(path) test", function() {
		var c = 0;
		for(var i=0;i<tests[0].assertEquals.length;i++){
			if(tests[0].assertEquals[i].count){c++;}
		}
		expect(c*2);
		tests.q('/assertEquals[count]',function(i,test){
			equal(set.q(test.path).count(), test.count, "set.q(" + test.path + ").count()");
			equal(set.count(test.path), test.count, "set.count(" + test.path + ")");
		});
	});
	
  	test("valueOf(path) test", function() {
		var c = 0;
		for(var i=0;i<tests[0].assertEquals.length;i++){
			if(tests[0].assertEquals[i].values){c++;}
		}
		expect(c*2);
		tests.q('/assertEquals[values]',function(i,test){
			equal(set.q(test.path).valueOf(), test.values, "set.q(" + test.path + ").valueOf() return " + set.q(test.path).valueOf());
			equal(set.valueOf(test.path), test.values, "set.count(" + test.path + ") return " + set.valueOf(test.path));
		});
	});
	
  	test("sum(path) test", function() {
		var c = 0;
		for(var i=0;i<tests[0].assertEquals.length;i++){
			if(tests[0].assertEquals[i].sum){c++;}
		}
		expect(c*2);
		tests.q('/assertEquals[sum]',function(i,test){
			equal(set.q(test.path).sum(), test.sum, "set.q(" + test.path + ").sum() return " + set.q(test.path).sum());
			equal(set.sum(test.path), test.sum, "set.sum(" + test.path + ") return " + set.sum(test.path));
		});
	});
	
	test("raise test", function() {
		expect(tests[0].assertErrors.length);
		tests.q('/assertErrors',function(i,test){
			raises(function(){
				set.q(test.path);
			},"set.q(" + test.path + ") raise an error");
		});
	});


	test("basic expressions tests", function() {
	
	    var tests = [
		{exp:'1 + 2 + 3 + 4',result:10},
		{exp:'4 + 2 = 5',result:false},
		{exp:'4 + 2 = 6',result:true},
		{exp:'8 + 7 * 2',result:22},
		{exp:'8 * 7 + 2',result:58},
		{exp:'4 + 2 = 9 - 3',result:true},
		{exp:'1 + 2 = 5 - 2',result:true},
		{exp:'2 + 2 = 5',result:false},
		{exp:'4 + 6 div 3 + 8',result:14},
		{exp:'4 + 2 * 9 div 3 * 2',result:16}
	    ]
	    
	    for(var i=0;i < tests.length;i++){
			equal(set.q(tests[i].exp)[0], tests[i].result, tests[i].exp + ' => ' + tests[i].result + ' - ' + set.q(tests[i].exp));
	    }
	});
}());
