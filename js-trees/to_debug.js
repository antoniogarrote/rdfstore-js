var btree = require("./src/in_memory_async_b_tree").InMemoryAsyncBTree;

    var t = new btree.Tree(2);

    t.insert(11,11,function(){
    t.insert(2,2, function(){
    t.insert(14,14, function(){
    t.insert(14,14, function(){
    t.insert(15,15,function(){
    t.insert(1,1, function(){
    t.insert(7,7, function(){
    t.insert(5,5, function(){
    t.insert(8,8, function(){
    t.insert(4,4, function(){
    t.insert(6,6, function(){
    t.insert(3,3, function(){


        t.search(15, function(r){
            console.log(r);
            debugger;
            var data = [];
            t.walk(function(n) {
                console.log(n.data)
                data.push(n.data);

            });
            test.done();
        });

    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });
    });

/*
var btree = require("./src/in_memory_b_tree").InMemoryBTree;

var t = new btree.Tree(2);


t.insert(1,1);
t.insert(3,3);
t.insert(2,2);
t.insert(11,11);
t.insert(5,5);
t.insert(10,10);

//t.insert(19,19);
//t.insert(8,8);
//t.insert(0,0);
//t.insert(12,12);
//t.insert(4,4);
//t.insert(6,6);
//t.insert(9,9);
//t.insert(17,17);
//t.insert(15,15);
//t.insert(18,18);
//t.insert(13,13);
//t.insert(7,7);
//t.insert(16,16);
//t.insert(14,14);


//t.insert(0,0);
//t.insert(6,6);
//t.insert(1,1);
//t.insert(5,5);
//t.insert(2,2);
//t.insert(8,8);
//t.insert(9,9);
//t.insert(3,3);
//t.insert(7,7);
//t.insert(4,4);

///t.insert(5,5);
///t.insert(6,6);
///t.insert(3,3);
///t.insert(4,4);
///t.insert(1,1);
///t.insert(2,2);
///t.insert(0,0);

t.audit(false);
console.log("================================");

mustFind = [
    11,2,3,5,1,10
//17,
//12,
//14,
//11,
//18,
//9,
//5,
//16,
//8,
//15,
//1,
//19,
//4,
//0,
//13,
//2,
//7,
//3,
//6,
//10

//    5,
//    2,
//    6,
//    1,
//    9,
//    7,
//    0,
//    8,
//    4,
//    3

//    5,
//    6,
//    1,
//    4,
//    0,
//    3,
//    2
];

for(var i=0; i<mustFind.length; i++) {
    console.log("pos " + i + " -> " + mustFind[i]);
    if(i===1) {
        debugger;
    }
    t.delete(mustFind[i]);
    var errors = t.audit(false);
    if(errors.length > 0) {
        throw new Error("Found "+errors.length+ " errrors");
    }
    console.log("================================");
}

var acum = [];
t.walk(function(n) { acum.push(n); });

console.log("REMAINING: "+ acum.length);

*/
