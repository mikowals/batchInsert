col = new Meteor.Collection( 'col' );
col2 = new Meteor.Collection( 'col2' );
loopTime = new Meteor.Collection('loopTime');
batchTime = new Meteor.Collection('batchTime');
connections = new Meteor.Collection('connections');

col.allow({
  insert: function(){ return true},
  remove: function(){ return true}
});
col2.allow({
  insert: function(){ return true},
  remove: function(){ return true}
});

function clientStub( docs, aCollection ){
      var myId = Meteor.default_connection._lastSessionId;
      docs.forEach( function( doc ){
        if ( doc.connectionId === myId ) aCollection.insert( doc );
      });
}
Meteor.methods({
  loopInsert: function(  docs ){
    console.log( 'running loop' );
    
    if ( Meteor.isClient ){
      clientStub( docs, col);
    } else {
      var time = 0;
      docs.forEach( function( doc ){
        var start = new Date();
        col.insert( doc );
        time += new Date().getTime() - start.getTime();
      });
      loopTime.upsert({_id:"1"}, {$inc:{calls: 1, totalTime: time}}, function(){return true;});
      var curData = loopTime.findOne( "1" );
      loopTime.upsert({_id:"1"}, {$set:{average: curData.totalTime / curData.calls}},function(){return true;} );
      console.log( 'loop finished');
      return true;
    }
  },
  batchInsert: function( docs ){
    console.log( 'running batch' );
    if ( Meteor.isClient ){
      clientStub( docs, col2);
    } else {
      var start = new Date();
      var connection = MongoInternals.defaultRemoteCollectionDriver().mongo;
      var write = connection._maybeBeginWrite();
      var refresh = function () {
        docs.forEach( function( doc ){
          Meteor.refresh({collection: 'col2', id: doc._id});
        });
      };
      var mongoCol = connection._getCollection( 'col2' );
      
      var mongoInsert = Meteor._wrapAsync( mongoCol.insert ).bind( mongoCol );
      mongoInsert( docs, {w:1});  
      batchTime.upsert({_id:"1"}, {$inc:{totalTime: new Date().getTime() - start.getTime(), calls: 1}}, function(){return true;});
      var curData = batchTime.findOne( "1" );
      batchTime.upsert({_id:"1"}, {$set:{average: curData.totalTime / curData.calls}},function(){return true;} );
      refresh();
      write.committed();
      console.log('batch finished');
      return true;
    }
    
  }
  
});
