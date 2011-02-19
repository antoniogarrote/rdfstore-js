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
  QueryUnit

/*
  [1]  	QueryUnit	  ::=  	Query
*/
QueryUnit "[1] QueryUnit"
  = Query

/*
  [2]  	Query	  ::=  	Prologue ( SelectQuery | ConstructQuery | DescribeQuery | AskQuery )
*/
Query "[2] Query"
  = Prologue ( SelectQuery / ConstructQuery / DescribeQuery / AskQuery )

/*
  [3]  	Prologue	  ::=  	BaseDecl? PrefixDecl*
*/
Prologue "[3] Prologue"
  = BaseDecl? PrefixDecl*

/*
  [4]  	BaseDecl	  ::=  	'BASE' IRI_REF
*/
BaseDecl "[4] BaseDecl"
  = 'BASE' IRI_REF

/*
  [5]  	PrefixDecl	  ::=  	'PREFIX' PNAME_NS IRI_REF
*/
PrefixDecl "[5] PrefixDecl"
  = 'PREFIX' PNAME_NS IRI_REF

/*
  [6]  	SelectQuery	  ::=  	SelectClause DatasetClause* WhereClause SolutionModifier BindingsClause
*/
SelectQuery "[6] SelectQuery"
  = SelectClause DatasetClause* WhereClause SolutionModifier BindingsClause

/*
  [7]  	SubSelect	  ::=  	SelectClause WhereClause SolutionModifier
*/
SubSelect "[7] SubSelect"
  = SelectClause WhereClause SolutionModifier

/*
  [8]  	SelectClause	  ::=  	'SELECT' ( 'DISTINCT' | 'REDUCED' )? ( ( Var | ( '(' Expression 'AS' Var ')' ) )+ | '*' )
*/
SelectClause "[8] SelectClause"
  = 'SELECT' ( 'DISTINCT' / 'REDUCED' )? ( ( Var / ( '(' Expression 'AS' Var ')' ) )+ / '*'  )

/*
  [9]  	ConstructQuery	  ::=  	'CONSTRUCT' ConstructTemplate DatasetClause* WhereClause SolutionModifier
*/
ConstructQuery "[9] ConstructQuery"
  = 'CONSTRUCT' ConstructTemplate DatasetClause* WhereClause SolutionModifier

/*
  [10]  	DescribeQuery	  ::=  	'DESCRIBE' ( VarOrIRIref+ | '*' ) DatasetClause* WhereClause? SolutionModifier
*/
DescribeQuery "[10] DescribeQuery"
  = 'DESCRIBE' ( VarOrIRIref+ / '*' ) DatasetClause* WhereClause? SolutionModifier

/*
[11]  	AskQuery	  ::=  	'ASK' DatasetClause* WhereClause
*/
AskQuery "[11] AskQuery"
  = 'ASK' DatasetClause* WhereClause

/*
  [12]  	DatasetClause	  ::=  	'FROM' ( DefaultGraphClause | NamedGraphClause )
*/
DatasetClause "[12] DatasetClause"
  = 'FROM' ( DefaultGraphClause / NamedGraphClause )

/*
  [13]  	DefaultGraphClause	  ::=  	SourceSelector
*/
DefaultGraphClause "[13] DefaultGraphClause"
  = SourceSelector

/*
  [14]  	NamedGraphClause	  ::=  	'NAMED' SourceSelector
*/
NamedGraphClause "[14] NamedGraphClause"
  = 'NAMED' SourceSelector

/*
  [15]  	SourceSelector	  ::=  	IRIref
*/
SourceSelector "[15] SourceSelector"
  = IRIref

/*
  [16]  	WhereClause	  ::=  	'WHERE'? GroupGraphPattern
*/
WhereClause "[16] WhereClause"
  = 'WHERE'? GroupGraphPattern

/*
  [17]  	SolutionModifier	  ::=  	GroupClause? HavingClause? OrderClause? LimitOffsetClauses?
*/
SolutionModifier "[17] SolutionModifier"
  = GroupClause? HavingClause? OrderClause? LimitOffsetClauses?

/*
  [18]  	GroupClause	  ::=  	'GROUP' 'BY' GroupCondition+
*/
GroupClause "[18] GroupClause"
  = 'GROUP' 'BY' GroupCondition+

/*
  [19]  	GroupCondition	  ::=  	( BuiltInCall | FunctionCall | '(' Expression ( 'AS' Var )? ')' | Var )
*/
GroupCondition "[19] GroupCondition"
  = ( BuiltInCall / FunctionCall / '(' Expression ( 'AS' Var )?  ')' / Var )

/*
  [20]  	HavingClause	  ::=  	'HAVING' HavingCondition+
*/
HavingClause "[20] HavingClause"
  = 'HAVING' HavingCondition+

/*
  [21]  	HavingCondition	  ::=  	Constraint
*/
HavingCondition "[21] HavingCondition"
  = Constraint

/*
  [22]  	OrderClause	  ::=  	'ORDER' 'BY' OrderCondition+
*/
OrderClause "[22] OrderClause"
  = 'ORDER' 'BY' OrderCondition+

/*
  [23]  	OrderCondition	  ::=  	 ( ( 'ASC' | 'DESC' ) BrackettedExpression ) | ( Constraint | Var )
*/
OrderCondition "[23] OrderCondition"
  = ( ( 'ASC' / 'DESC' ) BrackettedExpression ) / ( Constraint / Var )

/*
  [24]  	LimitOffsetClauses	  ::=  	( LimitClause OffsetClause? | OffsetClause LimitClause? )
*/
LimitOffsetClauses "[24] LimitOffsetClauses"
  = ( LimitClause OffsetClause? / OffsetClause LimitClause? )

/*
  [25]  	LimitClause	  ::=  	'LIMIT' INTEGER
*/
LimitClause "[25] LimitClause"
  = 'LIMIT' INTEGER

/*
  [26]  	OffsetClause	  ::=  	'OFFSET' INTEGER
*/
OffsetClause "[26] OffsetClause"
  = 'OFFSET' INTEGER

/*
  [27]  	BindingsClause	  ::=  	( 'BINDINGS' Var* '{' ( '(' BindingValue+ ')' | NIL )* '}' )?
*/
BindingsClause "[27] BindingsClause"
  = ( 'BINDINGS' Var* '{' ( '(' BindingValue+ ')' / NIL )* '}' )?

/*
  [28]  	BindingValue	  ::=  	IRIref |	RDFLiteral |	NumericLiteral |	BooleanLiteral |	'UNDEF'
*/
BindingValue "[28] BindingValue"
  = IRIref / RDFLiteral / NumericLiteral / BooleanLiteral / 'UNDEF'

/*
  [29]  	UpdateUnit	  ::=  	Update
*/
UpdateUnit "[29] UpdateUnit"
  = Update

/*
[30]  	Update	  ::=  	Prologue Update1 ( ';' Update? )?
*/
Update "[30] Update"
  = Prologue Update1 ( ';' Update? )?

/*
  [31]  	Update1	  ::=  	Load | Clear | Drop | Create | InsertData | DeleteData | DeleteWhere | Modify
*/
Update1 "[31] Update1"
  = Load / Clear / Drop / Create / InsertData / DeleteData / DeleteWhere / Modify

/*
[32]  	Load	  ::=  	'LOAD' IRIref ( 'INTO' GraphRef )?
*/
Load "[32] Load"
  = 'LOAD' IRIref ( 'INTO' GraphRef )?

/*
  [33]  	Clear	  ::=  	'CLEAR' 'SILENT'? GraphRefAll
*/
Clear "[33] Clear"
  = 'CLEAR' 'SILENT'? GraphRefAll

/*
  [34]  	Drop	  ::=  	'DROP' 'SILENT'? GraphRefAll
*/
Drop "[34] Drop"
  = 'DROP' 'SILENT'? GraphRefAll

/*
[35]  	Create	  ::=  	'CREATE' 'SILENT'? GraphRef
*/
Create "[35] Create"
  = 'CREATE' 'SILENT'? GraphRef

/*
  [36]  	InsertData	  ::=  	'INSERT' <WS*> ',DATA' QuadData
*/
InsertData "[36] InsertData"
  = 'INSERT' WS* ',DATA' QuadData

/*
  [37]  	DeleteData	  ::=  	'DELETE' <WS*> 'DATA' QuadData
*/
DeleteData "[37] DeleteData"
  = 'DELETE' WS* 'DATA' QuadData

/*
  [38]  	DeleteWhere	  ::=  	'DELETE' <WS*> 'WHERE' QuadPattern
*/
DeleteWhere "[38] DeleteWhere"
  = 'DELETE' WS* 'WHERE' QuadPattern

/*
  [39]  	Modify	  ::=  	( 'WITH' IRIref )? ( DeleteClause InsertClause? | InsertClause ) UsingClause* 'WHERE' GroupGraphPattern
*/
Modify "[39] Modify"
  = ('WITH' IRIref)? ( DeleteClause InsertClause? / InsertClause ) UsingClause* 'WHERE' GroupGraphPattern

/*
  [40]  	DeleteClause	  ::=  	'DELETE' QuadPattern
*/
DeleteClause "[40] DeleteClause"
  = 'DELETE' QuadPattern

/*
  [41]  	InsertClause	  ::=  	'INSERT' QuadPattern
*/
InsertClause "[41] InsertClause"
  = 'INSERT' QuadPattern

/*
  [42]  	UsingClause	  ::=  	'USING' ( IRIref | 'NAMED' IRIref )
*/
UsingClause "[42] UsingClause"
  = 'USING' ( IRIref / 'NAMED' IRIref )

/*
  [43]  	GraphRef	  ::=  	'GRAPH' IRIref
*/
GraphRef "[43] GraphRef"
  = 'GRAPH' IRIref


/*
  [44]  	GraphRefAll	  ::=  	GraphRef | 'DEFAULT' | 'NAMED' | 'ALL'
*/
GraphRefAll "[44] GraphRefAll"
  = GraphRef
  / 'DEFAULT'
  / 'NAMED'
  / 'ALL'

/*
  [45]  	QuadPattern	  ::=  	'{' Quads '}'
*/
QuadPattern "[45] QuadPattern"
  = '{' Quads '}'

/*
  [46]  	QuadData	  ::=  	'{' Quads '}'
*/
QuadData "[46] QuadData"
  = '{' Quads '}'

/*
  [47]  	Quads	  ::=  	TriplesTemplate? ( QuadsNotTriples '.'? TriplesTemplate? )*
*/
Quads "[47] Quads"
  = TriplesTemplate? ( QuadsNotTriples '.'? TriplesTemplate? )*

/*
  [48]  	QuadsNotTriples	  ::=  	'GRAPH' VarOrIRIref '{' TriplesTemplate? '}'
*/
QuadsNotTriples "[48] QuadsNotTriples"
  = 'GRAPH' VarOrIRIref '{' TriplesTemplate? '}'

/*
  [49]  	TriplesTemplate	  ::=  	TriplesSameSubject ( '.' TriplesTemplate? )?
*/
TriplesTemplate "[49] TriplesTemplate"
  = TriplesSameSubject ( '.' TriplesTemplate? )?

/*
  @todo
  @incomplete
  [50]  	GroupGraphPattern	  ::=  	'{' ( SubSelect | GroupGraphPatternSub ) '}'
*/
GroupGraphPattern "[50] GroupGraphPattern"
  = '{' SubSelect  '}'
  / '{' GroupGraphPatternSub '}'

/*
  [51]  	GroupGraphPatternSub	  ::=  	TriplesBlock? ( GraphPatternNotTriples '.'? TriplesBlock? )*
*/
GroupGraphPatternSub "[51] GroupGraphPatternSub"
  = TriplesBlock? ( GraphPatternNotTriples '.'? TriplesBlock? )*

/*
  [52]  	TriplesBlock	  ::=  	TriplesSameSubjectPath ( '.' TriplesBlock? )?
*/
TriplesBlock "[54] TriplesBlock"
  = TriplesSameSubjectPath ( '.' TriplesBlock? )?

/*
  [53]  	GraphPatternNotTriples	  ::=  	GroupOrUnionGraphPattern | OptionalGraphPattern | MinusGraphPattern | GraphGraphPattern | ServiceGraphPattern | Filter
*/
GraphPatternNotTriples "[53] GraphPatternNotTriples"
  = GroupOrUnionGraphPattern
  / OptionalGraphPattern
  / MinusGraphPattern
  / GraphGraphPattern
  / ServiceGraphPattern
  / Filter

/*
  [54]  	OptionalGraphPattern	  ::=  	'OPTIONAL' GroupGraphPattern
*/
OptionalGraphPattern "[54] OptionalGraphPattern"
  = 'OPTIONAL' GroupGraphPattern

/*
  [55]  	GraphGraphPattern	  ::=  	'GRAPH' VarOrIRIref GroupGraphPattern
*/
GraphGraphPattern "[55] GraphGraphPattern"
  = 'GRAPH' VarOrIRIref GroupGraphPattern

/*
  [56]  	ServiceGraphPattern	  ::=  	'SERVICE' VarOrIRIref GroupGraphPattern
*/
ServiceGraphPattern "[56] ServiceGraphPattern"
  = 'SERVICE' VarOrIRIref GroupGraphPattern

/*
  [57]  	MinusGraphPattern	  ::=  	'MINUS' GroupGraphPattern
*/
MinusGraphPattern "[57] MinusGraphPattern"
  = 'MINUS' GroupGraphPattern

/*
  [58]  	GroupOrUnionGraphPattern	  ::=  	GroupGraphPattern ( 'UNION' GroupGraphPattern )*
*/
GroupOrUnionGraphPattern "[58] GroupOrUnionGraphPattern"
  = GroupGraphPattern ( 'UNION' GroupGraphPattern )*

/*
  [59]  	Filter	  ::=  	'FILTER' Constraint
*/
Filter "[59] Filter"
  = 'FILTER' c:Constraint { return c }

/*
  [60]  	Constraint	  ::=  	BrackettedExpression | BuiltInCall | FunctionCall
*/
Constraint "[60] Constraint"
  = BrackettedExpression / BuiltInCall / FunctionCall

/*
  [61]  	FunctionCall	  ::=  	IRIref ArgList
*/
FunctionCall "[61] FunctionCall"
  = i:IRIref args:ArgList {
      var fcall = {};
      fall.token = "functioncall";
      fcall.fn = i;
      fcall.args = args.value;

      return fcall;
}


/*
  [62]  	ArgList	  ::=  	( NIL | '(' 'DISTINCT'? Expression ( ',' Expression )* ')' )
*/
ArgList "[62] ArgList"
  = NIL  {
      var args = {};
      args.token = 'args';
      args.value = [];
      return args;
}
  / '(' d:'DISTINCT'? e:Expression es:( ',' Expression)* ')' {
      cleanEx = [];

      for(var i=0; i<es.length; i++) {
          cleanEx.push(es[i][1]);
      }
      var args = {};
      args.token = 'args';
      args.value = [e].concat(cleanEx);

      if(d==="DISTINCT") {
          args.distinct = true;
      } else {
          args.distinct = false;
      }

      return args;
}

/*
  [63]  	ExpressionList	  ::=  	( NIL | '(' Expression ( ',' Expression )* ')' )
*/
ExpressionList "[63] ExpressionList"
  = NIL {
      var args = {};
      args.token = 'args';
      args.value = [];
      return args;
}
  / '(' e:Expression es:( ',' Expression)* ')' {
      cleanEx = [];

      for(var i=0; i<es.length; i++) {
          cleanEx.push(es[i][1]);
      }
      var args = {};
      args.token = 'args';
      args.value = [e].concat(cleanEx);

      return args;
}

/*
  [64]  	ConstructTemplate	  ::=  	'{' ConstructTriples? '}'
*/
ConstructTemplate "[64] ConstructTemplate"
  = '{' ConstructTriples? '}'


/*
  [65]  	ConstructTriples	  ::=  	TriplesSameSubject ( '.' ConstructTriples? )?
*/
ConstructTriples "[65] ConstructTriples"
  = TriplesSameSubject ( '.' ConstructTriples? )?

/*
  [66]  	TriplesSameSubject	  ::=  	VarOrTerm PropertyListNotEmpty |	TriplesNode PropertyList
*/
TriplesSameSubject "[66] TriplesSameSubject"
  = VarOrTerm PropertyListNotEmpty
  / TriplesNode PropertyList

/*
  [67]  	PropertyListNotEmpty	  ::=  	Verb ObjectList ( ';' ( Verb ObjectList )? )*
*/
PropertyListNotEmpty "[67] PropertyListNotEmpty"
  = Verb ObjectList ( ';' ( Verb ObjectList )? )*

/*
  [68]  	PropertyList	  ::=  	PropertyListNotEmpty?
*/
PropertyList "[68] PropertyList"
  = PropertyListNotEmpty?

/*
  [69]  	ObjectList	  ::=  	Object ( ',' Object )*
*/
ObjectList "[69] ObjectList"
  = Object ( ',' Object )*

/*
  [70]  	Object	  ::=  	GraphNode
*/
Object "[70] Object"
  = GraphNode

/*
  [71]  	Verb	  ::=  	VarOrIRIref | 'a'
*/
Verb "[71] Verb"
  = VarOrIRIref / 'a'

/*
  [72]  	TriplesSameSubjectPath	  ::=  	VarOrTerm PropertyListNotEmptyPath |	TriplesNode PropertyListPath
*/
TriplesSameSubjectPath "[72] TriplesSameSubject"
  = VarOrTerm PropertyListNotEmptyPath
  / TriplesNode PropertyListPath


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
  [87]  	TriplesNode	  ::=  	Collection |	BlankNodePropertyList
*/
TriplesNode "[87] TriplesNode"
  = Collection
  / BlankNodePropertyList

/*
  [88]  	BlankNodePropertyList	  ::=  	'[' PropertyListNotEmpty ']'
*/
BlankNodePropertyList "[88] BlankNodePropertyList"
  = '[' PropertyListNotEmpty ']'

/*
  [89]  	Collection	  ::=  	'(' GraphNode+ ')'
*/
Collection "[89] Collection"
  = '(' GraphNode+ ')'

/*
  [90]  	GraphNode	  ::=  	VarOrTerm |	TriplesNode
*/
GraphNode "[90] GraphNode"
  = (VarOrTerm / TriplesNode)

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
  [104]  	PrimaryExpression	  ::=  	BrackettedExpression | BuiltInCall | IRIrefOrFunction | RDFLiteral | NumericLiteral | BooleanLiteral | Var | Aggregate
*/
PrimaryExpression "[104] PrimaryExpression"
  = v:BrackettedExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'brackettedexpression';
      ex.value = v;

      return ex;
  }
  / v:BuiltInCall {
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
  / v:Var {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'primaryexpression';
      ex.primaryexprssion = 'var';
      ex.value = v;

      return ex;
  }

/*
  [105]  	BrackettedExpression	  ::=  	'(' Expression ')'
*/
BrackettedExpression "[105] BrackettedExpression"
  = '(' e:Expression ')' {
      return e;
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
  [108]  	ExistsFunc	  ::=  	'EXISTS' GroupGraphPattern
*/
ExistsFunc "[108] ExistsFunc"
  = 'EXISTS' GroupGraphPattern

/*
  [109]  	NotExistsFunc	  ::=  	'NOT EXISTS' GroupGraphPattern
*/
NotExistsFunc "[109] NotExistsFunc"
  = 'NOT EXISTS' GroupGraphPattern

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
  = '<' iri_ref:[^<>\"\{\} | ^\\ | \S]* '>' { return iri_ref.join('') }

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
