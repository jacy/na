var blockUI, format, growlUI, unblockUI;

format = function(str, step, splitor) {
	var arr, first, i, l1, l2, len;
	step = (step == null) ? 3 : step;
	splitor = (splitor == null) ? ',' : splitor;
	arr = [];
	str = str.toString();
	len = str.length;
	if (len > step) {
		l1 = len % step;
		l2 = parseInt(len / step);
		first = str.substr(0, l1);
		if (first !== '')
			arr.push(first);
		for (i = 0; i <= 11; i++) {
			if ((i * step + l1) < len)
				arr.push(str.substr(l1 + i * step, step));
		}
		str = arr.join(splitor);
	}
	return str;
};

growlUI = function(id, opt) {
	var conf;
	conf = {
		message : $(id).clone(),
		fadeIn : 700,
		fadeOut : 700,
		timeout : 6000,
		showOverlay : false,
		css : GROWLUI
	};
	if (opt != null)
		conf = $.extend(conf, opt);
	return $('#page').block(conf);
};

blockUI = function(o, timeout) {
	$.blockUI({
		message : typeof o === 'string' ? $(o).clone() : $(o),
		centerX : true,
		centerY : true,
		timeout : timeout ? timeout : 0,
		css : BLOCKUI
	});
};

unblockUI = function() {
	$.unblockUI();
};

// $(funciton(){}) is short for $(document ).ready(function(){});
$(function() {
	blockUI("#msg_connect");
	$.ajaxSetup({cache : false});
	var singin_dom = $('#singin');
	var singin_form = $('#singin > form');
	var player_dom = $('#toolbar > #player');
	$(this).oneTime('5s', function() {
		if (!$.ws.isConnection())
			blockUI('#err_network');
	});
	var on_load = function() {
		 // localStorage is HTML5 web storage, a better local storage than cookies.
		var usrFromUrl = $.url.get("usr");
		var identity = usrFromUrl ? usrFromUrl : localStorage.getItem("player#identity");
		var pwdFromUrl = $.url.get("pwd");
		var password = pwdFromUrl ? pwdFromUrl : localStorage.getItem("player#password");
		if (localStorage.getItem("autosave#identity") === "false") {
			$("#ckb_save").attr('checked', false);
		}
		$('#txt_identity').val(identity);
		$('#txt_password').val(password);
		if ((!$.isEmpty(identity)) && (!$.isEmpty(password))) {
			singin_form.trigger('submit');
		} else {
			blockUI(singin_dom);
		}
	};
	var on_open = function() {
		$(this).stopTime();
		$(document).oneTime(
				'1s',
				function() {
					var resources, s, sounds, _i, _len;
					blockUI('#msg_loading');
					resources = [ {
						url : 'css/heads.png',
						callback : $.rl.handle_heads
					}, {
						url : 'css/poker.png',
						callback : $.rl.handle_pokers
					}, {
						url : 'css/betting.png',
						callback : $.rl.handle_bets
					} ];
					sounds = [ "bet", "raise", "move", "card", "check", "fold",	"turn" ];
					for (_i = 0, _len = sounds.length; _i < _len; _i++) {
						s = sounds[_i];
						resources.push({
							url : 'css/sound/' + s + '.mp3',
							key : s
						});
					}
					$.rl.load(resources, on_load);
				});
	};
	singin_form.bind("submit", function() {
		blockUI('#msg_singin');
		var identity = $(this).children("#txt_identity").val();
		var password = $(this).children("#txt_password").val();
		$.ws.send($.pp.write({
			cmd : "LOGIN",
			usr : identity,
			pass : password
		}));
		$(this).oneTime('3s', function() {
			return blockUI(singin_dom);
		});
		return false;
	});
	singin_form.bind("stop", function() {
		$(this).stopTime();
	});
	player_dom.bind('singin', function() {
		singin_form.trigger("stop");
		$('#toolbar > *').show();
		$.unblockUI();
		if ($("#ckb_save").attr('checked')) {
			localStorage.setItem("player#identity", $('#txt_identity').val());
			localStorage.setItem("player#password", $('#txt_password').val());
			localStorage.setItem("autosave#identity", true);
		} else {
			localStorage.setItem("player#identity", "");
			localStorage.setItem("player#password", "");
			localStorage.setItem("autosave#identity", false);
		}
		$('#hall').trigger('setup');
	});
	$.pp.reg('ERROR', function() {
		$("#txt_password").val("");
		$("#lab_err_singin").show();
		singin_form.trigger("stop");
		blockUI(singin_dom);
	});
	if ($.url.get('host'))
		$.ws.defaults.host = $.url.get('host');
	$.ws.defaults.onmessage = $.pp.onmessage;
	$.ws.defaults.onopen = on_open;
	$.ws.init();
});
