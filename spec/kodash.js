define(['knockout','lodash','kodash'],function (ko,_){
    describe('kodash', function () {
        var baseArr;

        beforeEach(function () {
            baseArr = ko.observableArray([1,2,3,4,5,6,7,8]);
        });

        describe('when wrap is called', function () {
            var wrapper;

            beforeEach(function () {
                wrapper = baseArr._();
            });

            it('should fetch the model', function () { 
                expect(wrapper.constructor.name).toBe('kodashWrapper');
            });
        });
/*
        describe('when follow is called with no links', function () {
            var followFired = false;

            beforeEach(function () {
                stubSync();

                sut.on('follow', function () {
                    followFired = true;
                });

                sut.follow();
            });

            it('should not fire a follow event', function () {
                expect(followFired).toBe(false);
            });

            it('should not set followed to true', function () {
                expect(sut.followed).toBe(false);
            });
        });

        describe('when sync is called', function () {
            var options;

            beforeEach(function () {
                options = {
                    success: function () { }
                };

                stubSync();

                sut.sync('read', sut, options);
            });

            it('should call Backbone.sync', function () {
                expect(Backbone.sync.argsForCall[0][1]).toBe(sut);
            });
        });

        describe('when a mediaType property is defined', function () {
            beforeEach(function () {
                sut.mediaType = 'application/vnd.company.thing';
            });

            describe('and sync is called', function () {
                var options;

                beforeEach(function () {
                    options = {
                        success: function () { }
                    };

                    stubSync();

                    sut.sync('read', sut, options);
                });

                it('should set the accepts option to the media type', function () {
                    expect(options.accepts.json).toBe(sut.mediaType);
                });
            });

            describe('and sync is called with method create', function () {
                var options;

                beforeEach(function () {
                    options = {
                        success: function () { }
                    };

                    stubSync();

                    sut.sync('create', sut, options);
                });

                it('should set the contentType option to the media type', function () {
                    expect(options.contentType).toBe(sut.mediaType);
                });
            });
        });

        describe('when the model declares a link', function () {
            beforeEach(function () {
                sut.links = {
                    'some-rel': Backbone.Model
                };
            });

            describe('and the response contains a single corresponding link', function () {
                beforeEach(function () {
                    var data = {
                        links: [
                                { rel: 'some-rel', href: '/somewhere' }
                            ]
                    };

                    stubSync(data);
                });

                describe('and fetch is called', function () {
                    var followFired = false;

                    beforeEach(function () {
                        sut.on('follow', function () {
                            followFired = true;
                        });

                        sut.fetch();
                    });

                    it('should fetch the model', function () {
                        expect(Backbone.sync.argsForCall[0][1]).toBe(sut);
                    });

                    it('should follow the link', function () {
                        var related = Backbone.sync.argsForCall[1][1];

                        expect(related instanceof Backbone.Model).toBeTruthy();
                    });

                    it('should use the correct url', function () {
                        expect(Backbone.sync.argsForCall[1][2].url).toBe('/somewhere');
                    });

                    it('should add the related model to the parent', function () {
                        expect(sut['some-rel']).toBeDefined();
                        expect(sut['some-rel'] instanceof Backbone.Model).toBeTruthy();
                    });

                    it('should fire a follow event', function () {
                        expect(followFired).toBe(true);
                    });

                    it('should set followed to true', function () {
                        expect(sut.followed).toBe(true);
                    });

                    describe('and toJSON is called', function () {
                        var json;

                        beforeEach(function () {
                            json = sut.toJSON();
                        });

                        it('should include the related model', function () {
                            expect(json['some-rel']).toBeDefined();
                        });
                    });
                });

                describe('and fetch is called with empty follow array in options', function () {
                    var followFired = false;

                    beforeEach(function () {
                        sut.on('follow', function () {
                            followFired = true;
                        });
                        sut.fetch({ follow: [] });
                    });

                    it('should fetch the model', function () {
                        expect(Backbone.sync.argsForCall[0][1]).toBe(sut);
                    });

                    it('should not fire a follow event', function () {
                        expect(followFired).toBe(false);
                    });
                });

                describe('and fetch is called with a populated follow array in options', function () {
                    var followFired = false;

                    beforeEach(function () {
                        sut.on('follow', function () {
                            followFired = true;
                        });
                        sut.fetch({ follow: [ 'some-rel' ] });
                    });

                    it('should fetch the model', function () {
                        expect(Backbone.sync.argsForCall[0][1]).toBe(sut);
                    });

                    it('should fire a follow event', function () {
                        expect(followFired).toBe(true);
                    });

                    it('should follow the link', function () {
                        var related = Backbone.sync.argsForCall[1][1];

                        expect(related instanceof Backbone.Model).toBeTruthy();
                    });
                });
            });
        });

        describe('when the model has two links', function () {
            beforeEach(function () {
                sut.links = {
                    'some-rel': Backbone.Model,
                    'another-rel': Backbone.Model
                };
            });

            describe('and the response contains two links', function () {
                beforeEach(function () {
                    var data = {
                        links: [
                                { rel: 'some-rel', href: '/somewhere' },
                                { rel: 'another-rel', href: '/somewhere' }
                            ]
                    };

                    stubSync(data);
                });

                describe('and fetch is called with a populated follow array for only one of the link rels', function () {
                    beforeEach(function () {
                        sut.fetch({ follow: [ 'another-rel' ] });
                    });

                    it('should call sync twice (1 fetch and 1 follow)', function () {
                        expect(Backbone.sync.callCount).toBe(2);
                    });
                });
            });

            describe('and the response contains multiple corresponding links where only one was expected', function () {
                beforeEach(function () {
                    var data = {
                        links: [
                                { rel: 'some-rel', href: '/somewhere' },
                                { rel: 'some-rel', href: '/somewhere-else' }
                            ]
                    };

                    stubSync(data);
                });

                it('should throw an error when fetch is called', function () {
                    expect(function () {
                        sut.fetch();
                    }).toThrow(new Error('Found more than one link with rel \'some-rel\', but the link was not specified as allowing multiple values. To allow multiple values, suffix the link key with \'[]\'.'));
                });
            });
        });

        describe('when the model declares a link within a nested scope', function () {
            beforeEach(function () {
                sut.links = {
                    'scope.some-rel': Backbone.Model
                };
            });

            describe('and the response contains a scope with a corresponding link', function () {
                beforeEach(function () {
                    var data = {
                        scope: {
                            links: [
                                    { rel: 'some-rel', href: '/somewhere' }
                                ]
                        }
                    };

                    stubSync(data);
                });

                describe('and fetch is called', function () {
                    var followFired = false;

                    beforeEach(function () {
                        sut.on('follow', function () {
                            followFired = true;
                        });
                        sut.fetch();
                    });

                    it('should add the related model to the nested scope', function () {
                        expect(sut.get('scope')['some-rel']).toBeDefined();
                        expect(sut.get('scope')['some-rel'] instanceof Backbone.Model).toBeTruthy();
                    });

                    describe('and toJSON is called', function () {
                        var json;

                        beforeEach(function () {
                            json = sut.toJSON();
                        });

                        it('should include the related model', function () {
                            expect(json.scope).toBeDefined();
                            expect(json.scope['some-rel']).toBeDefined();
                        });
                    });
                });
            });

            describe('and the response contains an array with a corresponding link in each item', function () {
                beforeEach(function () {
                    var data = {
                        scope: [
                            {
                                links: [
                                    { rel: 'some-rel', href: '/somewhere' }
                                ]
                            },
                            {
                                links: [
                                    { rel: 'some-rel', href: '/somewhere-else' }
                                ]
                            }
                        ]
                    };

                    stubSync(data);
                });

                describe('and fetch is called', function () {
                    beforeEach(function () {
                        sut.fetch();
                    });

                    it('should add the related model to each array item', function () {
                        expect(sut.get('scope')[0]['some-rel']).toBeDefined();
                        expect(sut.get('scope')[0]['some-rel'] instanceof Backbone.Model).toBeTruthy();
                        expect(sut.get('scope')[1]['some-rel']).toBeDefined();
                        expect(sut.get('scope')[1]['some-rel'] instanceof Backbone.Model).toBeTruthy();
                    });

                    describe('and toJSON is called', function () {
                        var json;

                        beforeEach(function () {
                            json = sut.toJSON();
                        });

                        it('should include the related model for each array item', function () {
                            expect(json.scope).toBeDefined();
                            expect(json.scope[0]['some-rel']).toBeDefined();
                            expect(json.scope[1]['some-rel']).toBeDefined();
                        });
                    });
                });
            });

            // test to ensure that toJSON doesn't fall over even when links have not been followed successfully
            describe('and toJSON is called', function () {
                var json;

                beforeEach(function () {
                    json = sut.toJSON();
                });

                it('should ignore the property if it doesnt exist', function () {
                    expect(json).toBeDefined();
                    expect(json.scope).not.toBeDefined();
                });
            });
        });

        describe('when the model declares a link which may appear more than once', function () {
            beforeEach(function () {
                sut.links = {
                    'some-rel[]': Backbone.Model
                };
            });

            describe('and the response contains multiple corresponding links', function () {
                beforeEach(function () {
                    var data = {
                        links: [
                                { rel: 'some-rel', href: '/somewhere' },
                                { rel: 'some-rel', href: '/somewhere-else' }
                            ]
                    };

                    stubSync(data);
                });

                describe('and fetch is called', function () {
                    beforeEach(function () {
                        sut.fetch();
                    });

                    it('should add the related models to the parent as an array', function () {
                        expect(sut['some-rel']).toBeDefined();
                        expect(sut['some-rel'] instanceof Array).toBeTruthy();
                        expect(sut['some-rel'].length).toBe(2);
                    });

                    describe('and toJSON is called', function () {
                        var json;

                        beforeEach(function () {
                            json = sut.toJSON();
                        });

                        it('should include the array property', function () {
                            expect(json['some-rel']).toBeDefined();
                            expect(json['some-rel'] instanceof Array).toBeTruthy();
                            expect(json['some-rel'].length).toBe(2);
                        });
                    });
                });
            });
        });

        describe('when the model defines options to use for a link', function () {
            beforeEach(function () {
                sut.links = {
                    'some-rel': Backbone.Model,
                    'another-rel': {
                        model: Backbone.Model,
                        options: {
                            follow: [ 'another-rel' ]
                        }
                    }
                };
            });

            describe('and the response contains two links', function () {
                beforeEach(function () {
                    var data = {
                        links: [
                                { rel: 'some-rel', href: '/somewhere' },
                                { rel: 'another-rel', href: '/anotherwhere' }
                            ]
                    };

                    stubSync(data);
                });
                describe('and fetch is called', function () {
                    beforeEach(function () {
                        sut.fetch();
                    });

                    it('when fetching another-rel, the provided options should be mixed in', function () {
                        var theOptionsWeAreLookingFor = _.find(Backbone.sync.argsForCall, function (callArguments) {
                            return callArguments[2].url === '/anotherwhere';
                        })[2];
                        expect(theOptionsWeAreLookingFor.follow).toEqual([ 'another-rel' ]);
                    });
                });
            });
        });

        // TODO: Need to think this functionality over - struggling to construct a meaningful test
        xdescribe('when the model has a nested model which defines a links attribute', function () {
            beforeEach(function () {
                sut.links = {
                    'nestedModel.some-rel': Backbone.Model
                };
                sut.nestedModel = new Backbone.HypermediaModel();
            });

            describe('and the response contains a single corresponding link', function () {
                beforeEach(function () {
                    var data = {
                        nestedModel: {
                            links: [
                                { rel: 'some-rel', href: '/somewhere' }
                            ]
                        }
                    };

                    stubSync(data);
                });

                describe('and fetch is called', function () {
                    beforeEach(function () {
                        sut.fetch();
                    });

                    it('should add the related models to the nested model', function () {
                        expect(sut.nestedModel instanceof Backbone.Model).toBeTruthy();
                        expect(sut.nestedModel['some-rel']).toBeDefined();
                        expect(sut.nestedModel['some-rel'] instanceof Backbone.Model).toBeTruthy();
                    });
                });
            });
        });*/

        // when the model defined a link against a nested Backbone collection
    });
});