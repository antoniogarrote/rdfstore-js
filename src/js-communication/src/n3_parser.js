/**
 *  This code is taken from the rdflib.js / Tabulator project
 *  Licensed under the MIT license
 * 
 *  See the tabulator project for more details.
 */
var TabulatorN3Parser = function() {
    var N3Parser = {};


    N3Parser.RDFSink_uniqueURI = function(){
	return "https://github.com/antoniogarrote/rdfstore-js/vocabulary/unique#";
    };

    N3Parser.graph = null;

    N3Parser.Util = {
	ArrayIndexOf: function(arr, item, i) {
            i || (i = 0);
            var length = arr.length;
            if (i < 0) i = length + i;
            for (; i < length; i++)
		if (arr[i] === item) return i;
            return -1;
	}
	
    };


    if (typeof N3Parser.Util.uri == "undefined") { N3Parser.Util.uri = {}; };

    N3Parser.Util.uri.join = function (given, base) {
	given = given || ""
	// if (typeof N3Parser.log.debug != 'undefined') N3Parser.log.debug("   URI given="+given+" base="+base)
	var baseHash = base.indexOf('#')
	if (baseHash > 0) base = base.slice(0, baseHash)
	if (given.length==0) return base // before chopping its filename off
	if (given.indexOf('#')==0) return base + given
	var colon = given.indexOf(':')
	if (colon >= 0) return given	// Absolute URI form overrides base URI
	var baseColon = base.indexOf(':')
	if (base == "") return given;
	if (baseColon < 0) {
            alert("Invalid base: "+ base + ' in join with ' +given);
            return given
	}
	var baseScheme = base.slice(0,baseColon+1)  // eg http:
	if (given.indexOf("//") == 0)     // Starts with //
	    return baseScheme + given;
	if (base.indexOf('//', baseColon)==baseColon+1) {  // Any hostpart?
	    var baseSingle = base.indexOf("/", baseColon+3)
	    if (baseSingle < 0) {
		if (base.length-baseColon-3 > 0) {
		    return base + "/" + given
		} else {
		    return baseScheme + given
		}
	    }
	} else {
	    var baseSingle = base.indexOf("/", baseColon+1)
	    if (baseSingle < 0) {
		if (base.length-baseColon-1 > 0) {
		    return base + "/" + given
		} else {
		    return baseScheme + given
		}
	    }
	}

	if (given.indexOf('/') == 0)	// starts with / but not //
	    return base.slice(0, baseSingle) + given
	
	var path = base.slice(baseSingle)
	var lastSlash = path.lastIndexOf("/")
	if (lastSlash <0) return baseScheme + given
	if ((lastSlash >=0) && (lastSlash < (path.length-1)))
	    path = path.slice(0, lastSlash+1) // Chop trailing filename from base
	
	path = path + given
	while (path.match(/[^\/]*\/\.\.\//)) // must apply to result of prev
	    path = path.replace( /[^\/]*\/\.\.\//, '') // ECMAscript spec 7.8.5
	path = path.replace( /\.\//g, '') // spec vague on escaping
	path = path.replace( /\/\.$/, '/' )
	return base.slice(0, baseSingle) + path
    }


    //ends
    // These are the classes corresponding to the RDF and N3 data models
    //
    // Designed to look like rdflib and cwm designs.
    //
    // Issues: Should the names start with RDF to make them
    //      unique as program-wide symbols?
    //
    // W3C open source licence 2005.
    //

    //	Symbol

    N3Parser.Empty = function() {
	return this;
    };

    N3Parser.Empty.prototype.termType = 'empty';
    N3Parser.Empty.prototype.toString = function () { return "()" };
    N3Parser.Empty.prototype.toQuads = function() {
	return {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'}
    };

    N3Parser.Symbol = function( uri ) {
	this.uri = uri;
	this.value = uri;   // -- why? -tim
	return this;
    }

    N3Parser.Symbol.prototype.termType = 'symbol';
    N3Parser.Symbol.prototype.toString = function () { return ("<" + this.uri + ">"); };
    N3Parser.Symbol.prototype.toQuads = function() {
	return {token:'uri', prefix:null, suffix:null, value:this.uri}
    };

    //  Some precalculated symbols
    N3Parser.Symbol.prototype.XSDboolean = new N3Parser.Symbol('http://www.w3.org/2001/XMLSchema#boolean');
    N3Parser.Symbol.prototype.XSDdecimal = new N3Parser.Symbol('http://www.w3.org/2001/XMLSchema#decimal');
    N3Parser.Symbol.prototype.XSDfloat = new N3Parser.Symbol('http://www.w3.org/2001/XMLSchema#float');
    N3Parser.Symbol.prototype.XSDinteger = new N3Parser.Symbol('http://www.w3.org/2001/XMLSchema#integer');
    N3Parser.Symbol.prototype.XSDdateTime = new N3Parser.Symbol('http://www.w3.org/2001/XMLSchema#dateTime');
    N3Parser.Symbol.prototype.integer = new N3Parser.Symbol('http://www.w3.org/2001/XMLSchema#integer'); // Used?

    //	Blank Node

    if (typeof N3Parser.NextId != 'undefined') {
	N3Parser.log.error('Attempt to re-zero existing blank node id counter at '+N3Parser.NextId);
    } else {
	N3Parser.NextId = 0;  // Global genid
    }
    N3Parser.NTAnonymousNodePrefix = "_:";

    N3Parser.BlankNode = function ( id ) {
	/*if (id)
    	  this.id = id;
	  else*/
	this.id = N3Parser.NextId++
	this.value = id ? id : this.id.toString();
	return this
    };

    N3Parser.BlankNode.prototype.termType = 'bnode';
    N3Parser.BlankNode.prototype.toString = function() {
	return N3Parser.NTAnonymousNodePrefix + this.id
    };
    N3Parser.BlankNode.prototype.toString = N3Parser.BlankNode.prototype.toNT;
    N3Parser.BlankNode.prototype.toQuads = function() {
	return {'blank': N3Parser.NTAnonymousNodePrefix + this.id};
    };

    //	Literal

    N3Parser.Literal = function (value, lang, datatype) {
	this.value = value
	if (lang == "" || lang == null) this.lang = undefined;
	else this.lang = lang;	  // string
	if (datatype == null) this.datatype = undefined;
	else this.datatype = datatype;  // term
	return this;
    }

    N3Parser.Literal.prototype.termType = 'literal'    
    N3Parser.Literal.prototype.toNT = function() {
	var str = this.value
	if (typeof str != 'string') {
            if (typeof str == 'number') return ''+str;
	    throw Error("Value of RDF literal is not string: "+str)
	}
	str = str.replace(/\\/g, '\\\\');  // escape backslashes
	str = str.replace(/\"/g, '\\"');    // escape quotes
	str = str.replace(/\n/g, '\\n');    // escape newlines
	str = '"' + str + '"'  //';
	
	if (this.datatype){
            str = str + '^^' + this.datatype.toNT()
	}
	if (this.lang) {
            str = str + "@" + this.lang;
	}
	return str;
    };

    N3Parser.Literal.prototype.toQuads = function() {
	var str = this.value
	if (typeof str != 'string') {
            if (typeof str == 'number') return ''+str;
	    throw Error("Value of RDF literal is not string: "+str)
	}
	str = str.replace(/\\/g, '\\\\');  // escape backslashes
	str = str.replace(/\"/g, '\\"');    // escape quotes
	str = str.replace(/\n/g, '\\n');    // escape newlines
	str = '"' + str + '"'  //';

	if (this.datatype){
            str = str + '^^<' + this.datatype.value + ">"
	}
	if (this.lang) {
            str = str + "@" + this.lang;
	}
	return {'literal':str};
    };

    N3Parser.Collection = function() {
	this.id = N3Parser.NextId++;  // Why need an id? For hashstring.
	this.elements = [];
	this.closed = false;
    };

    N3Parser.Collection.idCounter = 0;


    N3Parser.Collection.prototype.termType = 'collection';


    N3Parser.Collection.prototype.toNT = function() {
	return N3Parser.NTAnonymousNodePrefix + this.id
    };

    N3Parser.Collection.prototype.toQuads = function() {
	var acum = [];
	var subjectId = "_:list"+N3Parser.Collection.idCounter;
	N3Parser.Collection.idCounter++;
	var first = {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'};
	var rest = {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'};
	var nil = {'uri': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'};

	var subject;
	var nextSubject = {'blank': subjectId+"p"+i};
	for (var i=0; i<this.elements.length; i++) {
	    subject = nextSubject;
	    if(i<(this.elements.length-1)) {
		nextSubject = {'blank': subjectId+"p"+(i+1)};
	    } else {
		nextSubject = nil;
	    }
	    acum.push({'subject': subject,
		       'predicate': first,
		       'object': this.elements[i].toQuads(),
		       'graph': N3Parser.graph});
	    acum.push({'subject': subject,
		       'predicate': rest,
		       'object': nextSubject,
		       'graph': N3Parser.graph});

	}
	return acum;
    };


    N3Parser.Collection.prototype.append = function (el) {
	this.elements.push(el)
    }
    N3Parser.Collection.prototype.unshift=function(el){
	this.elements.unshift(el);
    }
    N3Parser.Collection.prototype.shift=function(){
	return this.elements.shift();
    }
    
    N3Parser.Collection.prototype.close = function () {
	this.closed = true
    }


    //      Convert Javascript representation to RDF term object
    //
    N3Parser.term = function(val) {
	if (typeof val == 'object')
            if (val instanceof Date) {
		var d2=function(x) {return(''+(100+x)).slice(1,3)};  // format as just two digits
		return new N3Parser.Literal(
                    ''+ val.getUTCFullYear() + '-'+
			d2(val.getUTCMonth()+1) +'-'+d2(val.getUTCDate())+
			'T'+d2(val.getUTCHours())+':'+d2(val.getUTCMinutes())+
			':'+d2(val.getUTCSeconds())+'Z',
		    undefined, N3Parser.Symbol.prototype.XSDdateTime);

            }
        else if (val instanceof Array) {
            var x = new N3Parser.Collection();
            for (var i=0; i<val.length; i++) x.append(N3Parser.term(val[i]));
            return x;
        }
        else return val;
	if (typeof val == 'string') return new N3Parser.Literal(val);
	if (typeof val == 'number') {
            var dt;
            if ((''+val).indexOf('e')>=0) dt = N3Parser.Symbol.prototype.XSDfloat;
            else if ((''+val).indexOf('.')>=0) dt = N3Parser.Symbol.prototype.XSDdecimal;
            else dt = N3Parser.Symbol.prototype.XSDinteger;
            return new N3Parser.Literal(val, undefined, dt);
	}
	if (typeof val == 'boolean') return new N3Parser.Literal(val?"1":"0", undefined, 
							     N3Parser.Symbol.prototype.XSDboolean);
	if (typeof val == 'undefined') return undefined;
	throw ("Can't make term from " + val + " of type " + typeof val);
    }

    //	Statement
    //
    //  This is a triple with an optional reason.
    //
    //   The reason can point to provenece or inference
    //

    N3Parser.Statement = function(subject, predicate, object, why) {
	this.subject = N3Parser.term(subject)
	this.predicate = N3Parser.term(predicate)
	this.object = N3Parser.term(object)
	if (typeof why !='undefined') {
            this.why = why;
	}
	return this;
    }

    N3Parser.st= function(subject, predicate, object, why) {
	return new N3Parser.Statement(subject, predicate, object, why);
    };


    N3Parser.Statement.prototype.toNT = function() {
	return (this.subject.toNT() + " "
		+ this.predicate.toNT() + " "
		+  this.object.toNT() +" .");
    };

    N3Parser.Statement.prototype.toQuads = function() {
	var object = this.object.toQuads();
	if(object.constructor === Array) {
	    var nextObject = object[0].subject;
	    object.push({'subject': this.subject.toQuads(),
			 'predicate': this.predicate.toQuads(),
			 'object': nextObject,
			 'graph': N3Parser.graph});

	    return object;
	} else {
	    return {'subject': this.subject.toQuads(),
		    'predicate': this.predicate.toQuads(),
		    'object': this.object.toQuads(),
		    'graph': N3Parser.graph};
	}
    };

    //	Formula
    //
    //	Set of statements.

    N3Parser.Formula = function() {
	this.statements = []
	return this;
    };


    N3Parser.Formula.prototype.termType = 'formula';

    N3Parser.Formula.prototype.toNT = function() {
	return "{" + this.statements.join('\n') + "}"
    };
    N3Parser.Formula.prototype.toQuads = function() {
	var acum = [];
	for(var i=0; i<this.statements.length; i++) {
	    var nextValue = this.statements[i].toQuads();
	    if(nextValue.constructor === Array)
		acum = acum.concat(nextValue);
	    else
		acum.push(nextValue);
	}

	return acum;
    };

    N3Parser.Formula.prototype.add = function(subj, pred, obj, why) {
	this.statements.push(new N3Parser.Statement(subj, pred, obj, why))
    }

    // Convenience methods on a formula allow the creation of new RDF terms:

    N3Parser.Formula.prototype.sym = function(uri,name) {
	return new N3Parser.Symbol(uri)
    }

    N3Parser.sym = function(uri) { return new N3Parser.Symbol(uri); };

    N3Parser.Formula.prototype.literal = function(val, lang, dt) {
	if(dt != null && dt.value != null && dt.value.indexOf("http://") === -1) {
	    for(var ns in this.namespaces) {
		if(dt.value.indexOf(ns) === 0) {
		    dt.value = this.namespaces[ns]+(dt.value.split(ns+":")[1]);
		    break;
		}
	    }
	}
	return new N3Parser.Literal(''+val, lang, dt)
    }
    N3Parser.lit = N3Parser.Formula.prototype.literal;

    N3Parser.Formula.prototype.bnode = function(id) {
	return new N3Parser.BlankNode(id)
    }

    N3Parser.Formula.prototype.formula = function() {
	return new N3Parser.Formula()
    }

    N3Parser.Formula.prototype.collection = function () { // obsolete
	return new N3Parser.Collection()
    }

    N3Parser.Formula.prototype.list = function (values) {
	li = new N3Parser.Collection();
	if (values) {
            for(var i = 0; i<values.length; i++) {
		li.append(values[i]);
            }
	}
	return li;
    }


    // Convenience - and more conventional name:

    N3Parser.Graph = function(){return new N3Parser.IndexedFormula();};

    // ends
    // Matching a statement against a formula
    //
    //
    // W3C open source licence 2005.
    //
    // We retpresent a set as an associative array whose value for
    // each member is set to true.




    //  Convenience routines

    N3Parser.N3Parser = function () {

	function hexify(str) { // also used in parser
	    return encodeURI(str);
	}

	var Utf8 = {

	    // public method for url encoding
	    encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

		    var c = string.charCodeAt(n);

		    if (c < 128) {
			utftext += String.fromCharCode(c);
		    }
		    else if((c > 127) && (c < 2048)) {
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		    }
		    else {
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		    }

		}

		return utftext;
	    },

	    // public method for url decoding
	    decode : function (utftext) {
		var string = "";
		var i = 0;

		while ( i < utftext.length ) {

                    var c = utftext.charCodeAt(i);
                    if (c < 128) {
                        string += String.fromCharCode(c);
                        i++;
                    }
                    else if((c > 191) && (c < 224)) {
                        string += String.fromCharCode(((c & 31) << 6)
						      | (utftext.charCodeAt(i+1) & 63));
                        i += 2;
                    }
                    else {
                        string += String.fromCharCode(((c & 15) << 12)
						      | ((utftext.charCodeAt(i+1) & 63) << 6)
						      | (utftext.charCodeAt(i+2) & 63));
                        i += 3;
                    }
		}
		return string;
	    }

	}// Things we need to define to make converted pythn code work in js
	// environment of N3Parser

	var RDFSink_forSomeSym = "http://www.w3.org/2000/10/swap/log#forSome";
	var RDFSink_forAllSym = "http://www.w3.org/2000/10/swap/log#forAll";
	var Logic_NS = "http://www.w3.org/2000/10/swap/log#";

	//  pyjs seems to reference runtime library which I didn't find

	var pyjslib_Tuple = function(theList) { return theList };

	var pyjslib_List = function(theList) { return theList };

	var pyjslib_Dict = function(listOfPairs) {
	    if (listOfPairs.length > 0)
		throw "missing.js: oops nnonempty dict not imp";
	    return [];
	}

	var pyjslib_len = function(s) { return s.length }

	var pyjslib_slice = function(str, i, j) {
	    if (typeof str.slice == 'undefined')
		throw '@@ mising.js: No .slice function for '+str+' of type '+(typeof str) 
	    if ((typeof j == 'undefined') || (j ==null)) return str.slice(i);
	    return str.slice(i, j) // @ exactly the same spec?
	}
	var StopIteration = Error('dummy error stop iteration');

	var pyjslib_Iterator = function(theList) {
	    this.last = 0;
	    this.li = theList;
	    this.next = function() {
		if (this.last == this.li.length) throw StopIteration;
		return this.li[this.last++];
	    }
	    return this;
	};

	var ord = function(str) {
	    return str.charCodeAt(0)
	}

	var string_find = function(str, s) {
	    return str.indexOf(s)
	}

	var assertFudge = function(condition, desc) {
	    if (condition) return;
	    if (desc) throw "python Assertion failed: "+desc;
	    throw "(python) Assertion failed.";  
	}


	var stringFromCharCode = function(uesc) {
	    return String.fromCharCode(uesc);
	}


	String.prototype.encode = function(encoding) {
	    if (encoding != 'utf-8') throw "UTF8_converter: can only do utf-8"
	    return Utf8.encode(this);
	}
	String.prototype.decode = function(encoding) {
	    if (encoding != 'utf-8') throw "UTF8_converter: can only do utf-8"
	    //return Utf8.decode(this);
	    return this;
	}



	var uripath_join = function(base, given) {
	    return N3Parser.Util.uri.join(given, base)  // sad but true
	}

	var becauseSubexpression = null; // No reason needed
	var diag_tracking = 0;
	var diag_chatty_flag = 0;
	var diag_progress = function(str) { /*N3Parser.log.debug(str);*/ }

	// why_BecauseOfData = function(doc, reason) { return doc };


	var RDF_type_URI = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
	var DAML_sameAs_URI = "http://www.w3.org/2002/07/owl#sameAs";

	/*
	  function SyntaxError(details) {
	  return new __SyntaxError(details);
	  }
	*/

	function __SyntaxError(details) {
	    this.details = details
	}

	/*

	  $Id: n3parser.js 14561 2008-02-23 06:37:26Z kennyluck $

	  HAND EDITED FOR CONVERSION TO JAVASCRIPT

	  This module implements a Nptation3 parser, and the final
	  part of a notation3 serializer.

	  See also:

	  Notation 3
	  http://www.w3.org/DesignIssues/Notation3

	  Closed World Machine - and RDF Processor
	  http://www.w3.org/2000/10/swap/cwm

	  To DO: See also "@@" in comments

	  - Clean up interfaces
	  ______________________________________________

	  Module originally by Dan Connolly, includeing notation3
	  parser and RDF generator. TimBL added RDF stream model
	  and N3 generation, replaced stream model with use
	  of common store/formula API.  Yosi Scharf developped
	  the module, including tests and test harness.

	*/

	var ADDED_HASH = "#";
	var LOG_implies_URI = "http://www.w3.org/2000/10/swap/log#implies";
	var INTEGER_DATATYPE = "http://www.w3.org/2001/XMLSchema#integer";
	var FLOAT_DATATYPE = "http://www.w3.org/2001/XMLSchema#double";
	var DECIMAL_DATATYPE = "http://www.w3.org/2001/XMLSchema#decimal";
	var BOOLEAN_DATATYPE = "http://www.w3.org/2001/XMLSchema#boolean";
	var option_noregen = 0;
	var _notQNameChars = "\t\r\n !\"#$%&'()*.,+/;<=>?@[\\]^`{|}~";
	var _notNameChars =  ( _notQNameChars + ":" ) ;
	var _rdfns = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
	var N3CommentCharacter = "#";
	var eol = new RegExp("^[ \\t]*(#[^\\n]*)?\\r?\\n", 'g');
	var eof = new RegExp("^[ \\t]*(#[^\\n]*)?$", 'g');
	var ws = new RegExp("^[ \\t]*", 'g');
	var signed_integer = new RegExp("^[-+]?[0-9]+", 'g');
	var number_syntax = new RegExp("^([-+]?[0-9]+)(\\.[0-9]+)?(e[-+]?[0-9]+)?", 'g');
	var digitstring = new RegExp("^[0-9]+", 'g');
	var interesting = new RegExp("[\\\\\\r\\n\\\"]", 'g');
	var langcode = new RegExp("^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)?", 'g');
	function SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why) {
	    return new __SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why);
	}
	function __SinkParser(store, openFormula, thisDoc, baseURI, genPrefix, metaURI, flags, why) {
	    if (typeof openFormula == 'undefined') openFormula=null;
	    if (typeof thisDoc == 'undefined') thisDoc="";
	    if (typeof baseURI == 'undefined') baseURI=null;
	    if (typeof genPrefix == 'undefined') genPrefix="";
	    if (typeof metaURI == 'undefined') metaURI=null;
	    if (typeof flags == 'undefined') flags="";
	    if (typeof why == 'undefined') why=null;
	    /*
	      note: namespace names should *not* end in #;
	      the # will get added during qname processing */
	    
	    this._bindings = new pyjslib_Dict([]);
	    this._flags = flags;
	    if (thisDoc && (thisDoc != "")) {
		assertFudge((thisDoc.indexOf(":") >= 0),  ( "Document URI not absolute: " + thisDoc ) );
		this._bindings[""] = (  ( thisDoc + "#" ) );
	    }
	    this._store = store;
	    if (genPrefix) {
		store.setGenPrefix(genPrefix);
	    }
	    this._thisDoc = thisDoc;
	    this.source = store.sym(thisDoc);
	    this.lines = 0;
	    this.statementCount = 0;
	    this.startOfLine = 0;
	    this.previousLine = 0;
	    this._genPrefix = genPrefix;
	    this.keywords = new pyjslib_List(["a", "this", "bind", "has", "is", "of", "true", "false"]);
	    this.keywordsSet = 0;
	    this._anonymousNodes = new pyjslib_Dict([]);
	    this._variables = new pyjslib_Dict([]);
	    this._parentVariables = new pyjslib_Dict([]);
	    this._reason = why;
	    this._reason2 = null;
	    if (diag_tracking) {
		this._reason2 = why_BecauseOfData(store.sym(thisDoc), this._reason);
	    }
	    if (baseURI) {
		this._baseURI = baseURI;
	    }
	    else {
		if (thisDoc) {
		    this._baseURI = thisDoc;
		}
		else {
		    this._baseURI = null;
		}
	    }
	    assertFudge(!(this._baseURI) || (this._baseURI.indexOf(":") >= 0));
	    if (!(this._genPrefix)) {
		if (this._thisDoc) {
		    this._genPrefix =  ( this._thisDoc + "#_g" ) ;
		}
		else {
		    this._genPrefix = N3Parser.RDFSink_uniqueURI();
		}
	    }
	    if ((openFormula == null)) {
		if (this._thisDoc) {
		    this._formula = store.formula( ( thisDoc + "#_formula" ) );
		}
		else {
		    this._formula = store.formula();
		}
	    }
	    else {
		this._formula = openFormula;
	    }
	    this._context = this._formula;
	    this._parentContext = null;
	}
	__SinkParser.prototype.here = function(i) {
	    return  (  (  (  ( this._genPrefix + "_L" )  + this.lines )  + "C" )  +  (  ( i - this.startOfLine )  + 1 )  ) ;
	};
	__SinkParser.prototype.formula = function() {
	    return this._formula;
	};
	__SinkParser.prototype.loadStream = function(stream) {
	    return this.loadBuf(stream.read());
	};
	__SinkParser.prototype.loadBuf = function(buf) {
	    /*
	      Parses a buffer and returns its top level formula*/
	    
	    this.startDoc();
	    this.feed(buf);
	    return this.endDoc();
	};
	__SinkParser.prototype.feed = function(octets) {
	    /*
	     Feed an octet stream tothe parser
	     
	     if BadSyntax is raised, the string
	     passed in the exception object is the
	     remainder after any statements have been parsed.
	     So if there is more data to feed to the
	     parser, it should be straightforward to recover.*/
	    
	    var str = octets.decode("utf-8");

	    var chunks = []
	    var size = str.length;
	    var init = 0;
	    var chunkSize = 512*1024;
	    numChunks = size / chunkSize;
	    for(var i=0; i<numChunks+1; i++) {
		if(init+chunkSize < size)
		    chunks.push(str.substring(init, init+chunkSize));
		else
		    chunks.push(str.substring(init, size));

		init = init+chunkSize;
	    }
	    var currentChunk = 0;
	    var i = 0;
	    while ((i >= 0)) {
		var j = this.skipSpace(chunks[currentChunk], i);
		if ((j < 0)) {
		    if(currentChunk == (chunks.length-1)) {
			return;
		    } else {
			currentChunk++;
			i=0;
		    }
		} else {
		    var i = j;
		    try {
			i = this.directiveOrStatement(chunks[currentChunk], j);	
		    } catch(e) {
			if(currentChunk == (chunks.length-1))
			    throw e
			j = i;
			i = -1;
		    }
		    if ((i < 0)) {
			var remainingEnd  = chunks[currentChunk].substring(j,chunks[currentChunk].length);
			currentChunk++;
			chunks[currentChunk] = remainingEnd+chunks[currentChunk];
			i = 0;
		    }
		}
	    }
	};
	__SinkParser.prototype.directiveOrStatement = function(str, h) {
	    var i = this.skipSpace(str, h);
	    if ((i < 0)) {
		return i;
	    }
	    var j = this.directive(str, i);
	    if ((j >= 0)) {
		return this.checkDot(str, j);
	    }
	    var j = this.statement(str, i);
	    if ((j >= 0)) {
		return this.checkDot(str, j);
	    }
	    return j;
	};
	__SinkParser.prototype.tok = function(tok, str, i) {
	    /*
	      Check for keyword.  Space must have been stripped on entry and
	      we must not be at end of file.*/
	    var whitespace = "\t\n\v\f\r ";
	    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "@")) {
		var i =  ( i + 1 ) ;
	    }
	    else {
		if ((N3Parser.Util.ArrayIndexOf(this.keywords,tok) < 0)) {
		    return -1;
		}
	    }
	    var k =  ( i + pyjslib_len(tok) ) ;
	    if ((pyjslib_slice(str, i, k) == tok) && (_notQNameChars.indexOf(str.charAt(k)) >= 0)) {
		return k;
	    }
	    else {
		return -1;
	    }
	};
	__SinkParser.prototype.directive = function(str, i) {
	    var j = this.skipSpace(str, i);
	    if ((j < 0)) {
		return j;
	    }
	    var res = new pyjslib_List([]);
	    var j = this.tok("bind", str, i);
	    if ((j > 0)) {
		throw BadSyntax(this._thisDoc, this.lines, str, i, "keyword bind is obsolete: use @prefix");
	    }
	    var j = this.tok("keywords", str, i);
	    if ((j > 0)) {
		var i = this.commaSeparatedList(str, j, res, false);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "'@keywords' needs comma separated list of words");
		}
		this.setKeywords(pyjslib_slice(res, null, null));
		if ((diag_chatty_flag > 80)) {
		    diag_progress("Keywords ", this.keywords);
		}
		return i;
	    }
	    var j = this.tok("forAll", str, i);
	    if ((j > 0)) {
		var i = this.commaSeparatedList(str, j, res, true);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad variable list after @forAll");
		}
		
		var __x = new pyjslib_Iterator(res);
		try {
		    while (true) {
			var x = __x.next();
			
			
			if (N3Parser.Util.ArrayIndexOf(this._variables,x) < 0 || (N3Parser.Util.ArrayIndexOf(this._parentVariables,x) >= 0)) {
			    this._variables[x] = ( this._context.newUniversal(x));
			}
			
		    }
		} catch (e) {
		    if (e != StopIteration) {
			throw e;
		    }
		}
		
		return i;
	    }
	    var j = this.tok("forSome", str, i);
	    if ((j > 0)) {
		var i = this.commaSeparatedList(str, j, res, this.uri_ref2);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad variable list after @forSome");
		}
		
		var __x = new pyjslib_Iterator(res);
		try {
		    while (true) {
			var x = __x.next();
			
			
			this._context.declareExistential(x);
			
		    }
		} catch (e) {
		    if (e != StopIteration) {
			throw e;
		    }
		}
		
		return i;
	    }
	    var j = this.tok("prefix", str, i);
	    if ((j >= 0)) {
		var t = new pyjslib_List([]);
		var i = this.qname(str, j, t);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected qname after @prefix");
		}
		var j = this.uri_ref2(str, i, t);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected <uriref> after @prefix _qname_");
		}
		var ns = t[1].uri;
		if (this._baseURI) {
		    var ns = uripath_join(this._baseURI, ns);
		}
		else {
		    assertFudge((ns.indexOf(":") >= 0), "With no base URI, cannot handle relative URI for NS");
		}
		assertFudge((ns.indexOf(":") >= 0));
		this._bindings[t[0][0]] = ( ns);
		
		this.bind(t[0][0], hexify(ns));
		return j;
	    }
	    var j = this.tok("base", str, i);
	    if ((j >= 0)) {
		var t = new pyjslib_List([]);
		var i = this.uri_ref2(str, j, t);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected <uri> after @base ");
		}
		var ns = t[0].uri;
		if (this._baseURI) {
		    var ns = uripath_join(this._baseURI, ns);
		}
		else {
		    throw BadSyntax(this._thisDoc, this.lines, str, j,  (  ( "With no previous base URI, cannot use relative URI in @base  <" + ns )  + ">" ) );
		}
		assertFudge((ns.indexOf(":") >= 0));
		this._baseURI = ns;
		return i;
	    }
	    return -1;
	};
	__SinkParser.prototype.bind = function(qn, uri) {
            this._store.setPrefixForURI(qn, uri);

	    if ((qn == "")) {
	    }
	    else {
		this._store.setPrefixForURI(qn, uri);
	    }
	};
	__SinkParser.prototype.setKeywords = function(k) {
	    /*
	      Takes a list of strings*/
	    
	    if ((k == null)) {
		this.keywordsSet = 0;
	    }
	    else {
		this.keywords = k;
		this.keywordsSet = 1;
	    }
	};
	__SinkParser.prototype.startDoc = function() {
	};
	__SinkParser.prototype.endDoc = function() {
	    /*
	      Signal end of document and stop parsing. returns formula*/
	    
	    return this._formula;
	};
	__SinkParser.prototype.makeStatement = function(quad) {
	    quad[0].add(quad[2], quad[1], quad[3], this.source);
	    this.statementCount += 1;
	};
	__SinkParser.prototype.statement = function(str, i) {
	    var r = new pyjslib_List([]);
	    var i = this.object(str, i, r);
	    if ((i < 0)) {
		return i;
	    }
	    var j = this.property_list(str, i, r[0]);
	    if ((j < 0)) {
		throw BadSyntax(this._thisDoc, this.lines, str, i, "expected propertylist");
	    }
	    return j;
	};
	__SinkParser.prototype.subject = function(str, i, res) {
	    return this.item(str, i, res);
	};
	__SinkParser.prototype.verb = function(str, i, res) {
	    /*
	      has _prop_
	      is _prop_ of
	      a
	      =
	      _prop_
	      >- prop ->
	      <- prop -<
	      _operator_*/
	    
	    var j = this.skipSpace(str, i);
	    if ((j < 0)) {
		return j;
	    }
	    var r = new pyjslib_List([]);
	    var j = this.tok("has", str, i);
	    if ((j >= 0)) {
		var i = this.prop(str, j, r);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected property after 'has'");
		}
		res.push(new pyjslib_Tuple(["->", r[0]]));
		return i;
	    }
	    var j = this.tok("is", str, i);
	    if ((j >= 0)) {
		var i = this.prop(str, j, r);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected <property> after 'is'");
		}
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "End of file found, expected property after 'is'");
		}
		var i = j;
		var j = this.tok("of", str, i);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected 'of' after 'is' <prop>");
		}
		res.push(new pyjslib_Tuple(["<-", r[0]]));
		return j;
	    }
	    var j = this.tok("a", str, i);
	    if ((j >= 0)) {
		res.push(new pyjslib_Tuple(["->", this._store.sym(RDF_type_URI)]));
		return j;
	    }
	    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == "<=")) {
		res.push(new pyjslib_Tuple(["<-", this._store.sym( ( Logic_NS + "implies" ) )]));
		return  ( i + 2 ) ;
	    }
	    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "=")) {
		if ((pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) ) == ">")) {
		    res.push(new pyjslib_Tuple(["->", this._store.sym( ( Logic_NS + "implies" ) )]));
		    return  ( i + 2 ) ;
		}
		res.push(new pyjslib_Tuple(["->", this._store.sym(DAML_sameAs_URI)]));
		return  ( i + 1 ) ;
	    }
	    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == ":=")) {
		res.push(new pyjslib_Tuple(["->",  ( Logic_NS + "becomes" ) ]));
		return  ( i + 2 ) ;
	    }
	    var j = this.prop(str, i, r);
	    if ((j >= 0)) {
		res.push(new pyjslib_Tuple(["->", r[0]]));
		return j;
	    }
	    if ((pyjslib_slice(str, i,  ( i + 2 ) ) == ">-") || (pyjslib_slice(str, i,  ( i + 2 ) ) == "<-")) {
		throw BadSyntax(this._thisDoc, this.lines, str, j, ">- ... -> syntax is obsolete.");
	    }
	    return -1;
	};
	__SinkParser.prototype.prop = function(str, i, res) {
	    return this.item(str, i, res);
	};
	__SinkParser.prototype.item = function(str, i, res) {
	    return this.path(str, i, res);
	};
	__SinkParser.prototype.blankNode = function(uri) {
	    return this._context.bnode(uri, this._reason2);
	};
	__SinkParser.prototype.path = function(str, i, res) {
	    /*
	      Parse the path production.
	    */
	    
	    var j = this.nodeOrLiteral(str, i, res);
	    if ((j < 0)) {
		return j;
	    }
	    while (("!^.".indexOf(pyjslib_slice(str, j,  ( j + 1 ) )) >= 0)) {
		var ch = pyjslib_slice(str, j,  ( j + 1 ) );
		if ((ch == ".")) {
		    var ahead = pyjslib_slice(str,  ( j + 1 ) ,  ( j + 2 ) );
		    if (!(ahead) || (_notNameChars.indexOf(ahead) >= 0) && (":?<[{(".indexOf(ahead) < 0)) {
			break;
		    }
		}
		var subj = res.pop();
		var obj = this.blankNode(this.here(j));
		var j = this.node(str,  ( j + 1 ) , res);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found in middle of path syntax");
		}
		var pred = res.pop();
		if ((ch == "^")) {
		    this.makeStatement(new pyjslib_Tuple([this._context, pred, obj, subj]));
		}
		else {
		    this.makeStatement(new pyjslib_Tuple([this._context, pred, subj, obj]));
		}
		res.push(obj);
	    }
	    return j;
	};
	__SinkParser.prototype.anonymousNode = function(ln) {
	    /*
	      Remember or generate a term for one of these _: anonymous nodes*/
	    
	    var term = this._anonymousNodes[ln];
	    if (term) {
		return term;
	    }
	    var term = this._store.bnode(this._context, this._reason2);
	    this._anonymousNodes[ln] = ( term);
	    return term;
	};
	__SinkParser.prototype.node = function(str, i, res, subjectAlready) {
	    if (typeof subjectAlready == 'undefined') subjectAlready=null;
	    /*
	      Parse the <node> production.
	      Space is now skipped once at the beginning
	      instead of in multipe calls to self.skipSpace().
	    */
	    
	    var subj = subjectAlready;
	    var j = this.skipSpace(str, i);
	    if ((j < 0)) {
		return j;
	    }
	    var i = j;
	    var ch = pyjslib_slice(str, i,  ( i + 1 ) );
	    if ((ch == "[")) {
		var bnodeID = this.here(i);
		var j = this.skipSpace(str,  ( i + 1 ) );
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF after '['");
		}
		if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "=")) {
		    var i =  ( j + 1 ) ;
		    var objs = new pyjslib_List([]);
		    var j = this.objectList(str, i, objs);
		    
		    if ((j >= 0)) {
			var subj = objs[0];
			if ((pyjslib_len(objs) > 1)) {
			    
			    var __obj = new pyjslib_Iterator(objs);
			    try {
				while (true) {
				    var obj = __obj.next();
				    
				    
				    this.makeStatement(new pyjslib_Tuple([this._context, this._store.sym(DAML_sameAs_URI), subj, obj]));
				    
				}
			    } catch (e) {
				if (e != StopIteration) {
				    throw e;
				}
			    }
			    
			}
			var j = this.skipSpace(str, j);
			if ((j < 0)) {
			    throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF when objectList expected after [ = ");
			}
			if ((pyjslib_slice(str, j,  ( j + 1 ) ) == ";")) {
			    var j =  ( j + 1 ) ;
			}
		    }
		    else {
			throw BadSyntax(this._thisDoc, this.lines, str, i, "objectList expected after [= ");
		    }
		}
		if ((subj == null)) {
		    var subj = this.blankNode(bnodeID);
		}
		var i = this.property_list(str, j, subj);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "property_list expected");
		}
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF when ']' expected after [ <propertyList>");
		}
		if ((pyjslib_slice(str, j,  ( j + 1 ) ) != "]")) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "']' expected");
		}
		res.push(subj);
		return  ( j + 1 ) ;
	    }
	    if ((ch == "{")) {
		var ch2 = pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) );
		if ((ch2 == "$")) {
		    i += 1;
		    var j =  ( i + 1 ) ;
		    var mylist = new pyjslib_List([]);
		    var first_run = true;
		    while (1) {
			var i = this.skipSpace(str, j);
			if ((i < 0)) {
			    throw BadSyntax(this._thisDoc, this.lines, str, i, "needed '$}', found end.");
			}
			if ((pyjslib_slice(str, i,  ( i + 2 ) ) == "$}")) {
			    var j =  ( i + 2 ) ;
			    break;
			}
			if (!(first_run)) {
			    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == ",")) {
				i += 1;
			    }
			    else {
				throw BadSyntax(this._thisDoc, this.lines, str, i, "expected: ','");
			    }
			}
			else {
			    var first_run = false;
			}
			var item = new pyjslib_List([]);
			var j = this.item(str, i, item);
			if ((j < 0)) {
			    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected item in set or '$}'");
			}
			mylist.push(item[0]);
		    }
		    res.push(this._store.newSet(mylist, this._context));
		    return j;
		}
		else {
		    var j =  ( i + 1 ) ;
		    var oldParentContext = this._parentContext;
		    this._parentContext = this._context;
		    var parentAnonymousNodes = this._anonymousNodes;
		    var grandParentVariables = this._parentVariables;
		    this._parentVariables = this._variables;
		    this._anonymousNodes = new pyjslib_Dict([]);
		    this._variables = this._variables.slice();
		    var reason2 = this._reason2;
		    this._reason2 = becauseSubexpression;
		    if ((subj == null)) {
			var subj = this._store.formula();
		    }
		    this._context = subj;
		    while (1) {
			var i = this.skipSpace(str, j);
			if ((i < 0)) {
			    throw BadSyntax(this._thisDoc, this.lines, str, i, "needed '}', found end.");
			}
			if ((pyjslib_slice(str, i,  ( i + 1 ) ) == "}")) {
			    var j =  ( i + 1 ) ;
			    break;
			}
			var j = this.directiveOrStatement(str, i);
			if ((j < 0)) {
			    throw BadSyntax(this._thisDoc, this.lines, str, i, "expected statement or '}'");
			}
		    }
		    this._anonymousNodes = parentAnonymousNodes;
		    this._variables = this._parentVariables;
		    this._parentVariables = grandParentVariables;
		    this._context = this._parentContext;
		    this._reason2 = reason2;
		    this._parentContext = oldParentContext;
		    res.push(subj.close());
		    return j;
		}
	    }
	    if ((ch == "(")) {
		var thing_type = this._store.list;
		var ch2 = pyjslib_slice(str,  ( i + 1 ) ,  ( i + 2 ) );
		if ((ch2 == "$")) {
		    var thing_type = this._store.newSet;
		    i += 1;
		}
		var j =  ( i + 1 ) ;
		var mylist = new pyjslib_List([]);
		while (1) {
		    var i = this.skipSpace(str, j);
		    if ((i < 0)) {
			throw BadSyntax(this._thisDoc, this.lines, str, i, "needed ')', found end.");
		    }
		    if ((pyjslib_slice(str, i,  ( i + 1 ) ) == ")")) {
			var j =  ( i + 1 ) ;
			break;
		    }
		    var item = new pyjslib_List([]);
		    var j = this.item(str, i, item);
		    if ((j < 0)) {
			throw BadSyntax(this._thisDoc, this.lines, str, i, "expected item in list or ')'");
		    }
		    mylist.push(item[0]);
		}
		res.push(thing_type(mylist, this._context));
		return j;
	    }
	    var j = this.tok("this", str, i);
	    if ((j >= 0)) {
		throw BadSyntax(this._thisDoc, this.lines, str, i, "Keyword 'this' was ancient N3. Now use @forSome and @forAll keywords.");
	    }
	    var j = this.tok("true", str, i);
	    if ((j >= 0)) {
		res.push(true);
		return j;
	    }
	    var j = this.tok("false", str, i);
	    if ((j >= 0)) {
		res.push(false);
		return j;
	    }
	    if ((subj == null)) {
		var j = this.uri_ref2(str, i, res);
		if ((j >= 0)) {
		    return j;
		}
	    }
	    return -1;
	};
	__SinkParser.prototype.property_list = function(str, i, subj) {
	    /*
	      Parse property list
	      Leaves the terminating punctuation in the buffer
	    */
	    
	    while (1) {
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF found when expected verb in property list");
		}
		if ((pyjslib_slice(str, j,  ( j + 2 ) ) == ":-")) {
		    var i =  ( j + 2 ) ;
		    var res = new pyjslib_List([]);
		    var j = this.node(str, i, res, subj);
		    if ((j < 0)) {
			throw BadSyntax(this._thisDoc, this.lines, str, i, "bad {} or () or [] node after :- ");
		    }
		    var i = j;
		    continue;
		}
		var i = j;
		var v = new pyjslib_List([]);
		var j = this.verb(str, i, v);
		if ((j <= 0)) {
		    return i;
		}
		var objs = new pyjslib_List([]);
		var i = this.objectList(str, j, objs);
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "objectList expected");
		}
		
		var __obj = new pyjslib_Iterator(objs);
		try {
		    while (true) {
			var obj = __obj.next();
			
			
			var pairFudge = v[0];
			var dir = pairFudge[0];
			var sym = pairFudge[1];
			if ((dir == "->")) {
			    this.makeStatement(new pyjslib_Tuple([this._context, sym, subj, obj]));
			}
			else {
			    this.makeStatement(new pyjslib_Tuple([this._context, sym, obj, subj]));
			}
			
		    }
		} catch (e) {
		    if (e != StopIteration) {
			throw e;
		    }
		}
		
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found in list of objects");
		}
		if ((pyjslib_slice(str, i,  ( i + 1 ) ) != ";")) {
		    return i;
		}
		var i =  ( i + 1 ) ;
	    }
	};
	__SinkParser.prototype.commaSeparatedList = function(str, j, res, ofUris) {
	    /*
	      return value: -1 bad syntax; >1 new position in str
	      res has things found appended
	      
	      Used to use a final value of the function to be called, e.g. this.bareWord
	      but passing the function didn't work fo js converion pyjs
	    */
	    
	    var i = this.skipSpace(str, j);
	    if ((i < 0)) {
		throw BadSyntax(this._thisDoc, this.lines, str, i, "EOF found expecting comma sep list");
	    }
	    if ((str.charAt(i) == ".")) {
		return j;
	    }
	    if (ofUris) {
		var i = this.uri_ref2(str, i, res);
	    }
	    else {
		var i = this.bareWord(str, i, res);
	    }
	    if ((i < 0)) {
		return -1;
	    }
	    while (1) {
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    return j;
		}
		var ch = pyjslib_slice(str, j,  ( j + 1 ) );
		if ((ch != ",")) {
		    if ((ch != ".")) {
			return -1;
		    }
		    return j;
		}
		if (ofUris) {
		    var i = this.uri_ref2(str,  ( j + 1 ) , res);
		}
		else {
		    var i = this.bareWord(str,  ( j + 1 ) , res);
		}
		if ((i < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i, "bad list content");
		}
	    }
	};
	__SinkParser.prototype.objectList = function(str, i, res) {
	    var i = this.object(str, i, res);
	    if ((i < 0)) {
		return -1;
	    }
	    while (1) {
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, j, "EOF found after object");
		}
		if ((pyjslib_slice(str, j,  ( j + 1 ) ) != ",")) {
		    return j;
		}
		var i = this.object(str,  ( j + 1 ) , res);
		if ((i < 0)) {
		    return i;
		}
	    }
	};
	__SinkParser.prototype.checkDot = function(str, i) {
	    var j = this.skipSpace(str, i);
	    if ((j < 0)) {
		return j;
	    }
	    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == ".")) {
		return  ( j + 1 ) ;
	    }
	    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "}")) {
		return j;
	    }
	    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "]")) {
		return j;
	    }
	    throw BadSyntax(this._thisDoc, this.lines, str, j, "expected '.' or '}' or ']' at end of statement");
	};
	__SinkParser.prototype.uri_ref2 = function(str, i, res) {
	    /*
	      Generate uri from n3 representation.
	      
	      Note that the RDF convention of directly concatenating
	      NS and local name is now used though I prefer inserting a '#'
	      to make the namesapces look more like what XML folks expect.
	    */
	    
	    var qn = new pyjslib_List([]);
	    var j = this.qname(str, i, qn);
	    if ((j >= 0)) {
		var pairFudge = qn[0];
		var pfx = pairFudge[0];
		var ln = pairFudge[1];
		if ((pfx == null)) {
		    assertFudge(0, "not used?");
		    var ns =  ( this._baseURI + ADDED_HASH ) ;
		}
		else {
		    var ns = this._bindings[pfx];
		    if (!(ns)) {
			if ((pfx == "_")) {
			    res.push(this.anonymousNode(ln));
			    return j;
			}
			throw BadSyntax(this._thisDoc, this.lines, str, i,  (  ( "Prefix " + pfx )  + " not bound." ) );
		    }
		}
		var symb = this._store.sym( ( ns + ln ) );
		if ((N3Parser.Util.ArrayIndexOf(this._variables, symb) >= 0)) {
		    res.push(this._variables[symb]);
		}
		else {
		    res.push(symb);
		}
		return j;
	    }
	    var i = this.skipSpace(str, i);
	    if ((i < 0)) {
		return -1;
	    }
	    if ((str.charAt(i) == "?")) {
		var v = new pyjslib_List([]);
		var j = this.variable(str, i, v);
		if ((j > 0)) {
		    res.push(v[0]);
		    return j;
		}
		return -1;
	    }
	    else if ((str.charAt(i) == "<")) {
		var i =  ( i + 1 ) ;
		var st = i;
		while ((i < pyjslib_len(str))) {
		    if ((str.charAt(i) == ">")) {
			var uref = pyjslib_slice(str, st, i);
			if (this._baseURI) {
			    var uref = uripath_join(this._baseURI, uref);
			}
			else {
			    assertFudge((uref.indexOf(":") >= 0), "With no base URI, cannot deal with relative URIs");
			}
			if ((pyjslib_slice(str,  ( i - 1 ) , i) == "#") && !((pyjslib_slice(uref, -1, null) == "#"))) {
			    var uref =  ( uref + "#" ) ;
			}
			var symb = this._store.sym(uref);
			if ((N3Parser.Util.ArrayIndexOf(this._variables,symb) >= 0)) {
			    res.push(this._variables[symb]);
			}
			else {
			    res.push(symb);
			}
			return  ( i + 1 ) ;
		    }
		    var i =  ( i + 1 ) ;
		}
		throw BadSyntax(this._thisDoc, this.lines, str, j, "unterminated URI reference");
	    }
	    else if (this.keywordsSet) {
		var v = new pyjslib_List([]);
		var j = this.bareWord(str, i, v);
		if ((j < 0)) {
		    return -1;
		}
		if ((N3Parser.Util.ArrayIndexOf(this.keywords, v[0]) >= 0)) {
		    throw BadSyntax(this._thisDoc, this.lines, str, i,  (  ( "Keyword \"" + v[0] )  + "\" not allowed here." ) );
		}
		res.push(this._store.sym( ( this._bindings[""] + v[0] ) ));
		return j;
	    }
	    else {
		return -1;
	    }
	};
	__SinkParser.prototype.skipSpace = function(str, i) {
	    /*
	      Skip white space, newlines and comments.
	      return -1 if EOF, else position of first non-ws character*/
	    var tmp = str;
	    var whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
	    for (var j = (i ? i : 0); j < str.length; j++) {
		if (whitespace.indexOf(str.charAt(j)) === -1) {
		    if( str.charAt(j)==='#' ) {
			str = str.slice(i).replace(/^[^\n]*\n/,"");
			i=0;
			j=-1;
		    } else {
			break;
		    }
		}
	    }
	    val = (tmp.length - str.length) + j;
	    if( val === tmp.length ) {
		return -1;
	    }
	    return val;
	};
	__SinkParser.prototype.variable = function(str, i, res) {
	    /*
	      ?abc -> variable(:abc)
	    */
	    
	    var j = this.skipSpace(str, i);
	    if ((j < 0)) {
		return -1;
	    }
	    if ((pyjslib_slice(str, j,  ( j + 1 ) ) != "?")) {
		return -1;
	    }
	    var j =  ( j + 1 ) ;
	    var i = j;
	    if (("0123456789-".indexOf(str.charAt(j)) >= 0)) {
		throw BadSyntax(this._thisDoc, this.lines, str, j,  (  ( "Varible name can't start with '" + str.charAt(j) )  + "s'" ) );
	    }
	    while ((i < pyjslib_len(str)) && (_notNameChars.indexOf(str.charAt(i)) < 0)) {
		var i =  ( i + 1 ) ;
	    }
	    if ((this._parentContext == null)) {
		throw BadSyntax(this._thisDoc, this.lines, str, j,  ( "Can't use ?xxx syntax for variable in outermost level: " + pyjslib_slice(str,  ( j - 1 ) , i) ) );
	    }
	    res.push(this._store.variable(pyjslib_slice(str, j, i)));
	    return i;
	};
	__SinkParser.prototype.bareWord = function(str, i, res) {
	    /*
	      abc -> :abc
	    */
	    
	    var j = this.skipSpace(str, i);
	    if ((j < 0)) {
		return -1;
	    }
	    var ch = str.charAt(j);
	    if (("0123456789-".indexOf(ch) >= 0)) {
		return -1;
	    }
	    if ((_notNameChars.indexOf(ch) >= 0)) {
		return -1;
	    }
	    var i = j;
	    while ((i < pyjslib_len(str)) && (_notNameChars.indexOf(str.charAt(i)) < 0)) {
		var i =  ( i + 1 ) ;
	    }
	    res.push(pyjslib_slice(str, j, i));
	    return i;
	};
	__SinkParser.prototype.qname = function(str, i, res) {
	    /*
	      
	      xyz:def -> ('xyz', 'def')
	      If not in keywords and keywordsSet: def -> ('', 'def')
	      :def -> ('', 'def')    
	    */
	    
	    var i = this.skipSpace(str, i);
	    if ((i < 0)) {
		return -1;
	    }
	    var c = str.charAt(i);
	    if (("0123456789-+".indexOf(c) >= 0)) {
		return -1;
	    }
	    if ((_notNameChars.indexOf(c) < 0)) {
		var ln = c;
		var i =  ( i + 1 ) ;
		while ((i < pyjslib_len(str))) {
		    var c = str.charAt(i);
		    if ((_notNameChars.indexOf(c) < 0)) {
			var ln =  ( ln + c ) ;
			var i =  ( i + 1 ) ;
		    }
		    else {
			break;
		    }
		}
	    }
	    else {
		var ln = "";
	    }
	    if ((i < pyjslib_len(str)) && (str.charAt(i) == ":")) {
		var pfx = ln;
		var i =  ( i + 1 ) ;
		var ln = "";
		while ((i < pyjslib_len(str))) {
		    var c = str.charAt(i);
		    if ((_notNameChars.indexOf(c) < 0)) {
			var ln =  ( ln + c ) ;
			var i =  ( i + 1 ) ;
		    }
		    else {
			break;
		    }
		}
		res.push(new pyjslib_Tuple([pfx, ln]));
		return i;
	    }
	    else {
		if (ln && this.keywordsSet && (N3Parser.Util.ArrayIndexOf(this.keywords, ln) < 0)) {
		    res.push(new pyjslib_Tuple(["", ln]));
		    return i;
		}
		return -1;
	    }
	};
	__SinkParser.prototype.object = function(str, i, res) {
	    var j = this.subject(str, i, res);
	    if ((j >= 0)) {
		return j;
	    }
	    else {
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    return -1;
		}
		else {
		    var i = j;
		}
		if ((str.charAt(i) == "\"")) {
		    if ((pyjslib_slice(str, i,  ( i + 3 ) ) == "\"\"\"")) {
			var delim = "\"\"\"";
		    }
		    else {
			var delim = "\"";
		    }
		    var i =  ( i + pyjslib_len(delim) ) ;
		    var pairFudge = this.strconst(str, i, delim);
		    var j = pairFudge[0];
		    var s = pairFudge[1];
		    res.push(this._store.literal(s));
		    diag_progress("New string const ", s, j);
		    return j;
		}
		else {
		    return -1;
		}
	    }
	};
	__SinkParser.prototype.nodeOrLiteral = function(str, i, res) {
	    var j = this.node(str, i, res);
	    if ((j >= 0)) {
		return j;
	    }
	    else {
		var j = this.skipSpace(str, i);
		if ((j < 0)) {
		    return -1;
		}
		else {
		    var i = j;
		}
		var ch = str.charAt(i);
		if (("-+0987654321".indexOf(ch) >= 0)) {
		    number_syntax.lastIndex = 0;
		    var m = number_syntax.exec(str.slice(i));
		    if ((m == null)) {
			throw BadSyntax(this._thisDoc, this.lines, str, i, "Bad number syntax");
		    }
		    var j =  ( i + number_syntax.lastIndex ) ;
		    var val = pyjslib_slice(str, i, j);
		    if ((val.indexOf("e") >= 0)) {
			res.push(this._store.literal(parseFloat(val), undefined, this._store.sym(FLOAT_DATATYPE)));
		    }
		    else if ((pyjslib_slice(str, i, j).indexOf(".") >= 0)) {
			res.push(this._store.literal(parseFloat(val), undefined, this._store.sym(DECIMAL_DATATYPE)));
		    }
		    else {
			res.push(this._store.literal(parseInt(val), undefined, this._store.sym(INTEGER_DATATYPE)));
		    }
		    return j;
		}
		if ((str.charAt(i) == "\"")) {
		    if ((pyjslib_slice(str, i,  ( i + 3 ) ) == "\"\"\"")) {
			var delim = "\"\"\"";
		    }
		    else {
			var delim = "\"";
		    }
		    var i =  ( i + pyjslib_len(delim) ) ;
		    var dt = null;
		    var pairFudge = this.strconst(str, i, delim);
		    var j = pairFudge[0];
		    var s = pairFudge[1];
		    var lang = null;
		    if ((pyjslib_slice(str, j,  ( j + 1 ) ) == "@")) {
			langcode.lastIndex = 0;
			
			var m = langcode.exec(str.slice( ( j + 1 ) ));
			if ((m == null)) {
			    throw BadSyntax(this._thisDoc, startline, str, i, "Bad language code syntax on string literal, after @");
			}
			var i =  (  ( langcode.lastIndex + j )  + 1 ) ;
			
			var lang = pyjslib_slice(str,  ( j + 1 ) , i);
			var j = i;
		    }
		    if ((pyjslib_slice(str, j,  ( j + 2 ) ) == "^^")) {
			var res2 = new pyjslib_List([]);
			var j = this.uri_ref2(str,  ( j + 2 ) , res2);
			var dt = res2[0];
		    }
		    res.push(this._store.literal(s, lang, dt));
		    return j;
		}
		else {
		    return -1;
		}
	    }
	};
	__SinkParser.prototype.strconst = function(str, i, delim) {
	    /*
	      parse an N3 string constant delimited by delim.
	      return index, val
	    */
	    
	    var j = i;
	    var ustr = "";
	    var startline = this.lines;
	    while ((j < pyjslib_len(str))) {
		var i =  ( j + pyjslib_len(delim) ) ;
		if ((pyjslib_slice(str, j, i) == delim)) {
		    return new pyjslib_Tuple([i, ustr]);
		}
		if ((str.charAt(j) == "\"")) {
		    var ustr =  ( ustr + "\"" ) ;
		    var j =  ( j + 1 ) ;
		    continue;
		}
		interesting.lastIndex = 0;
		var m = interesting.exec(str.slice(j));
		if (!(m)) {
		    throw BadSyntax(this._thisDoc, startline, str, j,  (  (  ( "Closing quote missing in string at ^ in " + pyjslib_slice(str,  ( j - 20 ) , j) )  + "^" )  + pyjslib_slice(str, j,  ( j + 20 ) ) ) );
		}
		var i =  (  ( j + interesting.lastIndex )  - 1 ) ;
		var ustr =  ( ustr + pyjslib_slice(str, j, i) ) ;
		var ch = str.charAt(i);
		if ((ch == "\"")) {
		    var j = i;
		    continue;
		}
		else if ((ch == "\r")) {
		    var j =  ( i + 1 ) ;
		    continue;
		}
		else if ((ch == "\n")) {
		    if ((delim == "\"")) {
			throw BadSyntax(this._thisDoc, startline, str, i, "newline found in string literal");
		    }
		    this.lines =  ( this.lines + 1 ) ;
		    var ustr =  ( ustr + ch ) ;
		    var j =  ( i + 1 ) ;
		    this.previousLine = this.startOfLine;
		    this.startOfLine = j;
		}
		else if ((ch == "\\")) {
		    var j =  ( i + 1 ) ;
		    var ch = pyjslib_slice(str, j,  ( j + 1 ) );
		    if (!(ch)) {
			throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal (2)");
		    }
		    var k = string_find("abfrtvn\\\"", ch);
		    if ((k >= 0)) {
			var uch = "\a\b\f\r\t\v\n\\\"".charAt(k);
			var ustr =  ( ustr + uch ) ;
			var j =  ( j + 1 ) ;
		    }
		    else if ((ch == "u")) {
			var pairFudge = this.uEscape(str,  ( j + 1 ) , startline);
			var j = pairFudge[0];
			var ch = pairFudge[1];
			var ustr =  ( ustr + ch ) ;
		    }
		    else if ((ch == "U")) {
			var pairFudge = this.UEscape(str,  ( j + 1 ) , startline);
			var j = pairFudge[0];
			var ch = pairFudge[1];
			var ustr =  ( ustr + ch ) ;
		    }
		    else {
			throw BadSyntax(this._thisDoc, this.lines, str, i, "bad escape");
		    }
		}
	    }
	    throw BadSyntax(this._thisDoc, this.lines, str, i, "unterminated string literal");
	};
	__SinkParser.prototype.uEscape = function(str, i, startline) {
	    var j = i;
	    var count = 0;
	    var value = 0;
	    while ((count < 4)) {
		var chFudge = pyjslib_slice(str, j,  ( j + 1 ) );
		var ch = chFudge.toLowerCase();
		var j =  ( j + 1 ) ;
		if ((ch == "")) {
		    throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal(3)");
		}
		var k = string_find("0123456789abcdef", ch);
		if ((k < 0)) {
		    throw BadSyntax(this._thisDoc, startline, str, i, "bad string literal hex escape");
		}
		var value =  (  ( value * 16 )  + k ) ;
		var count =  ( count + 1 ) ;
	    }
	    var uch = String.fromCharCode(value);
	    return new pyjslib_Tuple([j, uch]);
	};
	__SinkParser.prototype.UEscape = function(str, i, startline) {
	    var j = i;
	    var count = 0;
	    var value = "\\U";
	    while ((count < 8)) {
		var chFudge = pyjslib_slice(str, j,  ( j + 1 ) );
		var ch = chFudge.toLowerCase();
		var j =  ( j + 1 ) ;
		if ((ch == "")) {
		    throw BadSyntax(this._thisDoc, startline, str, i, "unterminated string literal(3)");
		}
		var k = string_find("0123456789abcdef", ch);
		if ((k < 0)) {
		    throw BadSyntax(this._thisDoc, startline, str, i, "bad string literal hex escape");
		}
		var value =  ( value + ch ) ;
		var count =  ( count + 1 ) ;
	    }
	    var uch = stringFromCharCode( (  ( "0x" + pyjslib_slice(value, 2, 10) )  - 0 ) );
	    return new pyjslib_Tuple([j, uch]);
	};
	function OLD_BadSyntax(uri, lines, str, i, why) {
	    return new __OLD_BadSyntax(uri, lines, str, i, why);
	}
	function __OLD_BadSyntax(uri, lines, str, i, why) {
	    this._str = str.encode("utf-8");
	    this._str = str;
	    this._i = i;
	    this._why = why;
	    this.lines = lines;
	    this._uri = uri;
	}
	__OLD_BadSyntax.prototype.toString = function() {
	    var str = this._str;
	    var i = this._i;
	    var st = 0;
	    if ((i > 60)) {
		var pre = "...";
		var st =  ( i - 60 ) ;
	    }
	    else {
		var pre = "";
	    }
	    if (( ( pyjslib_len(str) - i )  > 60)) {
		var post = "...";
	    }
	    else {
		var post = "";
	    }
	    return "Line %i of <%s>: Bad syntax (%s) at ^ in:\n\"%s%s^%s%s\"" % new pyjslib_Tuple([ ( this.lines + 1 ) , this._uri, this._why, pre, pyjslib_slice(str, st, i), pyjslib_slice(str, i,  ( i + 60 ) ), post]);
	};
	function BadSyntax(uri, lines, str, i, why) {
	    return  (  (  (  (  (  (  (  ( "Line " +  ( lines + 1 )  )  + " of <" )  + uri )  + ">: Bad syntax: " )  + why )  + "\nat: \"" )  + pyjslib_slice(str, i,  ( i + 30 ) ) )  + "\"" ) ;
	}


	function stripCR(str) {
	    var res = "";
	    
	    var __ch = new pyjslib_Iterator(str);
	    try {
		while (true) {
		    var ch = __ch.next();
		    
		    
		    if ((ch != "\r")) {
			var res =  ( res + ch ) ;
		    }
		    
		}
	    } catch (e) {
		if (e != StopIteration) {
		    throw e;
		}
	    }
	    
	    return res;
	}


	function dummyWrite(x) {
	}

	return SinkParser;

    }();
    //  Identity management and indexing for RDF
    //
    // This file provides  IndexedFormula a formula (set of triples) which
    // indexed by predicate, subject and object.
    //
    // It "smushes"  (merges into a single node) things which are identical 
    // according to owl:sameAs or an owl:InverseFunctionalProperty
    // or an owl:FunctionalProperty
    //
    //
    //  2005-10 Written Tim Berners-Lee
    //  2007    Changed so as not to munge statements from documents when smushing
    //
    // 

    /*jsl:option explicit*/ // Turn on JavaScriptLint variable declaration checking

    N3Parser.IndexedFormula = function() {

	var owl_ns = "http://www.w3.org/2002/07/owl#";
	// var link_ns = "http://www.w3.org/2007/ont/link#";

	/* hashString functions are used as array indeces. This is done to avoid
	** conflict with existing properties of arrays such as length and map.
	** See issue 139.
	*/
	//Stores an associative array that maps URIs to functions
	N3Parser.IndexedFormula = function(features) {
	    this.statements = [];    // As in Formula
	    this.propertyActions = []; // Array of functions to call when getting statement with {s X o}
	    this.classActions = [];   // Array of functions to call when adding { s type X }
	    this.redirections = [];   // redirect to lexically smaller equivalent symbol
	    this.aliases = [];   // reverse mapping to redirection: aliases for this
	    this.HTTPRedirects = []; // redirections we got from HTTP
	    this.subjectIndex = [];  // Array of statements with this X as subject
	    this.predicateIndex = [];  // Array of statements with this X as subject
	    this.objectIndex = [];  // Array of statements with this X as object
	    this.whyIndex = [];     // Array of statements with X as provenance
	    this.index = [ this.subjectIndex, this.predicateIndex, this.objectIndex, this.whyIndex ];
	    this.namespaces = {} // Dictionary of namespace prefixes
	    if (features === undefined) features = ["sameAs",
						    "InverseFunctionalProperty", "FunctionalProperty"];
	} /* end IndexedFormula */

	N3Parser.IndexedFormula.prototype = new N3Parser.Formula();
	N3Parser.IndexedFormula.prototype.constructor = N3Parser.IndexedFormula;
	N3Parser.IndexedFormula.SuperClass = N3Parser.Formula;


	N3Parser.IndexedFormula.prototype.setPrefixForURI = function(prefix, nsuri) {
	    //TODO:This is a hack for our own issues, which ought to be fixed post-release
	    //See http://dig.csail.mit.edu/cgi-bin/roundup.cgi/N3Parser/issue227
	    if(prefix=="tab" && this.namespaces["tab"]) {
		return;
	    }
	    this.namespaces[prefix] = nsuri
	}

	// Deprocated ... name too generic
	N3Parser.IndexedFormula.prototype.register = function(prefix, nsuri) {
	    this.namespaces[prefix] = nsuri
	}



	// Return the symbol with canonical URI as smushed
	N3Parser.IndexedFormula.prototype.canon = function(term) {
	    return term;
	}

	// On input parameters, convert constants to terms
	// 
	function RDFMakeTerm(formula,val, canonicalize) {
	    if (typeof val != 'object') {   
		if (typeof val == 'string')
	            return new N3Parser.Literal(val);
		if (typeof val == 'number')
		    return new N3Parser.Literal(val); // @@ differet types
		if (typeof val == 'boolean')
		    return new N3Parser.Literal(val?"1":"0", undefined, 
					    N3Parser.Symbol.prototype.XSDboolean);
		else if (typeof val == 'number')
	            return new N3Parser.Literal(''+val);   // @@ datatypes
		else if (typeof val == 'undefined')
	            return undefined;
		else    // @@ add converting of dates and numbers
	            throw "Can't make Term from " + val + " of type " + typeof val; 
	    }
	    return val;
	}

	// Add a triple to the store
	//
	//  Returns the statement added
	// (would it be better to return the original formula for chaining?)
	//
	N3Parser.IndexedFormula.prototype.add = function(subj, pred, obj, why) {
	    var actions, st;
	    if (why == undefined) why = this.fetcher ? this.fetcher.appNode: this.sym("chrome:theSession"); //system generated
            //defined in source.js, is this OK with identity.js only user?
	    subj = RDFMakeTerm(this, subj);
	    pred = RDFMakeTerm(this, pred);
	    obj = RDFMakeTerm(this, obj);
	    why = RDFMakeTerm(this, why);
	    
	    //If we are tracking provenanance, every thing should be loaded into the store
	    //if (done) return new Statement(subj, pred, obj, why); // Don't put it in the store
            // still return this statement for owl:sameAs input
	    var st = new N3Parser.Statement(subj, pred, obj, why);
	    
	    //N3Parser.log.debug("ADDING    {"+subj+" "+pred+" "+obj+"} "+why);
	    this.statements.push(st);
	    return st;
	}; //add



	N3Parser.IndexedFormula.prototype.formula = function(features) {
	    return new N3Parser.IndexedFormula(features);
	}

	return N3Parser.IndexedFormula;

    }();

    
    // Parse a string and put the result into the graph kb
    N3Parser.parse = function parse(str, kb, graph, contentType) {
	try {
	    /*
              parseXML = function(str) {
              var dparser;
              if ((typeof tabulator != 'undefined' && tabulator.isExtension)) {
              dparser = Components.classes["@mozilla.org/xmlextras/domparser;1"].getService(
              Components.interfaces.nsIDOMParser);
              } else if (typeof module != 'undefined' ){ // Node.js
              var jsdom = require('jsdom');
              return jsdom.jsdom(str, undefined, {} );// html, level, options
              } else {
              dparser = new DOMParser()
              }
              return dparser.parseFromString(str, 'application/xml');
              }
            */
            if (contentType == 'text/n3' || contentType == 'text/turtle') {
		N3Parser.graph = graph;
		var p = N3Parser.N3Parser(kb, kb, null, null, null, null, "", null);
		p.loadBuf(str);
		return;
            }
	} catch(e) {
            throw "Error trying to parse N3 data:"+e;
	}
	throw "Don't know how to parse "+contentType+" yet";

    };


    // ends
    return N3Parser;
}();

exports.N3Parser = {};
var N3Parser = exports.N3Parser;

N3Parser.parser = {};
N3Parser.parser.parse = function(data, graph) {
    var g = new TabulatorN3Parser.Graph();
    try {
	TabulatorN3Parser.parse(data, g, graph, "text/n3");
    } catch(e) {
	throw e;
    }
    return g.toQuads();
};