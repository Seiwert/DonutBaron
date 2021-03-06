var http = require('http'),
assert = require('chai').assert,
app = require('../app.js'),
host = 'http://localhost:8080',
fs = require('fs'),
request = require('request').defaults({jar:true, followAllRedirects : true});


// Launch the web app before testing
before(function(done) {
    server = app.listen(function(err, result) {
        if(err) done(err);
        else done();
    });
});

// Close the web app when testing is finished
after(function(done) {
    server.close();
    done();
});

// Top­level application tests
describe('app tests', function() {
    
    //Test to make sure that app object is not null.
    it('App should exist', function() {
        assert.ok(app);
    });
    
    //Tests to make sure that the server starts up.
    it('Should be listening at localhost:8080', function(done) {
        http.get(host, function(res) {
            assert.equal(res.statusCode, 302);
            done();
        });
    });
});

// Static file tests
describe('static route tests', function() {

    // Helper functions
    function testStaticFile(route, path, done) {
        var fileBody;
        var responseBody;
        // ensure the served and original files match
        function checkBodies() {
            assert.equal(fileBody, responseBody, "Contents of served and requested file do not match");
            done();
            }
            
        // request the file from the server
        http.get(route, (res) => {
            assert.equal(res.statusCode, 200);
            var body = "";
            res.on('data', (chunk) => {body += chunk;});
            res.on('error', (err) => {done(err);});
            res.on('end', () => {
            responseBody = body;
                if(fileBody) checkBodies();
            })
        });
        // load the file from the public directory
        fs.readFile(path, (err, body) => {
            if(err) return done(err);
            fileBody = body;
            if(responseBody) checkBodies();
        });
    }
    
    // ### JS FILES ###
    it('public/js/donut.js is served from url/donut.js', function(done) {
        testStaticFile(host + '/js/donut.js', './public/js/donut.js', done);
    });
    
    it('jquery.raty is serverd', function(done) {
        testStaticFile(host + '/js/jquery.raty.js', './public/js/jquery.raty.js', done);
    });
    
    it('jquery-comments.js is served', function(done) {
        testStaticFile(host + '/js/jquery-comments.js', './public/js/jquery-comments.js', done);
    })
    
    // ### CSS FILES ###
    it('donut.css is served', function(done) {
        testStaticFile(host + '/css/donut.css', './public/css/donut.css', done);
    });
    
    it('jquery.raty.css is served', function(done) {
        testStaticFile(host + '/css/jquery.raty.css', './public/css/jquery.raty.css', done);
    });
    
    it('jquery.comments.css is served', function(done) {
        testStaticFile(host + '/css/jquery-comments.css', './public/css/jquery-comments.css', done);
    });
});


// User functionality tests
describe('User functionality tests', function() {
    it('Logging in with seiwerta', function(done) {
        request({
            url : host + '/login',
            method: 'POST',
            form : {
                Username : 'seiwerta',
                Password : 'password2'
            }
        },
        function(error, res, body) {
            if(error) {
                console.log(error);
                return done(error);
            }
            assert.include(body,'Adam Seiwert');
            assert.equal(res.statusCode, 200);
            done(); 
        });
    });
    
    it('Rating the Donut Dollie', function(done) {
        request({
            url : host + '/index/rate',
            method : 'POST',
            form : {
                //Leave delivered as undefined because controller expects this
                score : '3'
            }
        },
        function(error, res, body) {
            if(error) {
                console.log(error);
                return done(error);
            }
            assert.include(body, 'Thanks for voting this week!');
            assert.equal(res.statusCode, 200);
            done();
        })
    });
    
    it('Comment Creation test', function(done) {
       request({
           url : host + '/comments/add',
           method : 'POST',
           form : {
               comment : {
                    content : 'Hello this is a test',
                    created : '2016-05-09T20:14:51.210Z'
               },
               currentUser : 'Adam Seiwert',
           }
       },
       function(error, res, body) {
           if(error) {
                console.log(error);
                return done(error);
            }
            assert.include(body, 'Hello this is a test');
            assert.equal(res.statusCode, 200);
            done();
       }) 
    });
    
    it('View Rankings page', function(done) {
        request
            .get(host + '/rankings')
            .on('response',function(res) {
                assert.equal(res.statusCode, 200);
                done();
            });
    });
    
    it('Logout Functionality test', function(done) {
        request
            .get(host + '/logout')
            .on('response', function(res) {
                assert.equal(res.statusCode, 200);
                done();
            });
    });
    
    it('Account Registration Test', function(done) {
        request({
            url : host + '/register',
            method : 'POST',
            form : {
                Username : 'TheDonut',
                first_name : 'Homer',
                last_name : 'Simpson',
                organization_name : 'PowerPlant',
                email : 'donuteater@fake.com',
                phone : '8675309',
                password : 'asdf'
            }
        },
        function(error, res, body) {
            if(error) {
                console.log(error);
                return done(error);
            }
            assert.include(body, 'Homer Simpson');
            assert.equal(res.statusCode, 200);
            done();
        });
    })
    
});
