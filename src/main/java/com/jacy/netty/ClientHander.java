package com.jacy.netty;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.jboss.netty.buffer.ChannelBuffer;
import org.jboss.netty.channel.ChannelHandlerContext;
import org.jboss.netty.channel.ChannelStateEvent;
import org.jboss.netty.channel.ExceptionEvent;
import org.jboss.netty.channel.MessageEvent;
import org.jboss.netty.channel.SimpleChannelUpstreamHandler;

public class ClientHander extends SimpleChannelUpstreamHandler {

	private static final Logger logger = Logger.getLogger(ClientHander.class.getName());

	@Override
	public void channelConnected(ChannelHandlerContext ctx, ChannelStateEvent e) {
		System.out.println("Connected");
	}

	@Override
	public void messageReceived(ChannelHandlerContext ctx, MessageEvent e) {
		ChannelBuffer m = (ChannelBuffer) e.getMessage();
		short type = m.readUnsignedByte();
		switch (type) {
		case 31: // login success
			System.out.println("Login success, PId=" + m.readInt());
			break;
		case 18: // query game result
			System.out.printf("GID:%d,table_name:%s,Game type:%d,Limit:{type:%d,min:%d,max:%d},Seat counts:%d,required_players:%d,joined_players:%d,waiting_players:%d \n",
					m.readInt(), readString(m), m.readUnsignedByte(),m.readUnsignedByte(),m.readInt()/10000,m.readInt()/10000,m.readInt(),m.readInt(),m.readInt(),m.readInt());
			break;
		case 30: // query game result
			System.out.printf("GID:%d,SeatId:%d,Seat state:%d,player:count:%d,amount:%d \n",
					m.readInt(),m.readUnsignedByte(),m.readUnsignedByte(),m.readInt(),m.readInt()/10000);
			break;
		default:
			System.out.println("Get response type:" + type);
			break;
		}
	}
	
	private static String readString(ChannelBuffer message){
		short type = message.readUnsignedByte();
		String r = "";
		for(int i = 0; i < type; i++){
			r += readChar(message);
		}
		return r;	
	}

	private static char readChar(ChannelBuffer message) {
		return (char)message.readByte();
	}

	@Override
	public void exceptionCaught(ChannelHandlerContext ctx, ExceptionEvent e) {
		// Close the connection when an exception is raised.
		logger.log(Level.WARNING, "Unexpected exception from downstream.", e.getCause());
		e.getChannel().close();
	}

	@Override
	public void channelClosed(ChannelHandlerContext ctx, ChannelStateEvent e) throws Exception {
		super.channelClosed(ctx, e);
	}
}
