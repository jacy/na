package com.jacy.t;

import akka.actor.ActorRef;
import akka.actor.ActorSystem;
import akka.actor.Props;
import akka.actor.UntypedActor;

public class DemoActor extends UntypedActor {
	protected String name;
	protected ActorRef child = getContext().actorOf(mkProps("myChild"));

	public static Props mkProps(String name) {
		return Props.create(DemoActor.class, name);
	}

	public DemoActor(String name) {
		this.name = name;
	}

	@Override
	public void onReceive(Object message) throws Exception {
		// TODO Auto-generated method stub

	}

	public static void main(String[] args) {
		// Using the ActorSystem will create top-level actors, supervised by the
		// actor system’s provided guardian actor,
		// while using an actor’s context will create a child actor.
		ActorSystem system = ActorSystem.create("Mysystem");
		system.actorOf(mkProps("hello"));

	}

}
