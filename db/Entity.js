var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var EntitiesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sentiment: {
    type: String,
    required: false
  },
  count: {
    type: Number,
    required: false
  },
  negCount: {
    type: Number,
    required: false
  },
  posCount: {
    type: Number,
    required: false
  }
});

EntitiesSchema.plugin(findOrCreate);

var Entity = mongoose.model('Entity', EntitiesSchema);

module.exports = Entity;