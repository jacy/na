var EmptySeat, PlayingSeat, Seat;
var __hasProp = Object.prototype.hasOwnProperty;
var __extends = function(child, parent) { 
	for (var key in parent) { 
		if (__hasProp.call(parent, key))  //  Kickout inherited properties
			child[key] = parent[key];
	} 
	function Ctor() { 
		this.constructor = child; 
	} 
	Ctor.prototype = parent.prototype;  // copies all the properties and methods including the constructor
	child.prototype = new Ctor; // only instance copy everything from its prototype
	child.__super__ = parent.prototype; 
	return child; 
};

Seat = (function() {

  function Seat(detail, game, cards) {
    this.detail = detail;
    this.game = game;
    this.sn = this.detail.sn;
    this.init_dom();
    cards =  cards || [];
    this.cards = cards;
  }

  Seat.prototype.init_dom = function() {
    this.dom = this.get_dom();
    this.dom.data('sn', this.sn);
    this.set_position();
    return this.dom.appendTo(this.game.dom);
  };

  Seat.prototype.set_position = function() {
    this.dom.css(this.get_position());
    return this.dom.children(".draw_card").css($.positions.get_draw(this.sn));
  };

  Seat.prototype.remove = function() {
    return this.dom.remove();
  };

  return Seat;

})();

EmptySeat = (function() {

  __extends(EmptySeat, Seat);

  function EmptySeat(detail, game, cards) {
    this.detail = detail;
    this.game = game;
    cards =  cards || [];
    this.cards = cards;
    EmptySeat.__super__.constructor.apply(this, arguments);
  }

  EmptySeat.prototype.get_dom = function() {
    return $("#game > .template > .empty_seat").clone(true);
  };

  EmptySeat.prototype.get_position = function() {
    return $.positions.get_empty(this.detail.sn);
  };

  EmptySeat.prototype.hide = function() {
    return this.dom.hide();
  };

  EmptySeat.prototype.show = function() {
    return this.dom.show();
  };

  EmptySeat.prototype.clear = function() {
	  this.cards = [];
  };

  return EmptySeat;

})();

PlayingSeat = (function() {

  __extends(PlayingSeat, Seat);

  function PlayingSeat(detail, game, cards) {
    this.detail = detail;
    this.game = game;
    cards =  cards || [];
    this.cards = cards;
    PlayingSeat.__super__.constructor.apply(this, arguments);
    this.bet = 0;
    this.state = PS_PLAY;
    this.player = new Player(this.detail.pid, this.dom, this.detail);
    this.poker = this.dom.children('.card');
    if (this.game.detail.stage !== GS_CANCEL && this.game.detail.stage !== GS_PREFLOP) {
      this.draw_card();
    }
  }

  PlayingSeat.prototype.clear = function() {
    this.player.set_nick();
    this.dom.children(".card").remove();
    this.dom.children(".high_label").removeClass("high_label");
    this.dom.children('.draw_card').hide();
    this.dom.children('.dealer').remove();
    this.dom.children('.pot').remove();
    this.reset_bet();
    this.cards = [];
    return this.dom.removeClass('disabled');
  };

  PlayingSeat.prototype.update = function(detail) {
    this.player.set_inplay(detail.inplay);
    if (detail.state === this.state) return false;
    this.state = detail.state;
    return true;
  };

  PlayingSeat.prototype.get_dom = function() {
    return $("#game > .template > .playing_seat").clone(true);
  };

  PlayingSeat.prototype.get_position = function() {
    return $.positions.get_playing(this.detail.sn);
  };

  PlayingSeat.prototype.set_position = function() {
    PlayingSeat.__super__.set_position.apply(this, arguments);
    this.dom.children(".draw_card").css($.positions.get_draw(this.sn));
    return this.dom.children(".bet_lab").css($.positions.get_bet_lab(this.sn));
  };

  PlayingSeat.prototype.raise = function(call, raise) {
    var bet, bets, ps, _i, _len, _results;
    this.bet += (call + raise);
    this.dom.children('.bet_lab').text(this.bet).show();
    ps = $.positions.get_bet(this.sn);
    bets = $.compute_bet_count(call + raise, []);
    _results = [];
    for (_i = 0, _len = bets.length; _i < _len; _i++) {
      bet = bets[_i];
      _results.push(this.raise_bet($.rl.img[bet], ps));
    }
    return _results;
  };

  PlayingSeat.prototype.raise_bet = function(img, ps) {
    var bet = $("<img class='bet' src='" + img + "' />").css(ps.start).appendTo(this.game.dom);
    return $(this.dom).oneTime(100, function() {
      return bet.css($.positions.get_random(ps.end, 5));
    });
  };

  PlayingSeat.prototype.disable = function() {
    this.dom.addClass('disabled');
    return this.dom.children(".draw_card").hide();
  };

  PlayingSeat.prototype.check = function() {};

  PlayingSeat.prototype.set_dealer = function() {
    var dealer = $('.playing_seat > .dealer');
    if (dealer.size() === 0) {
      return $('#game > .template > .dealer').clone().insertBefore(this.dom.children(".nick"));
    } else {
      return dealer.remove().insertBefore(this.dom.children(".nick"));
    }
  };

  PlayingSeat.prototype.set_actor = function() {
    this.game.clear_actor();
    this.dom.addClass('actor_seat');
    return $('<div class="actor_timer"><div /></div>').appendTo(this.dom).oneTime(100, function() {
      return $(this).children('div').css({
        'margin-top': '120px'
      });
    });
  };

  PlayingSeat.prototype.draw_card = function() {
    return this.dom.children(".draw_card").css($.positions.get_draw(this.sn)).show();
  };

  PlayingSeat.prototype.private_card = function(face, suit, card_sn) {
    this.dom.children(".draw_card").hide();
    var poker = $.get_poker(face, suit).addClass('private_card').css($.positions.get_private(this.sn, card_sn)).appendTo(this.dom);
    return this.pokers = this.dom.children('.card');
  };

  PlayingSeat.prototype.set_rank = function() {
    this.rank = RANKS[this.hand.rank];
    if (this.hand.rank !== HC_HIGH_CARD) {
      return this.dom.children(".nick").addClass("high_label").text(this.rank);
    }
  };

  PlayingSeat.prototype.set_hand = function(hand) {
    return this.hand = {
      face: hand.high1,
      face2: hand.high2,
      suit: hand.suit,
      rank: hand.rank
    };
  };

  PlayingSeat.prototype.reset_bet = function() {
	  this.bet = 0;
	  return this.dom.children('.bet_lab').hide();
  };
  $.getCards = function(cs,suit,face) {
	  return $.grep(cs,function(entry){
		  if((suit == null || suit == entry.suit) && (face == null || face == entry.face)){
			  return entry;
		  }
	  });
  };

  PlayingSeat.prototype.high = function() {
    var f, faces, game, high, null_face, null_suit, one, pokers, s, _i, _len,all_cards,face1,face2;
    game = this.game;
    game.clear_high();
    all_cards = game.cards.concat(this.cards);
    
    pokers = this.pokers;
    null_suit = null;
    null_face = null;
    high = function(face, suit, filter) {
      game.high(face, suit, filter, pokers);
    };
    face1 = this.hand.face;
    face2 = this.hand.face2;
    switch (this.hand.rank) {
      case HC_PAIR:
      case HC_THREE_KIND:
      case HC_FOUR_KIND:
        high(face1);
        var first = $.getCards(all_cards,null,face1);
        var second = $.grep($.getCards(all_cards), function( a ) {
			return a.face != face1;
		}).sort($.compare_card_2);
        return first.concat(second).slice(0,5);
        break;
      case HC_TWO_PAIR:
      case HC_FULL_HOUSE:
        high(face1);
        high(face2);
        return $.getCards(all_cards,null,face1).concat($.getCards(all_cards,null,face2)).concat(
        		$.grep($.getCards(all_cards), function( a ) {
        			return a.face != face1 && a.face !=face2;
        		}).sort($.compare_card_2)
        ).slice(0, 5);
        break;
      case HC_FLUSH:
        high(null_face, this.hand.suit, function(pokers) {
          return pokers.sort($.compare_card).slice(0, 5);
        });
        return $.getCards(all_cards,this.hand.suit).sort($.compare_card_2).slice(0,5);
        break;
      case HC_STRAIGHT:
      case HC_STRAIGHT_FLUSH:
        faces = [face1, face1 - 1, face1 - 2, face1 - 3, face1 === CF_FIVE ? CF_ACE : face1 - 4];
        one = function(pokers) {
          var result;
          result = pokers.first();
          return result;
        };
        s = this.hand.rank === HC_STRAIGHT_FLUSH ? this.hand.suit : null_suit;
        s2 = this.hand.rank === HC_STRAIGHT_FLUSH ? this.hand.suit : null;
        var r = [];
        for (_i = 0, _len = faces.length; _i < _len; _i++) {
          f = faces[_i];
          r.push($.getCards(all_cards,s2,f)[0]);
          high(f, s, one);
        }
        return r;
        break;
      case HC_HIGH_CARD:
    	  return $.getCards(all_cards).sort($.compare_card_2).slice(0,5);
        break;
      default:
        throw "Unknown poker rank " + args.rank;
    }
  };

  return PlayingSeat;

})();

$(function() {
  var mod_sum;
  mod_sum = function(sum, bet, bets) {
    var i, times;
    times = Math.floor(sum / bet[0]);
    for (i = 1; 1 <= times ? i <= times : i >= times; 1 <= times ? i++ : i--) {
      bets.push(bet[1]);
    }
    return sum % bet[0];
  };
  $.compute_bet_count = function(sum, bets) {
    var b, bet, _i, _j, _len, _len2, _results;
    for (_i = 0, _len = BETS.length; _i < _len; _i++) {
      bet = BETS[_i];
      if (sum >= bet[0]) sum = mod_sum(sum, bet, bets);
    }
    _results = [];
    for (_j = 0, _len2 = bets.length; _j < _len2; _j++) {
      b = bets[_j];
      _results.push("betting_" + b);
    }
    return _results;
  };
  $.compare_card = function(a, b) {
	  var a1, b1;
	  a1 = new Number($(a).attr('face'));
	  b1 = new Number($(b).attr('face'));
	  if (a1 > b1) {
		  return -1;
	  } else if (a1 < b1) {
		  return 1;
	  } else {
		  return 0;
	  }
  };
  $.compare_card_2 = function(a, b) {
    var a1, b1;
    a1 = new Number(a.face);
    b1 = new Number(b.face);
    if (a1 > b1) {
      return -1;
    } else if (a1 < b1) {
      return 1;
    } else {
      return 0;
    }
  };
  $("#game .empty_seat").bind('click', function() {
    var balance, buyin, max, min;
    min = $.game.detail.min;
    max = $.game.detail.max;
    balance = $.player.balance;
    if (balance < min) {
      return $('#page').block({
        message: $("#err_buyin").clone(),
        css: BLOCKUI,
        timeout: 2000
      });
    }
    $('#page').block({
      message: $(".buyin").clone(true, true).data('sn', $(this).data('sn')),
      css: $.extend(BLOCKUI, {
        width: '300px'
      })
    });
    max = balance < max ? balance : max;
    buyin = balance > max ? max : min * 10;
    buyin = buyin > balance ? balance : buyin;
    $('.buyin #range_buy').attr('min', min).attr('max', max).val(buyin);
    $(".buyin #min").text(format($.game.detail.min));
    $(".buyin #max").text(format($.game.detail.max));
    $(".buyin #lab_min").text(format(min));
    $(".buyin #lab_max").text(format(max));
    $(".buyin #balance").text(format(balance));
    return $(".buyin #lab_buyin").text(format(buyin));
  });
  $(".buyin #cmd_buy").bind('click', function() {
    var buyin, cmd, sn;
    $(this).attr('disabled', true);
    sn = $(this).parent().data('sn');
    buyin = $(this).parent().children('#range_buy').val();
    cmd = {
      cmd: "JOIN",
      gid: $.game.gid,
      seat: sn,
      buyin: parseInt(buyin)
    };
    $.ws.send($.pp.write(cmd));
    return $('#page').unblock();
  });
  $(".buyin #cmd_cancel").bind('click', function() {
    return $('#page').unblock();
  });
  $(".buyin #range_buy").bind('change', function(event) {
    return $(".buyin #lab_buyin").text(format($(this).val()));
  });
  $("#cmd_up").bind('click', function() {
    var cmd;
    cmd = {
      cmd: "LEAVE",
      gid: $.game.gid
    };
    return $.ws.send($.pp.write(cmd));
  });
  return $("#cmd_exit").bind('click', function() {});
});
