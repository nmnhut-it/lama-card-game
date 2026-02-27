/**
 * Browser test runner for L.A.M.A. (T-408).
 * Loads via testRunner.html after source scripts.
 */
(function () {
  var resultsDiv = document.getElementById("results");
  var summaryDiv = document.getElementById("summary");
  var totalPassed = 0;
  var totalFailed = 0;

  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function describe(name, fn) {
    resultsDiv.innerHTML += '<div class="suite-name">' + esc(name) + '</div>';
    fn();
  }

  function it(name, fn) {
    try {
      fn();
      totalPassed++;
      resultsDiv.innerHTML += '<div class="test-pass">PASS: ' + esc(name) + '</div>';
    } catch (err) {
      totalFailed++;
      resultsDiv.innerHTML += '<div class="test-fail">FAIL: ' + esc(name) + '</div>';
      resultsDiv.innerHTML += '<div class="error-msg">' + esc(err.message) + '</div>';
    }
  }

  var assert = {
    equal: function(a,b,m){if(a!==b)throw new Error(m||"Expected "+JSON.stringify(b)+", got "+JSON.stringify(a));},
    ok: function(v,m){if(!v)throw new Error(m||"Expected truthy");},
    notOk: function(v,m){if(v)throw new Error(m||"Expected falsy");},
    throws: function(fn,m){var t=false;try{fn();}catch(_){t=true;}if(!t)throw new Error(m||"Expected throw");},
    doesNotThrow: function(fn,m){try{fn();}catch(e){throw new Error(m||"Unexpected: "+e.message);}},
    greaterThan: function(a,b,m){if(a<=b)throw new Error(m||a+" not > "+b);}
  };

  var L = window.LAMA;
  var Card=L.Card, Deck=L.Deck, Player=L.Player, TokenBank=L.TokenBank;
  var Round=L.Round, Game=L.Game, AiPlayer=L.AiPlayer;
  var CardValue=L.CardValue, TurnAction=L.TurnAction, TokenType=L.TokenType;
  var GameMode=L.GameMode, LLAMA=CardValue.LLAMA;
  var PC=L.PLAYER_COUNT, HSI=L.HAND_SIZE_INITIAL, TC=L.TOTAL_CARDS;
  var CPV=L.COPIES_PER_VALUE, BTV=L.BLACK_TOKEN_VALUE, WTV=L.WHITE_TOKEN_VALUE;
  var WTC=L.WHITE_TOKEN_COUNT, BTC=L.BLACK_TOKEN_COUNT;
  var LP=L.LLAMA_PENALTY, GOT=L.GAME_OVER_THRESHOLD;
  var ACV=L.ALL_CARD_VALUES;

  /* Card Tests */
  describe("Card - Construction & Values", function(){
    it("creates all card values", function(){
      for(var v=1;v<=6;v++) assert.equal(new Card(v).getValue(),v);
      assert.equal(new Card(LLAMA).getValue(),LLAMA);
    });
    it("rejects invalid values", function(){ assert.throws(function(){new Card(99);}); });
    it("is immutable", function(){
      var c=new Card(3); try{c._value=99;}catch(_){} assert.equal(c.getValue(),3);
    });
    it("validates canPlayOn", function(){
      assert.ok(new Card(2).canPlayOn(new Card(1)));
      assert.ok(new Card(LLAMA).canPlayOn(new Card(6)));
      assert.ok(new Card(1).canPlayOn(new Card(LLAMA)));
      assert.notOk(new Card(3).canPlayOn(new Card(1)));
      assert.notOk(new Card(2).canPlayOn(new Card(4)));
    });
    it("returns correct penalty", function(){
      for(var v=1;v<=6;v++) assert.equal(new Card(v).getPenaltyValue(),v);
      assert.equal(new Card(LLAMA).getPenaltyValue(),LP);
    });
  });

  /* Deck Tests */
  describe("Deck - Composition & Draw", function(){
    it("has TOTAL_CARDS", function(){ assert.equal(new Deck().remaining(),TC); });
    it("has correct copies per value", function(){
      var d=new Deck(),ct={};
      while(!d.isEmpty()){var v=d.draw().getValue();ct[v]=(ct[v]||0)+1;}
      for(var i=0;i<ACV.length;i++) assert.equal(ct[ACV[i]],CPV);
    });
    it("returns null when empty", function(){
      var d=new Deck(); while(!d.isEmpty()) d.draw(); assert.equal(d.draw(),null);
    });
  });

  /* Player Tests */
  describe("Player - Hand & Scoring", function(){
    it("manages hand", function(){
      var p=new Player(0); p.addCard(new Card(3)); assert.equal(p.getHandSize(),1);
      p.removeCard(p.getHand()[0]); assert.equal(p.getHandSize(),0);
    });
    it("applies duplicate-once penalty", function(){
      var p=new Player(0); p.addCard(new Card(5)); p.addCard(new Card(5)); p.addCard(new Card(5));
      assert.equal(p.getHandPenalty(),5);
    });
    it("scores Llama penalty once", function(){
      var p=new Player(0); p.addCard(new Card(LLAMA)); p.addCard(new Card(LLAMA));
      assert.equal(p.getHandPenalty(),LP);
    });
    it("calculates totalPoints", function(){
      var p=new Player(0); p.addWhiteTokens(5); p.addBlackTokens(2);
      assert.equal(p.totalPoints(),5*WTV+2*BTV);
    });
  });

  /* TokenBank Tests */
  describe("TokenBank - Distribute & Exchange", function(){
    it("distributes correct split for 23", function(){
      var b=new TokenBank(),p=new Player(0); b.distributeTokens(p,23);
      assert.equal(p.getBlackTokens(),2); assert.equal(p.getWhiteTokens(),3);
    });
    it("returns token to supply", function(){
      var b=new TokenBank(),p=new Player(0);
      b.distributeTokens(p,BTV); b.returnToken(p,TokenType.BLACK);
      assert.equal(p.getBlackTokens(),0); assert.equal(b.getBlackSupply(),BTC);
    });
    it("exchanges black to white", function(){
      var b=new TokenBank(),p=new Player(0);
      b.distributeTokens(p,BTV); b.exchange(p,TokenType.BLACK);
      assert.equal(p.getBlackTokens(),0); assert.equal(p.getWhiteTokens(),BTV);
    });
  });

  /* Round Tests */
  describe("Round - Turn Flow", function(){
    it("deals and sets top card", function(){
      var ps=[]; for(var i=0;i<PC;i++) ps.push(new Player(i));
      var d=new Deck(); d.shuffle(); var r=new Round(ps,d,0);
      assert.ok(r.getTopCard());
      for(var j=0;j<ps.length;j++) assert.equal(ps[j].getHandSize(),HSI);
    });
    it("detects all-quit round end", function(){
      var ps=[]; for(var i=0;i<PC;i++) ps.push(new Player(i));
      var d=new Deck(); d.shuffle(); var r=new Round(ps,d,0);
      for(var j=0;j<PC;j++){r.quitRound(r.getCurrentPlayer());if(j<PC-1)r.advanceTurn();}
      assert.ok(r.isRoundOver());
    });
  });

  /* Game Tests */
  describe("Game - Orchestration", function(){
    it("creates correct player count", function(){
      assert.equal(new Game(GameMode.AI).getPlayers().length,PC);
    });
    it("detects game over at threshold", function(){
      var g=new Game(GameMode.AI);
      g.getPlayers()[0].addBlackTokens(GOT/BTV);
      assert.ok(g.isGameOver());
    });
    it("finds winners", function(){
      var g=new Game(GameMode.AI);
      g.getPlayers()[0].addWhiteTokens(5);
      g.getPlayers()[1].addBlackTokens(3);
      var w=g.getWinners(); assert.equal(w.length,1); assert.equal(w[0].getIndex(),0);
    });
  });

  /* AiPlayer Tests */
  describe("AiPlayer - Decisions", function(){
    it("returns valid action", function(){
      var ps=[]; for(var i=0;i<PC;i++) ps.push(new Player(i));
      var d=new Deck(); d.shuffle(); var r=new Round(ps,d,0);
      var res=AiPlayer.decideAction(r.getCurrentPlayer(),r);
      var valid=[TurnAction.PLAY_CARD,TurnAction.DRAW_CARD,TurnAction.QUIT];
      assert.ok(valid.indexOf(res.action)!==-1);
    });
    it("only plays valid cards", function(){
      var ps=[]; for(var i=0;i<PC;i++) ps.push(new Player(i));
      var d=new Deck(); d.shuffle(); var r=new Round(ps,d,0);
      var res=AiPlayer.decideAction(r.getCurrentPlayer(),r);
      if(res.action===TurnAction.PLAY_CARD) assert.ok(res.card.canPlayOn(r.getTopCard()));
    });
  });

  /* Summary */
  var total=totalPassed+totalFailed;
  var cls=totalFailed>0?"fail-bg":"pass-bg";
  var lbl=totalFailed>0?"SOME TESTS FAILED":"ALL TESTS PASSED";
  summaryDiv.className=cls;
  summaryDiv.textContent="Total: "+total+" | Passed: "+totalPassed+" | Failed: "+totalFailed+" | "+lbl;
})();