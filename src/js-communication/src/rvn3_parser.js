// This code is taking from the N3 project from Ruben Verborgh licensed under the MIT license. See https://github.com/RubenVerborgh/node-n3/blob/master/LICENSE.md

// **N3Lexer** tokenizes N3 documents.
// ## Regular expressions
var patterns = {
  _explicituri: /^<((?:[^\x00-\x20<>\\"\{\}\|\^\`]|\\[uU])*)>/,
  _string: /^"[^"\\]*(?:\\.[^"\\]*)*"(?=[^"\\])|^'[^'\\]*(?:\\.[^'\\]*)*'(?=[^'\\])/,
  _tripleQuotedString: /^""("[^"\\]*(?:(?:\\.|"(?!""))[^"\\]*)*")""|^''('[^'\\]*(?:(?:\\.|'(?!''))[^'\\]*)*')''/,
  _langcode: /^@([a-z]+(?:-[a-z0-9]+)*)(?=[^a-z0-9\-])/i,
  _prefix: /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:[\.\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:(?=\s)/,
  _qname:  /^((?:[A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])(?:[\.\-0-9A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff])*)?:((?:(?:[0-:A-Z_a-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])(?:(?:[\.\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~])*(?:[\-0-:A-Z_a-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c\u200d\u203f\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]|[\ud800-\udb7f][\udc00-\udfff]|%[0-9a-fA-F]{2}|\\[!#-\/;=?\-@_~]))?)?)(?=[\s\.;,)])/,
  _number: /^[\-+]?(?:\d+\.?\d*([eE](?:[\-\+])?\d+)|\d+\.\d+|\.\d+|\d+)(?=\s*[\s\.;,)])/,
  _boolean: /^(?:true|false)(?=\s+)/,
  _punctuation: /^\.(?!\d)|^;|^,|^\[|^\]|^\(|^\)/, // If a digit follows a dot, it is a number, not punctuation.
  _fastString: /^"[^"\\]+"(?=[^"\\])/,
  _keyword: /^(?:@[a-z]+|[Pp][Rr][Ee][Ff][Ii][Xx]|[Bb][Aa][Ss][Ee])(?=\s)/,
  _type: /^\^\^(?:<([^>]*)>|([A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][\-0-9A-Z_a-z\u00b7\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u037d\u037f-\u1fff\u200c-\u200d\u203f-\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]*)?:([A-Z_a-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd][\-0-9A-Z_a-z\u00b7\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u037d\u037f-\u1fff\u200c-\u200d\u203f-\u2040\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd]*)(?=[\s\.;,)]))/,
  _shortPredicates: /^a(?=\s+|<)/,
  _newline: /^[ \t]*(?:#[^\n\r]*)?(?:\r\n|\n|\r)[ \t]*/,
  _whitespace: /^[ \t]+|^#[^\n\r]*/,
  _nonwhitespace: /^\S*/
};

// Regular expression and replacement string to escape N3 strings.
// Note how we catch invalid unicode sequences separately (they will trigger an error).
var escapeSequence = /\\u([a-fA-F0-9]{4})|\\U([a-fA-F0-9]{8})|\\[uU]|\\(.)/g;
var escapeReplacements = { '\\': '\\', "'": "'", '"': '"',
                           'n': '\n', 'r': '\r', 't': '\t', 'f': '\f', 'b': '\b',
                           '_': '_', '~': '~', '.': '.', '-': '-', '!': '!', '$': '$', '&': '&',
                           '(': '(', ')': ')', '*': '*', '+': '+', ',': ',', ';': ';', '=': '=',
                           '/': '/', '?': '?', '#': '#', '@': '@', '%': '%' };
var illegalUrlChars = /[\x00-\x20<>\\"\{\}\|\^\`]/;

// Different punctuation types.
var punctuationTypes = { '.': 'dot', ';': 'semicolon', ',': 'comma',
                         '[': 'bracketopen', ']': 'bracketclose',
                         '(': 'liststart', ')': 'listend' };
var fullPredicates = { 'a': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' };

// ## Constructor
function N3Lexer() {
  // We use a dummy constructor to enable construction without `new`.
  function Constructor() {}
  Constructor.prototype = N3Lexer.prototype;

  // Initialize the new `N3Lexer`.
  var n3Lexer = new Constructor();
  // Local copies of the patterns perform slightly better.
  for (var name in patterns)
    n3Lexer[name] = patterns[name];

  // Return the new `N3Lexer`.
  return n3Lexer;
}

N3Lexer.prototype = {
  constructor: N3Lexer,

  // ## Private methods

  // ### `_next` fires the callback with the next token.
  // Returns a boolean indicating whether a token has been emitted.
  _next: function (callback) {
    // Only emit tokens if there's still input left.
    if (this._input === undefined)
      return false;

    // Count and skip newlines.
    var match;
    while (match = this._newline.exec(this._input)) {
      this._line++;
      this._input = this._input.substr(match[0].length);
    }

    // Skip whitespace.
    if (match = this._whitespace.exec(this._input)) {
      this._input = this._input.substr(match[0].length);
    }

    // Create token skeleton.
    // We initialize all possible properties as strings, so the engine uses one runtime type for all tokens.
    var token = { line: this._line,
                  type: '',
                  value: '',
                  prefix: ''
                };
    var unescaped;

    // Emit the EOF token if we're at the end and reading is complete.
    if (!this._input.length) {
      // If we're streaming, don't emit EOF yet.
      if (!this._inputComplete)
        return false;
      // Free the input.
      delete this._input;
      // Emit EOF.
      token.type = 'eof';
      callback(null, token);
      return true;
    }

    // Try to find an `explicituri`.
    if (match = this._explicituri.exec(this._input)) {
      unescaped = this._unescape(match[1]);
      if (unescaped === null || illegalUrlChars.test(unescaped))
        return reportSyntaxError(this);
      token.type = 'explicituri';
      token.value = unescaped;
    }
    // Try to find a dot.
    else if (match = this._punctuation.exec(this._input)) {
      token.type = punctuationTypes[match[0]];
    }
    // Try to find a language code.
    else if (this._prevTokenType === 'literal' && (match = this._langcode.exec(this._input))) {
      token.type = 'langcode';
      token.value = match[1];
    }
    // Try to find a string literal the fast way.
    // This only includes non-empty simple quoted literals without escapes.
    // If streaming, make sure the input is long enough so we don't miss language codes or string types.
    else if (match = this._fastString.exec(this._input)) {
      token.type = 'literal';
      token.value = match[0];
    }
    // Try to find any other string literal wrapped in a pair of quotes.
    else if (match = this._string.exec(this._input)) {
      unescaped = this._unescape(match[0]);
      if (unescaped === null)
        return reportSyntaxError(this);
      token.type = 'literal';
      token.value = unescaped.replace(/^'|'$/g, '"');
    }
    // Try to find a string literal wrapped in a pair of triple quotes.
    else if (match = this._tripleQuotedString.exec(this._input)) {
      unescaped = match[1] || match[2];
      // Count the newlines and advance line counter.
      this._line += unescaped.split(/\r\n|\r|\n/).length - 1;
      unescaped = this._unescape(unescaped);
      if (unescaped === null)
        return reportSyntaxError(this);
      token.type = 'literal';
      token.value = unescaped.replace(/^'|'$/g, '"');
    }
    // Try to find a number.
    else if (match = this._number.exec(this._input)) {
      token.type = 'literal';
      token.value = '"' + match[0] + '"^^<http://www.w3.org/2001/XMLSchema#' +
                    (match[1] ? 'double>' : (/^[+\-]?\d+$/.test(match[0]) ? 'integer>' : 'decimal>'));
    }
    // Try to match a boolean.
    else if (match = this._boolean.exec(this._input)) {
      token.type = 'literal';
      token.value = '"' + match[0] + '"^^<http://www.w3.org/2001/XMLSchema#boolean>';
    }
    // Try to find a type.
    else if (this._prevTokenType === 'literal' && (match = this._type.exec(this._input))) {
      token.type = 'type';
      if (!match[2]) {
        token.value = match[1];
      }
      else {
        token.prefix = match[2];
        token.value = match[3];
      }
    }
    // Try to find a keyword.
    else if (match = this._keyword.exec(this._input)) {
      var keyword = match[0];
      token.type = keyword[0] === '@' ? keyword : keyword.toUpperCase();
    }
    // Try to find a prefix.
    else if ((this._prevTokenType === '@prefix' || this._prevTokenType === 'PREFIX') &&
             (match = this._prefix.exec(this._input))) {
      token.type = 'prefix';
      token.value = match[1] || '';
    }
    // Try to find a qname.
    else if (match = this._qname.exec(this._input)) {
      unescaped = this._unescape(match[2]);
      if (unescaped === null)
        return reportSyntaxError(this);
      token.type = 'qname';
      token.prefix = match[1] || '';
      token.value = unescaped;
    }
    // Try to find an abbreviated predicate.
    else if (match = this._shortPredicates.exec(this._input)) {
      token.type = 'abbreviation';
      token.value = fullPredicates[match[0]];
    }
    // What if nothing of the above was found?
    else {
      // We could be in streaming mode, and then we just wait for more input to arrive.
      // Otherwise, a syntax error has occurred in the input.
      if (this._inputComplete)
        reportSyntaxError(this);
      return false;
    }

    // Save the token type for the next iteration.
    this._prevTokenType = token.type;

    // Advance to next part to tokenize.
    this._input = this._input.substr(match[0].length);

    // Emit the parsed token.
    callback(null, token);
    return true;

    function reportSyntaxError(self) {
      match = self._nonwhitespace.exec(self._input);
      delete self._input;
      callback('Syntax error: unexpected "' + match[0] + '" on line ' + self._line + '.');
      return false;
    }
  },

  // ### `unescape` replaces N3 escape codes by their corresponding characters.
  _unescape: function (item) {
    try {
      return item.replace(escapeSequence, function (sequence, unicode4, unicode8, escapedChar) {
        var charCode;
        if (unicode4) {
          charCode = parseInt(unicode4, 16);
          if (isNaN(charCode))
            throw "invalid character code";
          return String.fromCharCode(charCode);
        }
        else if (unicode8) {
          charCode = parseInt(unicode8, 16);
          if (isNaN(charCode))
            throw "invalid character code";
          if (charCode < 0xFFFF)
            return String.fromCharCode(charCode);
          return String.fromCharCode(Math.floor((charCode - 0x10000) / 0x400) + 0xD800) +
                 String.fromCharCode((charCode - 0x10000) % 0x400 + 0xDC00);
        }
        else {
          var replacement = escapeReplacements[escapedChar];
          if (!replacement)
            throw "invalid escape sequence";
          return replacement;
        }
      });
    }
    catch (error) {
      return null;
    }
  },

  // ## Public methods

  // ### `tokenize` starts the transformation of an N3 document into an array of tokens.
  // The input can be a string or a stream.
  tokenize: function (input, callback) {
    var self = this;
    this._line = 1;

    // If the input is a string, continuously emit tokens through callback until the end.
    if (typeof(input) === 'string') {
      this._input = input;
      this._inputComplete = true;
      process.nextTick(function () {
        while (self._next(callback)) {} ;
      });
    }
    // Otherwise, the input must be a stream.
    else {
      this._input = '';
      this._inputComplete = false;

      // Read strings, not buffers.
      input.setEncoding('utf8');

      // If new data arrives…
      input.on('data', function (data) {
        // …add the new data to the buffer
        self._input += data;
        // …and parse as far as we can.
        while (self._next(callback)) {} ;
      });
      // If we're at the end of the stream…
      input.on('end', function () {
        // …signal completeness…
        self._inputComplete = true;
        // …and parse until the end.
        while (self._next(callback)) {} ;
      });
    }
  }
};

// ## Exports

// Export the `N3Lexer` class as a whole.


// **RVInnerN3Parser** parses N3 documents.

var RDF_PREFIX = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    RDF_NIL    = {token: 'uri', value: RDF_PREFIX + 'nil', prefix: null, suffix: null},
    RDF_FIRST  = {token: 'uri', value: RDF_PREFIX + 'first', prefix: null, suffix: null},
    RDF_REST   = {token: 'uri', value: RDF_PREFIX + 'rest', prefix: null, suffix: null};

var absoluteURI = /^[a-z]+:/;
var hashURI = /^#/;
var documentPart = /[^\/]*$/;

var _undefined;

// ## Constructor
function RVInnerN3Parser(config) {
  config = config || {};

  // We use a dummy constructor to enable construction without `new`.
  function Constructor() {}
  Constructor.prototype = RVInnerN3Parser.prototype;

  // Initialize the new `RVInnerN3Parser`.
  var n3Parser = new Constructor();
  n3Parser._lexer = config.lexer || new N3Lexer();
  n3Parser._blankNodes = Object.create(null);
  n3Parser._blankNodeCount = 0;
  n3Parser._tripleStack = [];
  if (!config.documentURI) {
    n3Parser._baseURI = n3Parser._documentURI = null;
    n3Parser._baseURIROOT = n3Parser._documentURIRoot = null;
  }
  else {
    n3Parser._baseURI = n3Parser._documentURI = config.documentURI;
    n3Parser._baseURIRoot = n3Parser._documentURIRoot = config.documentURI.replace(documentPart, '');
  }

  // Return the new `RVInnerN3Parser`.
  return n3Parser;
}

RVInnerN3Parser.prototype = {
  defaultGraph: null,
  constructor: RVInnerN3Parser,

  // ## Private methods

  // ### `_readInTopContext` reads a token when in the top context.
  _readInTopContext: function (token) {
    switch (token.type) {
    // If an EOF token arrives in the top context, signal that we're done.
    case 'eof':
      return this._callback(null, null);
    // It could be a prefix declaration.
    case '@prefix':
      this._sparqlStyle = false;
      return this._readPrefix;
    case 'PREFIX':
      this._sparqlStyle = true;
      return this._readPrefix;
    // It could be a base declaration.
    case '@base':
      this._sparqlStyle = false;
      return this._readBaseURI;
    case 'BASE':
      this._sparqlStyle = true;
      return this._readBaseURI;
    // Otherwise, the next token must be a subject.
    default:
      return this._readSubject(token);
    }
  },

  // ### `_readSubject` reads a triple's subject.
  _readSubject: function (token) {
    switch (token.type) {
    case 'explicituri':
      if (this._baseURI === null || absoluteURI.test(token.value))
          this._subject = {token: 'uri', value: token.value, prefix: null, suffix: null};
      else
          this._subject = {token: 'uri', value: (hashURI.test(token.value) ? this._baseURI : this._baseURIRoot) + token.value, prefix: null, suffix: null};
      break;
    case 'qname':
      if (token.prefix === '_') {
          if(this._blankNodes[token.value] !== undefined) {
              this._subject = {'blank': this._blankNodes[token.value] };
          } else {
              this._subject = {'blank': (this._blankNodes[token.value] = '_:' + this._blankNodeCount++)};
          }
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === _undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        this._subject = {token: 'uri', value: prefix + token.value, prefix: null, suffix: null};
      }
      break;
    case 'bracketopen':
      // Start a new triple with a new blank node as subject.
      this._subject = {'blank': ('_:' + this._blankNodeCount++)};
      this._tripleStack.push({ subject: this._subject, predicate: null, object: null, type: 'blank' });
      return this._readBlankNodeHead;
    case 'liststart':
      // Start a new list
      this._tripleStack.push({ subject: RDF_NIL, predicate: null, object: null, type: 'list' });
      this._subject = null;
      return this._readListItem;
    default:
      return this._error('Unexpected token type "' + token.type, token);
    }
    this._subjectHasPredicate = false;
    // The next token must be a predicate.
    return this._readPredicate;
  },

  // ### `_readPredicate` reads a triple's predicate.
  _readPredicate: function (token) {
    switch (token.type) {
    case 'explicituri':
    case 'abbreviation':
      if (this._baseURI === null || absoluteURI.test(token.value))
        this._predicate = {token: 'uri', value: token.value, prefix: null, suffix: null};
      else
        this._predicate = {token: 'uri', value: (hashURI.test(token.value) ? this._baseURI : this._baseURIRoot) + token.value, prefix: null, suffix: null};
      break;
    case 'qname':
      if (token.prefix === '_') {
        return this._error('Disallowed blank node as predicate', token);
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === _undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        this._predicate = {token: 'uri', value: prefix + token.value, prefix: null, suffix: null};
      }
      break;
    case 'bracketclose':
      // Expected predicate didn't come, must have been trailing semicolon.
      return this._readBlankNodeTail(token, true);
    case 'dot':
      // A dot is not allowed if the subject did not have a predicate yet
      if (!this._subjectHasPredicate)
        return this._error('Unexpected dot', token);
      // Expected predicate didn't come, must have been trailing semicolon.
      return this._readPunctuation(token, true);
    case 'semicolon':
      // Extra semicolons can be safely ignored
      return this._readPredicate;
    default:
      return this._error('Expected predicate to follow "' + this._subject + '"', token);
    }
    this._subjectHasPredicate = true;
    // The next token must be an object.
    return this._readObject;
  },

  // ### `_readObject` reads a triple's object.
  _readObject: function (token) {
    switch (token.type) {
    case 'explicituri':
      if (this._baseURI === null || absoluteURI.test(token.value))
        this._object = {token: 'uri', value: token.value, prefix: null, suffix: null};
      else
        this._object = {token: 'uri', value: (hashURI.test(token.value) ? this._baseURI : this._baseURIRoot) + token.value, prefix: null, suffix: null};
      break;
    case 'qname':
      if (token.prefix === '_') {
          if(this._blankNodes[token.value] !== undefined) {
              this._object = {'blank': this._blankNodes[token.value] };
          } else {
              this._object = {'blank': (this._blankNodes[token.value] = '_:' + this._blankNodeCount++)};
          }
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === _undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        this._object = {token: 'uri', value: prefix + token.value, prefix: null, suffix: null};
      }
      break;
    case 'literal':
        this._object = {'literal': token.value};
      return this._readDataTypeOrLang;
    case 'bracketopen':
      // Start a new triple with a new blank node as subject.
      var blank = {'blank': '_:' + this._blankNodeCount++};
      this._tripleStack.push({ subject: this._subject, predicate: this._predicate, object: blank, type: 'blank' });
      this._subject = blank;
      return this._readBlankNodeHead;
    case 'liststart':
      // Start a new list
      this._tripleStack.push({ subject: this._subject, predicate: this._predicate, object: RDF_NIL, type: 'list' });
      this._subject = null;
      return this._readListItem;
    default:
      return this._error('Expected object to follow "' + this._predicate + '"', token);
    }
    return this._getNextReader();
  },

  // ### `_readBlankNodeHead` reads the head of a blank node.
  _readBlankNodeHead: function (token) {
    if (token.type === 'bracketclose')
      return this._readBlankNodeTail(token, true);
    else
      return this._readPredicate(token);
  },

  // ### `_readBlankNodeTail` reads the end of a blank node.
  _readBlankNodeTail: function (token, empty) {
    if (token.type !== 'bracketclose')
      return this._readPunctuation(token);

    // Store blank node triple.
    if (empty !== true)
      this._callback(null, { subject: this._subject,
                             predicate: this._predicate,
                             object: this._object,
                             graph: RVInnerN3Parser.prototype.defaultGraph });

    // Restore parent triple that contains the blank node.
    var triple = this._tripleStack.pop();
    this._subject = triple.subject;
    // Was the blank node the object?
    if (triple.object !== null) {
      // Restore predicate and object as well, and continue by reading punctuation.
      this._predicate = triple.predicate;
      this._object = triple.object;
      return this._getNextReader();
    }
    // The blank node was the subject, so continue reading the predicate.
    return this._readPredicate;
  },

  // ### `_readDataTypeOrLang` reads an _optional_ data type or language.
  _readDataTypeOrLang: function (token) {
    switch (token.type) {
    case 'type':
      var value;
      if (token.prefix === '') {
        value = token.value;
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === _undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
        value = prefix + token.value;
      }
      if(this._object.literal) {
        this._object.literal += '^^<' + value + '>';
      } else {
        this._object += '^^<' + value + '>';
        this._object = {literal: this._object};
      }
      return this._readPunctuation;
    case 'langcode':
        if(this._object.literal) {
            this._object.literal += '@' + token.value.toLowerCase();
        } else {
            this._object += '@' + token.value.toLowerCase();
            this._object = {literal: this._object};
        }
      return this._getNextReader();
    default:
      return this._getNextReader().call(this, token);
    }
  },

  // ### `_readListItem` reads items from a list.
  _readListItem: function (token) {
    var item = null,                  // The actual list item.
        itemHead = null,              // The head of the rdf:first predicate.
        prevItemHead = this._subject, // The head of the previous rdf:first predicate.
        stack = this._tripleStack,    // The stack of triples part of recursion (lists, blanks, etc.).
        parentTriple = stack[stack.length - 1], // The triple containing the current list.
        next = this._readListItem;    // The next function to execute.

    switch (token.type) {
    case 'explicituri':
      item = {'token': 'uri', 'value': token.value, 'prefix': null, 'suffix': null};
      break;
    case 'qname':
      if (token.prefix === '_') {
        item = this._blankNodes[token.value] ||
              (this._blankNodes[token.value] = {'blank': '_:' + this._blankNodeCount++});
      }
      else {
        var prefix = this._prefixes[token.prefix];
        if (prefix === _undefined)
          return this._error('Undefined prefix "' + token.prefix + ':"', token);
          item = {'token': 'uri', 'value': prefix + token.value, 'prefix': null, 'suffix': null};
      }
      break;
    case 'literal':
      item = {'literal': token.value };
      next = this._readDataTypeOrLang;
      break;
    case 'bracketopen':
      // Stack the current list triple and start a new triple with a blank node as subject.
      itemHead = {'blank': '_:' + this._blankNodeCount++ };
      item     = {'blank': '_:' + this._blankNodeCount++ };
      stack.push({ subject: itemHead, predicate: RDF_FIRST, object: item, type: 'blank' });
      this._subject = item;
      next = this._readBlankNodeHead;
      break;
    case 'liststart':
      // Stack the current list triple and start a new list
      itemHead = {'blank': '_:' + this._blankNodeCount++};
      stack.push({ subject: itemHead, predicate: RDF_FIRST, object: RDF_NIL, type: 'list' });
      this._subject = null;
      next = this._readListItem;
      break;
    case 'listend':
      // Restore the parent triple.
      stack.pop();
      // If this list is contained within a parent list, return the membership triple here.
      // This will be `<parent list elemen>t rdf:first <this list>.`.
      if (stack.length !== 0 && stack[stack.length - 1].type === 'list')
        this._callback(null, { subject: parentTriple.subject,
                               predicate: parentTriple.predicate,
                               object: parentTriple.object,
                               graph: RVInnerN3Parser.prototype.defaultGraph });
      // Restore the parent triple's subject.
      this._subject = (typeof(parentTriple.subject) === 'string' ? {'token': 'uri', 'value': parentTriple.subject, 'prefix': null, 'suffix': null } : parentTriple.subject);
      // Was this list in the parent triple's subject?
      if (parentTriple.predicate === null) {
        // The next token is the predicate.
        next = this._readPredicate;
        // Skip writing the list tail if this was an empty list.
        if (parentTriple.subject === RDF_NIL)
          return next;
      }
      // The list was in the parent triple's object.
      else {
        // Restore the parent triple's predicate and object as well.
        this._predicate = (typeof(parentTriple.predicate) === 'string' ? {'token': 'uri', 'value': parentTriple.predicate, 'prefix': null, 'suffix': null } : parentTriple.predicate); 
        this._object = (typeof(parentTriple.object) === 'string' ? {'token': 'uri', 'value': parentTriple.object, 'prefix': null, 'suffix': null } : parentTriple.object);
        next = this._getNextReader();
        // Skip writing the list tail if this was an empty list.
        if (parentTriple.object === RDF_NIL)
          return next;
      }
      // Close the list by making the item head nil.
      itemHead = RDF_NIL;
      break;
    default:
      return this._error('Expected list item instead of "' + token.type + '"', token);
    }

     // Create a new blank node if no item head was assigned yet.
    if (itemHead === null)
      this._subject = itemHead = {'blank': '_:' + this._blankNodeCount++};

    // Is this the first element of the list?
    if (prevItemHead === null) {
      // This list is either the object or the subject.
      if (parentTriple.object === RDF_NIL)
        parentTriple.object = itemHead;
      else
        parentTriple.subject = itemHead;
    }
    else {
      // The rest of the list is in the current head.
      this._callback(null, { subject: prevItemHead,
                             predicate: RDF_REST,
                             object: itemHead,
                             graph: RVInnerN3Parser.prototype.defaultGraph });
    }
    // Add the item's value.
    if (item !== null)
      this._callback(null, { subject: itemHead,
                             predicate: RDF_FIRST,
                             object: item,
                             graph: RVInnerN3Parser.prototype.defaultGraph });
    return next;
  },

  // ### `_readPunctuation` reads punctuation between triples or triple parts.
  _readPunctuation: function (token, empty) {
    var next;
    switch (token.type) {
    // A dot just ends the statement, without sharing anything with the next.
    case 'dot':
      next = this._readInTopContext;
      break;
    // Semicolon means the subject is shared; predicate and object are different.
    case 'semicolon':
      next = this._readPredicate;
      break;
    // Comma means both the subject and predicate are shared; the object is different.
    case 'comma':
      next = this._readObject;
      break;
    default:
      return this._error('Expected punctuation to follow "' + this._object + '"', token);
    }
    // A triple has been completed now, so return it.
    if (!empty)
      this._callback(null, { subject: this._subject,
                             predicate: this._predicate,
                             object: this._object,
                             graph: RVInnerN3Parser.prototype.defaultGraph });
    return next;
  },

  // ### `_readPrefix` reads the prefix of a prefix declaration.
  _readPrefix: function (token) {
    if (token.type !== 'prefix')
      return this._error('Expected prefix to follow @prefix', token);
    this._prefix = token.value;
    return this._readPrefixURI;
  },

  // ### `_readPrefixURI` reads the URI of a prefix declaration.
  _readPrefixURI: function (token) {
    if (token.type !== 'explicituri')
      return this._error('Expected explicituri to follow prefix "' + this.prefix + '"', token);
    var prefixURI;
    if (this._baseURI === null || absoluteURI.test(token.value))
      prefixURI = token.value;
    else
      prefixURI = (hashURI.test(token.value) ? this._baseURI : this._baseURIRoot) + token.value;
    this._prefixes[this._prefix] = prefixURI;
    return this._readDeclarationPunctuation;
  },

  // ### `_readBaseURI` reads the URI of a base declaration.
  _readBaseURI: function (token) {
    if (token.type !== 'explicituri')
      return this._error('Expected explicituri to follow base declaration', token);
    if (this._baseURI === null || absoluteURI.test(token.value))
      this._baseURI = token.value;
    else
      this._baseURI = (hashURI.test(token.value) ? this._baseURI : this._baseURIRoot) + token.value;
    this._baseURIRoot = this._baseURI.replace(documentPart, '');
    return this._readDeclarationPunctuation;
  },

  // ### `_readDeclarationPunctuation` reads the punctuation of a declaration.
  _readDeclarationPunctuation: function (token) {
    // SPARQL-style declarations don't have punctuation.
    if (this._sparqlStyle)
      return this._readInTopContext(token);

    if (token.type !== 'dot')
      return this._error('Expected declaration to end with a dot', token);
    return this._readInTopContext;
  },

  // ### `_getNextReader` gets the next reader function at the end of a triple.
  _getNextReader: function () {
    var stack = this._tripleStack;
    if (stack.length === 0)
      return this._readPunctuation;

    switch (stack[stack.length - 1].type) {
    case 'blank':
      return this._readBlankNodeTail;
    case 'list':
      return this._readListItem;
    }
  },

  // ### `_error` emits an error message through the callback.
  _error: function (message, token) {
    this._callback(message + ' at line ' + token.line + '.');
  },

  // ## Public methods

  // ### `parse` parses the N3 input and emits each parsed triple through the callback.
  parse: function (input, callback) {
    var self = this;
    // Initialize prefix declarations.
    this._prefixes = Object.create(null);
    // Set the triple callback.
    this._callback = callback;
    // The read callback is the next function to be executed when a token arrives.
    // We start reading in the top context.
    this._readCallback = this._readInTopContext;
    // Execute the read callback when a token arrives.
    this._lexer.tokenize(input, function (error, token) {
      if(error !== null && self._readCallback === _undefined) {
        self._callback(error);
      } else if (self._readCallback !== _undefined) {
        if (error !== null)
          self._callback(error);
        else
          self._readCallback = self._readCallback(token);
      }
    });
  }
};

// ## Exports

// Export the `RVInnerN3Parser` class as a whole.


exports.RVN3Parser = {};
var RVN3Parser = exports.RVN3Parser;

RVN3Parser.parser = {};
// The parser is asynchronous
RVN3Parser.parser.async = true;

RVN3Parser.parser.parse = function() {

    var parser = new RVInnerN3Parser();

    var data = arguments[0];
    var graph = arguments[1];
    var cb = arguments[2];
    
    if(arguments.length === 2) {
        graph = null;
        cb = arguments[1];
    } else if(arguments.length !== 3) {
        cb(false, "Wrong number of arguments, 2, 3 args required");
    }
    if(graph && typeof(graph) === 'string')
        graph = {token: 'uri', value: graph, prefix: null, suffix: null};

    RVInnerN3Parser.prototype.defaultGraph = graph;

    var triples = [];

     parser.parse(data, function(err,triple) {
        if(err) {
            cb(false, err);
        } else {
            if(triple) {
               triples.push(triple);
            } else {
               cb(true, triples);
            }
        }
     });
};