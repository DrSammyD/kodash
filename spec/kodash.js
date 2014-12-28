define(['knockout', 'lodash', 'kodash'], function(ko, _) {
    describe('kodash', function() {
        var oArr;
        beforeEach(function() {
            oArr = ko.observableArray([1, 2, 3, 4, 5, 6, 7, 8]);
        });
        describe('when wrap is called', function() {
            var kw;
            beforeEach(function() {
                kw = oArr._();
            });

            it('should fetch the model', function() {
                expect(kw.constructor.name).toBe('kodashWrapper');
            });
        });
        describe('when filter is called with no dependencies', function() {
            var fcc, kw;
            beforeEach(function() {
                kw = oArr._();
                fcc = 0;
                kw.filter(function(item) {
                    fcc++;
                    return item % 2;
                });
            });
            it('should not run filter', function() {
                expect(fcc).toBe(0);
            });
            describe('when value is called on filter', function() {
                beforeEach(function() {
                    fcc = 0;
                    kw.filter(function(item) {
                        fcc++;
                        return item % 2;
                    }).value();
                });

                it('should run filter callback', function() {
                    expect(fcc).toBe(8);
                });
            });
            describe('when observe is called on filter', function() {
                var fo1,fo2,fw;
                beforeEach(function() {
                    fcc = 0;
                    fo1 = (fw = kw.filter(function(item) {
                        fcc++;
                        return item % 2;
                    })).observe();
                });
                it('should run filter callback', function() {
                    expect(fcc).toBe(8);
                });
                it('should return observable', function() {
                    var arr = fo1();
                    expect(arr).toContain(1);
                    expect(arr).not.toContain(2);
                    expect(arr).toContain(3);
                });
                describe('when base observable is changed', function() {
                    beforeEach(function() {
                        oArr([1, 2]);
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(10);
                    });
                    it('should update observable', function() {
                        var arr = fo1();
                        expect(arr).toContain(1);
                        expect(arr).not.toContain(2);
                        expect(arr).not.toContain(3);
                    });
                });
                describe('when two filters are chained and observed', function(){
                    beforeEach(function(){                        
                        fo2 = (fw2 = fw.filter(function(item) {
                            fcc++;
                            return item % 3;
                        })).observe();
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(12);
                    });
                    it('should return filtered observable',function(){
                        var arr = fo2();
                        expect(arr).toContain(1);
                        expect(arr).not.toContain(2);
                        expect(arr).not.toContain(3);
                        arr = fo1();
                        expect(arr).toContain(1);
                        expect(arr).not.toContain(2);
                        expect(arr).toContain(3);
                    });

                    describe('when base observable is changed', function() {  
                        beforeEach(function() {
                            oArr([1, 2, 3, 4, 5]);
                        });                      
                        it('should run filter callback', function() {
                            expect(fcc).toBe(23);
                        });
                        it('should return filtered observable',function(){
                            var arr = fo2();
                            expect(arr).toContain(1);
                            expect(arr).not.toContain(2);
                            expect(arr).not.toContain(3);
                            expect(arr).not.toContain(4);
                            expect(arr).toContain(5);
                            arr = fo1();
                            expect(arr).toContain(1);
                            expect(arr).not.toContain(2);
                            expect(arr).toContain(3);
                            expect(arr).not.toContain(4);
                            expect(arr).toContain(5);
                        });
                    });
                });
                describe('when two filters and observes are called on kw',function(){
                    beforeEach(function(){
                        fo2 = kw.filter(function(item) {
                            fcc++;
                            return item % 3;
                        }).observe();
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(16);
                    });
                    it('should return observable', function() {
                        var arr = fo2();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                        arr = fo1();
                        expect(arr).toContain(1);
                        expect(arr).not.toContain(2);
                        expect(arr).toContain(3);
                    });

                    describe('when base observable is changed', function() {
                        beforeEach(function() {
                            oArr([1, 2]);
                        });

                        it('should run filter callback', function() {
                            expect(fcc).toBe(20);
                        });
                        it('should update observable', function() {
                            var arr = fo2();
                            expect(arr).toContain(1);
                            expect(arr).toContain(2);
                            expect(arr).not.toContain(3);
                            arr = fo1();
                            expect(arr).toContain(1);
                            expect(arr).not.toContain(2);
                            expect(arr).not.toContain(3);
                        });
                    });
                });
            });
        });
        describe('when filter is called with dependencies', function() {
            var fcc,kw,filterMod,filterkw;
            beforeEach(function() {
                kw = oArr._();
                filterMod = ko.observable(2);
                filterkw = kw.filter(function(item) {
                    fcc++;
                    return item % filterMod();
                });
            });
            describe('when observe is called on filter with dependency', function() {
                var fo1;
                beforeEach(function() {
                    fcc = 0;
                    fo1 = filterkw.observe();
                });
                it('should run filter callback', function() {
                    expect(fcc).toBe(8);
                });
                it('should return observable', function() {
                    var arr = fo1();
                    expect(arr).toContain(1);
                    expect(arr).not.toContain(2);
                    expect(arr).toContain(3);
                });
                describe('when dependency is changed', function() {
                    beforeEach(function() {
                        filterMod(3);
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(16);
                    });
                    it('should update observable', function() {
                        var arr = fo1();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                    });
                });
                describe('when observe is called on another filter with dependency',function(){
                    var filterMod2,filterkw2,fo2;
                    beforeEach(function(){
                        filterMod2 = ko.observable(3);
                        filterkw2 = kw.filter(function(item) {
                            fcc++;
                            return item % filterMod2();
                        });
                        fo2 = filterkw2.observe();
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(16);
                    });
                    it('should return observable', function() {
                        arr = fo2();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                    });

                    describe('when dependency is changed', function() {
                        beforeEach(function() {
                            filterMod2(2);
                        });
                        it('should run filter callback', function() {
                            expect(fcc).toBe(24);
                        });
                        it('should update observable', function() {
                            var arr = fo2();
                            expect(arr).toContain(1);
                            expect(arr).not.toContain(2);
                            expect(arr).toContain(3);
                        });
                    });
                });
            });
        });
        describe('when filter is called with observable argument', function() {
            var fcc,kw,filterMod,filterkw;
            beforeEach(function() {
                kw = oArr._();
                filterMod = ko.observable(function(item) {
                    fcc++;
                    return item % 2;
                });
                filterkw = kw.filter(filterMod);
            });
            describe('when observe is called on filter with observable argument', function() {
                var fo1;
                beforeEach(function() {
                    fcc = 0;
                    fo1 = filterkw.observe();
                });
                it('should run filter callback', function() {
                    expect(fcc).toBe(8);
                });
                it('should return observable', function() {
                    var arr = fo1();
                    expect(arr).toContain(1);
                    expect(arr).not.toContain(2);
                    expect(arr).toContain(3);
                });
                describe('when observable argument is changed', function() {
                    beforeEach(function() {
                        filterMod(function(item) {
                            fcc++;
                            return item % 3;
                        });
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(16);
                    });
                    it('should update observable', function() {
                        var arr = fo1();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                    });
                });
                describe('when observe is called on another filter with observable argument',function(){
                    var filterMod2,filterkw2,fo2;
                    beforeEach(function(){
                        filterMod2 = ko.observable(function(item) {
                            fcc++;
                            return item % 3;
                        });
                        filterkw2 = kw.filter(filterMod2);
                        fo2 = filterkw2.observe();
                    });
                    it('should run filter callback', function() {
                        expect(fcc).toBe(16);
                    });
                    it('should return observable', function() {
                        var arr = fo2();
                        expect(arr).toContain(1);
                        expect(arr).toContain(2);
                        expect(arr).not.toContain(3);
                    });

                    describe('when dependency is changed', function() {
                        beforeEach(function() {
                            filterMod2(function(item) {
                                fcc++;
                                return item % 2;
                            });
                        });
                        it('should run filter callback', function() {
                            expect(fcc).toBe(24);
                        });
                        it('should update observable', function() {
                            var arr = fo2();
                            expect(arr).toContain(1);
                            expect(arr).not.toContain(2);
                            expect(arr).toContain(3);
                        });
                    });
                });
            });
        });
    });
});