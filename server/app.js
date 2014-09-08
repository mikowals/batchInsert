Meteor.publish( 'allDocs', function(){
  return [col.find({connectionId: this.connection.id}), col2.find({connectionId: this.connection.id}), batchTime.find("1"), loopTime.find("1"), connections.find()];
});

function resetCollections(){
  col.remove({});
  col2.remove({});
  batchTime.remove({});
  loopTime.remove({});
}
Meteor.startup( function(){
  connections.remove({});
  resetCollections();
});
Meteor.methods({
  resetCollections: resetCollections
});

Meteor.onConnection( function( con ){
  connections &&   connections.insert( {connectionId: con.id } );
  con.onClose( function(){
    connections && connections.remove( {connectionId: con.id } );
  });
});
Facts.setUserIdFilter(function () { return true; });
