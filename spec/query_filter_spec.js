var QueryFilters = require('../src/query_filters').QueryFilters;

describe('QueryFilters (async)', function() {
  it('should run the equality function', function(done) {
    var op1 = createLiteral('123');
    var op2 = createLiteral('1234');
    QueryFilters.runEqualityFunctionAsync(op1, op2, { }, null, null, null, function(result) {
      expect(result.value).toEqual(false);
      done();
    })
  })
  it('should run the lt function', function(done) {
    var op1 = createLiteral('1');
    var op2 = createLiteral('2');
    QueryFilters.runLtFunction(op1, op2, {}, function(result) {
      expect(result.value).toEqual(true);
      done();
    })
  })
  it('should run a relational filter (runRelationalFilter)', function(done) {
    var op1 = createLiteral('1');
    var op2 = createLiteral('2');
    QueryFilters.runRelationalFilter({ operator: '>'}, op1, op2, {}, null, null, null, function(result) {
      expect(result.value).toEqual(false);
      done();
    })
  })
  it('should run a relational filter (runFilter)', function(done) {
    var op1 = createLiteralExpression('1');
    var op2 = createLiteralExpression('2');
    var expr = { expressionType: 'relationalexpression', op1: op1, operator: '>', op2: op2 };
    QueryFilters.runFilter(expr, {}, null, null, null, function(result) {
      expect(result.value).toEqual(false);
      done();
    })
  })
  it('should run the or function', function(done) {
    var expr = {
      expressionType: 'conditionalor',
      operands: [
        createLiteralExpression(false),
        createLiteralExpression(true),
      ]
    }
    QueryFilters.runFilter(expr, {}, null, null, null, function(result) {
      expect(result.value).toEqual(true);
      done();
    })
  })
  it('should run the and function', function(done) {
    var expr = {
      expressionType: 'conditionaland',
      operands: [
        createLiteralExpression(true),
        createLiteralExpression(false),
      ]
    }
    QueryFilters.runFilter(expr, {}, null, null, null, function(result) {
      expect(result.value).toEqual(false);
      done();
    })
  })
  it('should run addition', function(done) {
    var expr = {
      expressionType: 'additiveexpression',
      summand: createIntegerExpression(1),
      summands: [ { operator: '+', expression: createIntegerExpression(4) } ]
    }
    QueryFilters.runFilter(expr, {}, null, null, null, function(result) {
      expect(result.value).toEqual(5);
      done();
    })
  })
  it('should run multiplication', function(done) {
    var expr = {
      expressionType: 'multiplicativeexpression',
      factor: createIntegerExpression(2),
      factors: [ { operator: '*', expression: createIntegerExpression(3) } ]
    }
    QueryFilters.runFilter(expr, {}, null, null, null, function(result) {
      expect(result.value).toEqual(6);
      done();
    })
  })
  it('should run filter-exists (built-in call)', function(done) {
    var queryEngine = {
      executeSelectUnit: function(projection, dataset, pattern, env, callback) {
        expect(projection.length == 1).toEqual(true);
        expect(projection[0].kind).toEqual('*');
        callback([ {
          's': { token: 'uri', value: 'http://example.org/s' },
          'p': { token: 'uri', value: 'http://example.org/p' },
          'o': { token: 'uri', value: 'http://example.org/o' } } ]);
      },
      abstractQueryTree: {
        parseSelect: function() {
          return { };
        },
        bind: function() {
          return { };
        }
      }
    }
    QueryFilters.runBuiltInCall('exists', [ {
      token: 'basicgraphpattern', triplesContext: [ { subject: { token: 'var', value: 's' }, predicate: { token: 'var', value: 'p' }, object: { token: 'var', value: 'o' } } ]
    } ], { }, queryEngine, null, null, function(result) {
      expect(result.value).toEqual(true);
      done();
    })
  })
  it('should run regex filters', function(done) {
    var text = {
      expressionType: 'atomic',
      primaryexpression: 'var',
      value: {
        token: 'var',
        value: 'variable'
      }
    };
    var pattern = {
      expressionType: 'atomic',
      value: {
        token: 'literal',
        value: '^12'
      }
    };
    QueryFilters.runRegex(text, pattern, null, { 'variable': { token: 'literal', value: '123' } }, null, null, null, function(result) {
      expect(result.value).toEqual(true);
      done();
    });
  })
  it('should run another relational expression', function(done) {
    var expr = {
      token: 'expression',
      expressionType: 'relationalexpression',
      operator: '<',
      op1: {
        token: 'expression',
        expressionType: 'atomic',
        primaryexpression: 'var',
        value: { token: 'var', value: 'price' }
      },
      op2: {
        token: 'expression',
        expressionType: 'atomic',
        primaryexpression: 'numericliteral',
        value: { token: 'literal', lang: null, type: 'http://www.w3.org/2001/XMLSchema#integer', value: '20' }
      }
    };
    QueryFilters.runFilter(expr, { price: { token: 'literal', type: 'http://www.w3.org/2001/XMLSchema#integer', value: '21' } }, null, null, null, function(result) {
      expect(result.value).toEqual(false);
      done();
    })
  })
  it("should run an IRI or ref function", function(done) {
    /** @todo */
    //expect("not implemented").toBe("implemented");
    done();
  })
})

function createIntegerExpression(value) {
  return createLiteralExpression(value, 'http://www.w3.org/2001/XMLSchema#' + 'integer');
}

function createLiteralExpression(value, type) {
  return {
    expressionType: 'atomic',
    value: createLiteral(value, type)
  }
}

function createLiteral(value, type) {
  return {
    token: 'literal',
    type: type,
    value: value
  }
}
