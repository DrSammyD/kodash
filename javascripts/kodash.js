(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['knockout', 'lodash','knockout-deferred-updates'], factory);
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
    hasOwn = Object.prototype.hasOwnProperty;

    function isLodash(lodashCalls) {
        return lodashCalls && typeof lodashCalls === 'object' && !_.isArray(lodashCalls) && hasOwn.call(lodashCalls, '__wrapped__');
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
            chars += String.fromCharCode((rem=(length % 65536))+ 45);
            length-=rem;
            length = length?length/65536:-1;
        }
        return chars;
    }
    function getIndexFromKey(key)
    {
        var index = 0;
        var currentChar = 0;
        while(currentChar < key.length){
            index+=Math.pow(65536,currentChar)*(key.charCodeAt(currentChar)-45);
            currentChar++;
        }
        return index;
    }
    function resolveIndexFromPaths(path,current){
        var next = path.slice(current.length+1);
        next = next.slice(0,~next.indexOf(',')?next.indexOf(','):next.length);
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
        var func=this['__func__'];
        while(func.parent) func=func.parent;
        if (ko.isWriteableObservable(func['__observable__'][""])) {
            var loVal = this.wrappedValueOf();
            func['__observable__'][""]((loVal).valueOf());
        }
        return func['__observable__'];
    };
    var wrappedValueOf = function() {
        var ret = {},
            depsToRemove = [],
            create = [],
            func = this['__func__'],
            lodashCalls,
            path = func.root;
        while (!ko.isObservable(func.parent['__observable__'] || 0) && func.parent.parent) {
            if (func.dep) 
                depsToRemove.push(func);
            func = func.parent;
        }
        ko.unwrap(ko.unwrap(func.dep));
        lodashCalls = ko.unwrap(func.parent['__observable__']);
        lodashCalls = lodashCalls[func.root.slice(0, -2)];
        lodashCalls = ko.unwrap(lodashCalls);
        if (!func.parent.parent)
            lodashCalls = _(lodashCalls);
        if (isLodash(lodashCalls)) {
            while(func){                
                var args = unwrapArgs(func['args']);
                lodashCalls = lodashCalls[func['loFunc']].apply(lodashCalls, args);
                lodashCalls = func.rewrap ? _(lodashCalls) : lodashCalls;
                parent--;
                func = func.children[resolveIndexFromPaths(path,func.root)];
            }
        }
        return lodashCalls;
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
        createComputedGroup(wrapper['__func__'], opts)();
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

    function createUnwrappedComputed(func) {
        return ko.computed(function() {
            return ko.unwrap(ko.unwrap(func.dep))[func.root.slice(0, -2)].value();
        });
    }

    function createComputedGroup(startFunc, opts) {
        opts = ko.utils.extend(opts || {});
        var retObs = ko.observable();
        opts.read = function() {
            var ret = {},
                depsToRemove = [],
                create = [],
                func = startFunc,
                lodashCalls;
            while (!ko.isObservable(func.parent['__observable__'] || 0) && func.parent.parent) {
                if (func.dep) 
                    depsToRemove.push(func);
                func = func.parent;
            }
            ko.unwrap(ko.unwrap(func.dep));
            lodashCalls = ko.unwrap(func.parent['__observable__']);
            lodashCalls = lodashCalls[func.root.slice(0, -2)];
            lodashCalls = ko.unwrap(lodashCalls);
            if (func.loFunc === 'observe')
                return lodashCalls;
            if (!func.parent.parent)
                lodashCalls = _(lodashCalls);
            if (isLodash(lodashCalls)) {
                var args = unwrapArgs(func['args']);
                lodashCalls = lodashCalls[func['loFunc']].apply(lodashCalls, args);
                lodashCalls = func.rewrap ? _(lodashCalls) : lodashCalls;
                ko.isObservable(func.__observable__)? func.__observable__(lodashCalls): func.__observable__=lodashCalls;
            }
            traverseTree(func, ret, lodashCalls, retObs, create, depsToRemove);

            retObs(ret); 
            _.each(depsToRemove, function(item) {
                var dep = item.dep;
                item.dep = null;
                dep(null);
                dep['__comp__'].dispose();
            });
            _.each(create, function(item) {
                item.dep['__comp__'] = createComputedGroup(item);
            });
            return ret;
        };
        return ko.computed(opts);
    }
    var cb = function() {
        throw DETECTED;
    };
    var traverseTree = function(func, ret, result, retObs, create, remove) {
        var lodashCalls = result,
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
                    if (!child.dep)
                        child.dep = ko.observable(retObs);
                    else
                        child.dep(retObs);
                    create.push(child);
                } else if (isLodash(lodashCalls)) {
                    var args = unwrapArgs(child['args']);
                    lodashCalls = lodashCalls[child['loFunc']].apply(lodashCalls, args);
                    lodashCalls = func.rewrap ? _(lodashCalls) : lodashCalls;
                    if (child.dep) 
                        remove.push(child);
                    child['__observable__'] = lodashCalls;
                }
            } catch (e) {
                if (e !== DETECTED)
                    throw e;
                setRoot = true;
                traverse = false;
                if (!child.dep)
                    (child.dep = ko.observable(retObs), create.push(child));
                else
                    child.dep(retObs);
            }
            ko.computedContext.end();
            traverse && traverseTree(child, ret, lodashCalls, retObs, create, remove);
        });
        if(setRoot){
            ret[func.root] = result;
            func['__observable__'] = retObs;
        }
    };
    ko.observable['fn']['_'] = ko.observable['fn']['kodash'] = ko.dependentObservable['fn']['_'] = ko.dependentObservable['fn']['kodash'] = function() {
        return new kodashWrapper(this);
    };
});