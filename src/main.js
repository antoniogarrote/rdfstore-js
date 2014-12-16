"use strict"

var _ = require('lodash');
var async = require('async');
var greetings = require('./greetings');

_.each([1,2,3,4,5], function(i){

  greetings.blah("something "+i);

});

