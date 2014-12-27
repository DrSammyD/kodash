define(['knockout', 'lodash', 'kodash'], function(ko, _) {
    describe('kodash arrays', function() {
        var numArray;
        beforeEach(function() {
            numArray = ko.observableArray([1, 2, 3, 4, 5, 6, 7, 8]);
        });
        describe('when wrap is called', function() {
            var wrapper;
            beforeEach(function() {
                wrapper = numArray._();
            });

            it('should fetch the model', function() {
                expect(wrapper.constructor.name).toBe('kodashWrapper');
            });
        });
        describe('when filter is called with no dependencies', function() {
            var filterCallBackCount, wrapper;
            beforeEach(function() {
                wrapper = numArray._();
                filterCallBackCount = 0;
                wrapper.filter(function(item) {
                    filterCallBackCount++;
                    return item % 2;
                });
            });
            it('should not run filter', function() {
                expect(filterCallBackCount).toBe(0);
            });
            describe('when value is called on filter', function() {
                beforeEach(function() {
                    filterCallBackCount = 0;
                    wrapper.filter(function(item) {
                        filterCallBackCount++;
                        return item % 2;
                    }).value();
                });

                it('should run filter callback', function() {
                    expect(filterCallBackCount).toBe(8);
                });
            });
            describe('when observe is called on filter', function() {
                var filteredObservable;
                beforeEach(function() {
                    filterCallBackCount = 0;
                    filteredObservable = wrapper.filter(function(item) {
                        filterCallBackCount++;
                        return item % 2;
                    }).observe();
                });
                it('should run filter callback', function() {
                    expect(filterCallBackCount).toBe(8);
                });
                it('should return observable', function() {
                    var arr = filteredObservable();
                    expect(arr).toContain(1);
                    expect(arr).not.toContain(2);
                    expect(arr).toContain(3);
                });
                describe('when base observable is changed', function() {
                    beforeEach(function() {
                        numArray([1, 2]);
                    });

                    it('should run filter callback', function() {
                        expect(filterCallBackCount).toBe(10);
                    });
                    it('should update observable', function() {
                        var arr = filteredObservable();
                        expect(arr).toContain(1);
                        expect(arr).not.toContain(2);
                        expect(arr).not.toContain(3);
                    });
                });
            });
        });
        describe('when filter is called with dependencies', function() {
            var filterCallBackCount,wrapper,filterMod,filterWrapper;
            beforeEach(function() {
                wrapper = numArray._();
                filterMod = ko.observable(2);
                filterWrapper = wrapper.filter(function(item) {
                    filterCallBackCount++;
                    return item % filterMod();
                });
            });
            describe('when observe is called on filter with dependency', function() {
                var filteredObservable;
                beforeEach(function() {
                    filterCallBackCount = 0;
                    filteredObservable = filterWrapper.observe();
                });
                it('should run filter callback', function() {
                    expect(filterCallBackCount).toBe(8);
                });
                it('should return observable', function() {
                    var arr = filteredObservable();
                    expect(arr).toContain(1);
                    expect(arr).not.toContain(2);
                    expect(arr).toContain(3);
                });
                describe('when dependency is changed', function() {
                    beforeEach(function() {
                        filterMod(3);
                    });
                    it('should run filter callback', function() {
                        expect(filterCallBackCount).toBe(16);
                    });
                    it('should update observable', function() {
                        var arr = filteredObservable();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                    });
                });
            });
        });
        describe('when filter is called with observable argument', function() {
            var filterCallBackCount,wrapper,filterMod,filterWrapper;
            beforeEach(function() {
                wrapper = numArray._();
                filterMod = ko.observable(function(item) {
                    filterCallBackCount++;
                    return item % 2;
                });
                filterWrapper = wrapper.filter(filterMod);
            });
            describe('when observe is called on filter with dependency', function() {
                var filteredObservable;
                beforeEach(function() {
                    filterCallBackCount = 0;
                    filteredObservable = filterWrapper.observe();
                });
                it('should run filter callback', function() {
                    expect(filterCallBackCount).toBe(8);
                });
                it('should return observable', function() {
                    var arr = filteredObservable();
                    expect(arr).toContain(1);
                    expect(arr).not.toContain(2);
                    expect(arr).toContain(3);
                });
                describe('when observable argument is changed', function() {
                    beforeEach(function() {
                        filterMod(function(item) {
                            filterCallBackCount++;
                            return item % 3;
                        });
                    });
                    it('should run filter callback', function() {
                        expect(filterCallBackCount).toBe(16);
                    });
                    it('should update observable', function() {
                        var arr = filteredObservable();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                    });
                });
            });
        });
    });
});