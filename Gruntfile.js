module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            files: ['javascripts/*.js','spec/*.js'],
            tasks: ['karma:unit:run','jshint']
        },

        nugetpack: {
            dist: {
                src: 'nuget/kodash.nuspec',
                dest: 'nuget/',
                options: {
                    version: '<%= pkg.version %>'
                }
            }
        },

        nugetpush: {
            dist: {
                src: 'nuget/*.nupkg'
            }
        },
        karma:{
            continuous: {
                configFile: 'karma.conf.js',
                singleRun: true,
                browsers: ['PhantomJS']
            },
            unit:{
                configFile:'karma.conf.js',
                browsers: ['Chrome'],
                preprocessors:null,
                singleRun:false
            }
        },
        jshint: {
            all: ['Gruntfile.js', 'javascripts/**/*.js', '!javascripts/**/*.min.map', '!javascripts/**/*.min.js', 'spec/**/*.js'],
            options: {
                jshintrc: '.jshintrc' // relative to Gruntfile
            }
        },

        clean: ['nuget/*.nupkg'],

        // pushes to npm
        release: {
            options: {
                // we'll use grunt-bump to increment the version as it
                // supports reloading the pkg config var which we need
                // as it is referenced when the nuget tasks are run
                bump: false,    
                commitMessage: 'Release <%= version %>'
                /*github: { 
                    repo: 'DrSammyD/kodash'
                }*/
            }
        },

        bump: {
            options: {
                // reload pkg config var after bump
                updateConfigs: ['pkg'],
                commit: false,
                createTag: false,
                push: false
            }
        },
        
        uglify: {
            my_target: {
                options: {
                    sourceMap: true,
                    sourceMapName: 'javascripts/kodash.min.map'
                },
                files: {
                    'javascripts/kodash.min.js': ['javascripts/kodash.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-nuget');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');

    grunt.registerTask('test', ['jshint', 'karma:continuous']);
    grunt.registerTask('minify', ['uglify']);
    grunt.registerTask('default', ['test', 'minify']);
    grunt.registerTask('publish', ['publish:patch']);
    grunt.registerTask('publish:patch', ['clean', 'minify', 'bump:patch', 'release', 'nugetpack', 'nugetpush']);
    grunt.registerTask('publish:minor', ['clean', 'minify', 'bump:minor', 'release', 'nugetpack', 'nugetpush']);
    grunt.registerTask('publish:major', ['clean', 'minify', 'bump:major', 'release', 'nugetpack', 'nugetpush']);
};