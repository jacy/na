var Game;

Game = (function() {

  function Game(gid, dom) {
    this.gid = gid;
    this.dom = dom;
    return;
  }

  Game.prototype.init = function(detail) {
    this.detail = detail;
    this.stage = GS_PREFLOP;
    this.seats = [];
    this.seatData = [];
    this.pot = new Pot();
    this.cards = [];
    return this.dom.trigger('inited');
  };

  Game.prototype.init_seat = function(seat_detail) {
	this.seatData[seat_detail.sn] = new Bet(seat_detail.sn, seat_detail.bet);
    switch (seat_detail.state) {
      case PS_EMPTY:
        return this.seats[seat_detail.sn] = new EmptySeat(seat_detail, this);
      default:
    	this.seats[seat_detail.sn] = new PlayingSeat(seat_detail, this);
        if(seat_detail.bet > 0){
        	this.seats[seat_detail.sn].raise(seat_detail.bet,0);
        }
        return this.seats[seat_detail.sn];
    }
  };

  Game.prototype.update_seat = function(seat_detail) {
    if (seat_detail.state === PS_EMPTY) {}
  };

  Game.prototype.reset_position = function(sn) {
    var seat, _i, _len, _ref, _results;
    $.positions.offset = $.positions.size - sn + 1;
    _ref = this.seats;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      seat = _ref[_i];
      if (seat != null) _results.push(seat.set_position());
    }
    return _results;
  };

  Game.prototype.join = function(seat_detail) {
    this.seats[seat_detail.sn].remove();
    this.seats[seat_detail.sn] = new PlayingSeat(seat_detail, this);
    if (seat_detail.pid === $.player.pid) {
      this.player = $.player;
      this.hide_empty();
      this.reset_position(seat_detail.sn);
    }
    return this.seats[seat_detail.sn].disable();
  };

  Game.prototype.hide_empty = function() {
    var seat, _i, _len, _ref, _results;
    $("#cmd_standup").show();
    _ref = this.seats;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      seat = _ref[_i];
      if ((seat != null) && seat.__proto__.constructor === EmptySeat) {
        _results.push(seat.hide());
      }
    }
    return _results;
  };

  Game.prototype.show_empty = function() {
    var seat, _i, _len, _ref, _results;
    $("#cmd_standup").hide();
    _ref = this.seats;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      seat = _ref[_i];
      if ((seat != null) && seat.__proto__.constructor === EmptySeat) {
        _results.push(seat.show());
      }
    }
    return _results;
  };

  Game.prototype.leave = function(args) {
    var seat  = this.seats[args.sn];
    if (seat.__proto__.constructor === EmptySeat) return;
    if (args.player.pid === $.player.pid) {
    	this.disable_actions();
    	this.player = null;
    }
    this.seats[seat.sn].clear();
    this.seats[seat.sn].remove();
    this.seats[seat.sn] = new EmptySeat({
      sn: args.sn
    }, this, seat.cards);
    if (this.player) {
      return this.hide_empty();
    } else {
      return this.show_empty();
    }
  };

  Game.prototype.clear = function() {
    var seat, _i, _len, _ref, _results;
    this.stage = GS_PREFLOP;
    this.cards = [];
    this.pot = new Pot();
    $.positions.reset_share();
    $(".bet, .pot, .card,").remove();
    _ref = this.seats;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      seat = _ref[_i];
      this.seatData[_i] = new Bet(_i);
      if (seat != null) _results.push(seat.clear());
    }
    return _results;
  };

  Game.prototype.get_seat_by_pid = function(o) {
    var seat, _i, _len, _ref;
    _ref = this.seats;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      seat = _ref[_i];
      if ((seat != null) && seat.__proto__.constructor === PlayingSeat && seat.player.pid === o.pid) {
        return seat;
      }
    }
  };

  Game.prototype.get_seat_by_sn = function(o) {
    var seat, _i, _len, _ref;
    _ref = this.seats;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      seat = _ref[_i];
      if ((seat != null) && seat.__proto__.constructor === PlayingSeat && seat.sn === o.seat) {
        return seat;
      }
    }
  };

  Game.prototype.get_seat = function(o) {
    if ('pid' in o) {
      return this.get_seat_by_pid(o);
    } else if ('seat' in o) {
      return this.get_seat_by_sn(o);
    } else if ('sn' in o) {
      return this.get_seat_by_sn(o);
    } else {
      throw "unknown object " + o + " in get_seat()";
    }
  };

  Game.prototype.new_stage = function(stage, pot) {
    var _i, _len, _this, _pot, _pots ;
    this.stage = stage;
    _this = this;
    _pot = _this.pot;
    
    for (_i = 0, _len = _this.seats.length; _i < _len; _i++) {
    	var seat = _this.seats[_i];
    	if ((seat != null) && seat.__proto__.constructor === PlayingSeat) {
    		seat.reset_bet();
    	}
    }
    
    var Bets = [];
    for (_i = 0, _len = _this.seatData.length; _i < _len; _i++) {
      var sd = _this.seatData[_i];
       Bets.push(sd);
      _this.seatData[_i] = new Bet(_i);
    }
    _pot.addBets(Bets);
    
    _pots = _pot.pots();
    _this.dom.oneTime('0.3s', function() {
    	for (_i = 0, _len = _pots.length; _i < _len; _i++) {
    		_this.animate_pot(_pots[_i],Bets);
	    }
    });
    _pot.new_stage();
  };

  Game.prototype.share_card = function(face, suit) {
	  $.push_card(this.cards,face,suit);
	  return $.get_poker(face, suit).css($.positions.get_next_share()).appendTo(this.dom);
  };
  
  Game.prototype.animate_pot = function(pot, orignBets) {
	  if(pot.total() <= 0){
		  return;
	  }
	  var ref = this.dom;
	  var _this = this;
	  $.each(pot.members, function(i, bet){
		  if(bet.amount > 0){
			  var l = (270 + pot.id * 55) + 'px';
			  var b = _this.move_to_pot(bet,orignBets[bet.seat]);
			  b.css({top:'270px', left:l}).removeClass('bet').attr('sn', pot.id).addClass('pot');
		  }
	  });
	  _this.show_pot(pot.id, pot.total());
  };
  
  Game.prototype.show_pot = function(id, amount) {
	  $('#pot_' + id +' label').text(amount).show();
  };
  
  Game.prototype.move_to_pot = function(bet, originBet) {
	  var b = this.dom.find('img.bet[sn=' + bet.seat + ']');
	  if(bet.amount >= originBet.amount){
		  originBet.amount = 0;
		  return b;
	  }else {
		  originBet.amount = Math.floor(originBet.amount / 2);
		  return b.slice(0, b.length/2 + 1);
	  }
  };
  
  Game.prototype.get_bet_chips = function(sn, amount) {
	  
	  return this.dom.find('img.bet[sn=' + bet.seat + ']');
  };

  Game.prototype.win = function(seat, potid) {
    var ref = this.dom;
    return ref.oneTime((potid+1)*1 + 's', function() {
    	var p = ref.find('img.pot[sn=' + potid + ']');
        p.css($.positions.get_bet(seat.sn).start);
      $('#pot_' + potid +' label').text('').hide();
    });
  };

  Game.prototype.high = function(face, suit, filter, seat_pokers) {
    var pokers;
    pokers = $.merge(this.dom.children('.card'), seat_pokers);
    pokers = $.find_poker(face, suit, pokers);
    if (filter != null) pokers = filter(pokers);
    return pokers.addClass('high_card');
  };

  Game.prototype.clear_high = function() {
    return $.find_poker().removeClass('high_card');
  };

  Game.prototype.clear_actor = function() {
    $('.actor_timer').remove();
    return $('.actor_seat').removeClass('actor_seat');
  };

  Game.prototype.disable_actions = function(key) {
    if (key == null) {
      $("#cmd_call").text('Call');
      $("#cmd_raise").text('Raise');
      return $("#game > .actions > *").hide();
    } else {
      if (key === '#cmd_call') $("#cmd_call").text('Call');
      if (key === '#cmd_raise') $("#cmd_raise").text('Raise');
      return $("#game > .actions").children(key).hide();
    }
  };

  Game.prototype.enable_actions = function(args) {
    $("#game > .actions > *").show();
    if (args.call >= args.max) {
      $("#cmd_call").text("ALL-IN $" + args.max);
      this.disable_actions('#cmd_raise');
      this.disable_actions('#cmd_check');
      this.disable_actions('#raise_range');
      this.disable_actions('#raise_number');
    } else {
      $("#cmd_call").text("Call $" + args.call);
    }
    return this.disable_actions(args.call === 0 ? '#cmd_call' : '#cmd_check');
  };

  Game.prototype.set_actor = function(args) {
    this.actor = this.get_seat(args);
    return this.actor.set_actor();
  };

  Game.prototype.check_actor = function() {
    if ((this.actor != null) && this.actor.player.pid === $.player.pid) {
      return true;
    }
    return false;
  };

  Game.prototype.check = function() {
    return $.ws.send($.pp.write({
      cmd: "RAISE",
      amount: 0,
      gid: this.gid
    }));
  };

  Game.prototype.fold = function() {
    return $.ws.send($.pp.write({
      cmd: "FOLD",
      gid: this.gid
    }));
  };

  Game.prototype.call = function(amount) {
    if (amount == null) amount = 0;
    return $.ws.send($.pp.write({
      cmd: "RAISE",
      amount: amount,
      gid: this.gid
    }));
  };

  return Game;

})();

$(function() {
  var action, game, game_dom, hall_dom, log, clearLogs, money, nick, private_card_sn, rank;
  game = null;
  game_dom = $('#game');
  hall_dom = $('#hall');
  private_card_sn = 0;
  log = function(msg) {
    return $('#logs').append("" + msg + "<br />").scrollTop($('#logs')[0].scrollHeight);
  };
  clearLogs = function() {
    return $('#logs').empty();
  };
  nick = function(o) {
    if (o.nick) return "<strong class='nick'>" + o.nick + "</strong>";
    return "<strong class='nick'>" + o.player.nick + "</strong>";
  };
  money = function(n) {
    return "<strong class='amount'>$" + n + "</strong>";
  };
  action = function(a) {
    return "<strong class='action'>" + a + "</strong>";
  };
  moneyAction=function(a,n){
	  return action(a) + " " + money(n);
  };
  rank = function(r) {
	  return "<strong class='rank'>" + r + "</strong>";
  };
  logCard = function(cs) {
	  return $.map(cs,function(card){return '<span class="' + SUITS[card.suit] + '">&' + SUITS[card.suit] + ';' + FACES[card.face]  + '</span>' }).join('');
  };
  game_dom.bind('cancel_game', function(event, args) {
    clearLogs();
    game.clear();
    game = null;
    $("#game > .playing_seat").remove();
    $("#game > .empty_seat").remove();
    return $(this).hide();
  });
  game_dom.bind('start_game', function(event, args) {
    $("#cmd_standup").hide();
    game = new Game(args.gid, game_dom);
    game.disable_actions();
    $.game = game;
    var cmd = { gid: args.gid};
    switch (args.action) {
      case 'watch':
        $.extend(cmd, {
          cmd: "WATCH"
        });
        break;
      case 'join':
        $.extend(cmd, {
          cmd: "JOIN",
          buyin: args.buyin,
          seat: 0
        });
        break;
      default:
        throw 'unknown game action';
    }
    $.ws.send($.pp.write(cmd));
    $(this).show();
    return $(this).oneTime(CONNECTION_TIMEOUT, function() {
      blockUI('#err_network');
    });
  });
  game_dom.bind('inited', function() {
    $(this).stopTime();
  });
  $.get_poker = function(face, suit) {
    return $("<img src='" + $.rl.poker["" + (new Number(face << 8 | suit))] + "' class='card'/>").attr('face', face).attr('suit', suit);
  };
  $.find_poker = function(face, suit, pokers) {
    if ((face != null) && (suit != null)) {
      return pokers.filter("[face=" + face + "]").filter("[suit=" + suit + "]");
    }
    if (face != null) return pokers.filter("[face=" + face + "]");
    if (suit != null) return pokers.filter("[suit=" + suit + "]");
    return $(".card");
  };
  $.push_card=function(c,face,suit){
	  c.push({'face':face,'suit':suit});
  };
  $.pp.reg("GAME_DETAIL", function(detail) {
    game.init(detail);
    if (detail.players < 2) {
      log('Hi ' + nick($.player) + ', Welcome !');
      return growlUI("#tips_empty");
    } else {
      return unblockUI();
    }
  });
  $.pp.reg("SEAT_DETAIL", function(detail) {
    return game.init_seat(detail);
  });
  $.pp.reg("SEAT_STATE", function(detail) {
    var seat;
    if (!game) return;
    if (detail.state === PS_EMPTY) return;
    seat = game.get_seat(detail);
    if (seat.update(detail)) {
      if (detail.state === PS_ALL_IN) {
        return log("" + (nick(detail)) + " " + (action('ALL-IN')));
      } else if (detail.state === PS_FOLD) {
        return log("" + (nick(detail)) + " " + (action('FOLD')));
      } else if (detail.state === PS_OUT) {
        return log("" + (nick(detail)) + " " + (action('OUT')));
      }
    }
  });
  $.pp.reg("CANCEL", function(args) {
    if(game)game.clear();
  });
  $.pp.reg("START", function(args) {
	if(!game)return;
    if ($(".blockUI > .buyin").size() === 0) unblockUI();
    game.clear();
    log('----------------------------------------');
    return log((action('Starting new round')));
  });
  $.pp.reg("END", function(args) {
	  if(game)game.clear();
  });
  $.pp.reg("DEALER", function(args) {
    var seat;
    seat = game.get_seat(args);
    return seat.set_dealer();
  });
  $.pp.reg("SBLIND", function(args) {});
  $.pp.reg("BBLIND", function(args) {});
  $.pp.reg("BLIND", function(args) {
    var seat = game.get_seat(args);
    seat.raise(args.blind, 0);
    var sd = game.seatData[seat.sn];
    if(args.allin == 1){
    	sd.set_allin();
    }
    sd.add(args.blind);
    return log("" + (nick(seat)) + " " + (action('Blind Bet')) + " " + (money(args.blind)));
  });
  $.pp.reg("RAISE", function(args) {
	 if(!game)return;
    var seat, sum, sd;
    sum = args.call + args.raise;
    seat = game.get_seat(args);
    sd = game.seatData[seat.sn];
    if(args.allin == 1){
    	sd.set_allin();
    }
    sd.add(sum);
    if (sum === 0) {
      seat.check();
      return log("" + (nick(seat)) + " " + (action('Checking')));
    } else {
      seat.raise(args.call, args.raise);
	  if (args.raise === 0) {
		return log("" + (nick(seat)) + " " + (action('Call')) + " " + (money(args.call)));
	  } else {
		return log("" + (nick(seat)) + " " + (action('Raise')) + " " + (money(args.raise)));
	  }
    }
  });
  $.pp.reg("DRAW", function(args) {
    var seat;
    seat = game.get_seat(args);
    return seat.draw_card();
  });
  $.pp.reg("SHARE", function(args) {
    return game.share_card(args.face, args.suit);
  });
  $.pp.reg("PRIVATE", function(args) {
    var seat;
    private_card_sn += 1;
    seat = game.get_seat(args);
    seat.private_card(args.face, args.suit, private_card_sn);
	$.push_card(seat.cards,args.face,args.suit);
    
    if (private_card_sn === 2) private_card_sn = 0;
  });
  $.pp.reg("ACTOR", function(args) {
    game.set_actor(args);
    if (!game.check_actor()) return game.disable_actions();
  });
  $.pp.reg("STAGE", function(args) {
    if (args.stage !== GS_PREFLOP) return game.new_stage(args.stage,args.pot);
  });
  $.pp.reg("JOIN", function(args) {
    game.join(args);
    $.player.update_balance();
    return log("" + (nick(args)) + " " + (action('Join')));
  });
  $.pp.reg("LEAVE", function(args) {
    var seat = game.get_seat(args);
    console.log("leave seat: ", seat);
    log("" + (nick(seat.player)) + " " + (action('Standup')));
    $.player.update_balance();
    return game.leave(seat);
  });
  $.pp.reg("UNWATCH", function(args) {
	unGrowUI();
    game_dom.trigger('cancel_game');
    return hall_dom.trigger('cancel_game');
  });
  $.pp.reg("BET_REQ", function(args) {
    game.enable_actions(args);
    $("#cmd_standup").show();
    return $('#raise_range, #raise_number').val(args.min).attr('min', args.min).attr('max', args.max);
  });
  $.pp.reg("SHOW", function(args) {
    var seat;
    game.new_stage();
    seat = game.get_seat(args);
    seat.private_card(args.face1, args.suit1, 1);
    if (args.pid != $.player.pid) {
    	$.push_card(seat.cards,args.face1,args.suit1);
    	$.push_card(seat.cards,args.face2,args.suit2);
    }
    return seat.private_card(args.face2, args.suit2, 2);
  });
  $.pp.reg("HAND", function(args) {
	  var seat = game.get_seat(args);
	  seat.set_hand(args);
	  seat.set_rank();
	  if (game.check_actor()) return seat.high();
  });
  $.pp.reg("POT", function(args) {
	  game.show_pot(args.id, args.amount);
	  var bets = $.compute_bet_count(args.amount, []);
	  for (_i = 0, _len = bets.length; _i < _len; _i++) {
		  var bet = bets[_i];
		  var l = (270 + args.id * 55) + 'px';
		  $("<img class='pot' sn='" +  args.id + "' src='" + $.rl.img[bet] + "' />").css({top:'270px', left:l}).appendTo(game.dom);
	  }
  });
  $.pp.reg("WIN", function(args) {
	if(!game)return;
    var msg, seat;
    game.disable_actions();
    game.clear_actor();
    seat = game.get_seat(args);
    game.win(seat,args.potid);
    var c = seat.high();
    msg = "" + (nick(seat)) + " " + (rank(seat.rank)) + " " + logCard(c) + moneyAction(' Win',args.amount) + ' From Pot' + (args.potid + 1);
    if(args.cost){
    	msg += moneyAction(' Commission Charged',args.cost);
    }
    log(msg);
    //if ($(".blockUI > .buyin").size() === 0) {
      //return growlUI("<div>" + msg + "</div>");
    //}
  });
  $("#game > .actions > [id^=cmd_fold]").bind('click', function() {
    if (!$(this).is(':visible')) return;
    if (!game.check_actor()) return;
    return game.fold();
  });
  $("#game > .actions > [id^=cmd_check]").bind('click', function() {
    if (!$(this).is(':visible')) return;
    if (!game.check_actor()) return;
    return game.check();
  });
  $("#game > .actions > [id^=cmd_call]").bind('click', function() {
    if (!$(this).is(':visible')) return;
    if (!game.check_actor()) return;
    return game.call();
  });
  $("#game > .actions > [id^=cmd_raise]").bind('click', function() {
    var amount;
    if (!$(this).is(':visible')) return;
    if (!game.check_actor()) return;
    $('#raise_range').trigger('change');
    amount = parseInt($('#raise_range').val());
    return game.call(amount);
  });
  $("#game > .actions > [id^=cmd]").bind('click', function() {
    return game.disable_actions();
  });
  $('#raise_range, #raise_number').bind('change', function(event) {
    var max, min, v;
    v = parseInt($(this).val());
    min = parseInt($(this).attr("min"));
    max = parseInt($(this).attr("max"));
    if (v < min) v = min;
    if (v > max) v = max;
    return $('#raise_range, #raise_number').val(v.toString());
  });
  $('#cmd_cancel').bind('click', function(event) {
    return $.ws.send($.pp.write({
      cmd: "UNWATCH",
      gid: $.game.gid
    }));
  });
  $('#cmd_standup').bind('click', function(event) {
   return $.ws.send($.pp.write({
      cmd: "LEAVE",
      gid: $.game.gid,
      pid: $.player.pid
    }));
  });
});
