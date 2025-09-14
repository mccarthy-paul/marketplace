/**
 * Aggregation Pipeline Utilities for Complex MongoDB Queries
 * Provides reusable aggregation pipeline stages and builders
 */

class AggregationUtils {
  /**
   * Date range filter stage
   */
  static dateRangeFilter(field, startDate, endDate) {
    const filter = {};
    if (startDate) filter.$gte = new Date(startDate);
    if (endDate) filter.$lte = new Date(endDate);
    
    return filter ? { $match: { [field]: filter } } : null;
  }

  /**
   * Pagination stages
   */
  static paginate(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return [
      { $skip: skip },
      { $limit: limit }
    ];
  }

  /**
   * Add computed fields stage
   */
  static addComputedFields(fields) {
    return { $addFields: fields };
  }

  /**
   * Lookup with pipeline for complex joins
   */
  static lookupWithPipeline(from, localField, foreignField, pipeline, as) {
    return {
      $lookup: {
        from,
        let: { localId: `$${localField}` },
        pipeline: [
          { $match: { $expr: { $eq: [`$${foreignField}`, '$$localId'] } } },
          ...pipeline
        ],
        as
      }
    };
  }

  /**
   * Group by time period (day, week, month, year)
   */
  static groupByTimePeriod(dateField, period, aggregations) {
    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-W%V',
      month: '%Y-%m',
      year: '%Y'
    };

    return {
      $group: {
        _id: { $dateToString: { format: dateFormat[period], date: `$${dateField}` } },
        ...aggregations
      }
    };
  }

  /**
   * Calculate running totals
   */
  static calculateRunningTotal(groupField, sumField, sortField) {
    return [
      { $sort: { [sortField]: 1 } },
      { $group: {
        _id: `$${groupField}`,
        items: { $push: '$$ROOT' },
        total: { $sum: `$${sumField}` }
      }},
      { $unwind: { path: '$items', includeArrayIndex: 'index' } },
      { $sort: { [`items.${sortField}`]: 1 } },
      { $group: {
        _id: '$items._id',
        document: { $first: '$items' },
        runningTotal: {
          $sum: {
            $cond: [
              { $lte: ['$index', '$$CURRENT.index'] },
              `$items.${sumField}`,
              0
            ]
          }
        }
      }}
    ];
  }

  /**
   * Faceted search for multiple aggregations
   */
  static facetedSearch(facets) {
    return { $facet: facets };
  }

  /**
   * Text search stage
   */
  static textSearch(searchTerm, score = false) {
    const stage = { $match: { $text: { $search: searchTerm } } };
    if (score) {
      return [
        stage,
        { $addFields: { searchScore: { $meta: 'textScore' } } },
        { $sort: { searchScore: -1 } }
      ];
    }
    return stage;
  }

  /**
   * Bucket aggregation for ranges
   */
  static bucketize(groupBy, boundaries, defaultBucket, output) {
    return {
      $bucket: {
        groupBy: `$${groupBy}`,
        boundaries,
        default: defaultBucket,
        output
      }
    };
  }

  /**
   * Window functions for advanced analytics
   */
  static windowFunction(partitionBy, sortBy, output) {
    return {
      $setWindowFields: {
        partitionBy: partitionBy ? `$${partitionBy}` : null,
        sortBy,
        output
      }
    };
  }

  /**
   * Conditional aggregation
   */
  static conditionalSum(field, condition) {
    return {
      $sum: {
        $cond: [condition, `$${field}`, 0]
      }
    };
  }

  /**
   * Array operations
   */
  static arrayOperations = {
    filter: (input, as, cond) => ({
      $filter: { input, as, cond }
    }),
    
    map: (input, as, inExpr) => ({
      $map: { input, as, in: inExpr }
    }),
    
    reduce: (input, initialValue, inExpr) => ({
      $reduce: { input, initialValue, in: inExpr }
    }),
    
    size: (array) => ({
      $size: array
    })
  };

  /**
   * Common aggregation pipelines
   */
  static commonPipelines = {
    // Get top N items by a field
    topN: (sortField, limit, matchStage = null) => {
      const pipeline = [];
      if (matchStage) pipeline.push(matchStage);
      pipeline.push(
        { $sort: { [sortField]: -1 } },
        { $limit: limit }
      );
      return pipeline;
    },

    // Calculate percentage distribution
    percentageDistribution: (groupField, countField = null) => [
      { $group: {
        _id: `$${groupField}`,
        count: { $sum: countField ? `$${countField}` : 1 }
      }},
      { $group: {
        _id: null,
        total: { $sum: '$count' },
        distribution: { $push: { [groupField]: '$_id', count: '$count' } }
      }},
      { $unwind: '$distribution' },
      { $project: {
        [groupField]: `$distribution.${groupField}`,
        count: '$distribution.count',
        percentage: {
          $multiply: [
            { $divide: ['$distribution.count', '$total'] },
            100
          ]
        }
      }}
    ],

    // Time series analysis
    timeSeries: (dateField, metrics, period = 'day') => {
      const dateFormat = {
        day: '%Y-%m-%d',
        week: '%Y-W%V',
        month: '%Y-%m',
        year: '%Y'
      }[period];

      return [
        { $group: {
          _id: { $dateToString: { format: dateFormat, date: `$${dateField}` } },
          ...metrics
        }},
        { $sort: { _id: 1 } }
      ];
    },

    // Cohort analysis
    cohortAnalysis: (userDateField, eventDateField, metricField) => [
      { $addFields: {
        cohortMonth: {
          $dateToString: { format: '%Y-%m', date: `$${userDateField}` }
        },
        eventMonth: {
          $dateToString: { format: '%Y-%m', date: `$${eventDateField}` }
        }
      }},
      { $group: {
        _id: {
          cohort: '$cohortMonth',
          event: '$eventMonth'
        },
        users: { $addToSet: '$userId' },
        metric: { $sum: `$${metricField}` }
      }},
      { $project: {
        cohort: '$_id.cohort',
        eventMonth: '$_id.event',
        userCount: { $size: '$users' },
        metric: 1
      }},
      { $sort: { cohort: 1, eventMonth: 1 } }
    ],

    // Moving average
    movingAverage: (dateField, valueField, windowSize) => [
      { $sort: { [dateField]: 1 } },
      { $setWindowFields: {
        sortBy: { [dateField]: 1 },
        output: {
          movingAverage: {
            $avg: `$${valueField}`,
            window: {
              documents: [-windowSize + 1, 0]
            }
          }
        }
      }}
    ],

    // Rank calculation
    calculateRank: (sortField, ascending = false) => [
      { $sort: { [sortField]: ascending ? 1 : -1 } },
      { $group: {
        _id: null,
        items: { $push: '$$ROOT' }
      }},
      { $unwind: { path: '$items', includeArrayIndex: 'rank' } },
      { $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$items', { rank: { $add: ['$rank', 1] } }]
        }
      }}
    ]
  };

  /**
   * Build a complete aggregation pipeline
   */
  static buildPipeline(stages) {
    return stages.filter(stage => stage !== null);
  }

  /**
   * Performance optimization helpers
   */
  static optimization = {
    // Add index hints
    indexHint: (indexName) => ({
      $hint: indexName
    }),

    // Limit fields early in pipeline
    projectEarly: (fields) => ({
      $project: fields
    }),

    // Use allowDiskUse for large datasets
    allowDiskUse: () => ({
      allowDiskUse: true
    })
  };

  /**
   * Geospatial queries
   */
  static geo = {
    // Near query
    near: (coordinates, maxDistance, minDistance = 0) => ({
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distance',
        maxDistance,
        minDistance,
        spherical: true
      }
    }),

    // Within polygon
    within: (field, polygon) => ({
      $match: {
        [field]: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: polygon
            }
          }
        }
      }
    })
  };

  /**
   * Data transformation utilities
   */
  static transform = {
    // Convert string to number
    toNumber: (field) => ({
      $toDouble: `$${field}`
    }),

    // Convert to date
    toDate: (field) => ({
      $toDate: `$${field}`
    }),

    // String operations
    stringOps: {
      concat: (...fields) => ({
        $concat: fields.map(f => `$${f}`)
      }),
      
      substring: (field, start, length) => ({
        $substr: [`$${field}`, start, length]
      }),
      
      toLowerCase: (field) => ({
        $toLower: `$${field}`
      }),
      
      toUpperCase: (field) => ({
        $toUpper: `$${field}`
      })
    }
  };

  /**
   * Validation and sanitization
   */
  static validatePipeline(pipeline) {
    if (!Array.isArray(pipeline)) {
      throw new Error('Pipeline must be an array');
    }

    for (const stage of pipeline) {
      if (typeof stage !== 'object' || stage === null) {
        throw new Error('Each pipeline stage must be an object');
      }

      const stageKeys = Object.keys(stage);
      if (stageKeys.length !== 1) {
        throw new Error('Each pipeline stage must have exactly one operator');
      }

      const operator = stageKeys[0];
      if (!operator.startsWith('$')) {
        throw new Error(`Invalid operator: ${operator}. Operators must start with $`);
      }
    }

    return true;
  }

  /**
   * Debug helper - adds a stage to output intermediate results
   */
  static debug(label) {
    return {
      $addFields: {
        __debug: label
      }
    };
  }
}

module.exports = AggregationUtils;