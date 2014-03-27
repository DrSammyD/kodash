kodash
======

Knockout dependency detection in chained lodash (soon to be underscore as well) calls.

I simple extension of KnockoutJS which allows you to call lodash functions on observableArrays and observables.


Getting the value from the wrapper
==================================
```
var x = ko.observableArray([1,2,0,0,3,4,5]);
x._().filter().value();
```
The above code will output [1,2,3,4,5]


Mutating
========
Now let's say you want to mutate your observableArray
with the current value of your lodash calls

```
var x = ko.observableArray([1,2,0,0,3,4,5]);
x._().filter().mutate();
x();
```
The above code will output [1,2,3,4,5]

Making observableArrays
==================
```
var x = ko.observableArray([1,2,0,0,3,4,5]);
var y = x._().filter().observe();
x([1,2,0,0,3]);
y();
```
The above code will output [1,2,3]

Chaining dependencies
=====================
```
var x = ko.observableArray([1,2,3,4,5]);
var y = ko.observableArray([1]);
var z=x._().difference(y).observe();
z();
```

The above code will output [2,3,4,5],
but with another call
```
y([1,2]);
z()
```
it will now output [3,4,5]

One thing to note. Lodash unwraps it's observableArrays on certain calls. If you expect lodash to do this for one of your calls, simply perform the following

```
var x= ko.observableArray([[1,2,0], 3]);
x.first()._().filter().value();
```
The above code will output [1,2]

Calling _() in your chain will rewrap the value so that it can continue to be chained. Any lodash functions called without a rewrap will be skipped.
```
var x= ko.observableArray([[1,2,0], 3]);
x.first().filter().value();
```
The above code will output [1,2,0]



Checkout this [jsfiddle](http://jsfiddle.net/FZek4/153/) for more intersting behavior
