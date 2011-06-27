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

    var arrayToString = function(array) {
        var tmp = "";
        for(var i=0; i<array.length; i++) {
            tmp = tmp + array[i];            
        }

        return tmp.toUpperCase();
    }
}

SPARQL =
  QueryUnit
  / UpdateUnit

/*
  [1]  	QueryUnit	  ::=  	Query
*/
QueryUnit "[1] QueryUnit"
  = Query

/*
  [2]  	Query	  ::=  	Prologue ( SelectQuery | ConstructQuery | DescribeQuery | AskQuery )
*/
Query "[2] Query"
  = p:Prologue q:( SelectQuery / ConstructQuery / DescribeQuery / AskQuery ) {
      return {token: 'query',
              kind: 'query',
              prologue: p,
              units: [q]};
}

/*
  [3]  	Prologue	  ::=  	BaseDecl? PrefixDecl*
*/
Prologue "[3] Prologue"
  = b:BaseDecl? WS* pfx:PrefixDecl* {
      return { token: 'prologue',
               base: b,
               prefixes: pfx }
}

/*
  [4]  	BaseDecl	  ::=  	'BASE' IRI_REF
*/
BaseDecl "[4] BaseDecl"
  = WS* ('B'/'b')('A'/'a')('S'/'s')('E'/'e') WS* i:IRI_REF {
      registerDefaultPrefix(i);

      base = {};
      base.token = 'base';
      base.value = i;

      return base;
}

/*
  [5]  	PrefixDecl	  ::=  	'PREFIX' PNAME_NS IRI_REF
*/
PrefixDecl "[5] PrefixDecl"
  = WS* ('P'/'p')('R'/'r')('E'/'e')('F'/'f')('I'/'i')('X'/'x')  WS* p:PNAME_NS  WS* l:IRI_REF {

      registerPrefix(p,l);

      prefix = {};
      prefix.token = 'prefix';
      prefix.prefix = p;
      prefix.local = l;

      return prefix;
}

/*
  @todo
  @incomplete
  @semantics
  [6]  	SelectQuery	  ::=  	SelectClause DatasetClause* WhereClause SolutionModifier BindingsClause
*/
SelectQuery "[6] SelectQuery"
  = s:SelectClause WS* gs:DatasetClause* WS* w:WhereClause WS* sm:SolutionModifier WS* BindingsClause {

      var dataset = {named:[], default:[]};
      for(var i=0; i<gs.length; i++) {
          var g = gs[i];
          if(g.kind === 'default') {
              dataset['default'].push(g.graph);
          } else {
              dataset['named'].push(g.graph)
          }
      }


      if(dataset['named'].length === 0 && dataset['default'].length === 0) {
          dataset['default'].push({token:'uri', 
                                   prefix:null, 
                                   suffix:null, 
                                   value:'https://github.com/antoniogarrote/rdfstore-js#default_graph'});
      }

      var query = {};
      query.kind = 'select';
      query.token = 'executableunit'
      query.dataset = dataset;
      query.projection = s.vars;
      query.modifier = s.modifier;
      query.pattern = w
      
      if(sm!=null && sm.limit!=null) {
          query.limit = sm.limit;
      }
      if(sm!=null && sm.offset!=null) {
          query.offset = sm.offset;
      }
      if(sm!=null && (sm.order!=null && sm.order!="")) {
          query.order = sm.order;
      }
      if(sm!=null && sm.group!=null) {
          query.group = sm.group;
      }

      return query
}

/*
  [7]  	SubSelect	  ::=  	SelectClause WhereClause SolutionModifier
*/
SubSelect "[7] SubSelect"
  = SelectClause WhereClause SolutionModifier

/*
  [8]  	SelectClause	  ::=  	'SELECT' ( 'DISTINCT' | 'REDUCED' )? ( ( Var | ( '(' Expression 'AS' Var ')' ) )+ | '*' )
*/
SelectClause "[8] SelectClause"
    = WS* ('S'/'s')('E'/'e')('L'/'l')('E'/'e')('C'/'c')('T'/'t') WS* mod:( ('D'/'d')('I'/'i')('S'/'s')('T'/'t')('I'/'i')('N'/'n')('C'/'c')('T'/'t') / ('R'/'r')('E'/'e')('D'/'d')('U'/'u')('C'/'c')('E'/'e')('D'/'d') )? WS* proj:( ( ( WS* Var WS* ) / ( WS* '(' WS* Expression WS* ('A'/'a')('S'/'s') WS* Var WS* ')' WS* ) )+ / ( WS* '*' WS* )  ) {
     var vars = [];
      if(proj.length === 3 && proj[1]==="*") {
          return {vars: [{token: 'variable', kind:'*'}], modifier:arrayToString(mod)};
      }

      for(var i=0; i< proj.length; i++) {
          var aVar = proj[i];

          if(aVar.length === 3) {
              vars.push({token: 'variable', kind:'var', value:aVar[1]});
          } else {
              vars.push({token: 'variable', kind:'aliased', expression: aVar[3], alias:aVar[8]})
          }
      }

      return {vars: vars, modifier:arrayToString(mod)};
}

/*
  [9]  	ConstructQuery	  ::=  	'CONSTRUCT' ConstructTemplate DatasetClause* WhereClause SolutionModifier
*/
ConstructQuery "[9] ConstructQuery"
    = WS* ('C'/'c')('O'/'o')('N'/'n')('S'/'s')('T'/'t')('R'/'r')('U'/'u')('C'/'c')('T'/'t') WS* t:ConstructTemplate WS* gs:DatasetClause* WS* w:WhereClause WS* sm:SolutionModifier {
      var dataset = {named:[], default:[]};
      for(var i=0; i<gs.length; i++) {
          var g = gs[i];
          if(g.kind === 'default') {
              dataset['default'].push(g.graph);
          } else {
              dataset['named'].push(g.graph)
          }
      }


      if(dataset['named'].length === 0 && dataset['default'].length === 0) {
          dataset['default'].push({token:'uri', 
                                   prefix:null, 
                                   suffix:null, 
                                   value:'https://github.com/antoniogarrote/rdfstore-js#default_graph'});
      }

      var query = {};
      query.kind = 'construct';
      query.token = 'executableunit'
      query.dataset = dataset;
      query.template = t;
      query.pattern = w
      
      if(sm!=null && sm.limit!=null) {
          query.limit = sm.limit;
      }
      if(sm!=null && sm.offset!=null) {
          query.offset = sm.offset;
      }
      if(sm!=null && (sm.order!=null && sm.order!="")) {
          query.order = sm.order;
      }
      return query

}

/*
  [10]  	DescribeQuery	  ::=  	'DESCRIBE' ( VarOrIRIref+ | '*' ) DatasetClause* WhereClause? SolutionModifier
*/
DescribeQuery "[10] DescribeQuery"
  = 'DESCRIBE' ( VarOrIRIref+ / '*' ) DatasetClause* WhereClause? SolutionModifier

/*
[11]  	AskQuery	  ::=  	'ASK' DatasetClause* WhereClause
*/
AskQuery "[11] AskQuery"
    = WS* ('A'/'a')('S'/'s')('K'/'k') WS* gs:DatasetClause* WS* w:WhereClause {
      var dataset = {'named':[], 'default':[]};
      for(var i=0; i<gs.length; i++) {
          var g = gs[i];
          if(g.kind === 'default') {
              dataset['default'].push(g.graph);
          } else {
              dataset['named'].push(g.graph)
          }
      }


      if(dataset['named'].length === 0 && dataset['default'].length === 0) {
          dataset['default'].push({token:'uri', 
                                   prefix:null, 
                                   suffix:null, 
                                   value:'https://github.com/antoniogarrote/rdfstore-js#default_graph'});
      }

      var query = {};
      query.kind = 'ask';
      query.token = 'executableunit'
      query.dataset = dataset;
      query.pattern = w

      return query
}

/*
  [12]  	DatasetClause	  ::=  	'FROM' ( DefaultGraphClause | NamedGraphClause )
*/
DatasetClause "[12] DatasetClause"
  = ('F'/'f')('R'/'r')('O'/'o')('M'/'m') WS* gs:( DefaultGraphClause / NamedGraphClause ) WS* {
      return gs;
}

/*
  [13]  	DefaultGraphClause	  ::=  	SourceSelector
*/
DefaultGraphClause "[13] DefaultGraphClause" = WS* s:SourceSelector {
    return {graph:s , kind:'default', token:'graphClause'}
}

/*
  [14]  	NamedGraphClause	  ::=  	'NAMED' SourceSelector
*/
NamedGraphClause "[14] NamedGraphClause"
  = ('N'/'n')('A'/'a')('M'/'m')('E'/'e')('D'/'d') WS* s:SourceSelector {      
      return {graph:s, kind:'named', token:'graphCluase'};
}

/*
  [15]  	SourceSelector	  ::=  	IRIref
*/
SourceSelector "[15] SourceSelector"
  = IRIref

/*
  [16]  	WhereClause	  ::=  	'WHERE'? GroupGraphPattern
*/
WhereClause "[16] WhereClause"
  = (('W'/'w')('H'/'h')('E'/'e')('R'/'r')('E'/'e'))? WS* g:GroupGraphPattern WS* {
      return g;
}

/*
  [17]  	SolutionModifier	  ::=  	GroupClause? HavingClause? OrderClause? LimitOffsetClauses?
*/
SolutionModifier "[17] SolutionModifier"
  = gc:GroupClause? HavingClause? oc:OrderClause? lo:LimitOffsetClauses? {
      var acum = {};
      if(lo != null) {
          if(lo.limit != null) {
              acum.limit = lo.limit;
          } 
          if(lo.offset != null) {
              acum.offset = lo.offset;
          }
      }

      if(gc != null) {
          acum.group = gc;
      }

      acum.order = oc;

      return acum
}

/*
  [18]  	GroupClause	  ::=  	'GROUP' 'BY' GroupCondition+
*/
GroupClause "[18] GroupClause"
  = ('G'/'g')('R'/'r')('O'/'o')('U'/'u')('P'/'p') WS* ('B'/'b')('Y'/'y') WS* conds:GroupCondition+ {
      return conds;
}

/*
  [19]  	GroupCondition	  ::=  	( BuiltInCall | FunctionCall | '(' Expression ( 'AS' Var )? ')' | Var )
*/
GroupCondition "[19] GroupCondition"
  = b:BuiltInCall {
      return b;
}
  / f:FunctionCall {
      return f;
}
  / WS* '(' WS* e:Expression WS*  alias:( ('A'/'a')('S'/'s') WS* Var )?  WS* ')' WS* {
      if(alias.length != 0) {
          return {token: 'aliased_expression',
                  expression: e,
                  alias: alias[3] };
      } else {
          return e;
      }
}
  / v:Var {
      return v;
}

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
  = ('O'/'o')('R'/'r')('D'/'d')('E'/'e')('R'/'r') WS* ('B'/'b')('Y'/'y') WS* os:OrderCondition+ WS* {
      return os;
}

/*
  [23]  	OrderCondition	  ::=  	 ( ( 'ASC' | 'DESC' ) BrackettedExpression ) | ( Constraint | Var )
*/
OrderCondition "[23] OrderCondition"
  = ( direction:( 'ASC' / 'DESC' ) WS* e:BrackettedExpression WS* ) {
      return { direction: direction, expression:e };
}
/ e:( Constraint / Var ) WS* {
    if(e.token === 'var') {
        e = { token:'expression', 
              expressionType:'atomic',
              primaryexpression: 'var',
              value: e };
    }
    return { direction: 'ASC', expression:e };
}

/*
  [24]  	LimitOffsetClauses	  ::=  	( LimitClause OffsetClause? | OffsetClause LimitClause? )
*/
LimitOffsetClauses "[24] LimitOffsetClauses"
  = cls:( LimitClause OffsetClause? / OffsetClause LimitClause? ) {
      var acum = {};
      for(var i=0; i<cls.length; i++) {
          var cl = cls[i];
          if(cl.limit != null) {
              acum['limit'] = cl.limit;
          } else if(cl.offset != null){
              acum['offset'] = cl.offset;
          }
      }

      return acum;
}

/*
  [25]  	LimitClause	  ::=  	'LIMIT' INTEGER
*/
LimitClause "[25] LimitClause"
  = ('L'/'l')('I'/'i')('M'/'m')('I'/'i')('T'/'t') WS* i:INTEGER WS* {
  return { limit:parseInt(i.value) };
}

/*
  [26]  	OffsetClause	  ::=  	'OFFSET' INTEGER
*/
OffsetClause "[26] OffsetClause"
  = ('O'/'o')('F'/'f')('F'/'f')('S'/'s')('E'/'e')('T'/'t') WS* i:INTEGER WS* {
  return { offset:parseInt(i.value) };
}

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
  = p:Prologue WS* u:Update1 us:(WS* ';' WS* Update? )? {

      var query = {};
      query.token = 'query';
      query.kind = 'update'
      query.prologue = p;

     var units = [u];

     if(us.length != null && us[3] != null && us[3].units != null) {
         units = units.concat(us[3].units);
     }

     query.units = units;
     return query;
}


/*
  [31]  	Update1	  ::=  	Load | Clear | Drop | Create | InsertData | DeleteData | DeleteWhere | Modify
*/
Update1 "[31] Update1"
  = Load / Clear / Drop / Create / InsertData / DeleteData / DeleteWhere / Modify

/*
[32]  	Load	  ::=  	'LOAD' IRIref ( 'INTO' GraphRef )?
*/
Load "[32] Load"
  = ('L'/'l')('O'/'o')('A'/'a')('D'/'d') WS* sg:IRIref WS* dg:( ('I'/'i')('N'/'n')('T'/'t')('O'/'o') WS* GraphRef)? {
      var query = {};
      query.kind = 'load';
      query.token = 'executableunit'
      query.sourceGraph = sg;
      query.destinyGraph = dg[5];
      
      return query;
}


/*
  [33]  	Clear	  ::=  	'CLEAR' 'SILENT'? GraphRefAll
*/
Clear "[33] Clear"
  = ('C'/'c')('L'/'l')('E'/'e')('A'/'a')('R'/'r') WS* (('S'/'s')('I'/'i')('L'/'l')('E'/'e')('N'/'n')('T'/'t'))? WS* ref:GraphRefAll {
      var query = {};
      query.kind = 'clear';
      query.token = 'executableunit'
      query.destinyGraph = ref;
      
      return query;
}

/*
  [34]  	Drop	  ::=  	'DROP' 'SILENT'? GraphRefAll
*/
Drop "[34] Drop"
  = ('D'/'d')('R'/'r')('O'/'o')('P'/'p')  WS* (('S'/'s')('I'/'i')('L'/'l')('E'/'e')('N'/'n')('T'/'t'))? WS* ref:GraphRefAll {
      var query = {};
      query.kind = 'drop';
      query.token = 'executableunit'
      query.destinyGraph = ref;
      
      return query;
}

/*
[35]  	Create	  ::=  	'CREATE' 'SILENT'? GraphRef
*/
Create "[35] Create"
  = ('C'/'c')('R'/'r')('E'/'e')('A'/'a')('T'/'t')('E'/'e') WS* (('S'/'s')('I'/'i')('L'/'l')('E'/'e')('N'/'n')('T'/'t'))? WS* ref:GraphRef {
      var query = {};
      query.kind = 'create';
      query.token = 'executableunit'
      query.destinyGraph = ref;
      
      return query;
}

/*
  [36]  	InsertData	  ::=  	'INSERT' <WS*> ',DATA' QuadData
*/
InsertData "[36] InsertData"
  = ('I'/'i')('N'/'n')('S'/'s')('E'/'e')('R'/'r')('T'/'t') WS* ('D'/'d')('A'/'a')('T'/'t')('A'/'a') WS* qs:QuadData {
      var query = {};
      query.kind = 'insertdata';
      query.token = 'executableunit'
      query.quads = qs;

      return query;
}

/*
  [37]  	DeleteData	  ::=  	'DELETE' <WS*> 'DATA' QuadData
*/
DeleteData "[37] DeleteData"
  =  ('D'/'d')('E'/'e')('L'/'l')('E'/'e')('T'/'t')('E'/'e') WS* ('D'/'d')('A'/'a')('T'/'t')('A'/'a') qs:QuadData {
      var query = {};
      query.kind = 'deletedata';
      query.token = 'executableunit'
      query.quads = qs;

      return query;
}

/*
  [38]  	DeleteWhere	  ::=  	'DELETE' <WS*> 'WHERE' QuadPattern
*/
DeleteWhere "[38] DeleteWhere"
  = ('D'/'d')('E'/'e')('L'/'l')('E'/'e')('T'/'t')('E'/'e') WS* ('W'/'w')('H'/'h')('E'/'e')('R'/'r')('E'/'e') WS* p:GroupGraphPattern {
      var query = {};
      query.kind = 'modify';
      query.pattern = p;
      query.with = null;
      query.using = null;

      var quads = [];


      var patternsCollection = p.patterns[0];
      if(patternsCollection.triplesContext == null && patternsCollection.patterns!=null) {
          patternsCollection = patternsCollection.patterns[0].triplesContext;
      } else {
          patternsCollection = patternsCollection.triplesContext;
      }

      for(var i=0; i<patternsCollection.length; i++) {
          var quad = {};
          var contextQuad = patternsCollection[i];

          quad['subject'] = contextQuad['subject'];
          quad['predicate'] = contextQuad['predicate'];
          quad['object'] = contextQuad['object'];
          quad['graph'] = contextQuad['graph'];

          quads.push(quad);
      }

      query.delete = quads;

      return query;
}

/*
  [39]  	Modify	  ::=  	( 'WITH' IRIref )? ( DeleteClause InsertClause? | InsertClause ) UsingClause* 'WHERE' GroupGraphPattern
*/
Modify "[39] Modify"
  = wg:(('W'/'w')('I'/'i')('T'/'t')('H'/'h') WS* IRIref)? WS* dic:( DeleteClause WS* InsertClause? / InsertClause ) WS* uc:UsingClause* WS* ('W'/'w')('H'/'h')('E'/'e')('R'/'r')('E'/'e') WS* p:GroupGraphPattern WS* {
      var query = {};
      query.kind = 'modify';

      if(wg != "") {
          query.with = wg[5];
      } else {
          query.with = null;
      }


      if(dic.length === 3 && dic[2] === '') {
          query.delete = dic[0];
          query.insert = null;
      } else if(dic.length === 3 && dic[0].length != null && dic[1].length != null && dic[2].length != null) {
          query.delete = dic[0];
          query.insert = dic[2];
      } else  {
          query.insert = dic;
          query.delete = null;
      }

      if(uc != '') {
          query.using = uc;
      }

      query.pattern = p;

      return query;
}

/*
  [40]  	DeleteClause	  ::=  	'DELETE' QuadPattern
*/
DeleteClause "[40] DeleteClause"
  = ('D'/'d')('E'/'e')('L'/'l')('E'/'e')('T'/'t')('E'/'e') q:QuadPattern {
      return q;
}

/*
  [41]  	InsertClause	  ::=  	'INSERT' QuadPattern
*/
InsertClause "[41] InsertClause"
  = ('I'/'i')('N'/'n')('S'/'s')('E'/'e')('R'/'r')('T'/'t') q:QuadPattern {
  return q;
}

/*
  [42]  	UsingClause	  ::=  	'USING' ( IRIref | 'NAMED' IRIref )
*/
UsingClause "[42] UsingClause"
  = WS* ('U'/'u')('S'/'s')('I'/'i')('N'/'n')('G'/'g') WS* g:( IRIref / ('N'/'n')('A'/'a')('M'/'m')('E'/'e')('D'/'d') WS* IRIref ) {
      if(g.length!=null) {
          return {kind: 'named', uri: g[6]};
      } else {
          return {kind: 'default', uri: g};
      }
}

/*
  [43]  	GraphRef	  ::=  	'GRAPH' IRIref
*/
GraphRef "[43] GraphRef"
  = ('G'/'g')('R'/'r')('A'/'a')('P'/'p')('H'/'h') WS* i:IRIref {
      return i;
}


/*
  [44]  	GraphRefAll	  ::=  	GraphRef | 'DEFAULT' | 'NAMED' | 'ALL'
*/
GraphRefAll "[44] GraphRefAll"
  = g:GraphRef {
      return g;
}
  / ('D'/'d')('E'/'e')('F'/'f')('A'/'a')('U'/'u')('L'/'l')('T'/'t') {
      return 'default';
}
  / ('N'/'n')('A'/'a')('M'/'m')('E'/'e')('D'/'d') {
      return 'named';
}
  / ('A'/'a')('L'/'l')('L'/'l') {
      return 'all';
}

/*
  [45]  	QuadPattern	  ::=  	'{' Quads '}'
*/
QuadPattern "[45] QuadPattern"
  = WS* '{' WS* qs:Quads WS* '}' WS* {
      return qs.quadsContext;
}

/*
  [46]  	QuadData	  ::=  	'{' Quads '}'
*/
QuadData "[46] QuadData"
  = WS* '{' WS* qs:Quads WS* '}' WS* {
      return qs.quadsContext;
}

/*
  [47]  	Quads	  ::=  	TriplesTemplate? ( QuadsNotTriples '.'? TriplesTemplate? )*
*/
Quads "[47] Quads"
  = ts:TriplesTemplate? qs:( QuadsNotTriples '.'? TriplesTemplate? )* {
      var quads = []
      if(ts.triplesContext != null && ts.triplesContext != null) {
        for(var i=0; i<ts.triplesContext.length; i++) {
            var triple = ts.triplesContext[i]
            triple.graph = null;
            quads.push(triple)
        }
      }

      if(qs && qs.length>0 && qs[0].length > 0) {
          quads = quads.concat(qs[0][0].quadsContext);

          if( qs[0][2] != null && qs[0][2].triplesContext != null) {
            for(var i=0; i<qs[0][2].triplesContext.length; i++) {
                var triple = qs[0][2].triplesContext[i]
                triple.graph = null;
                quads.push(triple)
            }
          }
      }

      return {token:'quads',
              quadsContext: quads}
}

/*
  [48]  	QuadsNotTriples	  ::=  	'GRAPH' VarOrIRIref '{' TriplesTemplate? '}'
*/
QuadsNotTriples "[48] QuadsNotTriples"
  = WS* ('G'/'g')('R'/'r')('A'/'a')('P'/'p')('H'/'h') WS* g:VarOrIRIref WS* '{' WS* ts:TriplesTemplate? WS* '}' WS* {
      var quads = []
      for(var i=0; i<ts.triplesContext.length; i++) {
          var triple = ts.triplesContext[i]
          triple.graph = g;
          quads.push(triple)
      }

      return {token:'quadsnottriples',
              quadsContext: quads}
}

/*
  [49]  	TriplesTemplate	  ::=  	TriplesSameSubject ( '.' TriplesTemplate? )?
*/
TriplesTemplate "[49] TriplesTemplate"
  = b:TriplesSameSubject bs:(WS* '.' WS* TriplesTemplate? )? {
     var triples = b.triplesContext;
     var toTest = null;
      if(typeof(bs) === 'object') {
            if(bs.length != null) {
                  if(bs[3].triplesContext!=null) {
                     triples = triples.concat(bs[3].triplesContext);
              }
           }
      }

     return {token:'triplestemplate',
             triplesContext: triples}
}

/*
  @todo
  @incomplete
  [50]  	GroupGraphPattern	  ::=  	'{' ( SubSelect | GroupGraphPatternSub ) '}'
*/
GroupGraphPattern "[50] GroupGraphPattern"
  = '{' WS* p:SubSelect  WS* '}' {
      return p;
}
  / '{' WS* p:GroupGraphPatternSub WS* '}' {
      return p;
}

/*
  [51]  	GroupGraphPatternSub	  ::=  	TriplesBlock? ( GraphPatternNotTriples '.'? TriplesBlock? )*
*/
GroupGraphPatternSub "[51] GroupGraphPatternSub"
  = tb:TriplesBlock? WS* tbs:( GraphPatternNotTriples WS* '.'? WS* TriplesBlock? )* {
      var subpatterns = [];
      if(tb != null && tb != []) {
          subpatterns.push(tb);
      }

      for(var i=0; i<tbs.length; i++) {
          for(var j=0; j< tbs[i].length; j++) {
              if(tbs[i][j].token != null) {
                  subpatterns.push(tbs[i][j]);
              }
          }
      }

      var compactedSubpatterns = [];

      var currentBasicGraphPatterns = [];
      var currentFilters = [];

      for(var i=0; i<subpatterns.length; i++) {
          if(subpatterns[i].token!='triplespattern' && subpatterns[i].token != 'filter') {
              if(currentBasicGraphPatterns.length != 0 || currentFilters.length != 0) {
                  var triplesContext = [];
                  for(var j=0; j<currentBasicGraphPatterns.length; j++) {
                      triplesContext = triplesContext.concat(currentBasicGraphPatterns[j].triplesContext);
                  }
                  if(triplesContext.length > 0) {  
                      compactedSubpatterns.push({token: 'basicgraphpattern',
                                                 triplesContext: triplesContext});
                  }
                  currentBasicGraphPatterns = [];
              }
              compactedSubpatterns.push(subpatterns[i]);
          } else {
              if(subpatterns[i].token === 'triplespattern') {
                  currentBasicGraphPatterns.push(subpatterns[i]);
              } else {
                  currentFilters.push(subpatterns[i]);
              }
          }
      }

      if(currentBasicGraphPatterns.length != 0 || currentFilters.length != 0) {
          var triplesContext = [];
          for(var j=0; j<currentBasicGraphPatterns.length; j++) {
              triplesContext = triplesContext.concat(currentBasicGraphPatterns[j].triplesContext);
          }
          if(triplesContext.length > 0) {
            compactedSubpatterns.push({token: 'basicgraphpattern',
                                       triplesContext: triplesContext});
          }
      }

//      if(compactedSubpatterns.length == 1) {
//          compactedSubpatterns[0].filters = currentFilters;
//          return compactedSubpatterns[0];
//      } else  {
          return { token: 'groupgraphpattern',
                   patterns: compactedSubpatterns,
                   filters: currentFilters }
//      }
}

/*
  @warning
  @rewritten
  [52]  	TriplesBlock	  ::=  	TriplesSameSubjectPath ( '.' TriplesBlock? )?
*/
TriplesBlock "[54] TriplesBlock"
  = b:TriplesSameSubjectPath bs:(WS*  '.' TriplesBlock? )? {
     var triples = b.triplesContext;
     var toTest = null;
      if(typeof(bs) === 'object') {
            if(bs.length != null) {
                  if(bs[2].triplesContext!=null) {
                     triples = triples.concat(bs[2].triplesContext);
              }
           }
      }

     return {token:'triplespattern',
             triplesContext: triples}
}

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
  = WS* 'OPTIONAL' WS* v:GroupGraphPattern {
      return { token: 'optionalgraphpattern',
               value: v }
}

/*
  [55]  	GraphGraphPattern	  ::=  	'GRAPH' VarOrIRIref GroupGraphPattern
*/
GraphGraphPattern "[55] GraphGraphPattern"
  = WS* 'GRAPH' WS* g:VarOrIRIref WS* gg:GroupGraphPattern {
      for(var i=0; i<gg.patterns.length; i++) {
        var quads = []
        var ts = gg.patterns[i];
        for(var j=0; j<ts.triplesContext.length; j++) {
            var triple = ts.triplesContext[j]
            triple.graph = g;
        }
      }

      gg.token = 'groupgraphpattern'
      return gg;
}

/*
  [56]  	ServiceGraphPattern	  ::=  	'SERVICE' VarOrIRIref GroupGraphPattern
*/
ServiceGraphPattern "[56] ServiceGraphPattern"
  = 'SERVICE' v:VarOrIRIref ts:GroupGraphPattern {
      return {token: 'servicegraphpattern',
              status: 'todo',
              value: [v,ts] }
}

/*
  [57]  	MinusGraphPattern	  ::=  	'MINUS' GroupGraphPattern
*/
MinusGraphPattern "[57] MinusGraphPattern"
  = 'MINUS' ts:GroupGraphPattern {
      return {token: 'minusgraphpattern',
              status: 'todo',
              value: ts}
}

/*
  @todo
  @incomplete
  @semantics
  [58]  	GroupOrUnionGraphPattern	  ::=  	GroupGraphPattern ( 'UNION' GroupGraphPattern )*
*/
GroupOrUnionGraphPattern "[58] GroupOrUnionGraphPattern"
  = a:GroupGraphPattern b:( WS* 'UNION' WS* GroupGraphPattern )* {
      if(b.length === 0) {
          return a;
      } else {

          var lastToken = {token: 'graphunionpattern',
                           value: [a]};

          for(var i=0; i<b.length; i++) {
              if(i==b.length-1) {
                  lastToken.value.push(b[i][3]);
              } else {
                  lastToken.value.push(b[i][3]);
                  var newToken = {token: 'graphunionpattern',
                                  value: [lastToken]}

                  lastToken = newToken;
              }
          }

          return lastToken;

      }
}

/*
  [59]  	Filter	  ::=  	'FILTER' Constraint
*/
Filter "[59] Filter"
  = WS* ('F'/'f')('I'/'i')('L'/'l')('T'/'t')('E'/'e')('R'/'r') WS* c:Constraint {
      return {token: 'filter',
              value: c}
}

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
      fcall.token = "expression";
      fcall.expressionType = 'irireforfunction'
      fcall.iriref = i;
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
  = '{' WS* ts:ConstructTriples? WS* '}' {
      return ts;
}


/*
  [65]  	ConstructTriples	  ::=  	TriplesSameSubject ( '.' ConstructTriples? )?
*/
ConstructTriples "[65] ConstructTriples"
  = b:TriplesSameSubject bs:( WS* '.' WS* ConstructTriples? )? {
     var triples = b.triplesContext;
     var toTest = null;
      if(typeof(bs) === 'object') {
            if(bs.length != null) {
                  if(bs[3].triplesContext!=null) {
                     triples = triples.concat(bs[3].triplesContext);
              }
           }
      }

     return {token:'triplestemplate',
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
  [95]  	Expression	  ::=  	ConditionalOrExpression
*/
Expression "[95] Expression"
  = ConditionalOrExpression

/*
  [96]  	ConditionalOrExpression	  ::=  	ConditionalAndExpression ( '||' ConditionalAndExpression )*
*/
ConditionalOrExpression "[96] ConditionalOrExpression"
  = v:ConditionalAndExpression vs:(WS* '||' WS* ConditionalAndExpression)* {
      if(vs.length === 0) {
          return v;
      }

      var exp = {};
      exp.token = "expression";
      exp.expressionType = "conditionalor";
      var ops = [v];

      for(var i=0; i<vs.length; i++) {
          ops.push(vs[i][3]);
      }

      exp.operands = ops;

      return exp;
}

/*
  [97]  	ConditionalAndExpression	  ::=  	ValueLogical ( '&&' ValueLogical )*
*/
ConditionalAndExpression "[97] ConditionalAndExpression"
  = v:ValueLogical vs:(WS* '&&' WS* ValueLogical)* {
      if(vs.length === 0) {
          return v;
      }
      var exp = {};
      exp.token = "expression";
      exp.expressionType = "conditionaland";
      var ops = [v];

      for(var i=0; i<vs.length; i++) {
          ops.push(vs[i][3]);
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
  @todo
  @incomplete
  [99]  	RelationalExpression	  ::=  	NumericExpression ( '=' NumericExpression | '!=' NumericExpression | '<' NumericExpression | '>' NumericExpression | '<=' NumericExpression | '>=' NumericExpression | 'IN' ExpressionList | 'NOT IN' ExpressionList )?
*/
RelationalExpression "[99] RelationalExpression"
  = op1:NumericExpression op2:( WS* '=' WS* NumericExpression / WS* '!=' WS* NumericExpression / WS* '<' WS* NumericExpression / WS* '>' WS* NumericExpression / WS* '<=' WS* NumericExpression / WS* '>=' WS* NumericExpression)* {
      if(op2.length === 0) {
          return op1;
      } else {
        var exp = {};
        exp.expressionType = "relationalexpression"
        exp.operator = op2[0][1];
        exp.op1 = op1;
        exp.op2 = op2[0][3];
        exp.token = "expression";

        return exp;
      }
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
  = op1:MultiplicativeExpression ops:( WS* '+' WS* MultiplicativeExpression / WS* '-' WS* MultiplicativeExpression / ( NumericLiteralNegative / NumericLiteralNegative ) ( (WS* '*' WS* UnaryExpression) / (WS* '/' WS* UnaryExpression))? )* {
      if(ops.length === 0) {
          return op1;
      }

      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'additiveexpression';
      ex.summand = op1;
      ex.summands = [];

      for(var i=0; i<ops.length; i++) {
          var summand = ops[i];
          var sum = {};
          if(summand.length == 4 && typeof(summand[1]) === "string") {
              sum.operator = summand[1];
              sum.expression = summand[3];
          } else {
              var subexp = {}
              var firstFactor = sum[0];
              var operator = sum[1][1];
              var secondFactor = sum[1][3];
              var operator = null;
              if(firstFactor.value < 0) {
                  sum.operator = '-';
                  firstFactor.value = - firstFactor.value;
              } else {
                  sum.operator = '+';
              }
              subexp.token = 'expression';
              subexp.expressionType = 'multiplicativeexpression';
              subexp.operator = firstFactor;
              subexp.factors = [{operator: operator, expression: secondFactor}];

              sum.expression = subexp;
          }
          ex.summands.push(sum);
      }

      return ex;
}


/*
  [102]  	MultiplicativeExpression	  ::=  	UnaryExpression ( '*' UnaryExpression | '/' UnaryExpression )*
*/
MultiplicativeExpression "[102] MultiplicativeExpression"
  = exp:UnaryExpression exps:(WS* '*' WS* UnaryExpression / WS* '/' WS* UnaryExpression)* {
      if(exps.length === 0) {
          return exp;
      }

      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'multiplicativeexpression';
      ex.factor = exp;
      ex.factors = [];
      for(var i=0; i<exps.length; i++) {
          var factor = exps[i];
          var fact = {};
          fact.operator = factor[1];
          fact.expression = factor[3];
          ex.factors.push(fact);
      }

      return ex;
}

/*
  [103]  	UnaryExpression	  ::=  	  '!' PrimaryExpression  |	'+' PrimaryExpression |	'-' PrimaryExpression |	PrimaryExpression
*/
UnaryExpression "[103] UnaryExpression"
  = '!' WS* e:PrimaryExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'unaryexpression';
      ex.unaryexpression = "!";
      ex.expression = e;

      return ex;
  }
  / '+' WS* v:PrimaryExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'unaryexpression';
      ex.unaryexpression = "+";
      ex.expression = v;

      return ex;
  }
  / '-' WS* v:PrimaryExpression {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'unaryexpression';
      ex.unaryexpression = "-";
      ex.expression = v;

      return ex;
  }
  / PrimaryExpression

/*  [104]  	PrimaryExpression	  ::=  	BrackettedExpression | BuiltInCall | IRIrefOrFunction | RDFLiteral | NumericLiteral | BooleanLiteral | Var | Aggregate
*/
PrimaryExpression "[104] PrimaryExpression"
  = BrackettedExpression
  / BuiltInCall
  / IRIrefOrFunction 
  / v:RDFLiteral {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'atomic';
      ex.primaryexpression = 'rdfliteral';
      ex.value = v;

      return ex;
  }
  / v:NumericLiteral {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'atomic';
      ex.primaryexpression = 'numericliteral';
      ex.value = v;

      return ex;
  }
  / v:BooleanLiteral {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'atomic';
      ex.primaryexpression = 'booleanliteral';
      ex.value = v;

      return ex;
  }
  / Aggregate
  / v:Var {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'atomic';
      ex.primaryexpression = 'var';
      ex.value = v;

      return ex;
  }

/*
  [105]  	BrackettedExpression	  ::=  	'(' Expression ')'
*/
BrackettedExpression "[105] BrackettedExpression"
  = '(' WS* e:Expression WS* ')' {
      return e;
}

/*
  @todo
  @incomplete
  [106]  	BuiltInCall	  ::=  	  'STR' '(' Expression ')'
                                       |  'LANG' '(' Expression ')'
                                       |  'LANGMATCHES' '(' Expression ',' Expression ')'
                                       |  'DATATYPE' '(' Expression ')'
                                       |  'BOUND' '(' Var ')'
                                       |  'IRI' '(' Expression ')'
                                       |  'URI' '(' Expression ')'
                                       |  'BNODE' ( '(' Expression ')' | NIL )
                                       |  'COALESCE' ExpressionList
                                       |  'IF' '(' Expression ',' Expression ',' Expression ')'
                                       |  'STRLANG' '(' Expression ',' Expression ')'
                                       |  'STRDT' '(' Expression ',' Expression ')'
                                       |  'sameTerm' '(' Expression ',' Expression ')'
                                       |  'isIRI' '(' Expression ')'
                                       |  'isURI' '(' Expression ')'
                                       |  'isBLANK' '(' Expression ')'
                                       |  'isLITERAL' '(' Expression ')'
                                       |  'isNUMERIC' '(' Expression ')'
                                       |  RegexExpression
                                       |  ExistsFunc
                                       |  NotExistsFunc
*/
BuiltInCall "[106] BuiltInCall"
  = ('S'/'s')('T'/'t')('R'/'r') WS* '(' WS* e:Expression WS* ')' {
      var ex = {};
      ex.token = 'expression'
      ex.expressionType = 'builtincall'
      ex.builtincall = 'str'
      ex.args = [e]

      return ex;
  }
  / ('L'/'l')('A'/'a')('N'/'n')('G'/'g') WS* '(' WS* e:Expression WS* ')' {
      var ex = {};
      ex.token = 'expression'
      ex.expressionType = 'builtincall'
      ex.builtincall = 'lang'
      ex.args = [e]

      return ex;
}
  / 'LANGMATCHES' WS* '(' WS* e1:Expression WS* ',' WS* e2:Expression WS* ')' {
      var ex = {};
      ex.token = 'expression'
      ex.expressionType = 'builtincall'
      ex.builtincall = 'langmatches'
      ex.args = [e1,e2]

      return ex;
}
  / ('D'/'d')('A'/'a')('T'/'t')('A'/'a')('T'/'t')('Y'/'y')('P'/'p')('E'/'e') WS* '(' WS* e:Expression WS* ')' {
      var ex = {};
      ex.token = 'expression'
      ex.expressionType = 'builtincall'
      ex.builtincall = 'datatype'
      ex.args = [e]

      return ex;
}
  / 'BOUND' WS* '(' WS* v:Var WS* ')'  {
      var ex = {};
      ex.token = 'expression'
      ex.expressionType = 'builtincall'
      ex.builtincall = 'bound'
      ex.args = [v]

      return ex;
}
  / 'IRI' WS* '(' WS* e:Expression WS* ')' {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'builtincall';
      ex.builtincall = 'iri'
      ex.args = [e];

      return ex;
}

  / 'URI' WS* '(' WS* e:Expression WS* ')' {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'builtincall';
      ex.builtincall = 'uri'
      ex.args = [e];

      return ex;
}

  / 'BNODE' WS* arg:('(' WS* e:Expression WS* ')' / NIL) {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'builtincall';
      ex.builtincall = 'bnode';
      if(arg.length === 5) {
          ex.args = [arg[2]];
      } else {
          ex.args = null;
      }

      return ex;
}

/ 'COALESCE' WS* args:ExpressionList {
      var ex = {};
      ex.token = 'expression';
      ex.expressionType = 'builtincall';
      ex.builtincall = 'coalesce';
      ex.args = args;

      return ex;    
}

/ 'IF' WS* '(' WS* test:Expression WS* ',' WS* trueCond:Expression WS* ',' WS* falseCond:Expression WS* ')' {
    var ex = {};
    ex.token = 'expression';
    ex.expressionType = 'builtincall';
    ex.builtincall = 'if';
    ex.args = [test,trueCond,falseCond];

    return ex;
}
/ 'ISLITERAL' WS* '(' WS* arg:Expression WS* ')' {
    var ex = {};
    ex.token = 'expression';
    ex.expressionType = 'builtincall';
    ex.builtincall = 'isliteral';
    ex.args = [arg];

    return ex;
}
/ 'ISBLANK' WS* '(' WS* arg:Expression WS* ')' {
    var ex = {};
    ex.token = 'expression';
    ex.expressionType = 'builtincall';
    ex.builtincall = 'isblank';
    ex.args = [arg];

    return ex;
}
/ 'SAMETERM' WS*  '(' WS* e1:Expression WS* ',' WS* e2:Expression WS* ')' {
    var ex = {};
    ex.token = 'expression';
    ex.expressionType = 'builtincall';
    ex.builtincall = 'sameterm';
    ex.args = [e1, e2];
    return ex;
}
/ ('I'/'i')('S'/'s')('U'/'u')('R'/'r')('I'/'i') WS* '(' WS* arg:Expression WS* ')' {
    var ex = {};
    ex.token = 'expression';
    ex.expressionType = 'builtincall';
    ex.builtincall = 'isuri';
    ex.args = [arg];

    return ex;
}
/ ('I'/'i')('S'/'s')('I'/'i')('R'/'r')('I'/'i') WS* '(' WS* arg:Expression WS* ')' {
    var ex = {};
    ex.token = 'expression';
    ex.expressionType = 'builtincall';
    ex.builtincall = 'isuri';
    ex.args = [arg];

    return ex;
}
/ RegexExpression

/*
  [107]  	RegexExpression	  ::=  	'REGEX' '(' Expression ',' Expression ( ',' Expression )? ')'
*/
RegexExpression "[107] RegexExpression"  
  = ('R'/'r')('E'/'e')('G'/'g')('E'/'e')('X'/'x') WS* '(' WS* e1:Expression WS* ',' WS* e2:Expression WS* eo:( ',' WS* Expression)?  WS* ')' {
      var regex = {};
      regex.token = 'expression';
      regex.expressionType = 'regex';
      regex.text = e1;
      regex.pattern = e2;
      regex.flags = eo[2];

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
  =   ('C'/'c')('O'/'o')('U'/'u')('N'/'n')('T'/'t') WS* '(' WS* d:( ('D'/'d')('I'/'i')('S'/'s')('T'/'t')('I'/'i')('N'/'n')('C'/'c')('T'/'t') )? WS* e:Expression WS* ')' WS* {
      exp = {};
      exp.token = 'expression';
      exp.expressionType = 'aggregate';
      exp.aggregateType = 'count';
      exp.distinct = (d != "" ? 'DISTINCT' : d);
      exp.expression = e;

      return exp;

  }
  / ('S'/'s')('U'/'u')('M'/'m') WS* '(' WS* d:( ('D'/'d')('I'/'i')('S'/'s')('T'/'t')('I'/'i')('N'/'n')('C'/'c')('T'/'t') )? WS*  e:Expression WS* ')' WS* {
      exp = {};
      exp.token = 'expression';
      exp.expressionType = 'aggregate';
      exp.aggregateType = 'sum';
      exp.distinct = (d != "" ? 'DISTINCT' : d);
      exp.expression = e;

      return exp;

  }
  / ('M'/'m')('I'/'i')('N'/'n') WS* '(' WS* d:( ('D'/'d')('I'/'i')('S'/'s')('T'/'t')('I'/'i')('N'/'n')('C'/'c')('T'/'t') )? WS* e:Expression WS* ')' WS* {
      exp = {};
      exp.token = 'expression';
      exp.expressionType = 'aggregate';
      exp.aggregateType = 'min';
      exp.distinct = (d != "" ? 'DISTINCT' : d);
      exp.expression = e;

      return exp;

  }
  / ('M'/'m')('A'/'a')('X'/'x') WS* '(' WS* d:( ('D'/'d')('I'/'i')('S'/'s')('T'/'t')('I'/'i')('N'/'n')('C'/'c')('T'/'t') )? WS* e:Expression WS* ')' WS* {
      exp = {};
      exp.token = 'expression'
      exp.expressionType = 'aggregate'
      exp.aggregateType = 'max'
      exp.distinct = (d != "" ? 'DISTINCT' : d);
      exp.expression = e

      return exp

  }
  / ('A'/'a')('V'/'v')('G'/'g') WS* '(' WS* d:( ('D'/'d')('I'/'i')('S'/'s')('T'/'t')('I'/'i')('N'/'n')('C'/'c')('T'/'t') )? WS* e:Expression WS* ')' WS* {
      exp = {};
      exp.token = 'expression'
      exp.expressionType = 'aggregate'
      exp.aggregateType = 'avg'
      exp.distinct = (d != "" ? 'DISTINCT' : d);
      exp.expression = e

      return exp

  }

/*
  @error
  Something has gone wrong with numeration in the rules!!

  [117]  	IRIrefOrFunction	  ::=  	IRIref ArgList?
*/
IRIrefOrFunction "[117] IRIrefOrFunction"
  = i:IRIref args:ArgList? {
      var fcall = {};
      fcall.token = "expression";
      fcall.expressionType = 'irireforfunction';
      fcall.iriref = i;
      fcall.args = args.value;

      return fcall;
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
  = ('T'/'t')('R'/'r')('U'/'u')('E'/'e') {
      lit = {};
      lit.token = "literal";
      lit.lang = null;
      lit.type = "http://www.w3.org/2001/XMLSchema#boolean";
      lit.value = true;
      return lit;
 }
  / ('F'/'f')('A'/'a')('L'/'l')('S'/'s')('E'/'e') {
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
