Meteor.subscribe( 'allDocs');

function create1000Docs(){
  var userData = connections.find().fetch();
  var count = 0;
  return _.range(1000).map( function( num ){
    var rand = _.random( 10000000000000);
    var doc =  {_id: Random.id(), name: num+'name'+rand, someData: rand, connectionId:userData[count].connectionId };
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
    Meteor.call( 'batchInsert', create1000Docs());
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

