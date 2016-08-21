/**
 * Created by antoniogarrote on 21/08/2016.
 */
var fs = require("fs");
/*
{
    "@context": {
    "@coerce": {
        "@iri": [
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
            "http://www.w3.org/2002/07/owl#imports"
        ]
    }
},
    "@subject": "http://test.com/something",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": [
    "http://www.w3.org/2002/07/owl#Ontology"
],
    "http://www.w3.org/2002/07/owl#imports": [
    "http://test.com/test"
]
}
*/

var triples = JSON.parse(fs.readFileSync("./lubm/browser/data.json").toString());

var converted = triples.map(function(triple){
    var toCoerceUris = triple["@context"]["@coerce"]["@iri"];
    triple["@id"] = triple["@subject"];
    for(var i=0; i<toCoerceUris.length; i++) {
        var toCoerce = toCoerceUris[i];
        var urls = triple[toCoerce];
        if(urls.constructor.name === "Array") {
            urls = urls.map(function(url){ return {"@id": url}});
            triple[toCoerce] = urls;
        } else {
            triple[toCoerce] = {"@id": urls};
        }
    }
    delete triple["@context"]["@coerce"];
    delete triple["@subject"];
    return triple;
});

fs.writeFileSync("./lubm/browser/converted_data.json", JSON.stringify(converted.slice(0,9000)));