{
    flattenString = function(arrs) {
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
}

SPARQL =
  Expression

/*
  [95]  	Expression	  ::=  	ConditionalOrExpression
*/
Expression "[95] Expression"
  = ConditionalOrExpression

/*
  [96]  	ConditionalOrExpression	  ::=  	ConditionalAndExpression ( '||' ConditionalAndExpression )*
*/
ConditionalOrExpression "[96] ConditionalOrExpression"
  = v:ConditionalAndExpression vs:('||' ConditionalAndExpression)* {
      var exp = {};
      exp.token = "expression";
      exp.expressionType = "conditionalor";
      var ops = [v];

      for(var i=0; i<vs.length; i++) {
          ops.push(vs[i][1]);
      }

      exp.operands = ops;

      return exp;
}

/*
  [97]  	ConditionalAndExpression	  ::=  	ValueLogical ( '&&' ValueLogical )*
*/
ConditionalAndExpression "[97] ConditionalAndExpression"
  = v:ValueLogical vs:('&&' ValueLogical)* {
      var exp = {};
      exp.token = "expression";
      exp.expressionType = "conditionaland";
      var ops = [v];

      for(var i=0; i<vs.length; i++) {
          ops.push(vs[i][1]);
      }

      exp.operands = ops;

      return exp;
}

/*
  [98]  	ValueLogical	  ::=  	RelationalExpression
*/
ValueLogical "[98] ValueLogical"
  = RelationalExpression

/*
  @
  [99]  	RelationalExpression	  ::=  	NumericExpression ( '=' NumericExpression | '!=' NumericExpression | '<' NumericExpression | '>' NumericExpression | '<=' NumericExpression | '>=' NumericExpression | 'IN' ExpressionList | 'NOT IN' ExpressionList )?
*/
RelationalExpression "[99] RelationalExpression"
  = op1:NumericExpression op2:( '=' NumericExpression / '!=' NumericExpression / '<' NumericExpression / '>' NumericExpression / '<=' NumericExpression / '>=' NumericExpression)* {
      var exp = {};
      exp.expressionType = "relationalexpression"
      exp.op1 = op1;
      exp.ops = op2;

      return exp;
  }

/*
  [100]  	NumericExpression	  ::=  	AdditiveExpression
*/
NumericExpression "[100] NumericExpression"
  = AdditiveExpression

/*
  [101]  	AdditiveExpression	  ::=  	MultiplicativeExpression ( '+' MultiplicativeExpression | 
                                                                           '-' MultiplicativeExpression | 
                                                                           ( NumericLiteralPositive | NumericLiteralNegative ) ( ( '*' UnaryExpression ) | ( '/' UnaryExpression ) )? )*
*/
AdditiveExpression "[101] AdditiveExpression"
  = MultiplicativeExpression ( '+' MultiplicativeExpression / '-' MultiplicativeExpression / ( NumericLiteralNegative / NumericLiteralNegative ) ( ('*' UnaryExpression) / ('/' UnaryExpression))? )* 


/*
  [102]  	MultiplicativeExpression	  ::=  	UnaryExpression ( '*' UnaryExpression | '/' UnaryExpression )*
*/
MultiplicativeExpression "[102] MultiplicativeExpression"
  = exp:UnaryExpression exps:('*' UnaryExpression / '/' UnaryExpression)* {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'multiplicativeexpression';
      ex.factor = exp;
      ex.factors = [];
      for(var i=0; i<exps.length; i++) {
          var factor = exps[i];
          var fact = {};
          fact.operator = factor[0];
          fact.expression = factor[1];
          ex.factors.push(fact);
      }

      return ex;
}

/*
  [103]  	UnaryExpression	  ::=  	  '!' PrimaryExpression  |	'+' PrimaryExpression |	'-' PrimaryExpression |	PrimaryExpression
*/
UnaryExpression "[103] UnaryExpression"
  = '!' e:PrimaryExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'unaryexpression';
      ex.unaryexpression = "!";
      ex.expression = v;

      return ex;
  }
  / '+' v:PrimaryExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'unaryexpression';
      ex.unaryexpression = "+";
      ex.expression = v;

      return ex;
  }
  / '-' v:PrimaryExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'unaryexpression';
      ex.unaryexpression = "-";
      ex.expression = v;

      return ex;
  }
  / PrimaryExpression

/*
  @todo
  @incomplete
  [104]  	PrimaryExpression	  ::=  	BrackettedExpression | BuiltInCall | IRIrefOrFunction | RDFLiteral | NumericLiteral | BooleanLiteral | Var | Aggregate
*/
PrimaryExpression "[104] PrimaryExpression"
  = v:BuiltInCall {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'builtincall';
      ex.value = v;

      return ex;
  }
  / v:RDFLiteral {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'rdfliteral';
      ex.value = v;

      return ex;
  }
  / v:NumericLiteral {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'numericliteral';
      ex.value = v;

      return ex;
  }
  / v:BooleanLiteral {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'booleanliteral';
      ex.value = v;

      return ex;
  }
  / v:Aggregate {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'aggregate';
      ex.value = v;

      return ex;
  }


/*
  @todo
  @incomplete
  [106] BuiltInCall
*/
BuiltInCall "[106] BuiltInCall"
  = 'STR(' e:Expression ')' {
      var ex = {};
      ex.token = 'expression'
      ex.expressionType = 'builtincall'
      ex.builtincall = 'str'
      ex.expression = e

      return ex;
  }
  / RegexExpression
/*
  [107]  	RegexExpression	  ::=  	'REGEX' '(' Expression ',' Expression ( ',' Expression )? ')'
*/
RegexExpression "[107] RegexExpression"
  = 'REGEX' '(' e1:Expression ',' e2:Expression eo:( ',' Expression)? ')' {
      var regex = {};
      regex.token = 'expression';
      regex.expressionType = 'regex';
      regex.expression1 = e1;
      regex.expression2 = e2;
      regex.optionalExpression = eo;

      return regex;
}

/*
  @todo
  @waiting
  [108]  	ExistsFunc	  ::=  	'EXISTS' GroupGraphPattern
*/
//ExistsFunc "[108] ExistsFunc"
//  = 'EXISTS' GroupGraphPattern

/*
  @todo
  @waiting
  [109]  	NotExistsFunc	  ::=  	'NOT EXISTS' GroupGraphPattern
*/
//NotExistsFunc "[109] NotExistsFunc"
//  = 'NOT EXISTS' GroupGraphPattern

/*
  @todo
  @incomplete
  [110]  	Aggregate	  ::=  	( 'COUNT' '(' 'DISTINCT'? ( '*' | Expression ) ')' | 
                                          'SUM' '(' 'DISTINCT'? Expression ')' | 
                                          'MIN' '(' 'DISTINCT'? Expression ')' | 
                                          'MAX' '(' 'DISTINCT'? Expression ')' | 
                                          'AVG' '(' 'DISTINCT'? Expression ')' | 
                                          'SAMPLE' '(' 'DISTINCT'? Expression ')' | 
                                          'GROUP_CONCAT' '(' 'DISTINCT'? Expression ( ';' 'SEPARATOR' '=' String )? ')' )
*/
Aggregate "[110] Aggregate"
  = 'COUNT' '(' d:'DISTINCT'?  e:('*' / Expression) ')' {
      exp = {};
      exp.token = 'expression'
      exp.rexpressionType = 'aggregate'
      exp.aggregateType = 'count'
      exp.distinct = d
      exp.expression = e

      return exp
      
  }
  / 'SUM' '(' d:'DISTINCT'? e:Expression ')' {
      exp = {};
      exp.token = 'expression'
      exp.rexpressionType = 'aggregate'
      exp.aggregateType = 'sum'
      exp.distinct = d
      exp.expression = e

      return exp
      
  }
  / 'MIN' '(' d:'DISTINCT'? e:Expression ')' {
      exp = {};
      exp.token = 'expression'
      exp.rexpressionType = 'aggregate'
      exp.aggregateType = 'min'
      exp.distinct = d
      exp.expression = e

      return exp
      
  }
  / 'MAX' '(' d:'DISTINCT'? e:Expression ')' {
      exp = {};
      exp.token = 'expression'
      exp.rexpressionType = 'aggregate'
      exp.aggregateType = 'max'
      exp.distinct = d
      exp.expression = e

      return exp
      
  }
  / 'AVG' '(' d:'DISTINCT'? e:Expression ')' {
      exp = {};
      exp.token = 'expression'
      exp.rexpressionType = 'aggregate'
      exp.aggregateType = 'avg'
      exp.distinct = d
      exp.expression = e

      return exp
      
  }

/*
  [112]  	RDFLiteral	  ::=  	String ( LANGTAG | ( '^^' IRIref ) )?
*/
RDFLiteral "[112] RDFLiteral"
  = s:String e:( LANGTAG / ('^^' IRIref) )? {
      if(typeof(e) === "string" && e.length > 0) {
          return {token:'literal', value:s.value, lang:e.slice(1), type:null}
      } else {
          if(typeof(e) === "object") {
              e.shift();
              return {token:'literal', value:s.value, lang:null, type:e }
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
  = 'true' { return true }
  / 'false' { return false }

/*
  [118]  	String	  ::=  	STRING_LITERAL1 | STRING_LITERAL2 | STRING_LITERAL_LONG1 | STRING_LITERAL_LONG2
*/
String "[118] String"
  = s:STRING_LITERAL1 { return {token:'string', value:s} }
  / s:STRING_LITERAL2 { return {token:'string', value:s} }
  / s:STRING_LITERAL_LONG1 { return {token:'string', value:s} }
  / s:STRING_LITERAL_LONG2 { return {token:'string', value:s} }

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
  / ANON { return {token:'blank', label:null} }

/*
  [122]  	IRI_REF	  ::=  	'<' ([^<>"{}|^`\]-[#x00-#x20])* '>'
*/
IRI_REF "[122] IRI_REF"
  = '<' iri_ref:[^<>\"\{\} / ^\\ / \S]* '>' { return iri_ref }

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
          return "@"+a.join('');
      } else {
          return "@"+a.join('')+"-"+b[0][1].join('');
      }
}

/*
  [129]  	INTEGER	  ::=  	[0-9]+
*/
INTEGER "[129] INTEGER"
  = d:[0-9]+ { return eval(flattenString(d))}

/*
  [130]  	DECIMAL	  ::=  	[0-9]+ '.' [0-9]* | '.' [0-9]+
*/
DECIMAL "[130] DECIMAL"
  = a:[0-9]+ b:'.' c:[0-9]* { return eval(flattenString([a,b,c])) }
  / a:'.' b:[0-9]+ { return eval(flattenString([a,b])) }

/*
  [131]  	DOUBLE	  ::=  	[0-9]+ '.' [0-9]* EXPONENT | '.' ([0-9])+ EXPONENT | ([0-9])+ EXPONENT
*/
DOUBLE "[131] DOUBLE"
  = a:[0-9]+ b:'.' c:[0-9]* e:EXPONENT { return eval(flattenString([a,b,c,e])) }
  / a:'.' b:[0-9]+ c:EXPONENT { return eval(flattenString([a,b,c])) }
  / a:[0-9]+ b:EXPONENT { return eval(flattenString([a,b])) }

/*
  [132]  	INTEGER_POSITIVE	  ::=  	'+' INTEGER
*/
INTEGER_POSITIVE "[132] INTEGER_POSITIVE"
  = '+' d:INTEGER { return d }

/*
  [133]  	DECIMAL_POSITIVE	  ::=  	'+' DECIMAL
*/
DECIMAL_POSITIVE "[133] DECIMAL_POSITIVE"
  = '+' d:DECIMAL { return d }

/*
  [134]  	DOUBLE_POSITIVE	  ::=  	'+' DOUBLE
*/
DOUBLE_POSITIVE "[134] DOUBLE_POSITIVE"
  = '+' d:DOUBLE { return d }

/*
  [135]  	INTEGER_NEGATIVE	  ::=  	'-' INTEGER
*/
INTEGER_NEGATIVE "[135] INTEGER_NEGATIVE"
  = '-' d:INTEGER {return -d }

/*
  [136]  	DECIMAL_NEGATIVE	  ::=  	'-' DECIMAL
*/
DECIMAL_NEGATIVE "[136] DECIMAL_NEGATIVE"
  = '-' d:DECIMAL { return -d }
/*
  [137]  	DOUBLE_NEGATIVE	  ::=  	'-' DOUBLE
*/
DOUBLE_NEGATIVE "[137] DOUBLE_NEGATIVE"
  = '-' d:DOUBLE { return -d }

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
  = ''''' content:([^\'\\] / ECHAR)* '''''  { return flattenString(content) }

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
  = '(' WS* ')'

/*
  [145]  	WS	  ::=  	#x20 | #x9 | #xD | #xA
*/
WS "[145] WS"
  = [\u0020]
  / [\u0009]
  / [\u000D]
  / [\u000A]


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
  = base:(PN_CHARS_U / [0-9]) rest:(PN_CHARS / '.')* { if(rest[rest.length-1] == '.'){
                                                       throw new Error("Wrong PN_LOCAL, cannot finish with '.'")
                                                     } else {
                                                         return base + rest.join('');
                                                     }}
