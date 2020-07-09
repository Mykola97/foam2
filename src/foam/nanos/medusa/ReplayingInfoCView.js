/**
 * @license
 * Copyright 2020 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.medusa',
  name: 'ReplayingInfoCView',
  extends: 'foam.graphics.Circle',

  implements: [ 'foam.mlang.Expressions' ],

  imports: [
    'DAO clusterTopologyDAO as dao'
  ],

  requires: [
    'foam.graphics.Arc',
    'foam.graphics.Circle',
    'foam.graphics.Label',
    'foam.graphics.Point',
    'foam.graphics.ScrollCView',
    'foam.nanos.medusa.ClusterConfig',
    'foam.nanos.medusa.ReplayingInfoDetailCView',
    'foam.u2.DetailView',
    'foam.u2.PopupView'
  ],

  properties: [
    {
      name: 'config',
      class: 'FObjectProperty',
      of: 'foam.nanos.medusa.ClusterConfig'
    },
    {
      name: 'complete',
      class: 'String'
    },
    {
      name: 'completeLabel',
      class: 'FObjectProperty',
      of: 'foam.graphics.Label',
      factory: function() {
        return this.Label.create({
          align: 'center',
          y: -25,
          text$: this.complete$.map(function(i) {
            if ( i > 0 && i < 1 ) {
              let f = (i * 100).toFixed(2);
              return f+'%';
            }
            return '';
          })
        });
      }
    },
    {
      name: 'eta',
      class: 'String'
    },
    {
      name: 'etaLabel',
      class: 'FObjectProperty',
      of: 'foam.graphics.Label',
      factory: function() {
        return this.Label.create({
          align: 'center',
          y: -15,
          text$: this.eta$.map(function(i) { return i; })
        });
      }
    },
    {
      name: 'index',
      class: 'String'
    },
    {
      name: 'indexLabel',
      class: 'FObjectProperty',
      of: 'foam.graphics.Label',
      factory: function() {
        return this.Label.create({
          align: 'center',
          y: +5,
          text$: this.index$.map(function(i) { return i; })
        });
      }
    },
    {
      name: 'replayIndex',
      class: 'String'
    },
    {
      name: 'replayIndexLabel',
      class: 'FObjectProperty',
      of: 'foam.graphics.Label',
      factory: function() {
        return this.Label.create({
          align: 'center',
          y: +15,
          text$: this.replayIndex$.map(function(i) { return i; })
        });
      }
    },
    {
      name: 'infoView',
      class: 'FObjectProperty',
      of: 'foam.graphics.CView'
    }
  ],

  methods: [
    async function initCView() {
      this.SUPER();

      this.color = '';
      this.border = '';
      this.arcWidth = 1;
      this.alpha = 0.5;

      this.add(this.completeLabel);
      this.add(this.etaLabel);
      this.add(this.indexLabel);
      this.add(this.replayIndexLabel);

      this.refresh();
    },
    {
      name: 'refresh',
      code: async function(self = this) {
        console.log('ReplayingInfoCView.refresh '+self.children.length);
        if ( self.config ) {
          self.config = await self.dao.find(self.config.id);
          self.updateReplaying();
          for ( var i = 0; i < self.children.length; i++ ) {
            let child = self.children[i];
            child.refresh && child.refresh(child);
          }
          self.invalidate();
        }
      }
    },
    {
      name: 'updateReplaying',
      code: function() {
        if ( this.config.replayingInfo ) {
          if ( this.config.replayingInfo.replaying &&
               this.config.replayingInfo.replayIndex > 0 ) {
            this.color = 'cyan';
            this.start = (1 - this.config.replayingInfo.percentComplete ) * (2 * Math.PI);
            this.complete = this.config.replayingInfo.percentComplete;
            this.eta = this.config.replayingInfo.timeRemaining;
            this.index = this.config.replayingInfo.index;
            this.replayIndex = this.config.replayingInfo.replayIndex;
          } else {
            this.color = '';
            this.complete = '';
            this.eta == this.config.replayingInfo.tps;
            this.index = this.config.replayingInfo.index;
            this.replayIndex = '';
          }
        }
      }
    },
    {
      name: 'handleClick',
      code: function(evt, element) {
        console.log('ReplayingInfoCView.handleClick');
        if ( this.config.replayingInfo ) {
          for ( var i = 0 ; i < this.children.length ; i++ ) {
            let child = this.children[i];
            if ( child.cls_.id == this.ReplayingInfoDetailCView.id ) {
              return;
            }
          }

          if ( this.infoView ) {
            element.canvas.remove(this.infoView);
            this.infoView = undefined;
          } else {
            var r = this.ReplayingInfoDetailCView.create({
              config: this.config,
              alpha: 0.8,
              x: evt.offsetX,
              y: evt.offsetY
            });
            r.y = r.y - r.height/2;
            this.infoView = r;
            element.canvas.add(r);
          }
        }
      }
    },
    // {
    //   name: 'handleRightClick',
    //   code: function(evt, element) {
    //     console.log(this.cls_.id+'.handleRightClick');
    //   }
    // },
    // {
    //   name: 'handleMouseMove',
    //   code: function(evt, element) {
    //     console.log(this.cls_.id+'.handleMouseMove');
    //   }
    // }
  ]
});
