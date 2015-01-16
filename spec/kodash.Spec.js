define(['knockout', 'lodash', 'chai', 'kodash'], function(ko, _, chai) {
    ko.utils.extend(window, chai);
    describe('kodash', function() {
        var baseObservableArray;
        beforeEach(function() {
            window.comps=[];
            baseObservableArray = ko.observableArray([1, 2, 3, 4, 5, 6, 7, 8]);
        });
        describe('when wrap is called', function() {
            var kodashWrapper;
            beforeEach(function() {
                kodashWrapper = baseObservableArray._();
            });
            it('should fetch the model', function() {
                expect(kodashWrapper.constructor.name).to.equal('kodashWrapper');
            });
        });
        describe('when filter is called with no dependencies', function() {
            var filterCounter, kodashWrapper, filteredWrapper;
            beforeEach(function() {
                kodashWrapper = baseObservableArray._();
                filterCounter = 0;
                filteredWrapper = kodashWrapper.filter(function(item) {
                    filterCounter++;
                    return item % 2;
                });
            });
            it('should not run filter', function() {
                expect(filterCounter).to.equal(0);
            });
            describe('when value is called on filter', function() {
                beforeEach(function() {
                    filterCounter = 0;
                    filteredWrapper.value();
                });

                it('should run filter callback', function() {
                    expect(filterCounter).to.equal(8);
                });
            });
            describe('when observe is called on filter', function() {
                var filteredObservable1, filteredObservable2;
                beforeEach(function() {
                    filterCounter = 0;
                    filteredObservable1 = filteredWrapper.observe();
                });
                it('should run filter callback', function() {
                    expect(filterCounter).to.equal(8);
                });
                it('should return observable', function() {
                    var arr = filteredObservable1();
                    expect(arr).to.include.members([1, 3]);
                    expect(arr).to.not.include(2);
                });
                describe('when base observable is changed', function() {
                    beforeEach(function() {
                        filterCounter = 0;
                        baseObservableArray([1, 2]);
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(2);
                    });
                    it('should update observable', function() {
                        var arr = filteredObservable1();
                        expect(arr).to.include(1);
                        expect(arr).to.not.include.members([2, 3]);
                    });
                });
                describe('when two filters are chained and observed', function() {
                    var filteredWrapper2;
                    beforeEach(function() {
                        filterCounter = 0;
                        filteredObservable2 = (filteredWrapper2 = filteredWrapper.filter(function(item) {
                            filterCounter++;
                            return item % 3;
                        })).observe();
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(4);
                    });
                    it('should return filtered observable', function() {
                        var arr = filteredObservable2();
                        expect(arr).to.include(1);
                        expect(arr).to.not.include.members([2, 3]);
                        arr = filteredObservable1();
                        expect(arr).to.include.members([1, 3]);
                        expect(arr).to.not.include(2);
                    });

                    describe('when base observable is changed', function() {
                        beforeEach(function() {
                            filterCounter = 0;
                            baseObservableArray([1, 2, 3, 4, 5]);
                        });
                        it('should run filter callback', function() {
                            expect(filterCounter).to.equal(8);
                        });
                        it('should return filtered observable', function() {
                            var arr = filteredObservable2();
                            expect(arr).to.include.members([1, 5]);
                            expect(arr).to.not.include.members([2, 3, 4]);
                            arr = filteredObservable1();
                            expect(arr).to.include.members([1, 3, 5]);
                            expect(arr).to.not.include.members([2, 4]);
                        });
                    });
                });
                describe('when two filters and observes are called on kodashWrapper', function() {
                    beforeEach(function() {
                        filterCounter = 0;
                        filteredObservable2 = kodashWrapper.filter(function(item) {
                            filterCounter++;
                            return item % 3;
                        }).observe();
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(8);
                    });
                    it('should return observable', function() {
                        var arr = filteredObservable2();
                        expect(arr).to.include.members([1, 2]);
                        expect(arr).to.not.include(3);
                        arr = filteredObservable1();
                        expect(arr).to.include.members([1, 3]);
                        expect(arr).to.not.include(2);
                    });

                    describe('when base observable is changed', function() {
                        beforeEach(function() {
                            filterCounter = 0;
                            baseObservableArray([1, 2]);
                        });

                        it('should run filter callback', function() {
                            expect(filterCounter).to.equal(4);
                        });
                        it('should update observable', function() {
                            var arr = filteredObservable2();
                            expect(arr).to.include.members([1, 2]);
                            expect(arr).to.not.include(3);
                            arr = filteredObservable1();
                            expect(arr).to.include(1);
                            expect(arr).to.not.include.members([2, 3]);
                        });
                    });
                });
                describe('when two filters, one with a map, and two observes are called on kodashWrapper', function() {
                    beforeEach(function() {
                        filterCounter = 0;
                        filteredObservable2 = kodashWrapper.filter(function(item) {
                            filterCounter++;
                            return item % 3;
                        }).map(function(item){
                            filterCounter++; 
                            return item+1;
                        }).observe();
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(14);
                    });
                    it('should return observable', function() {
                        var arr = filteredObservable2();
                        expect(arr).to.include.members([2, 3]);
                        expect(arr).to.not.include(4);
                        arr = filteredObservable1();
                        expect(arr).to.include.members([1, 3]);
                        expect(arr).to.not.include(2);
                    });

                    describe('when base observable is changed', function() {
                        beforeEach(function() {
                            filterCounter = 0;
                            baseObservableArray([1, 2]);
                        });

                        it('should run filter callback', function() {
                            expect(filterCounter).to.equal(6);
                        });
                        it('should update observable', function() {
                            var arr = filteredObservable2();
                            expect(arr).to.include.members([2, 3]);
                            expect(arr).to.not.include(4);
                            arr = filteredObservable1();
                            expect(arr).to.include(1);
                            expect(arr).to.not.include.members([2, 3]);
                        });
                    });
                });
            });
        });
        describe('when filter is called with dependencies', function() {
            var filterCounter, kodashWrapper, filterMod, filterKodashWrapper;
            beforeEach(function() {
                kodashWrapper = baseObservableArray._();
                filterMod = ko.observable(2);
                filterKodashWrapper = kodashWrapper.filter(function(item) {
                    filterCounter++;
                    return item % filterMod();
                });
            });
            describe('when observe is called on filter with dependency', function() {
                var filteredObservable1;
                beforeEach(function() {
                    filterCounter = 0;
                    filteredObservable1 = filterKodashWrapper.observe();
                });
                it('should run filter callback', function() {
                    expect(filterCounter).to.equal(8);
                });
                it('should return observable', function() {
                    var arr = filteredObservable1();
                    expect(arr).to.include(1);
                    expect(arr).to.not.include(2);
                    expect(arr).to.include(3);
                });
                describe('when dependency is changed', function() {
                    beforeEach(function() {
                        filterMod(3);
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(16);
                    });
                    it('should update observable', function() {
                        var arr = filteredObservable1();
                        expect(arr).to.include.members([1, 2]);
                        expect(arr).to.not.include(3);
                    });
                });
                describe('when observe is called on another filter with dependency', function() {
                    var filterMod2, filterKodashWrapper2, filteredObservable2;
                    beforeEach(function() {
                        filterMod2 = ko.observable(3);
                        filterKodashWrapper2 = kodashWrapper.filter(function(item) {
                            filterCounter++;
                            return item % filterMod2();
                        });
                        filteredObservable2 = filterKodashWrapper2.observe();
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(16);
                    });
                    it('should return observable', function() {
                        arr = filteredObservable2();
                        expect(arr).to.include.members([1, 2]);
                        expect(arr).to.not.include(3);
                    });

                    describe('when dependency is changed', function() {
                        beforeEach(function() {
                            filterMod2(2);
                        });
                        it('should run filter callback', function() {
                            expect(filterCounter).to.equal(24);
                        });
                        it('should update observable', function() {
                            var arr = filteredObservable2();
                            expect(arr).to.include.members([1, 3]);
                            expect(arr).to.not.include(2);
                        });
                    });
                });
            });
        });
        describe('when filter is called with observable argument', function() {
            var filterCounter, kodashWrapper, filterMod, filterKodashWrapper;
            beforeEach(function() {
                kodashWrapper = baseObservableArray._();
                filterMod = ko.observable(function(item) {
                    filterCounter++;
                    return item % 2;
                });
                filterKodashWrapper = kodashWrapper.filter(filterMod);
            });
            describe('when observe is called on filter with observable argument', function() {
                var filteredObservable1;
                beforeEach(function() {
                    filterCounter = 0;
                    filteredObservable1 = filterKodashWrapper.observe();
                });
                it('should run filter callback', function() {
                    expect(filterCounter).to.equal(8);
                });
                it('should return observable', function() {
                    var arr = filteredObservable1();
                    expect(arr).to.include(1);
                    expect(arr).to.not.include(2);
                    expect(arr).to.include(3);
                });
                describe('when observable argument is changed', function() {
                    beforeEach(function() {
                        filterMod(function(item) {
                            filterCounter++;
                            return item % 3;
                        });
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(16);
                    });
                    it('should update observable', function() {
                        var arr = filteredObservable1();
                        expect(arr).to.include.members([1, 2]);
                        expect(arr).to.not.include(3);
                    });
                });
                describe('when observe is called on another filter with observable argument', function() {
                    var filterMod2, filterKodashWrapper2, filteredObservable2;
                    beforeEach(function() {
                        filterMod2 = ko.observable(function(item) {
                            filterCounter++;
                            return item % 3;
                        });
                        filterKodashWrapper2 = kodashWrapper.filter(filterMod2);
                        filteredObservable2 = filterKodashWrapper2.observe();
                    });
                    it('should run filter callback', function() {
                        expect(filterCounter).to.equal(16);
                    });
                    it('should return observable', function() {
                        var arr = filteredObservable2();
                        expect(arr).to.include.members([1, 2]);
                        expect(arr).to.not.include(3);
                    });

                    describe('when dependency is changed', function() {
                        beforeEach(function() {
                            filterMod2(function(item) {
                                filterCounter++;
                                return item % 2;
                            });
                        });
                        it('should run filter callback', function() {
                            expect(filterCounter).to.equal(24);
                        });
                        it('should update observable', function() {
                            var arr = filteredObservable2();
                            expect(arr).to.include.members([1, 3]);
                            expect(arr).to.not.include(2);
                        });
                    });
                });
            });
        });
    });
});