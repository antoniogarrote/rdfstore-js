{
    var flattenString = function(arrs) {
        var acum ="";
        for(var i=0; i< arrs.length; i++) {
          if(typeof(arrs[i])==='string') {
            acum = acum + arrs[i];
          } else {
            acum = acum + arrs[i].join('');
          }
        }

        return acum;
    }


    var GlobalBlankNodeCounter = 0;

    var prefixes = {};

    var registerPrefix = function(prefix, uri) {
        prefixes[prefix] = uri;
    }

    var registerDefaultPrefix = function(uri) {
        prefixes[null] = uri;
    }
}

/*
  [1]	turtleDoc 	::= 	statement*
*/
turtleDoc
    = sts:statement* {
        return sts;
    }

/*
  [2]	statement 	::= 	directive '.' | triples '.' | ws+
*/
statement
    = WS* d:directive WS* '.' WS* {
        return d;
    }
    / WS* ts:TriplesBlock WS* {
        return ts;
    }
    / WS+

/*
  [3]	directive 	::= 	prefixID | base
*/
directive
    = prefixID
    / base

/*
  [5]	base 	::= 	'@base' ws+ uriref
*/
base
  = WS* '@base' WS+ i:IRI_REF {
      registerDefaultPrefix(i);

      base = {};
      base.token = 'base';
      base.value = i;

      return base;
}

/*
  [4]	prefixID 	::= 	'@prefix' ws+ prefixName? ':' uriref
*/
prefixID
  = WS* '@prefix'  WS+ p:PN_PREFIX? ':' WS* l:IRI_REF {

      registerPrefix(p,l);

      prefix = {};
      prefix.token = 'prefix';
      prefix.prefix = p;
      prefix.local = l;

      return prefix;
}

/*
  @warning
  @rewritten
  [52]  	TriplesBlock	  ::=  	TriplesSameSubjectPath ( '.' TriplesBlock? )?
*/
TriplesBlock "[54] TriplesBlock"
  = b:TriplesSameSubject bs:(WS*  '.' TriplesBlock? )? {
     var triples = b.triplesContext;
     var toTest = null;
      if(typeof(bs) === 'object') {
            if(bs.length != null) {
                  if(bs[2].triplesContext!=null) {
                     triples = triples.concat(bs[2].triplesContext);
              }
           }
      }

     return {token:'triples',
             triplesContext: triples}
}

/*
  [66]  	TriplesSameSubject	  ::=  	VarOrTerm PropertyListNotEmpty |	TriplesNode PropertyList
*/
TriplesSameSubject "[66] TriplesSameSubject"
  = WS* s:VarOrTerm WS* pairs:PropertyListNotEmpty {
      var triplesContext = pairs.triplesContext;
      var subject = s;
      if(pairs.pairs) {
        for(var i=0; i< pairs.pairs.length; i++) {
            var pair = pairs.pairs[i];
            var triple = null;
            if(subject.token && subject.token==='triplesnodecollection') {
                triple = {subject: subject.chainSubject[0], predicate: pair[0], object: pair[1]}
                triplesContext.push(triple);
                triplesContext = triplesContext.concat(subject.triplesContext);
            } else {
                triple = {subject: subject, predicate: pair[0], object: pair[1]}
                triplesContext.push(triple);
            }
        }
      }

      var token = {};
      token.token = "triplessamesubject";
      token.triplesContext = triplesContext;
      token.chainSubject = subject;

      return token;
  }
  / WS* tn:TriplesNode WS* pairs:PropertyList {
      var triplesContext = tn.triplesContext;
      var subject = tn.chainSubject;

      if(pairs.pairs) {
        for(var i=0; i< pairs.pairs.length; i++) {
            var pair = pairs.pairs[i];
            if(tn.token === "triplesnodecollection") {
                for(var j=0; j<subject.length; j++) {
                    var subj = subject[j];
                    if(subj.triplesContext != null) {
                        var triple = {subject: subj.chainSubject, predicate: pair[0], object: pair[1]}
                        triplesContext.concat(subj.triplesContext);
                    } else {
                        var triple = {subject: subject[j], predicate: pair[0], object: pair[1]}
                        triplesContext.push(triple);
                    }
                }
            } else {
                var triple = {subject: subject, predicate: pair[0], object: pair[1]}
                triplesContext.push(triple);
            }
        }
      }

      var token = {};
      token.token = "triplessamesubject";
      token.triplesContext = triplesContext;
      token.chainSubject = subject;

      return token;
  }

/*
  [67]  	PropertyListNotEmpty	  ::=  	Verb ObjectList ( ';' ( Verb ObjectList )? )*
*/
PropertyListNotEmpty "[67] PropertyListNotEmpty"
  = v:Verb WS* ol:ObjectList rest:( WS* ';' WS* ( Verb WS* ObjectList )? )* {
      token = {}
      token.token = 'propertylist';
      var triplesContext = [];
      var pairs = [];
      var test = [];

      for( var i=0; i<ol.length; i++) {

         if(ol[i].triplesContext != null) {
             triplesContext = triplesContext.concat(ol[i].triplesContext);
             if(ol[i].token==='triplesnodecollection' && ol[i].chainSubject.length != null) {
                 pairs.push([v, ol[i].chainSubject[0]]);
             } else {
                 pairs.push([v, ol[i].chainSubject]);
             }

          } else {
              pairs.push([v, ol[i]])
          }

      }


      for(var i=0; i<rest.length; i++) {
          var tok = rest[i][3];
          var newVerb  = tok[0];
          var newObjsList = tok[2] || [];

          for(var j=0; j<newObjsList.length; j++) {
           if(newObjsList[j].triplesContext != null) {
              triplesContext = triplesContext.concat(newObjsList[j].triplesContext);
             pairs.push([newVerb, newObjsList[j].chainSubject]);
            } else {
              pairs.push([newVerb, newObjsList[j]])
            }
          }
      }

      token.pairs = pairs;
      token.triplesContext = triplesContext;

      return token;

}

/*
  [68]  	PropertyList	  ::=  	PropertyListNotEmpty?
*/
PropertyList "[68] PropertyList"
  = PropertyListNotEmpty?

/*
  [69]  	ObjectList	  ::=  	Object ( ',' Object )*
*/
/*
  [69]  	ObjectList	  ::=  	Object ( ',' Object )*
*/
ObjectList "[69] ObjectList"
  = obj:Object WS* objs:( ',' WS* Object )* {

        var toReturn = [];

        toReturn.push(obj);

        for(var i=0; i<objs.length; i++) {
            for(var j=0; j<objs[i].length; j++) {
                if(typeof(objs[i][j])=="object" && objs[i][j].token != null) {
                    toReturn.push(objs[i][j]);
                }
            }
        }

        return toReturn;
    }

/*
  [70]  	Object	  ::=  	GraphNode
*/
Object "[70] Object"
  = GraphNode

/*
  [71]  	Verb	  ::=  	VarOrIRIref | 'a'
*/
Verb "[71] Verb"
  = VarOrIRIref
  / 'a' {
      return{token: 'uri', prefix:null, suffix:null, value:"http://www.w3.org/1999/02/22-rdf-syntax-ns#type"}
  }

/*
  @todo
  @incomplete
  @semantics
  // support for property paths must be added
  [72]  	TriplesSameSubjectPath	  ::=  	VarOrTerm PropertyListNotEmptyPath |	TriplesNode PropertyListPath
*/
TriplesSameSubjectPath "[72] TriplesSameSubjectPath"
  = TriplesSameSubject
// Property paths not supported yet :(
//  = VarOrTerm PropertyListNotEmptyPath
//  / TriplesNode PropertyListPath


/*
  [73]  	PropertyListNotEmptyPath	  ::=  	( VerbPath | VerbSimple ) ObjectList ( ';' ( ( VerbPath | VerbSimple ) ObjectList )? )*
*/
PropertyListNotEmptyPath "[73] PropertyListNotEmptyPath"
  = ( VerbPath / VerbSimple ) ObjectList ( ';' ( ( VerbPath / VerbSimple ) ObjectList)? )*

/*
  [74]  	PropertyListPath	  ::=  	PropertyListNotEmpty?
*/
PropertyListPath "[74] PropertyListPath"
  = PropertyListNotEmpty?

/*
  [75]  	VerbPath	  ::=  	Path
*/
VerbPath "[75]"
  = p:Path {
      var path = {};
      path.token = 'path';
      path.value = p;

      return p;
}

/*
  [76]  	VerbSimple	  ::=  	Var
*/
VerbSimple "[76] VerbSimple"
  = Var

/*
  [77]  	Path	  ::=  	PathAlternative
  @todo
  @fix
*/
Path "[77] Path"
  = PathAlternative

/*
  [78]  	PathAlternative	  ::=  	PathSequence ( '|' PathSequence )*
*/
PathAlternative "[78] PathAlternative"
  = PathSequence ( '|' PathSequence)*

/*
  [79]  	PathSequence	  ::=  	PathEltOrInverse ( '/' PathEltOrInverse )*
*/
PathSequence "[79] PathSequence"
    = PathEltOrInverse ( '/' PathEltOrInverse)*

/*
  [80]  	PathElt	  ::=  	PathPrimary PathMod?
*/
PathElt "[88] PathElt"
  = PathPrimary PathMod?

/*
  [81]  	PathEltOrInverse	  ::=  	PathElt | '^' PathElt
*/

PathEltOrInverse "[81] PathEltOrInverse"
  = PathElt / '^' PathElt

/*
  [82]  	PathMod	  ::=  	( '*' | '?' | '+' | '{' ( Integer ( ',' ( '}' | Integer '}' ) | '}' ) | ',' Integer '}' ) )
*/
PathMod "[82] PathMod"
  = ( '*' / '?' / '+' / '{' ( Integer ( ',' ( '}' / Integer '}' ) / '}' ) / ',' Integer '}' ) )

/*
 [83]  	PathPrimary	  ::=  	( IRIref | 'a' | '!' PathNegatedPropertySet | '(' Path ')' )
*/
PathPrimary "[83] PathPrimary"
  = ( IRIref / 'a' / '!' PathNegatedPropertySet / '(' Path ')' )

/*
  [84]	PathNegatedPropertySet	  ::=	( PathOneInPropertySet | '(' ( PathOneInPropertySet ( '|' PathOneInPropertySet )* )? ')' )
*/
PathNegatedPropertySet
  = ( PathOneInPropertySet / '(' ( PathOneInPropertySet	 ('|' PathOneInPropertySet)* )? ')' )

/*
  [85]	PathOneInPropertySet	  ::=	( IRIref | 'a' | '^' ( IRIref | 'a' ) )
*/
PathOneInPropertySet "[85] PathOneInPropertySet"
  = ( IRIref / 'a' / '^' (IRIref / 'a') )

/*
  [86] 	Integer	  ::=  	INTEGER
*/
Integer "[86] Integer"
  = INTEGER

/*
  @todo
  // finish semantic
  [87]  	TriplesNode	  ::=  	Collection |	BlankNodePropertyList
*/
TriplesNode "[87] TriplesNode"
  = c:Collection {
      triplesContext = [];
      chainSubject = [];

      var triple = null;

      // catch NIL
      /*
      if(c.length == 1 && c[0].token && c[0].token === 'nil') {
          GlobalBlankNodeCounter++;
          return  {token: "triplesnodecollection", 
                   triplesContext:[{subject: {token:'blank', label:("_:"+GlobalBlankNodeCounter)},
                                    predicate:{token:'uri', prefix:null, suffix:null, value:'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'},
                                    object:  {token:'blank', label:("_:"+(GlobalBlankNodeCounter+1))}}], 
                   chainSubject:{token:'blank', label:("_:"+GlobalBlankNodeCounter)}};

      }
      */

      // other cases
      for(var i=0; i<c.length; i++) {
          GlobalBlankNodeCounter++;
          //_:b0  rdf:first  1 ;
          //rdf:rest   _:b1 .
          var nextObject = null;
          if(c[i].chainSubject == null && c[i].triplesContext == null) {
              nextObject = c[i];
          } else {
              nextObject = c[i].chainSubject;
              triplesContext = triplesContext.concat(nextSubject.triplesContext);
          }
          var currentSubject = null;
          triple = {subject: {token:'blank', label:("_:"+GlobalBlankNodeCounter)},
                    predicate:{token:'uri', prefix:null, suffix:null, value:'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'},
                    object:nextObject };

          if(i==0) {
              chainSubject.push(triple.subject);
          }

          triplesContext.push(triple);

          if(i===(c.length-1)) {
              triple = {subject: {token:'blank', label:("_:"+GlobalBlankNodeCounter)},
                        predicate:{token:'uri', prefix:null, suffix:null, value:'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'},
                        object:   {token:'uri', prefix:null, suffix:null, value:'http://www.w3.org/1999/02/22-rdf-syntax-ns#nil'}};
          } else {
              triple = {subject: {token:'blank', label:("_:"+GlobalBlankNodeCounter)},
                        predicate:{token:'uri', prefix:null, suffix:null, value:'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest'},
                        object:  {token:'blank', label:("_:"+(GlobalBlankNodeCounter+1))} };
          }

          triplesContext.push(triple);
      }

      return {token:"triplesnodecollection", triplesContext:triplesContext, chainSubject:chainSubject};
}
  / BlankNodePropertyList

/*
  [88]  	BlankNodePropertyList	  ::=  	'[' PropertyListNotEmpty ']'
*/
BlankNodePropertyList "[88] BlankNodePropertyList"
  = WS* '[' WS* pl:PropertyListNotEmpty WS* ']' WS* {

      GlobalBlankNodeCounter++;
      var subject = {token:'blank', label:''+GlobalBlankNodeCounter};
      var newTriples =  [];

      for(var i=0; i< pl.pairs.length; i++) {
          var pair = pl.pairs[i];
          var triple = {}
          triple.subject = subject;
          triple.predicate = pair[0];
          triple.object = pair[1];
          newTriples.push(triple);
      }

      return {token: 'triplesnode',
              kind: 'blanknodepropertylist',
              triplesContext: pl.triplesContext.concat(newTriples),
              chainSubject: subject};
}

/*
  [89]  	Collection	  ::=  	'(' GraphNode+ ')'
*/
Collection "[89] Collection"
  = WS* '(' WS* gn:GraphNode+ WS* ')' WS* {
      return gn;
}

/*
  [90]  	GraphNode	  ::=  	VarOrTerm |	TriplesNode
*/
GraphNode "[90] GraphNode"
  = gn:(WS* VarOrTerm WS* / WS* TriplesNode WS*) {
  return gn[1];
}

/*
  [91]  	VarOrTerm	  ::=  	Var | GraphTerm
*/
VarOrTerm "[91] VarOrTerm"
  = (Var / GraphTerm)

/*
  [92]  	VarOrIRIref	  ::=  	Var | IRIref
*/
VarOrIRIref "[92] VarOrIRIref"
  = (Var /IRIref)

/*
  [93]  	Var	  ::=  	VAR1 | VAR2
*/
Var "[93] Var"
  = v:(VAR1 / VAR2) {
      var term = {};
      term.token = 'var';
      term.value = v;
      return term;
  }

/*
  [94]  	GraphTerm	  ::=  	IRIref |	RDFLiteral |	NumericLiteral |	BooleanLiteral |	BlankNode |	NIL
*/
GraphTerm "[94] GraphTerm"
 = IRIref /	RDFLiteral /	NumericLiteral /	BooleanLiteral /	BlankNode /	NIL
/*
  = t:IRIref {
      var term = {};
      term.token = 'graphterm';
      term.term = 'iri';
      term.value = t;
      return term;
}
  / t:RDFLiteral {
      var term = {};
      term.token = 'graphterm'
      term.term = 'literal'
      term.value = t
      return term;
}
  / t:NumericLiteral {
      var term = {};
      term.token = 'graphterm'
      term.term = 'numericliteral'
      term.value = t
      return term;
}
  / t:BooleanLiteral  {
      var term = {};
      term.token = 'graphterm'
      term.term = 'booleanliteral'
      term.value = t
      return term;
}
  / t:BlankNode {
      var term = {};
      term.token = 'graphterm'
      term.term = 'blanknode'
      term.value = t
      return term;
}
  / t:NIL {
      var term = {};
      term.token = 'graphterm'
      term.term = 'nil'
      term.value = t
      return term;
}
*/

/*
  [112]  	RDFLiteral	  ::=  	String ( LANGTAG | ( '^^' IRIref ) )?
*/
RDFLiteral "[112] RDFLiteral"
  = s:String e:( LANGTAG / ('^^' IRIref) )? {
      if(typeof(e) === "string" && e.length > 0) {
          return {token:'literal', value:s.value, lang:e.slice(1), type:null}
      } else {
          if(typeof(e) === "object") {
              e.shift(); // remove the '^^' char
              return {token:'literal', value:s.value, lang:null, type:e[0] }
          } else {
              return { token:'literal', value:s.value, lang:null, type:null }
          }
      }
}

/*
  [113]  	NumericLiteral	  ::=  	NumericLiteralUnsigned | NumericLiteralPositive | NumericLiteralNegative
*/
NumericLiteral "[113] NumericLiteral"
  = NumericLiteralUnsigned
  / NumericLiteralPositive
  / NumericLiteralNegative

/*
  [114]  	NumericLiteralUnsigned	  ::=  	INTEGER |	DECIMAL |	DOUBLE
*/
NumericLiteralUnsigned "[114] NumericLiteralUnsigned"
  = DOUBLE
  / DECIMAL
  / INTEGER

/*
  [115]  	NumericLiteralPositive	  ::=  	INTEGER_POSITIVE |	DECIMAL_POSITIVE |	DOUBLE_POSITIVE
*/
NumericLiteralPositive "[115] NumericLiteralPositive"
  = DOUBLE_POSITIVE
  / DECIMAL_POSITIVE
  / INTEGER_POSITIVE

/*
  [116]  	NumericLiteralNegative	  ::=  	INTEGER_NEGATIVE |	DECIMAL_NEGATIVE |	DOUBLE_NEGATIVE
*/
NumericLiteralNegative "[116] NumericLiteralNegative"
  = DOUBLE_NEGATIVE
  / DECIMAL_NEGATIVE
  / INTEGER_NEGATIVE

/*
  [117]  	BooleanLiteral	  ::=  	'true' |	'false'
*/
BooleanLiteral "[117] BooleanLiteral"
  = 'true' {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#boolean";
      lit.value = true;
      return lit;
 }
  / 'false' {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#boolean";
      lit.value = false;
      return lit;
}

/*
  [118]  	String	  ::=  	STRING_LITERAL1 | STRING_LITERAL2 | STRING_LITERAL_LONG1 | STRING_LITERAL_LONG2
*/
String "[118] String"
  = s:STRING_LITERAL_LONG1 { return {token:'string', value:s} }
  / s:STRING_LITERAL_LONG2 { return {token:'string', value:s} }
  / s:STRING_LITERAL1 { return {token:'string', value:s} }
  / s:STRING_LITERAL2 { return {token:'string', value:s} }

/*
  [119]  	IRIref	  ::=  	IRI_REF |	PrefixedName
*/
IRIref "[119] IRIref"
  = iri:IRI_REF { return {token: 'uri', prefix:null, suffix:null, value:iri} }
  / p:PrefixedName { return p }

/*
  [120]  	PrefixedName	  ::=  	PNAME_LN | PNAME_NS
*/
PrefixedName "[120] PrefixedName"
  = p:PNAME_LN { return {token: 'uri', prefix:p[0], suffix:p[1], value:null } }
  / p:PNAME_NS { return {token: 'uri', prefix:p, suffix:'', value:null } }

/*
  [121]  	BlankNode	  ::=  	BLANK_NODE_LABEL |	ANON
*/
BlankNode "[121] BlankNode"
  = l:BLANK_NODE_LABEL { return {token:'blank', label:l}}
  / ANON { GlobalBlankNodeCounter++; return {token:'blank', label:''+GlobalBlankNodeCounter} }

/*
  [122]  	IRI_REF	  ::=  	'<' ([^<>"{}|^`\]-[#x00-#x20])* '>'
  @todo check this rule
  @incomplete
*/
IRI_REF "[122] IRI_REF"
  = '<' iri_ref:[^<>\"\{\} | ^\\]* '>' { return iri_ref.join('') }

/*
  [123]  	PNAME_NS	  ::=  	PN_PREFIX? ':'
*/
PNAME_NS "[123] PNAME_NS"
  = p:PN_PREFIX? ':' { return p }

/*
  [124]  	PNAME_LN	  ::=  	PNAME_NS PN_LOCAL
*/
PNAME_LN "[124] PNAME_LN"
  = p:PNAME_NS s:PN_LOCAL { return [p, s] }

/*
  [125]  	BLANK_NODE_LABEL	  ::=  	'_:' PN_LOCAL
*/
BLANK_NODE_LABEL "[125] BLANK_NODE_LABEL"
  = '_:' l:PN_LOCAL { return l }

/*
  [126]  	VAR1	  ::=  	'?' VARNAME
*/
VAR1 "[126] VAR1"
  = '?' v:VARNAME { return v }

/*
  [127]  	VAR2	  ::=  	'$' VARNAME
*/
VAR2 "[127] VAR2"
  = '$' v:VARNAME { return v }

/*
  [128]  	LANGTAG	  ::=  	'@' [a-zA-Z]+ ('-' [a-zA-Z0-9]+)*
*/
LANGTAG "[128] LANGTAG"
  = '@' a:[a-zA-Z]+ b:('-' [a-zA-Z0-9]+)*  {

      if(b.length===0) {
          return ("@"+a.join('')).toLowerCase();
      } else {
          return ("@"+a.join('')+"-"+b[0][1].join('')).toLowerCase();
      }
}

/*
  [129]  	INTEGER	  ::=  	[0-9]+
*/
INTEGER "[129] INTEGER"
  = d:[0-9]+ {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#integer";
      lit.value = flattenString(d);
      return lit;
}

/*
  [130]  	DECIMAL	  ::=  	[0-9]+ '.' [0-9]* | '.' [0-9]+
*/
DECIMAL "[130] DECIMAL"
  = a:[0-9]+ b:'.' c:[0-9]* {

      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#decimal";
      lit.value = flattenString([a,b,c]);
      return lit;
}
  / a:'.' b:[0-9]+ {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#decimal";
      lit.value = flattenString([a,b]);
      return lit;
 }

/*
  [131]  	DOUBLE	  ::=  	[0-9]+ '.' [0-9]* EXPONENT | '.' ([0-9])+ EXPONENT | ([0-9])+ EXPONENT
*/
DOUBLE "[131] DOUBLE"
  = a:[0-9]+ b:'.' c:[0-9]* e:EXPONENT {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#double";
      lit.value = flattenString([a,b,c,e]);
      return lit;
}
  / a:'.' b:[0-9]+ c:EXPONENT {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#double";
      lit.value = flattenString([a,b,c]);
      return lit;
}
  / a:[0-9]+ b:EXPONENT {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#double";
      lit.value = flattenString([a,b]);
      return lit;
}

/*
  [132]  	INTEGER_POSITIVE	  ::=  	'+' INTEGER
*/
INTEGER_POSITIVE "[132] INTEGER_POSITIVE"
  = '+' d:INTEGER { d.value = "+"+d.value; return d; }

/*
  [133]  	DECIMAL_POSITIVE	  ::=  	'+' DECIMAL
*/
DECIMAL_POSITIVE "[133] DECIMAL_POSITIVE"
  = '+' d:DECIMAL { d.value = "+"+d.value; return d }

/*
  [134]  	DOUBLE_POSITIVE	  ::=  	'+' DOUBLE
*/
DOUBLE_POSITIVE "[134] DOUBLE_POSITIVE"
  = '+' d:DOUBLE { d.value = "+"+d.value; return d }

/*
  [135]  	INTEGER_NEGATIVE	  ::=  	'-' INTEGER
*/
INTEGER_NEGATIVE "[135] INTEGER_NEGATIVE"
  = '-' d:INTEGER { d.value = "-"+d.value; return d; }

/*
  [136]  	DECIMAL_NEGATIVE	  ::=  	'-' DECIMAL
*/
DECIMAL_NEGATIVE "[136] DECIMAL_NEGATIVE"
  = '-' d:DECIMAL { d.value = "-"+d.value; return d; }
/*
  [137]  	DOUBLE_NEGATIVE	  ::=  	'-' DOUBLE
*/
DOUBLE_NEGATIVE "[137] DOUBLE_NEGATIVE"
  = '-' d:DOUBLE { d.value = "-"+d.value; return d; }

/*
  [138]  	EXPONENT	  ::=  	[eE] [+-]? [0-9]+
*/
EXPONENT "[138] EXPONENT"
  = a:[eE] b:[+-]? c:[0-9]+  { return flattenString([a,b,c]) }

/*
  [139]  	STRING_LITERAL1	  ::=  	"'" ( ([^#x27#x5C#xA#xD]) | ECHAR )* "'"
*/
STRING_LITERAL1 "[139] STRING_LITERAL1"
  =  "'" content:([^\u0027\u005C\u000A\u000D] / ECHAR)* "'" { return flattenString(content) }

/*
  [140]  	STRING_LITERAL2	  ::=  	'"' ( ([^#x22#x5C#xA#xD]) | ECHAR )* '"'
*/
STRING_LITERAL2 "[140] STRING_LITERAL2"
  =  '"' content:([^\u0022\u005C\u000A\u000D] / ECHAR)* '"' { return flattenString(content) }

/*
  @todo check
  [141]  	STRING_LITERAL_LONG1	  ::=  	"'''" ( ( "'" | "''" )? ( [^'\] | ECHAR ) )* "'''"
*/
STRING_LITERAL_LONG1 "[141] STRING_LITERAL_LONG1"
  = "'''" content:([^\'\\] / ECHAR)* "'''"  { return flattenString(content) }

/*
  @todo check
  [142]  	STRING_LITERAL_LONG2	  ::=  	'"""' ( ( '"' | '""' )? ( [^"\] | ECHAR ) )* '"""'
*/
STRING_LITERAL_LONG2 "[142] STRING_LITERAL_LONG2"
  = '"""' content:([^\"\\] / ECHAR)* '"""'  { return flattenString(content) }

/*
  [143]  	ECHAR	  ::=  	'\' [tbnrf\"']
*/
ECHAR "[143] ECHAR"
  = '\\' [tbnrf\"\']

/*
  [144]  	NIL	  ::=  	'(' WS* ')'
*/

NIL "[144] NIL"
  = '(' WS* ')' {

      return  {token: "triplesnodecollection", 
               triplesContext:[], 
               chainSubject:[{token:'uri', value:"http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"}]};
}

/*
  [145]  	WS	  ::=  	#x20 | #x9 | #xD | #xA
*/
WS "[145] WS"
  = [\u0020]
  / [\u0009]
  / [\u000D]
  / [\u000A]
  / COMMENT


/*
  comment 	::= 	'#' ( [^#xA#xD] )*
*/
COMMENT " COMMENT"
  = '#'( [^#xA#xD] )*

/*
  [146]  	ANON	  ::=  	'[' WS* ']'
*/
ANON "[146] ANON"
  = '[' WS* ']'

/*
  [147]  	PN_CHARS_BASE	  ::=  	[A-Z] | [a-z] | [#x00C0-#x00D6] | [#x00D8-#x00F6] | [#x00F8-#x02FF] | [#x0370-#x037D] | [#x037F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
*/
PN_CHARS_BASE  "[147] PN_CHARS_BASE"
  = [A-Z]
  / [a-z]
  / [\u00C0-\u00D6]
  / [\u00D8-\u00F6]
  / [\u00F8-\u02FF]
  / [\u0370-\u037D]
  / [\u037F-\u1FFF]
  / [\u200C-\u200D]
  / [\u2070-\u218F]
  / [\u2C00-\u2FEF]
  / [\u3001-\uD7FF]
  / [\uF900-\uFDCF]
  / [\uFDF0-\uFFFD]
  / [\u1000-\uEFFF]

/*
  [148]  	PN_CHARS_U	  ::=  	PN_CHARS_BASE | '_'
*/

PN_CHARS_U "[148] PN_CHARS_U"
  = PN_CHARS_BASE
  / '_'

/*
  [149]  	VARNAME	  ::=  	( PN_CHARS_U | [0-9] ) ( PN_CHARS_U | [0-9] | #x00B7 | [#x0300-#x036F] | [#x203F-#x2040] )*
*/

VARNAME "[149] VARNAME"
  = init:( PN_CHARS_U / [0-9] ) rpart:( PN_CHARS_U / [0-9] / [\u00B7] / [\u0300-\u036F] / [\u203F-\u2040])* { return init+rpart.join('') }

/*
  [150]  	PN_CHARS	  ::=  	PN_CHARS_U | '-' | [0-9] | #x00B7 | [#x0300-#x036F] | [#x203F-#x2040]
*/

PN_CHARS "[150] PN_CHARS"
  = PN_CHARS_U
  / '-'
  / [0-9]
  / [\u00B7]
  / [\u0300-\u036F]
  / [\u203F-\u2040]

/*
  [151]  	PN_PREFIX	  ::=  	PN_CHARS_BASE ((PN_CHARS|'.')* PN_CHARS)?
*/

PN_PREFIX "[151] PN_PREFIX"
  = base:PN_CHARS_BASE rest:(PN_CHARS / '.')* { if(rest[rest.length-1] == '.'){
                                              	throw new Error("Wrong PN_PREFIX, cannot finish with '.'")
					      } else {
						  return base + rest.join('');
					      }}

/*
  [152]  	PN_LOCAL	  ::=  	( PN_CHARS_U | [0-9] ) ((PN_CHARS|'.')* PN_CHARS)?
*/

PN_LOCAL "[152] PN_LOCAL"
  = base:(PN_CHARS_U / [0-9]) rest:(PN_CHARS / '.')* { 
                                                       return base + rest.join('');
                                                     }
