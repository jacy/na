package com.jacy.t;

import akka.actor.Props;
import akka.japi.Creator;

public class MyActorC implements Creator<MyUntypedActor> {

	private static final long serialVersionUID = 1425293848968668363L;

	@Override
	public MyUntypedActor create() throws Exception {
		return new MyUntypedActor();
	}

	Props props1 = Props.create(MyActorC.class);
}
