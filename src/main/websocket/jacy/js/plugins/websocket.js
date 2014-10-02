(function($) {
	var ws;
	var queue = [];
	$.ws = {
		send : function(bin) {
			var msg = $.base64.encode(bin);
			queue.unshift(msg);
		},
		defaults : {
			host : "localhost",
			port : "8002",
			onmessage : function(e) {
				console.log([ 'websocket message', e ]);
			},
			onopen : function() {
				console.log('websocket is open');
			},
			onerror : function(error) {
				console.error(['websocket catch error:',error]);
			},
			onclose : function() {
				growlUI("Connection is closed by game server.");
			}
		},

		init : function() {
			if ((ws == null) || (ws == undefined)) {
				ws = new WebSocket("ws://" + $.ws.defaults.host + ":" + $.ws.defaults.port + "/", "chat");
				ws.onmessage = $.ws.defaults.onmessage;
				ws.onopen = $.ws.defaults.onopen;
				ws.onerror = $.ws.defaults.onerror;
			}
			$(this).everyTime(300, function() {
				if (queue.length) ws.send(queue.pop());
			});
		},
		isConnection : function() {
			return ws.readyState == WebSocket.OPEN;
		}
	};
})($);
