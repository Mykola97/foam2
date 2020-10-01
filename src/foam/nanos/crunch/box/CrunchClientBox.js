foam.CLASS({
  package: 'foam.nanos.crunch.box',
  name: 'CrunchClientBox',
  extends: 'foam.box.ProxyBox',

  documentation: `
    This box adds support for CRUNCH intercepts.
  `,

  requires: [ 'foam.nanos.crunch.box.CrunchClientReplyBox' ],

  properties: [
  ],

  methods: [
    {
      name: 'send',
      code: function send(msg) {
        msg.attributes.replyBox.localBox =
          this.CrunchClientReplyBox.create({
            msg:       msg,
            clientBox: this,
            delegate:  msg.attributes.replyBox.localBox
          });

        this.delegate.send(msg);
      }
    }
  ]
});
