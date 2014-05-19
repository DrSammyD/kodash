(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['knockout','lodash'], factory);
    } else {
        factory(ko,_);
    }
})(function (ko, _) {
    function isLodash(lodashCalls) {
        return lodashCalls && typeof lodashCalls == 'object' && !_.isArray(lodashCalls) && hasOwnProperty.call(lodashCalls, '__wrapped__')
    };

    function kodashWrapper(obs) {
        this.__observable__ = obs;
        this.__funcs__ = [];
    };
    kodashWrapper['fn'] = kodashWrapper['prototype'];
    var kodashPushFunction = function (wrapper, loFunc, args) {
        wrapper.__funcs__.push({
            loFunc: loFunc,
            args: args,
            comp: null,
            rewrap: false
        });
    };
    var unwrapArgs = function (args) {
        var observableflag = false;
        argArr=[];
        _(args).reverse().each(function (item, index) {
            var arg=item;
            if (ko.isObservable(arg)) {
                arg = ko.utils.unwrapObservable(arg)
            }            
            argArr.push(arg)
        });
        return argArr;
    };
    var hasObservableArgs = function (args) {
        var argRev = [];
        return _(args).any(function (item) {
            return ko.isObservable(item)
        });
    };
    _.mixin(kodashWrapper.prototype, _(_.prototype).keys().object().mapValues(function (val, key) {
        return function () {
            var wrapper = new kodashWrapper(this.__observable__)
            wrapper.__funcs__ = wrapper.__funcs__.concat(this.__funcs__);
            kodashPushFunction(wrapper, key, arguments);
            return wrapper;
        }
    }).value());

    var mixinOrig = _.mixin;
    _.mixin({
        mixin: function () {
            var premixin = _.keys(_.prototype);
            mixinOrig.apply(this, arguments);
            _(_.prototype).keys().difference(premixin).tap(function(arr) {
                if (arr.length) {
                    mixinOrig(kodashWrapper.prototype, _(arr).object().mapValues(function (val, key) {
                        return function () {
                            var wrapper = new kodashWrapper(this.__observable__)
                            wrapper.__funcs__ = wrapper.__funcs__.concat(this.__funcs__);
                            kodashPushFunction(wrapper, key, arguments);
                            return wrapper;
                        }
                    }).value())
                }
            })
        }
    });
    
    var rewrap=function(){
            lastFunc = _.last(this.__funcs__);
            if(lastFunc){
                lastFunc["rewrap"]=true;
            }
            return this;
        };
    var mutate = function () {
            if (ko.isWriteableObservable(this.__observable__)) {
                var loVal = this.wrappedValueOf();
                this.__funcs__ = [];
                this.__observable__((loVal).valueOf());
            }
            return this.__observable__;
        };
    var wrappedValueOf = function () {
            var lofuncs=_(this.__funcs__);
            var lastLofuncs=lofuncs.last(function(item){ return !item.comp });
            var length = -lastLofuncs.value().length;
            length = length? length: this.__funcs__.length;
            lastComp = lofuncs.slice(0,length).last();
            if(lastComp){
                var lodashCalls = _(lastComp.comp.peek());
                lastLofuncs =lastLofuncs.rest()
            }
            else{
                var lodashCalls = _(ko.unwrap(this.__observable__));
                lastLofuncs= lofuncs;
            }
            
            lastLofuncs.each(function (func) {
                args = unwrapArgs(func['args'])
                if (isLodash(lodashCalls)) {
                    lodashCalls = lodashCalls[func['loFunc']].apply(lodashCalls, args);
                }
            });
            return lodashCalls
        };
    var valueOf = function () {
            return this.wrappedValueOf().valueOf();
        };
    var observe = function () {
            var result = [];
            _(this.__funcs__).each(function (item, index) {
                var lastgroup = result.length ? _.last(result).group : 0;
                var group = hasObservableArgs(item.args) ? lastgroup + 1 : lastgroup;
                result.push({
                    group: group,
                    func: item
                });
            });
            
            var computed = baseObservable = this.__observable__;
            _(result).groupBy('group').each(function (group) {
                computed = createComputedGroup(group, computed, baseObservable);
            });
            return createUnwrappedComputed(computed);
        }
    _.mixin(kodashWrapper.prototype, {
        _: rewrap,
        rewrap: rewrap,
        mutate: mutate,
        wrappedValueOf: wrappedValueOf,
        wrappedValue: wrappedValueOf,
        valueOf: valueOf,
        value: valueOf,
        observe: observe,
        observeValueOf: observe
    });
    function createUnwrappedComputed(observable){
        if(isLodash(observable.peek()))
            return ko.computed(function(){return observable().valueOf()})
        else
            return observable;
    }
    function createComputedGroup(group, observable, baseObservable) {
        var funcs = _(group).pluck('func')
        var last =funcs.last();
        if(last.comp){
            return last.comp
        }
        return last.comp = ko.computed(function () {
            var lodashCalls = ko.unwrap(observable);
            lodashCalls= (observable === baseObservable)? _(lodashCalls) : lodashCalls
            _(funcs).each(function (func) {
                if (isLodash(lodashCalls)) {
                    var args = unwrapArgs(func['args'])
                    lodashCalls = lodashCalls[func['loFunc']].apply(lodashCalls, args);
                    lodashCalls = func.rewrap? _(lodashCalls) : lodashCalls;
                }
            });
            return lodashCalls;
        })
    };
    ko.observable['fn']['_'] = ko.observable['fn']['kodash'] = function () {
        return new kodashWrapper(this)
    }
});
