#micrograph.js

Graph data layer for client JS applications.

    var mg = require('micrograph');

    mg.create(function(g) {
     	g.save([{$type: 'Person',
     		 name: 'Ludwig',
     		 surname: 'Wittgenstein',
     		 birthplace: 'Wien',
     	         author: [{$type: 'Book',
     			   title: 'Tractatus Logico-Philosophicus'},
     			  {$type: 'Book',
     			   title: 'Philosophical Investigations'}]},
     		{$type: 'Person',
     		 name: 'Karl',
     		 surname: 'Popper',
     		 author: {$type: 'Book',
     			  title: 'The Open Society and its Enemies'}}]).
     	    where({author$in: {surname: 'Wittgenstein'}}).
            removeNodes(function(removed) {
     		assert(removed === 2);
     	    }).
     	    where({author$in: {}}).
     	    all(function(authored){
     		assert(authored.length === 1);
     		assert(authored[0].title === 'The Open Society and its Enemies');
     		assert(authored[0].author$in.surname === "Popper");		
     	    });
        });