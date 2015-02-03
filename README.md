kodash
======

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/DrSammyD/kodash?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/DrSammyD/kodash.svg?branch=master)](https://travis-ci.org/DrSammyD/kodash)

Knockout dependency detection in chained lodash (soon to be underscore as well) calls.

It's a simple extension of KnockoutJS which allows you to call lodash functions on observableArrays and observables.


Getting the value from the wrapper
==================================
```
var x = ko.observableArray([1,2,0,0,3,4,5]);
x._().filter().value();
//=>[1,2,3,4,5]
```


Mutating
========
Now let's say you want to mutate your observableArray
with the current value of your lodash calls

```
var x = ko.observableArray([1,2,0,0,3,4,5]);
x._().filter().mutate();
x();
//=>[1,2,3,4,5]
```
Making observableArrays
==================
```
var x = ko.observableArray([1,2,0,0,3,4,5]);
var y = x._().filter().observe();
x([1,2,0,0,3]);
y();
//=>[1,2,3]
```

Chaining dependencies
=====================
```
var x = ko.observableArray([1,2,3,4,5]);
var y = ko.observableArray([1]);
var z=x._().difference(y).observe();
z();
//=>[2,3,4,5]
```

But with another call
```
y([1,2]);
z();
//=>[3,4,5]
```

One thing to note. Lodash unwraps it's lodashWrapper class on certain calls. If you expect lodash to do this for one of your calls, make sure that you chain it.


Checkout this [jsfiddle](http://jsfiddle.net/FZek4/170/) for more intersting behavior
