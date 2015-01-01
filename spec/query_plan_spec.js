var QueryPlan = require("../src/query_plan").QueryPlan;


var makeVar = function(n) {
    return { token: 'var', value: n }
};

var pred = { token: 'uri',
    prefix: null,
    suffix: null,
    value: 'http://test.com/named' };


describe("QueryPlan#executeAndBGPsGroups", function(){

    it("Should be possible to group BGPs sharing variables", function(){
        var dataIn = [
            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o') },

            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o2') }
        ];

        var solution = QueryPlan.executeAndBGPsGroups(dataIn);

        expect(solution.length).toBe(1);
        expect(solution[0].length).toBe(2);

        dataIn = [
            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o') },

            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o2') },

            { subject: makeVar('p'),
              predicate: pred,
              object: makeVar('p2')}
        ];

        solution = QueryPlan.executeAndBGPsGroups(dataIn);
        expect(solution.length).toBe(2);
        expect(solution[0].length).toBe(2);
        expect(solution[1].length).toBe(1);

        dataIn = [
            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o') },

            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o2') },

            { subject: makeVar('p'),
              predicate: pred,
              object: makeVar('p2')},

            { subject: makeVar('m'),
              predicate: pred,
              object: makeVar('n2')}
        ];

        solution = QueryPlan.executeAndBGPsGroups(dataIn);
        expect(solution.length).toBe(3);
        expect(solution[0].length).toBe(2);
        expect(solution[1].length).toBe(1);
        expect(solution[2].length).toBe(1);

        dataIn = [

            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o') },

            { subject: makeVar('s'),
              predicate: pred,
              object: makeVar('o2') },

            { subject: makeVar('p'),
              predicate: pred,
              object: makeVar('p2')},

            { subject: makeVar('m'),
              predicate: pred,
              object: makeVar('n2')},

            { subject: makeVar('p'),
              predicate: pred,
              object: makeVar('n2')}
        ];

        solution = QueryPlan.executeAndBGPsGroups(dataIn);
        expect(solution.length).toBe(2);
        expect(solution[0].length).toBe(2);
        expect(solution[1].length).toBe(3);
    });

});