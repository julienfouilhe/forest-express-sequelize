"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _lodash = _interopRequireDefault(require("lodash"));

var _forestExpress = require("forest-express");

var _orm = _interopRequireDefault(require("../utils/orm"));

function LeaderboardStatGetter(model, modelRelationship, params, options) {
  const labelField = params.label_field;
  const aggregate = params.aggregate.toUpperCase();
  const aggregateField = params.aggregate_field;
  const {
    limit
  } = params;
  const schema = _forestExpress.Schemas.schemas[model.name];
  const schemaRelationship = _forestExpress.Schemas.schemas[modelRelationship.name];
  let associationAs = schema.name;

  _lodash.default.each(modelRelationship.associations, function (association) {
    if (association.target.name === model.name && association.as) {
      associationAs = association.as;
    }
  });

  const groupBy = `${associationAs}.${labelField}`;

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = aggregateField || schemaRelationship.primaryKeys[0] || schemaRelationship.fields[0].field;
    return `${schemaRelationship.name}.${_orm.default.getColumnName(schema, fieldName)}`;
  }

  this.perform = function () {
    return modelRelationship.unscoped().findAll({
      attributes: [[options.sequelize.fn(aggregate, options.sequelize.col(getAggregateField())), 'value']],
      include: [{
        model,
        attributes: [labelField],
        as: associationAs,
        required: true
      }],
      group: groupBy,
      order: [[options.sequelize.literal('value'), 'DESC']],
      limit,
      raw: true
    }).then(function (records) {
      records = records.map(function (data) {
        data.key = data[groupBy];
        delete data[groupBy];
        return data;
      });
      return {
        value: records
      };
    });
  };
}

module.exports = LeaderboardStatGetter;