// Copyright 2012 Charles Blaxland
// This file is part of rdio-xbmc.
//
// rdio-xbmc is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// rdio-xbmc is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with rdio-xbmc.  If not, see <http://www.gnu.org/licenses/>.

var args = require('system').args;
var script = require(args[1]);
if (args.length > 2) {
  var script_args = args.slice(2, args.length);
  script.init(script_args);
}

var PhantomXbmc = {

  result: {},

  waitFor: function(testFx, timeOutMillis, onReady, onTimeout) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000,
      start = new Date().getTime(),
      condition = false,
      interval = setInterval(function() {
        if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
          condition = testFx();
        } else {
          clearInterval(interval);
          if(!condition) {
            if (typeof onTimeout === "function") {
              onTimeout();
            }
          } else {
            if (typeof onReady === "function") {
              onReady();
            }
          }
        }
      }, 100);
  },

  execute: function(steps, step) {
    console.log("Executing step " + step);
    try {
      steps[step].execute();
      if (steps[step].hasOwnProperty('complete')) {
        PhantomXbmc.waitFor(steps[step].complete, 30000,
          function() {
            PhantomXbmc.next(steps, step);
          },
          function() {
            PhantomXbmc.result.error = "Timeout occurred waiting for step " + step + " to complete";
            PhantomXbmc.done();
          });

      } else {
        PhantomXbmc.next(steps, step);
      }

    } catch (err) {
      PhantomXbmc.result.error = err.message;
      PhantomXbmc.done();
    }
  },

  next: function(steps, step) {
    var next_step = steps[step].next;
    if (typeof next_step === "function") {
      next_step = next_step();
    }
    if (next_step) {
      PhantomXbmc.execute(steps, next_step);
    } else {
      PhantomXbmc.done();
    }
  },

  done: function() {
    console.log("PhantomXbmc Result: " + JSON.stringify(PhantomXbmc.result))
    phantom.exit();
  },

  getElement: function(page, selector) {
    return page.evaluate(function(sel) {
        return document.querySelector(sel);
    }, selector);
  },

  elementExists: function(page, selector) {
    return PhantomXbmc.getElement(page, selector);
  }

}

PhantomXbmc.execute(script.steps, 'start');
