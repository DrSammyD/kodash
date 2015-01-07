(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['knockout', 'lodash'], factory);
    } else {
        factory(ko, _);
    }
})(function(ko, _) {

    // taken from https://github.com/mbest/knockout-deferred-updates/blob/master/knockout-deferred-updates.js#L248
    function findNameMethodSignatureContaining(obj, match) {
        for (var a in obj)
            if (obj.hasOwnProperty(a) && obj[a] && obj[a].toString().indexOf(match) >= 0)
                return a;
    }

    function findSubObjectWithProperty(obj, prop) {
        for (var a in obj)
            if (obj.hasOwnProperty(a) && obj[a] && obj[a][prop])
                return obj[a];
    }
    var depDet = findSubObjectWithProperty(ko, 'end'),
        depDetBeginName = findNameMethodSignatureContaining(depDet, '.push'),
        // end coppied code

        DETECTED = {},
        OBSERVED = {},
        hasOwn = Object.prototype.hasOwnProperty;

    function isLodash(lodashCall) {
        return lodashCall && typeof lodashCall === 'object' && !_.isArray(lodashCall) && hasOwn.call(lodashCall, '__wrapped__');
    }

    function kodashWrapper(obs) {
        this['__func__'] = {
            children: [],
            root: ''
        };
        if (obs)
            this['__func__']['__observable__'] = {
                '': obs
            };
    }

    function getKeyFromLength(length) {
        var chars = "";
        var rem;
        while (~length) {
            chars += String.fromCharCode((rem = (length % 65536)) + 45);
            length -= rem;
            length = length ? length / 65536 : -1;
        }
        return chars;
    }

    function getIndexFromKey(key) {
        var index = 0;
        var currentChar = 0;
        while (currentChar < key.length) {
            index += Math.pow(65536, currentChar) * (key.charCodeAt(currentChar) - 45);
            currentChar++;
        }
        return index;
    }

    function resolveIndexFromPaths(path, current) {
        var next = path.slice(current.length + 1);
        next = next.slice(0, ~next.indexOf(',') ? next.indexOf(',') : next.length);
        return getIndexFromKey(next);
    }
    kodashWrapper['fn'] = kodashWrapper['prototype'];
    var kodashPushFunction = function(wrapper, loFunc, args, current) {
        var funcSlice;
        wrapper['__func__'] = {
            loFunc: loFunc,
            args: args,
            comp: null,
            rewrap: false,
            root: current['__func__'].root.split(',').concat(getKeyFromLength(current['__func__'].children.length)).join(','),
            parent: current['__func__'],
            children: [],
            dep: undefined
        };
        current['__func__'].children.push(wrapper['__func__']);
    };
    var unwrapArgs = function(args) {
        var observableflag = false;
        argArr = [];
        _(args).reverse().each(function(item, index) {
            var arg = item;
            arg = ko.utils.unwrapObservable(arg);
            argArr.push(arg);
        });
        return argArr;
    };
    _.mixin(kodashWrapper.prototype, _(_.prototype).keys().object().mapValues(function(val, key) {
        return function() {
            var wrapper = new kodashWrapper();
            kodashPushFunction(wrapper, key, arguments, this);
            return wrapper;
        };
    }).value());

    var mixinOrig = _.mixin;
    _.mixin({
        mixin: function() {
            var premixin = _.keys(_.prototype);
            mixinOrig.apply(this, arguments);
            _(_.prototype).keys().difference(premixin).tap(function(arr) {
                if (arr.length) {
                    mixinOrig(kodashWrapper.prototype, _(arr).object().mapValues(function(val, key) {
                        return function() {
                            var wrapper = new kodashWrapper();
                            kodashPushFunction(wrapper, key, arguments, this);
                            return wrapper;
                        };
                    }).value());
                }
            });
        }
    });

    var rewrap = function() {
        lastFunc = this['__func__'];
        if (lastFunc) {
            lastFunc['rewrap'] = true;
        }
        return this;
    };
    var mutate = function() {
        var func = this['__func__'];
        while (func.parent) func = func.parent;
        if (ko.isWriteableObservable(func['__observable__'][""])) {
            var loVal = this.wrappedValueOf();
            func['__observable__'][""]((loVal).valueOf());
        }
        return func['__observable__'];
    };
    var wrappedValueOf = function() {
        var ret = {},
            remove = [],
            create = [],
            func = this['__func__'],
            lodashCall,
            path = func.root;
        while (!ko.isObservable(func.parent['__observable__'] || 0) && func.parent.parent) {
            if (func.dep)
                remove.push(func);
            func = func.parent;
        }
        ko.unwrap(ko.unwrap(func.dep));
        lodashCall = ko.unwrap(func.parent['__observable__']);
        lodashCall = lodashCall[func.root.slice(0, -2)];
        lodashCall = ko.unwrap(lodashCall);
        if (!func.parent.parent)
            lodashCall = _(lodashCall);
        if (isLodash(lodashCall)) {
            while (func) {
                var args = unwrapArgs(func['args']);
                lodashCall = lodashCall[func['loFunc']].apply(lodashCall, args);
                lodashCall = func.rewrap ? _(lodashCall) : lodashCall;
                parent--;
                func = func.children[resolveIndexFromPaths(path, func.root)];
            }
        }
        return lodashCall;
    };
    var valueOf = function() {
        var wrapper = new kodashWrapper();
        kodashPushFunction(wrapper, 'value', arguments, this);
        var val = wrapper.wrappedValueOf();
        return val && val.valueOf();
    };
    var observe = function(opts) {
        var wrapper = new kodashWrapper();
        kodashPushFunction(wrapper, 'observe', arguments, this);
        createComputedGroup(wrapper['__func__'], opts);
        return createUnwrappedComputed(wrapper['__func__']);
    };
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

    function createUnwrappedComputed(startFunc) {
        return ko.computed(function() {
            return ko.unwrap(ko.unwrap(startFunc.parent['__observable__']))[startFunc.root.slice(0, -2)].value();
        });
    }

    function createComputedGroup(startFunc, opts) {
        opts = ko.utils.extend(opts || {});
        var retObs = ko.observable();
        setStartFunc=_.once(function(func){
            startFunc=func;
        });
        opts.read = function() {
            var ret = {},
                remove = [],
                create = [],
                func = startFunc,
                lodashCalls;
            while (!ko.isObservable(func.parent['__observable__'] || 0) && func.parent.parent) {
                if (func.dep) 
                    remove.push(func);
                func = func.parent;
            }
            setStartFunc(func);
            lodashCall = getLodashCall(func);
            if (func.loFunc === 'observe')
                return lodashCall;
            lodashCall = callLodashCall(func, lodashCall);
            traverseTree(func, ret, lodashCall, retObs, create, remove);

            retObs(ret);
            _.each(remove, removeFunc);
            _.each(create, createFunc);
            return ret;
        };

        return ko.computed(opts);
    }
    var callLodashCall = function(func, lodashCall) {
        if (isLodash(lodashCall)) {
            var args = unwrapArgs(func['args']);
            lodashCall = lodashCall[func['loFunc']].apply(lodashCall, args);
            lodashCall = func.rewrap ? _(lodashCall) : lodashCall;
            ko.isObservable(func.__observable__) ? func.__observable__()[func.root] = lodashCall : func.__observable__ = lodashCall;
        }
        return lodashCall;
    };
    var getLodashCall = function(func) {
        var lodashCall;
        ko.unwrap(ko.unwrap(func.dep));
        lodashCall = ko.unwrap(func.parent['__observable__']);
        lodashCall = lodashCall[func.root.slice(0, -2)];
        lodashCall = ko.unwrap(lodashCall);
        if (func.loFunc === 'observe')
            return lodashCall;
        if (!func.parent.parent)
            lodashCall = _(lodashCall);
        return lodashCall;
    };
    var removeFunc = function(item) {
        if (!item.dep) return;
        var dep = item.dep;
        item.dep = null;
        dep(null);
        dep['__comp__'].dispose();
    };
    var createFunc = function(item) {
        item.dep['__comp__'] = createComputedGroup(item);
    };
    var cb = function() {
        throw DETECTED;
    };
    var traverseTree = function(func, ret, result, retObs, create, remove) {
        var lodashCall = result,
            setRoot = false;

        _(func.children).each(function(child) {
            var traverse = true;
            depDet[depDetBeginName]({
                callback: cb
            });
            try {
                if ('observe' === child['loFunc']) {
                    setRoot = true;
                    traverse = false;
                } else if (isLodash(lodashCall)) {
                    if(_(child.children).any({'loFunc':'observe'})){
                        throw OBSERVED;
                    }
                    var args = unwrapArgs(child['args']);
                    lodashCall = lodashCall[child['loFunc']].apply(lodashCall, args);
                    lodashCall = func.rewrap ? _(lodashCall) : lodashCall;
                    if (child.dep)
                        remove.push(child);
                    child['__observable__'] = lodashCall;
                }
            } catch (e) {
                if (e !== DETECTED && e !== OBSERVED)
                    throw e;
                setRoot = true;
                traverse = false;
                if(e ==OBSERVED);
                else if (!child.dep)
                    (child.dep = ko.observable(retObs), create.push(child));
                else
                    child.dep.peek() != retObs && 'observe' !== child['loFunc'] && child.dep(retObs);
            }
            ko.computedContext.end();
            traverse && traverseTree(child, ret, lodashCall, retObs, create, remove);
        });
        if (setRoot) {
            ret[func.root] = result;
            func['__observable__'] = retObs;
        }
    };
    ko.observable['fn']['_'] = ko.observable['fn']['kodash'] = ko.dependentObservable['fn']['_'] = ko.dependentObservable['fn']['kodash'] = function() {
        return new kodashWrapper(this);
    };
});