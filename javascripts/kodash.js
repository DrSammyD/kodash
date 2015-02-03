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
            root: '',
            loFunc:'tap',
            args:[_.noop]
        };
        if (obs){
            this['__func__'].parent={children:[this['__func__']]};
            this['__func__'].parent['__output__'] = ko.computed(function() {
                return {
                    '': _(obs())
                };
            });
            current = this['__func__'].parent;
        }
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
        for (var i = args.length - 1; i >= 0; i--) {
            var arg=args[i];
            arg = ko.utils.unwrapObservable(arg);
            argArr.push(arg);
        }
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
    var mutate = function() {
        var func = this['__func__'];
        while (func.parent) func = func.parent;
        if (ko.isWriteableObservable(func['__output__'][""])) {
            var loVal = this.wrappedValueOf();
            func['__output__'][""]((loVal).valueOf());
        }
        return func['__output__'];
    };
    var wrappedValueOf = function() {
        var outputObj = {},
            remove = [],
            create = [],
            func = this['__func__'],
            lodashCall,
            path = func.root;
        while (!ko.isObservable(func.parent['__output__'] || 0) && func.parent.parent) {
            if (func.dep)
                remove.push(func);
            func = func.parent;
        }
        lodashCall = getResultFromParent(func);
        if (isLodash(lodashCall)) {
            while (func) {
                var args = unwrapArgs(func['args']);
                lodashCall = lodashCall[func['loFunc']].apply(lodashCall, args);
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
        createComputedGroup(wrapper['__func__'], opts,true);
        return createUnwrappedComputed(wrapper['__func__']);
    };
    _.mixin(kodashWrapper.prototype, {
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
            return ko.unwrap(ko.unwrap(startFunc.parent['__output__']))[startFunc.parent.root||""].value();
        });
    }

    function createComputedGroup(func, opts, external) {
        var outputObservable = ko.observable(),
            startFunc = _.once(function(func) {
                return func;
            }),
            funcIttr=determineStart(func);
        if(external && funcIttr.parent.parent){
            appendObservedCalls(funcIttr.parent,func.root);
        }else{
            opts = ko.utils.extend(opts || {});
            opts.read = function() {
                var outputObj = {},
                    remove = [],
                    create = [],
                    lodashCalls;
                funcIttr = startChanged(funcIttr,startFunc,remove);
                if(funcIttr === null)
                    return null;
                lodashCall = getResultFromParent(funcIttr);
                if (funcIttr.loFunc === 'observe')
                    return lodashCall;
                lodashCall = callLodashCall(funcIttr, lodashCall,outputObj);
                traverseTree(funcIttr, outputObj, lodashCall, outputObservable, create, remove);

                _.each(remove, removeFunc);
                outputObservable(outputObj);
                _.each(create, createFunc);
                return outputObj;
            };

            var comp= ko.computed(opts);
            startFunc().dep['__comp__']  || (startFunc().dep['__comp__']=comp);
            return comp;
        }
    }

    var traverseTree = function(func, outputObj, result, outputObservable, create, remove) {
        var lodashCall = result,
            setOutput = false;

        _(func.children).each(function(child) {
            if(child.observed){
                var traverse = true;
                depDet[depDetBeginName]({
                    callback: cb
                });
                try {
                    if ('observe' === child['loFunc']) {
                        setOutput = true;
                        traverse = false;
                    } else if (isLodash(lodashCall)) {
                        if (_.any(child.children,{'loFunc': 'observe'})) {
                            throw OBSERVED;
                        }
                        var args = unwrapArgs(child['args']);
                        lodashCall = lodashCall[child['loFunc']].apply(lodashCall, args);
                        if (child.dep)
                            remove.push(child);
                        child['__output__'] = lodashCall;
                        child.observed=1;
                    }
                } catch (e) {
                    if (e !== DETECTED && e !== OBSERVED)
                        throw e;
                    setOutput = true;
                    traverse = false;
                    if (!child.dep)
                        (child.dep = ko.observable(outputObservable), create.push(child));
                    else
                        child.dep.peek() != outputObservable && 'observe' !== child['loFunc'] && child.dep(outputObservable);
                }
                ko.computedContext.end();
                traverse && traverseTree(child, outputObj, lodashCall, outputObservable, create, remove);
            }
        }).value();
        if (setOutput) {
            outputObj[func.root] = result;
            func['__output__'] = outputObservable;
        }
    };
    var appendObservedCalls=function(funcIttr,path){
        var outputObservable=funcIttr['__output__'],
        outputObj=ko.unwrap(outputObservable),
        create = [];
        while(funcIttr['__output__']&&funcIttr.observed===1){
            funcIttr=funcIttr.children[resolveIndexFromPaths(path,funcIttr.root)];
        }
        var result = funcIttr.parent['__output__'];
        if(ko.isObservable(result))
            result=(ko.unwrap(result))[funcIttr.parent.root];
        traversePath(funcIttr,path,outputObj,result, outputObservable, create);
        _.each(create, createFunc);
        return outputObj;
    };
    var traversePath=function(func, path, outputObj, result, outputObservable, create){
        var traverse = true,
            setOutput = false;
            setParentOutput=false,
            lodashCall = result;
        depDet[depDetBeginName]({
            callback: cb
        });
        try {
            if ('observe' === func['loFunc']) {
                setParentOutput = true;
                traverse = false;
            } else if (isLodash(lodashCall)) {
                if (_.any(func.children,{'loFunc': 'observe'})) {
                    throw OBSERVED;
                }
                var args = unwrapArgs(func['args']);
                lodashCall = lodashCall[func['loFunc']].apply(lodashCall, args);
                func['__output__'] = lodashCall;
                func.observed=1;
            }
        } catch (e) {
            if (e !== DETECTED && e !== OBSERVED)
                throw e;
            setParentOutput = true;
            traverse = false;
            func.dep = ko.observable(outputObservable);
            create.push(func);
        }
        ko.computedContext.end();
        traverse && (setOutput=traversePath(func.children[resolveIndexFromPaths(func.root,path)],path, outputObj, lodashCall, outputObservable, create));
        if (setOutput) {
            outputObj[func.root] = lodashCall;
            func['__output__'] = outputObservable;
        }
        return setParentOutput;
    };
    var determineStart=function(funcIttr){
        while (funcIttr.parent && !ko.isObservable(funcIttr.parent['__output__'] || 0)) {
            funcIttr.observed=-1;
            funcIttr = funcIttr.parent;
        }
        funcIttr.observed=true;
        if(!funcIttr.dep){
            funcIttr.dep=ko.observable(funcIttr.parent['__output__']);
        }
        return funcIttr;
    };
    var startChanged=function(funcIttr,startFunc,remove){
        funcIttr=startFunc(funcIttr);
        if (funcIttr.parent && !ko.isObservable(funcIttr.parent['__output__'] || 0)) {
            return null;
        }
        return funcIttr;
    };
    var callLodashCall = function(func, lodashCall) {
        if (isLodash(lodashCall)) {
            var args = unwrapArgs(func['args']);
            func.observed=1;
            lodashCall = lodashCall[func['loFunc']].apply(lodashCall, args);
        }
        return lodashCall;
    };
    var getResultFromParent = function(func) {
        var lodashCall;
        ko.unwrap(ko.unwrap(func.dep));
        lodashCall = ko.unwrap(func.parent['__output__']);
        lodashCall = lodashCall[func.parent.root||""];
        lodashCall = ko.unwrap(lodashCall);
        return lodashCall;
    };
    var removeFunc = function(item) {
        if (!item.dep) return;
        var dep = item.dep;
        item.dep = null;
        dep(null);
        dep['__comp__']&&dep['__comp__'].dispose();
    };
    var createFunc = function(item) {
        item.dep['__comp__'] = createComputedGroup(item);
    };
    var cb = function() {
        throw DETECTED;
    };
    ko.observable['fn']['_'] = ko.observable['fn']['kodash'] = ko.dependentObservable['fn']['_'] = ko.dependentObservable['fn']['kodash'] = function() {
        return new kodashWrapper(this);
    };
});