var SidePot = (function() {
	function SidePot(allin, members,id) {
		this.allin = allin;
		this.members = members;
		this.id=id;
	}
	
	SidePot.prototype.addBet = function(seat,amount,allin) {
		if(amount <= 0){
			return;
		}
		var alreadyBet = this.getBet(seat);
		if(alreadyBet == null){
			alreadyBet = new Bet(seat,0,allin);
			this.members.push(alreadyBet);
		}
		alreadyBet.amount += amount;
	};
	
	SidePot.prototype.getBet = function(seat) {
		var found = null;
		$.each(this.members, function(i,bet){
			if(bet.seat === seat){
				found = bet;
			}
		});
		return found;
	};
	SidePot.prototype.total = function() {
		var _total = 0;
		$.each(this.members,function(i,bet){
			_total += bet.amount;
		});
		return _total;
	};
	return SidePot;
})();

var Pot = (function() {
	function Pot() {
		this.active = [];
		this.id = 0;
		this.current = new SidePot(0,[],this.id);
	}
	
	Pot.prototype.new_stage = function() {
		this.active = [];
	};
	
	Pot.prototype.get_dom = function(id, game) {
		if($('#pot_' + id).length){
			return $('#pot_' + id);
		}
		var dom = $("#game > .template > .sidepot").clone();
		dom.attr('id','pot_' + id).css($.positions.get_pot(id));
		return dom.appendTo(game.dom)
	};
	
	Pot.prototype.pots = function() {
		return this.active.concat(this.current);
	};
	
	Pot.prototype.addBet = function(bet) {
		if(bet == null){
			return;
		}
		var unallocated = bet.amount;
		for(var i = 0;i < this.active.length;i++){
			var record = this.active[i];
			record.addBet(bet.seat, record.allin,bet.allin);
			unallocated -= record.allin;
		}
		if(unallocated > 0){
			if(bet.allin){
				var newMembers = this.split(unallocated);
				var newPot = this.current;
				newPot.addBet(bet.seat, unallocated,bet.allin);
				this.active.push(newPot);
				this.current = new SidePot(0, newMembers,++this.id);
			}else{
				this.current.addBet(bet.seat,unallocated,bet.allin);
			}
		}
	};
	
	Pot.prototype.addBets = function(bets) {
		var sortedBets = bets.slice(0).sort(this.sorts);
		var _this = this;
		$.each(sortedBets,function(i,bet){
			_this.addBet(bet);
		})
	};
	
	Pot.prototype.split = function(amount) {
		var newMembers= [];
		for(var i = 0;i < this.current.members.length;i++){
			var m = this.current.members[i];
			if(m.amount > amount){
				newMembers.push(new Bet(m.seat,m.amount - amount,m.allin));
				m.amount = amount;
			}
		}
		this.current.allin = amount;
		return newMembers;
	};
	
	Pot.prototype.sorts = function(betsA, betsB) {
		if(betsA.amount >= betsB.amount){
			return 1;
		}else {
			return 0;
		}
	};
	
	return Pot;
})();

var Bet = (function() {
	function Bet(seat,amount,allin) {
		this.seat = seat;
		this.amount = amount || 0;
		this.allin = allin || false;
	}
	Bet.prototype.add=function(amount){
		this.amount += amount;
	}
	Bet.prototype.set_allin=function(){
		this.allin=true;
	}
	return Bet;
})();