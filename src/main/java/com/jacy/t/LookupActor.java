package com.jacy.t;

import java.util.concurrent.TimeUnit;

import scala.concurrent.duration.Duration;
import akka.actor.ActorSelection;
import akka.actor.ActorSystem;
import akka.actor.Inbox;
import akka.actor.Props;
import akka.actor.UntypedActor;

public class LookupActor extends UntypedActor {
	private static final String AKKA_PROTOL = "akka://";
	private static final String ACTOR_SYSTEM = "jacy";
	private static final String ACTOR_USER = "user";
	private static final String ACTOR_CUSTOM = "service";
	private static final String ACTOR_CUSTOM_CHILD = "child";
	private static final String PATH_CUSTOM = AKKA_PROTOL + ACTOR_SYSTEM + "/" + ACTOR_USER + "/" + ACTOR_CUSTOM;

	@Override
	public void preStart() {
		System.out.println("------Parent Pre Start----");
		getContext().actorOf(Props.create(ChildActor.class), ACTOR_CUSTOM_CHILD); // create child
		
		ActorSelection child = getContext().actorSelection(PATH_CUSTOM + "/" + ACTOR_CUSTOM_CHILD);
		child.tell("from parent 1", getSelf());
		child = getContext().actorSelection(ACTOR_CUSTOM_CHILD);
		child.tell("from parent 2", getSelf());
		System.out.println("-----Parent Pre Start Ending----");

	}

	private static void sleep(int ms) {
		try {
			Thread.sleep(ms);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
	}

	@Override
	public void onReceive(Object message) throws Exception {
		System.out.println("Parent receive message ：" + message);
		if(getSender() != null){
			getSender().tell("message confirmation", null);
		}
	}

	public static void main(String[] args) {
		ActorSystem system = ActorSystem.create(ACTOR_SYSTEM); // ActorSystem is a heavy object: create only one per application
		testActorPath(system);

	}

	public static void mailBox(ActorSystem system) {
		final Inbox inbox = Inbox.create(system);
		inbox.send(system.actorOf(Props.create(LookupActor.class), ACTOR_CUSTOM), "hello");
		
		Object message = inbox.receive(Duration.create(1, TimeUnit.SECONDS));
		System.out.println(message);
	}

	public static void testActorPath(ActorSystem system) {
		system.actorOf(Props.create(LookupActor.class), ACTOR_CUSTOM); // create top-level actor,supervised by the actor system’s provided guardian actor
		System.out.println("*******IN main thread*********");
		ActorSelection service = system.actorSelection(PATH_CUSTOM);
		service.tell("Get root actor of my system by full path", null);
		service = system.actorSelection(ACTOR_USER + "/" + ACTOR_CUSTOM);
		service.tell("Get root actor of my system by relative path", null);

		ActorSelection child = system.actorSelection(PATH_CUSTOM + "/" + ACTOR_CUSTOM_CHILD);
		child.tell("Get child actor by full path", null);
		child = system.actorSelection(ACTOR_USER + "/" + ACTOR_CUSTOM + "/" + ACTOR_CUSTOM_CHILD);
		child.tell("Get child actor by relative path", null);

		sleep(10000);
		system.shutdown();
	}

	static class ChildActor extends UntypedActor {
		@Override
		public void preStart() throws Exception {
			System.out.println("=======child is created========");
		}

		@Override
		public void onReceive(Object message) throws Exception {
			System.out.println("Child receive message: " + message);
		}

	}

}