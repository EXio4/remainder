var h = maquette.h;
var projector = maquette.createProjector();

var selected = { x : -1, y: -1 };
var score = 0;

var game_over = false;

/* awful shit, gotta check this sometime later */
function deepClone(x) {
    return JSON.parse(JSON.stringify(x));
}

function recalculateScore() {
    score = 0;
    lvl.forEach(function(row) {
        row.forEach(function(el) {
            if (el == 1) {
                score++;
            }
        });
    });
}

function startGame(xid) {
    return function(evt) {
        lvl = deepClone(lvs[xid]);
        mg = lvl.map(function(r, x_pos) {
            return r.map(function(el, y_pos) {
                return hand(x_pos, y_pos);
            });
        });
        recalculateScore();
        lvl_xid = xid;
        game_over = false;
    }
}

function backToMenu() {
    lvl = null;
    lvl_xid = -1;
    game_over = false;
}

var tutorial = [[0, 0, 0, 0, 0]
               ,[0, 2, 1, 1, 0]
               ,[0, 0, 0, 0, 0]];

var level_1 = [[0, 0, 0, 1, 1, 1, 0, 0, 0]
              ,[0, 0, 0, 1, 1, 1, 0, 0, 0]
              ,[0, 0, 0, 1, 1, 1, 0, 0, 0]
              ,[1, 1, 1, 1, 1, 1, 1, 1, 1]
              ,[1, 1, 1, 1, 2, 1, 1, 1, 1]
              ,[1, 1, 1, 1, 1, 1, 1, 1, 1]
              ,[0, 0, 0, 1, 1, 1, 0, 0, 0]
              ,[0, 0, 0, 1, 1, 1, 0, 0, 0]
              ,[0, 0, 0, 1, 1, 1, 0, 0, 0]];

var level_2 = [[0, 0, 0, 0, 1, 1, 1, 1, 1]
              ,[0, 0, 0, 1, 1, 1, 1, 1, 0]
              ,[0, 0, 1, 1, 2, 1, 1, 0, 0]
              ,[0, 1, 1, 1, 1, 1, 0, 0, 0]
              ,[1, 1, 1, 1, 1, 0, 0, 0, 0]];

var lvs = [tutorial, level_1, level_2];
           
var lvl_xid = -1;
var lvl = null;

var levels = [{ xid : "Tutorial", cb : startGame(0)}
             ,{ xid : 1, cb : startGame(1)}
             ,{ xid : 2, cb : startGame(2)}];

function is_possible_gen(selected, x, y) {
    if (selected.x >= 0 && selected. y >= 0) {
        var ix = (x + selected.x)/2;
        var iy = (y + selected.y)/2;
        if ((selected.x == x && Math.abs(y-selected.y) == 2) || (selected.y == y && Math.abs(x-selected.x)==2)) {
            return lvl[ix][iy] == 1;
        }
    }
    return false;
}
function is_possible(x, y) {
    return is_possible_gen(selected, x, y);
}

function is_dead() {
    var cnt = 0;
    lvl.forEach(function(row, pos_x) {
        row.forEach(function(el, pos_y) {
            if (el != 1) return; // if not a red block
            var sel = {x : pos_x, y : pos_y};
            var pos = [{x : -2, y :  0},
                       {x :  2, y :  0},
                       {x :  0, y : -2},
                       {x :  0, y :  2}];
            pos.forEach(function(co) {
                co.x = sel.x + co.x;
                co.y = sel.y + co.y;
                if (co.x < 0 || co.x >= lvl.length || co.y < 0 || co.y >= row.length) {
                    return;
                }
                if (lvl[co.x][co.y] == 2 && is_possible_gen(sel, co.x, co.y)) {
                    cnt++;
                }
            });
        });
    });
    return cnt == 0;
}


var itemEnter = function(domNode) {
  console.log("itemEnter");
  var targetHeight = domNode.scrollHeight;
  domNode.style.height=0;
  Velocity.animate(domNode, {height: targetHeight, opacity: [1,0]}, 400, "ease-out");
};

var buttonEnter = function(domNode) {
  var targetWidth = domNode.width;
  domNode.style.width=0;
  Velocity.animate(domNode, {width: targetWidth, opacity: [1,0]}, 400, "ease-out");
};

var itemExit = function(domNode, removeDomNodeFunction) {
  console.log("itemExit");
  Velocity.animate(domNode, {height: 0}, 400, "ease-out", removeDomNodeFunction);
};

function hand(x, y) {
    return function(evt) {
        if (game_over) return;
        if (lvl[x][y] == 1) {
            selected = {x : x, y: y};
        } else if (lvl[x][y] == 2 && is_possible(x, y)) {
            var ix = (x + selected.x)/2;
            var iy = (y + selected.y)/2;
            lvl[selected.x][selected.y] = 2;
            lvl[x][y] = 1;
            lvl[ix][iy] = 2;
            selected.x = -1;
            selected.y = -1;
            recalculateScore();
            if (is_dead()) { game_over = true; }
        }
    };
}

var mg = null;
var score = -1;


function renderMaquette() {
  if (lvl != null) {
      var ls = [];
      ls.push(h('table.board', {key: -100},  [
                lvl.map(function(r, x_pos) {
                    var xs = r.map(function(el, y_pos) {
                        var cs = { "void" : null, "dot" : null, "dot_selected": null, "dot_possible" : null, "empty": null, "disabled" : game_over };
                        if (el == 1 && selected.x == x_pos && selected.y == y_pos) cs["dot_selected"] = true;
                        else if (el == 2 && is_possible(x_pos, y_pos)) cs["dot_possible"] = true;
                        else if (el == 1) cs["dot"] = true;
                        else if (el == 2) cs["empty"] = true;
                        else cs["void"] = true; 
                        return h("td.slot", { key: x_pos * 1024 + y_pos, onclick: mg[x_pos][y_pos], classes : cs }, " ");
                    });
                    return h("tr", { key: x_pos }, xs);
                })
            ]));
      if (lvl_xid == 0) {
          var text = [h("div.text", {key: -777}, "Click the rightmost red block")];
          if (selected.x == 1 && selected.y == 3) {
              text = [h("div.text", {key: -777}, "Click on the yellow box to eat"),
                      h("div.text", {key: -778}, "the block in the middle!")];
          }
          if (score == 1) {
              text = [h("div.text", {key: -777}, "Congrats! You have eaten your first block"),
                      h("div.text", {key: -778}, "The goal is to eat the most blocks"),
                      h("div.text", {key: -779}, "Note you can only jump a max of two blocks"),
                      h("div.text", {key: -780}, "And you must eat a block per jump"),
                      h("div.text", {key: -781}, "Give the real levels a try now!"),
                     ];
          }
          ls[0] = h("div.left", {key: -100}, [ls[0], h("div.tutorial_text", text)]);
      }
      ls.push(h("div.right", {key : -101}, [
                h("div.button", {enterAnimation : buttonEnter, onclick : backToMenu}, "Main Menu"),
                h("div.score", "Score: " + score),
            ]));
    return h('div.game', {key: -1337, enterAnimation: itemEnter, exitAnimation : itemExit, classes : { "menu" : true, "game_sys" : true } }, ls);
  } else {
      return h ("div.game", {key: -1338, enterAnimation: itemEnter, exitAnimation : itemExit,  classes : { "menu" : true, "game_sys" : false }  }, [
            h("div.left", {key: -200}, [
                h("div.text", { classes: { "text_big" : true } } , "Remainder!"),
                h("div.text", "A boring game I just came up with"),
                h("div.text", "- Exio"),
            ]), 
            h("div.right", {key: -201}, 
                levels.map(function(el) {
                    return h("div.button", { enterAnimation : buttonEnter, key: "l"+el.xid, onclick: el.cb }, "Start " + ((typeof el.xid === "number") ? ("Level " + el.xid) : el.xid))
                })
            )
        ]);
  }
    
}

// Initializes the projector 
document.addEventListener('DOMContentLoaded', function () {
  projector.append(document.body, renderMaquette, {});
});
