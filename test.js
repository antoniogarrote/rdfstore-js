var rdfstore = require('./src/store');

rdfstore.create(function(err,store) {

    var insertQuery = 'PREFIX  foaf:  <http://xmlns.com/foaf/0.1/> \
                       PREFIX dcterms: <http://purl.org/dc/terms/> \
                       INSERT DATA { \
                         <http://example.org/> dcterms:contributor <http://example.org/c1>, _:c2 .\
                         <http://example.org/c1> foaf:name "Foo" .\
                         _:c2 foaf:name "Bar" \
                       }';
    store.execute(insertQuery, function(){
        var query = "PREFIX  foaf:  <http://xmlns.com/foaf/0.1/>\
                     PREFIX dcterms: <http://purl.org/dc/terms/> \
                     SELECT ?contributorName\
                     WHERE {\
                       <http://example.org/> dcterms:contributor ?contributorIRI .\
                       ?contributorIRI foaf:name ?contributorName \
                     }";
        store.execute(query, function (err, results) {
            for(var i=0; i<results.length; i++)
                console.log(results[i]['contributorName'].value);
        });
    });
});