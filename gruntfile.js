/*global module:false*/
module.exports = function(grunt) {

    var BANNER_TEMPLATE = '/*! <%= pkg.title %> v<%= pkg.version %> | <%= pkg.homepage %> */\n';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                banner: BANNER_TEMPLATE
            },
            dist: {
                src: [
                    'js/specialEvents.js',
                    'js/pointers.js',
                    'js/gestures.js',
                    'js/taps.js',
                    'js/doubletap.js',
                    'js/pinch.js',
                    'js/drag.js',
                    'js/swipe.js'
                ],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        copy: {
            dist: {
                files: [
                    { expand: true, cwd: 'dist/', src: ['jquery.pxtouch.js'], dest: 'sample/' }
                ]
            }
        },
        jshint: {
            files: [ 'gruntfile.js', 'js/*.js', 'sample/draw.js' ],
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true,
                globals: {
                    jQuery: true,
                    PxTouch: true,
                    console: true
                }
            }
        },
        watch: {
            cj: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint', 'concat', 'copy', 'uglfiy']
            }
        },
        uglify: {
            options: {
                banner: BANNER_TEMPLATE
            },
            dist: {
                src: ['<%= concat.dist.dest %>'],
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['jshint', 'concat', 'copy', 'uglify']);

};
