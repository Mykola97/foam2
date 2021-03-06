/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.approval',
  name: 'Approvable',

  sections: [
    {
      name: 'admin',
      permissionRequired: true
    },
  ],

  properties: [
    {
      class: 'String',
      name: 'id',
      documentation: `
        A function of daoKey, objId and a hashed properties to update, to be used
        to distinguish update requests on the same object
      `,
      required: true,
      section: 'admin',
      visibility: 'RO'
    },
    {
      class: 'String',
      name: 'daoKey',
      section: 'admin',
      visibility: 'RO'
    },
    {
      class: 'Object',
      javaType: 'Object',
      name: 'objId',
      section: 'admin',
      visibility: 'RO'
    },
    {
      class: 'Map',
      name: 'propertiesToUpdate'
    },
    {
      class: 'Enum',
      of: 'foam.nanos.approval.ApprovalStatus',
      name: 'status'
    }
  ],

  methods: [
    {
      name: 'toSummary',
      code: function() {
        var modelString = this.daoKey;

        modelString = modelString.replace('local', '');
        modelString = modelString.replace('DAO', '');

        return `(${modelString}:${this.objId}) UPDATE`;
      }
    }
  ]
});
