package com.jacy.netty;

import java.net.InetSocketAddress;
import java.util.Scanner;
import java.util.concurrent.Executors;

import org.jboss.netty.bootstrap.ClientBootstrap;
import org.jboss.netty.buffer.ChannelBuffer;
import org.jboss.netty.buffer.ChannelBuffers;
import org.jboss.netty.channel.Channel;
import org.jboss.netty.channel.ChannelFuture;
import org.jboss.netty.channel.ChannelPipeline;
import org.jboss.netty.channel.ChannelPipelineFactory;
import org.jboss.netty.channel.Channels;
import org.jboss.netty.channel.socket.nio.NioClientSocketChannelFactory;
import org.jboss.netty.handler.codec.frame.LengthFieldBasedFrameDecoder;
import org.jboss.netty.handler.codec.frame.LengthFieldPrepender;

/**
 * Sends one message when a connection is open and echoes back any received data
 * to the server. Simply put, the echo client initiates the ping-pong traffic
 * between the echo client and server by sending the first message to the
 * server.
 */
public class Client {

	private final String host;
	private final int port;

	public Client(String host, int port) {
		this.host = host;
		this.port = port;
	}

	public void run() {
		ClientBootstrap bootstrap = new ClientBootstrap(new NioClientSocketChannelFactory(Executors.newCachedThreadPool(), Executors.newCachedThreadPool()));
		bootstrap.setPipelineFactory(channelFactory());

		// Start the connection attempt.
		ChannelFuture future = bootstrap.connect(new InetSocketAddress(host, port));
		Channel channel = future.getChannel();
//		write(channel, 1, new String[] { "jacy", "jacy" });
		Scanner sc = new Scanner(System.in);
		while (sc.hasNextLine()) {
			try{
				
				String line = sc.nextLine();
				if ("exit".equals(line)) {
					channel.close();
					bootstrap.releaseExternalResources();
					break;
				}else if("gamequery".equals(line)){
					gameQuery(channel);
				}else if("seatquery".equals(line)){
					System.out.println("input GID");
					seatQuery(Integer.valueOf(sc.nextLine()),channel);
				}else{
					String[] t = line.split("@");
					write(channel, Integer.valueOf(t[0]), getParam(t));
				}
			}catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

	private void seatQuery(Integer gameId, Channel c) {
		ChannelBuffer wrappedBuffer = ChannelBuffers.buffer(1024);
		wrappedBuffer.writeByte(14);
		wrappedBuffer.writeInt(gameId);
		c.write(wrappedBuffer);
	}

	private void gameQuery(Channel c) {
		ChannelBuffer wrappedBuffer = ChannelBuffers.buffer(1024);
		wrappedBuffer.writeByte(13);
		wrappedBuffer.writeByte(0); //game type
		wrappedBuffer.writeByte(0); //limit type
		wrappedBuffer.writeByte(0); //expected op
		wrappedBuffer.writeByte(0); //expected value
		wrappedBuffer.writeByte(0); //joined op
		wrappedBuffer.writeByte(0); //joined value
		wrappedBuffer.writeByte(0); //waiting op
		wrappedBuffer.writeByte(0); //waiting value
		c.write(wrappedBuffer);
	}

	private String[] getParam(String[] t) {
		if (t.length == 2) {
			return t[1].split(",");
		}
		return null;
	}

	private ChannelPipelineFactory channelFactory() {
		return new ChannelPipelineFactory() {
			public ChannelPipeline getPipeline() throws Exception {
				ChannelPipeline pipeline = Channels.pipeline();
				pipeline.addLast("length-decoder", new LengthFieldBasedFrameDecoder(256, 0, 2, 0, 2));
				pipeline.addLast("length-encoder", new LengthFieldPrepender(2, false));
				pipeline.addLast("handler", new ClientHander());
				return pipeline;
			}
		};
	}

	private void write(Channel c, int type, String[] msg) {
		ChannelBuffer wrappedBuffer = ChannelBuffers.buffer(1024);
		wrappedBuffer.writeByte(type);
		if (msg != null) {
			for (String s : msg) {
				writeString(wrappedBuffer, s);
			}
		}
		c.write(wrappedBuffer);
	}

	private void writeString(ChannelBuffer wrappedBuffer, String s) {
		wrappedBuffer.writeByte(s.length());
		for (int i = 0; i < s.length(); i++) {
			wrappedBuffer.writeByte(s.charAt(i));
		}
	}

	public static void main(String[] args) throws Exception {
		new Client("localhost", 7799).run();
	}
}
