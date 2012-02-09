var MicrographQL = require("./../src/MicrographQL").MicrographQL;
var Micrograph = require("./../src/MicrographQL").Micrograph;
var mg = Micrograph;
var AbstractQueryTree = require("./../../js-sparql-parser/src/abstract_query_tree").AbstractQueryTree;

var sys = null;
try {
    sys = require("util");
} catch(e) {
    sys = require("sys");
}

var aqt = new AbstractQueryTree.AbstractQueryTree();

exports.bgp1 = function(test) {
    var pattern = MicrographQL.parseQuery({name: "john"});
    var parsedQuery = aqt.parseQueryString("SELECT ?id0 ?id0p ?id0o { ?id0 <name> \"john\" ; ?id0p ?id0o . }");
    test.ok(pattern.varsMap['id0'] === 'id0');
    test.ok(sys.inspect(pattern.query,true,20) == sys.inspect(parsedQuery,true,20));
    test.done();

};

exports.bgp2 = function(test) {
    MicrographQL.counter = 0;
    var pattern = MicrographQL.parseQuery({name: "john", friend: {name: "mary"}});

    var parsedQuery = aqt.parseQueryString("SELECT ?id0 ?id1 { ?id0 <name> \"john\" ; ?id0p ?id0o . ?id0 <friend> ?id1 . ?id1 <name> <mary> ; ?id1p ?id1o }");
    test.ok(pattern.varsMap['id0'] === 'id0');
    test.ok(pattern.varsMap['id1'] === 'id1');
    test.ok(pattern.query.units[0].pattern.patterns.length === parsedQuery.units[0].pattern.patterns.length);
    test.done();

};

exports.parseTriples1 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations'
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus'
	    }
	]
    };

    var result = MicrographQL.parseJSON(data);

    var bookCounter = 0;
    var books = {};
    var peopleCounter = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else if(node.$type === "Person") {
			peopleCounter++;
			test.ok(node.name="Ludwig");
			test.ok(node.surname = "Wittgenstein");
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(books["Philosophical Investigations"]);
		    test.ok(bookCounter == 2);
		    test.done();
		});
	});
    });
};


exports.bgpExecution1 = function(test) {
    mg.create(function(g) {
	g.execute("INSERT DATA { <http://rdfstore-js.org/micrographql/graph#obj1> <name> \"John\"; <name> \"Juan\"; <age> \"26\"^^<http://www.w3.org/2001/XMLSchema#float> ; <friend> <http://rdfstore-js.org/micrographql/graph#obj2> .\
                                 <http://rdfstore-js.org/micrographql/graph#obj2> <name> \"Mary\" ; <height> \"15\"^^<http://www.w3.org/2001/XMLSchema#float>.}",
		  function(success, result) {
		      var counter = 0;
		      g.where({name: "John", friend:{}}).
			  onError(function(reason) {
			      test.done();
			  }).
			  each(function(result) {
			      counter++;
			      test.ok(result.name.length === 2);
			      test.ok(result.age === 26);
			      result;
			  }).
			  execute(function(results) {
			      test.ok(results.length === 1);
			      test.ok(counter === 1);
			      test.done();
			  });
		  });
    });
};

exports.filters1 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$eq: 120}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};


exports.filters2 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$gt: 200}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Philosophical Investigations"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};


exports.filters3 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$lt: 200}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};


exports.filters4 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$neq: 320}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};

exports.filters5 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$lteq: 120}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};


exports.filters6 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$gteq: 320}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Philosophical Investigations"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};

exports.filters7 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({title: {$not: {$eq: "Philosophical Investigations"}}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(bookCounter == 1);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};

exports.filters8 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({title: {$like: /[a-z]*Philo[a-z]+/}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(books["Philosophical Investigations"]);
		    test.ok(bookCounter == 2);
		    test.ok(other == 0);
		    test.done();
		});
	});
    });
};

exports.filters9 = function(test) {
    var data = {
	$type: 'Person',
	name: 'Ludwig',
	surname: 'Wittgenstein',
	birthplace: 'Wien',
	authorOf: [
	    {
		$type: 'Book',
		title: 'Philosophical Investigations',
		pages: 320
	    },
	    {
		$type: 'Book',
		title: 'Tractatus Logico-Philosophicus',
		pages: 120
	    }
	]
    };

    var bookCounter = 0;
    var books = {};
    var other = 0;

    mg.create(function(g) {
	g.load(data,function(){
	    g.where({pages: {$and: [{$gt: 10}, {$lt: 1000}]}}).
		each(function(node) {
		    if(node.$type === "Book") {
			bookCounter++;
			books[node.title] = true;
		    } else {
			other++;
		    }
		}).
		onError(function(reason){
		    test.ok(false);
		}).
		execute(function(){
		    test.ok(books["Tractatus Logico-Philosophicus"]);
		    test.ok(books["Philosophical Investigations"]);
		    test.ok(bookCounter == 2);
		    test.ok(other == 0);
		    g.where({pages:{$and:[{$gt:1000},{$lt:10}]}}).
			execute(function(res) {
			    test.ok(res.length === 0);
			    test.done();
			});
		});
	});
    });
};


exports.limitOffset = function(test) {
    var data = [{a: 1},
		{a: 3},
		{a: 2},
		{a: 4},
		{a: 6},
		{a: 7},
		{a: 5},
		{a: 8}];

    mg.create(function(g) {
	g.load(data,function() {
	    g.where({}).order('a').offset(0).limit(2).
		execute(function(nodes){
		    test.ok(nodes[0].a === 1);
		    test.ok(nodes[1].a === 2);
		    test.ok(nodes.length === 2);

		    g.where({}).order('a').offset(2).limit(4).
			execute(function(nodes) {
			    test.ok(nodes[0].a === 3);
			    test.ok(nodes[1].a === 4);
			    test.ok(nodes[2].a === 5);
			    test.ok(nodes[3].a === 6);
			    test.ok(nodes.length === 4);
			    
			    test.done();
			});
		});
	});
    });
};