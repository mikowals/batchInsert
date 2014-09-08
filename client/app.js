Meteor.subscribe( 'allDocs');

function create1000Docs(){
  var userData = connections.find().fetch();
  var count = 0;
  return _.range(20).map( function( num ){
    var rand = Random.id();
    var doc =  { name: num+'name'+rand, someData: rand, connectionId:userData[count].connectionId };
    count ++;
    if ( count >= userData.length ) count = 0;
    return doc;
  });
}

Template.connectionInfo.connections = function(){
  return connections.find();
};
Template.insert1.events({
  'click #insert1': function() {
    Meteor.call( 'loopInsert', create1000Docs());
  }
});

Template.insert1.helpers({
  docs: function() {
    return col.find();
  },
  loopTime: function(){
    return loopTime.findOne();
  }
});

Template.insert2.events({
  'click #insert2': function() {
    var ids = Meteor.call( 'batchInsert', create1000Docs(), 'col2', function(err, res){
      console.log( 'server Id: ', err || res[0] );
    });
  }
});

Template.insert2.helpers({
  docs: function() {
    return col2.find();
  },
  batchTime: function(){
    return batchTime.findOne();
  }
});
