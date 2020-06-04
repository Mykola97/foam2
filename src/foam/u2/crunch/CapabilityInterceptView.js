/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.u2.crunch',
  name: 'CapabilityInterceptView',
  extends: 'foam.u2.View',

  implements: [ 'foam.mlang.Expressions' ],

  requires: [
    'foam.nanos.crunch.Capability',
    'foam.nanos.crunch.CapabilityJunctionStatus',
    'foam.nanos.crunch.UserCapabilityJunction',
    'foam.u2.crunch.CapabilityCardView',
    'foam.u2.layout.Rows'
  ],

  imports: [
    'capabilityAcquired',
    'capabilityCache',
    'capabilityCancelled',
    'capabilityDAO',
    'crunchController',
    'notify',
    'stack',
    'user',
    'userCapabilityJunctionDAO'
  ],

  properties: [
    {
      name: 'capabilityOptions',
      class: 'StringArray'
    },
    {
      name: 'capabilityView',
      class: 'foam.u2.ViewSpec',
      factory: function () {
        return 'foam.u2.crunch.CapabilityCardView';
      }
    },
    {
      name: 'onClose',
      class: 'Function',
      factory: () => (x) => {
        x.closeDialog();
      }
    }
  ],

  messages: [
    { name: 'REJECTED_MSG', message: 'Your choice to bypass this was stored, please refresh page to revert cancel selection.' }
  ],

  css: `
    ^detail-container {
      overflow-y: scroll;
    }
    ^ > *:not(:last-child) {
      margin-bottom: 24px !important;
    }
  `,

  methods: [
    function initE() {
      this.capabilityOptions.forEach((c) => {
        if ( this.capabilityCache.has(c) && this.capabilityCache.get(c) ) {
          capabilityAcquired = true;
          this.stack.back();
        }
      });

      var self = this;
      this
        .addClass(this.myClass())
        .start(this.Rows)
          .addClass(this.myClass('detail-container'))
          .add(this.slot(function (capabilityOptions) {
            return this.E().select(this.capabilityDAO.where(
              self.IN(self.Capability.ID, capabilityOptions)
            ), (cap) => {
              return this.E().tag(self.capabilityView, {
                data: cap
              })
                .on('click', () => {
                  var p = self.crunchController.launchWizard(cap.id);
                  p.then(() => {
                    this.checkStatus(cap);
                  })
                })
            })
          }))
        .end()
        .startContext({ data: this })
          .tag(this.CANCEL, { buttonStyle: 'SECONDARY' })
        .endContext();
    },
    function checkStatus(cap) {
      // Query UCJ status
      this.userCapabilityJunctionDAO.where(this.AND(
        this.EQ(this.UserCapabilityJunction.SOURCE_ID, this.user.id),
        this.EQ(this.UserCapabilityJunction.TARGET_ID, cap.id)
      )).limit(1).select(this.PROJECTION(
        this.UserCapabilityJunction.STATUS
      )).then(results => {
        if ( results.array.length < 1 ) {
          this.reject();
          return;
        }
        var entry = results.array[0]; // limit 1
        var status = entry[0]; // first field (status)
        switch ( status ) {
          case this.CapabilityJunctionStatus.GRANTED:
            this.aquire();
            break;
          default:
            this.reject();
            break;
        }
      });
    },
    function aquire(x) {
      x = x || this.__subSubContext__;
      this.capabilityAcquired = true;
      this.capabilityOptions.forEach((c) => {
        this.capabilityCache.set(c, true);
      });
      this.onClose(x);
    },
    function reject(x) {
      x = x || this.__subSubContext__;
      this.capabilityCancelled = true;
      this.capabilityOptions.forEach((c) => {
        this.capabilityCache.set(c, true);
      });
      this.notify(this.REJECTED_MSG);
      this.onClose(x);
    }
  ],

  actions: [
    {
      name: 'cancel',
      label: 'Not interested in adding this functionality',
      code: function(x) {
        this.reject(x);
      }
    }
  ]
});
