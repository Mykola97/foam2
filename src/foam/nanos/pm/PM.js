/**
 * @license
 * Copyright 2019 The FOAM Authors. All Rights Reserved.
 * http://www.apache.org/licenses/LICENSE-2.0
 */

foam.CLASS({
  package: 'foam.nanos.pm',
  name: 'PM',

  documentation: `A Performance Measure which captures the count and duration of some event.`,

  implements: [
    'foam.nanos.analytics.Foldable',
    'foam.nanos.ruler.RuleAction'
  ],

  javaImports: [
    'foam.core.ClassInfo',
    'foam.core.ContextAgent',
    'foam.core.FObject',
    'foam.core.X'
  ],

  ids: [ 'key', 'name', 'startTime' ],

  properties: [
    {
      class: 'String',
      name: 'key'
    },
    {
      class: 'String',
      name: 'name'
    },
    {
      name: 'startTime',
      class: 'DateTime',
      factory: function() {
        return new Date();
      },
      javaFactory: `return new java.util.Date();`
    },
    {
      name: 'endTime',
      class: 'DateTime'
    },
    {
      name: 'isError',
      class: 'Boolean',
      value: false
    },
    {
      name: 'errorMessage',
      class: 'String'
    },
    {
      name: 'exception',
      class: 'Object',
      storageTransient: true
    }
  ],

  methods: [
    {
      name: 'init_',
      javaCode: `
      getStartTime();
      `
    },
    {
      name: 'log',
      type: 'Void',
      args: [
        {
          name: 'x',
          type: 'X'
        }
      ],
      javaCode: `
    if ( x == null ) return;
    if ( getIsError() ) return;
    setEndTime(new java.util.Date());
    PMLogger pmLogger = (PMLogger) x.get(DAOPMLogger.SERVICE_NAME);
    if ( pmLogger != null ) {
      pmLogger.log(this);
    }
      `
    },
    {
      name: 'getTime',
      type: 'Long',
      javaCode: `
    return getEndTime().getTime() - getStartTime().getTime();
      `
    },
    {
      name: 'doFolds',
      javaCode: `
    fm.foldForState(getKey()+":"+getName(), getStartTime(), getTime());
      `
    },
    {
      name: 'error',
      args: [
        { name: 'x', type: 'Context' },
        { name: 'args', type: 'Object...' }
      ],
      javaCode: `
        setIsError(true);
        StringBuilder sb = new StringBuilder();
        for (Object obj: args) {
          if ( obj instanceof Exception ) {
            setException(obj);
            sb.append(((Exception) obj).getMessage()).append(",");
          }
        }
        if ( sb.length() > 0 )
          setErrorMessage(sb.deleteCharAt(sb.length() - 1).toString());
      `
    },
    {
      name: 'applyAction',
      javaCode: `
          agency.submit(x, new ContextAgent() {
            @Override
            public void execute(X x) {
              if ( ! obj.getIsError() ) {
                return;
              }
              DAO configDAO = (DAO) x.get("alarmConfigDAO");
              PM pm = (PM) obj;
              AlarmConfig config = (AlarmConfig) configDAO.find(EQ(AlarmConfig.NAME, pm.getId()));
              if ( config == null || ! config.getEnabled() ) {
                return;
              }
              DAO alarmDAO = (DAO) x.get("alarmDAO");
              Alarm alarm = (Alarm) alarmDAO.find(EQ(Alarm.NAME, config.getName()));
              if ( ! alarm == null || alarm.getIsActive() ){
                return;
              }
              alarm = new Alarm.Builder(x)
                .setName(config.getName())
                .setIsActive(true)
                .build();
              alarmDAO.put(alarm);
            }
          }, "PM alarm");
     `
    }
  ],
  axioms: [
    {
      name: 'javaExtras',
      buildJavaClass: function (cls) {
        cls.extras.push(foam.java.Code.create({
          data: `
            public static PM create(X x, FObject fo, String... name) {
              PM pm = (PM) x.get("PM");

              if ( pm == null ) return new PM(fo, name);

              pm.setKey(fo.getClassInfo().getId());
              pm.setName(combine(name));
              pm.init_();

              return pm;
            }

            public static PM create(X x, ClassInfo clsInfo, String... name) {
              PM pm = (PM) x.get("PM");

              if ( pm == null ) return new PM(clsInfo, name);

              pm.setKey(clsInfo.getId());
              pm.setName(combine(name));
              pm.init_();

              return pm;
            }

            public PM(ClassInfo clsInfo, String... name) {
              setName(combine(name));
              setKey(clsInfo.getId());
              init_();
            }

            public PM(Class cls, String... name) {
              setName(combine(name));
              foam.core.ClassInfoImpl clsInfo = new foam.core.ClassInfoImpl();
              clsInfo.setObjClass(cls);
              clsInfo.setId(cls.getName());
              setKey(clsInfo.getId());
              init_();
            }

            public PM(FObject fo, String... name) {
              this(fo.getClassInfo(), name);
            }

            public PM(Object... args) {
              setKey(args[0].toString());
              StringBuilder sb = new StringBuilder();
              for (Object obj: java.util.Arrays.copyOfRange(args, 1, args.length)){
                sb.append(obj.toString()).append(":");
              }
              if ( sb.length() > 0 )
                setName(sb.deleteCharAt(sb.length() - 1).toString());
              init_();
            }

            private static String combine(String... args) {
              StringBuilder sb = new StringBuilder();
              for ( String s: args) {
                sb.append(s).append(":");
              }
              return sb.deleteCharAt(sb.length() - 1).toString();
            }
          `
        }));
      }
    }
  ]
});
