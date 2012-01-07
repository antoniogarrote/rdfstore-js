var raptor = require('./raptor.js');
var rdfstore = require('./rdfstore.js');
var fs = require('fs');

Utils = {};

Utils.recur = function(c){
    if(Utils.stackCounter === Utils.stackCounterLimit) {
        Utils.stackCounter = 0;
        setTimeout(c, 0);
    } else {
        Utils.stackCounter++;
        c();
    } 
};

Utils.repeat = function(c,max,floop,fend,env) {
    if(arguments.length===4) { env = {}; }
    if(c<max) {
        env._i = c;
        floop(function(floop,env){
            // avoid stack overflow
            // deadly hack
            Utils.recur(function(){ Utils.repeat(c+1, max, floop, fend, env) });
        },env);
    } else {
        fend(env);
    }
};

var grandTotal = 0;
var totalJSON = [];

var load = function(data, store, cb){
    var parser = raptor.newParser("rdfxml");
    var jsonld = "";
    var statements = {};
    var nextStatement;
    var counter = 0;

    var start = new Date().getTime();

    parser.on('statement', function(statement) {
        counter++;
        //console.log(statement.subject.value+" "+statement.predicate.value+" "+statement.object.value+" ");
        var obj = statements[statement.subject.value] || {'@context':{'@coerce':{'@iri':[]}},
                                                          '@subject': statement.subject.value};
        obj[statement.predicate.value] = obj[statement.predicate.value] || [];
        if(statement.object.type === "uri") {
            obj[statement.predicate.value].push(statement.object.value);
            var found = false;
            for(var i in obj['@context']['@coerce']['@iri']) {
                if(obj['@context']['@coerce']['@iri'][i] == statement.predicate.value) {
                    found = true;
                    break;
                }
            }
            if(!found)
                obj['@context']['@coerce']['@iri'].push(statement.predicate.value);
        } else {
            obj[statement.predicate.value].push(statement.object.value);
        }

        statements[statement.subject.value] = obj;
    });

    parser.on('end', function(){
        grandTotal = grandTotal + counter;
        var acum = [];
        for(var s in statements) {
            acum.push(statements[s]);
            totalJSON.push(statements[s]);
        }
        var end = new Date().getTime();
        var ellapsed = (end - start)/1000;
        start = end;

        console.log("PARSED "+counter+" TRIPLES IN "+ellapsed+" secs");
        store.load("application/json",acum,function(success, results) {
            var end = new Date().getTime();
            var ellapsed = (end - start)/1000;

            console.log("LOADED IN "+ellapsed+" secs");
            cb();
        });
    });

    //parser.parseStart(webidUri);
    parser.parseStart("http://test.com/something");
    parser.parseBuffer(new Buffer(data));
    parser.parseBuffer();
};

var check = function(data, store, cb){
    console.log("*** checking");
    var parser = raptor.newParser("rdfxml");

    parser.on('statement', function(statement) {
        var query = " { ";
        if(statement.subject.type === 'uri') {
	    query = query + " <"+statement.subject.value+">";
	} else {
	    query = query + " "+statement.subject.value+" ";
	}

	query = query + "<"+statement.predicate.value+">";

        if(statement.object.type === 'uri') {
	    query = query + " <"+statement.object.value+">";
	} else if(statement.object.type === 'literal') {
	    query = query + " \""+statement.object.value+"\"";
	} else {
	    query = query + " "+statement.object.value;
	}
	
	query = " select * "+query+" }";

	store.execute(query, function(success, res) {
	    if(success === false) {
		console.log("QUERY FAILED");
		console.log(query);
	    } else {
		if(res.length != 1) {
		    console.log("FOUND "+res.length+" results for query '"+query+"'");
		}else {
		    //console.log(".");
		}
	    } 
	});
    });

    parser.on('end', function(){
	console.log("===================\nFINISHED!");
	cb();
    });

    //parser.parseStart(webidUri);
    parser.parseStart("http://test.com/something");
    parser.parseBuffer(new Buffer(data));
    parser.parseBuffer();
};

var ontology = "http://test.com/something#";
var queries = {
    "query0": "SELECT * { ?s ?p ?o }",

    "query1":
    "PREFIX ub: <"+ontology+">\
     SELECT ?X { ?X a ub:GraduateStudent; ub:takesCourse <http://www.Department0.University0.edu/GraduateCourse0> }",
    
    "query2":
    "PREFIX ub: <"+ontology+">\
     SELECT ?X ?Y { ?Y a ub:University. ?Z a ub:Department .\
                    ?X a ub:GraduateStudent; ub:memberOf ?Z; ub:undergraduateDegreeFrom ?Y .\
                    ?Z ub:subOrganizationOf ?Y }",

    "query3":
    "PREFIX ub: <"+ontology+">\
     SELECT ?X { ?X a ub:Publication; ub:publicationAuthor <http://www.Department0.University0.edu/AssistantProfessor0> }",
 
    "query4":
    "SELECT ?x ?y1 ?y2 ?y3 WHERE {\
       {\
	?x <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <"+ontology+"FullProfessor> .\
	?x <"+ontology+"worksFor> <http://www.Department0.University0.edu> .\
	?x <"+ontology+"name> ?y1 .\
	?x <"+ontology+"emailAddress> ?y2 .\
	?x <"+ontology+"telephone> ?y3\
      }\
      UNION\
      {\
	?x <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <"+ontology+"AssociateProfessor> .\
	?x <"+ontology+"worksFor> <http://www.Department0.University0.edu> .\
	?x <"+ontology+"name> ?y1 .\
	?x <"+ontology+"emailAddress> ?y2 .\
	?x <"+ontology+"telephone> ?y3\
      }\
      UNION\
      {\
	?x <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <"+ontology+"AssistantProfessor> .\
	?x <"+ontology+"worksFor> <http://www.Department0.University0.edu> .\
	?x <"+ontology+"name> ?y1 .\
	?x <"+ontology+"emailAddress> ?y2 .\
	?x <"+ontology+"telephone> ?y3\
      }\
    }",

    "query5":
    "PREFIX ub: <"+ontology+">\
    select distinct * where \
    {\
       { ?x a ub:AssociateProfessor . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:FullProfessor . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:AssistantProfessor . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:Lecturer . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:UndergraduateStudent . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:GraduateStudent . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:TeachingAssistant . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:ResearchAssistant . ?x ub:memberOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:AssociateProfessor . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:FullProfessor . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:AssistantProfessor . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:Lecturer . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:UndergraduateStudent . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:GraduateStudent . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:TeachingAssistant . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:ResearchAssistant . ?x ub:worksFor <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:AssociateProfessor . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:FullProfessor . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:AssistantProfessor . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:Lecturer . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:UndergraduateStudent . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:GraduateStudent . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:TeachingAssistant . ?x ub:headOf <http://www.Department0.University0.edu> } UNION\
       { ?x a ub:ResearchAssistant . ?x ub:headOf <http://www.Department0.University0.edu> }\
    }",

    "query6":
    "prefix ub: <"+ontology+">\
     select distinct * where {\
       { ?x a ub:UndergraduateStudent . }\
       UNION\
       { ?x a ub:ResearchAssistant . }\
       UNION\
       { ?x a ub:GraduateStudent . }\
     }",

   "query7":
   "prefix ub: <"+ontology+">\
    select distinct * where\
    {\
    {  ?x a ub:UndergraduateStudent . ?y a ub:Course . <http://www.Department0.University0.edu/AssociateProfessor0> ub:teacherOf ?y . ?x ub:takesCourse ?y . }\
    UNION\
    {  ?x a ub:UndergraduateStudent . ?y a ub:GraduateCourse . <http://www.Department0.University0.edu/AssociateProfessor0> ub:teacherOf ?y . ?x ub:takesCourse ?y . }\
    UNION\
    {  ?x a ub:ResearchAssistant . ?y a ub:Course . <http://www.Department0.University0.edu/AssociateProfessor0> ub:teacherOf ?y . ?x ub:takesCourse ?y . }\
    UNION\
    {  ?x a ub:ResearchAssistant . ?y a ub:GraduateCourse . <http://www.Department0.University0.edu/AssociateProfessor0> ub:teacherOf ?y . ?x ub:takesCourse ?y . }\
    UNION\
    {  ?x a ub:GraduateStudent . ?y a ub:Course . <http://www.Department0.University0.edu/AssociateProfessor0> ub:teacherOf ?y . ?x ub:takesCourse ?y . }\
    UNION\
    {  ?x a ub:GraduateStudent . ?y a ub:GraduateCourse . <http://www.Department0.University0.edu/AssociateProfessor0> ub:teacherOf ?y . ?x ub:takesCourse ?y . }\
    }",

    "query8":
    "prefix ub: <"+ontology+">\
     select distinct * where\
     {\
      { ?x a ub:UndergraduateStudent . ?y a ub:Department . ?x ub:memberOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:UndergraduateStudent . ?y a ub:Department . ?x ub:worksFor ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:UndergraduateStudent . ?y a ub:Department . ?x ub:headOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:ResearchAssistant . ?y a ub:Department . ?x ub:memberOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:ResearchAssistant . ?y a ub:Department . ?x ub:worksFor ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:ResearchAssistant . ?y a ub:Department . ?x ub:headOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:GraduateStudent . ?y a ub:Department . ?x ub:memberOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:GraduateStudent . ?y a ub:Department . ?x ub:worksFor ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
       UNION\
      { ?x a ub:GraduateStudent . ?y a ub:Department . ?x ub:headOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . ?x ub:emailAddress ?z }\
     }",

//    "query9":
//    "prefix ub: <"+ontology+">\
//     select distinct * where\
//     {\
//       { ?x a ub:ResearchAssistant . ?y a ub:Lecturer . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:PostDoc . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:VisitingProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:AssistantProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:AssociateProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:FullProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:Lecturer . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:PostDoc . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:VisitingProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:AssistantProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:AssociateProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:ResearchAssistant . ?y a ub:FullProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:Lecturer . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:PostDoc . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:VisitingProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:AssistantProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:AssociateProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:FullProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:Lecturer . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:PostDoc . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:VisitingProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:AssistantProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:AssociateProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:UndergraduateStudent . ?y a ub:FullProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:Lecturer . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:PostDoc . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:VisitingProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:AssistantProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:AssociateProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:FullProfessor . ?z a ub:Course . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:Lecturer . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:PostDoc . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:VisitingProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:AssistantProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:AssociateProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . } UNION\
//       { ?x a ub:GraduateStudent . ?y a ub:FullProfessor . ?z a ub:GraduateCourse . ?x ub:advisor ?y . ?x ub:takesCourse ?z . ?y ub:teacherOf ?z . }\
//     }",

    "query10":
    "prefix ub: <"+ontology+">\
    select * where\
    {\
    { ?x a ub:ResearchAssistant . ?x ub:takesCourse <http://www.Department0.University0.edu/GraduateCourse0> . }\
    UNION\
    { ?x a ub:UndergraduateStudent . ?x ub:takesCourse <http://www.Department0.University0.edu/GraduateCourse0> . }\
    UNION\
    { ?x a ub:GraduateStudent . ?x ub:takesCourse <http://www.Department0.University0.edu/GraduateCourse0> . }\
    }",

    "query11":
    "prefix ub: <"+ontology+"> select * where { ?x a ub:ResearchGroup . ?x ub:subOrganizationOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . }",

    "query12":
    "prefix ub: <"+ontology+"> select * where\
     {\
       { ?x a ub:FullProfessor . ?y a ub:Department . ?x ub:headOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssistantProfessor . ?y a ub:Department . ?x ub:headOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssociateProfessor . ?y a ub:Department . ?x ub:headOf ?y . ?y ub:subOrganizationOf <http://www.University0.edu> . }\
     }",

    "query13":
    "prefix ub: <"+ontology+"> select * where\
     {\
       { ?x a ub:AssociateProfessor . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:FullProfessor . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssistantProfessor . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:Lecturer . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:UndergraduateStudent . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:GraduateStudent . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:TeachingAssistant . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:ResearchAssistant . ?x ub:doctoralDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssociateProfessor . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:FullProfessor . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssistantProfessor . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:Lecturer . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:UndergraduateStudent . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:GraduateStudent . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:TeachingAssistant . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:ResearchAssistant . ?x ub:mastersDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssociateProfessor . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:FullProfessor . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:AssistantProfessor . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:Lecturer . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:UndergraduateStudent . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:GraduateStudent . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:TeachingAssistant . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
       UNION\
       { ?x a ub:ResearchAssistant . ?x ub:undergraduateDegreeFrom <http://www.University0.edu> . }\
     }",

    "query14":
    "prefix ub: <"+ontology+"> select * where { ?x a ub:UndergraduateStudent . }"


};

rdfstore.create({engine:'mongodb', name:'test',overwrite:false},function(store){
    var files = fs.readdirSync("./data/");
    files = [files[0], files[1], files[2], files[3]];

    Utils.repeat(0, files.length, function(k,env){
	var floop = arguments.callee;
	console.log("*** LOADING FILE "+env._i);
	fs.readFile("./data/"+files[env._i],function(err,data){
	    if(err) 
		throw new Exception("ERROR!!");
     
	    load(data, store, function() { 
		check(data,store, function() {
		    k(floop,env);
		});
	    });
	});
    },
    function() {
        console.log("TOTAL TRIPLES LOADED "+grandTotal);
        console.log("==========================");

        //fs.writeFile("./json/data.json", JSON.stringify(totalJSON));

        var queryNames = [];
        for(var query in queries) {
            queryNames.push(query);
        }
	//queryNames = ["query1", "query3", "query4"];

	/*
        Utils.repeat(0, queryNames.length, function(kq, envq) {
            var qfloop = arguments.callee;
            var queryName = queryNames[envq._i];
            
            console.log(queryName);

            var start = new Date().getTime();
            console.log("QUERY");
            console.log(queries[queryName]);
            store.execute(queries[queryName], function(succ, results) {
                var end = new Date().getTime();
                var ellapsed = (end - start)/1000;

                if(succ) {
                    //for(var i=0; i<results.length; i++) {
                    //    console.log(results[i]);
                    //}
                    //console.log("==========================");
                    console.log(results.length);
                    console.log("ellpased: "+ellapsed);
                } else {
                    console.log("ERROR!");
                }

                kq(qfloop, envq);
            });
        }, function() {
            console.log("*** Finished");
        });
	*/

	process.exit(0);
    });
});
