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

function maybeCreateIds( docs, collection ){
  docs.forEach(function( doc ){
    if ( ! doc._id )
      doc._id = collection._makeNewID();
  });
}

function clientStub( docs, aCollection ){
      docs.forEach( function( doc ){
        aCollection.insert( doc );
      });
}
Meteor.methods({
  loopInsert: function( docs ){
    maybeCreateIds( docs, col );
    if ( Meteor.isClient ){
      clientStub( docs, col);
    } else {
      var start = new Date().getTime();
      docs.forEach( function( doc ){
        col.insert( doc );
      });
      loopTime.upsert({_id:"1"}, {$inc:{calls: 1, totalTime: new Date().getTime() - start}}, function(){return true;});
      var curData = loopTime.findOne( "1" );
      loopTime.upsert({_id:"1"}, {$set:{average: curData.totalTime / curData.calls}},function(){return true;} );
      return true;
    }
  },
  batchInsert: function( docs, name ){
    //assume collection uses string _ids
    _makeNewID = function () {
      var src = name ? DDP.randomStream('/collection/' + name) : Random;
      return src.id();
    };

    docs.forEach(function( doc ){
      if ( ! doc._id )
        doc._id = _makeNewID();
    });

    if ( Meteor.isClient ){
      var _collection = Meteor.connection._mongo_livedata_collections[ name ];
      docs.map( function( doc ){
        _collection.insert( doc );
      });
    } else {

      var connection = MongoInternals.defaultRemoteCollectionDriver().mongo;
      var write = connection._maybeBeginWrite();
      var refresh = function () {
        docs.forEach( function( doc ){
          Meteor.refresh({collection: name, id: doc._id});
        });
      };
      var start = new Date().getTime();
      var _collection = connection._getCollection( name );
      var mongoInsert = Meteor._wrapAsync( _collection.insert ).bind( _collection );
      var result = mongoInsert( docs, {w:1});
      batchTime.upsert({_id:"1"}, {$inc:{totalTime: new Date().getTime() - start, calls: 1}}, function(){return true;});
      var curData = batchTime.findOne( "1" );
      batchTime.upsert({_id:"1"}, {$set:{average: curData.totalTime / curData.calls}},function(){return true;} );
      refresh();
      Meteor.refresh( {collection: 'batchTime', _id: "1"});
      write.committed();
      return _( result ).pluck( '_id');
    }

  }

});
