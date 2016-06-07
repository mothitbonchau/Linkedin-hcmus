var app = angular.module('myApp', ['ngMaterial', 'ngRoute', 'ngMessages', 'ngLetterAvatar', 'pascalprecht.translate', 'angularFileUpload']);
app.constant('CONFIG', {
    apiKey: "AIzaSyA3gbSfQMhKENkz2m5xNgmUgxSwu91wS1I",
    authDomain: "linkedin-hcmus-b38e0.firebaseapp.com",
    databaseURL: "https://linkedin-hcmus-b38e0.firebaseio.com",
    storageBucket: "linkedin-hcmus-b38e0.appspot.com"

//    apiKey: "AIzaSyA0ReqsTDTj-ElTOcb0DKUOh32bPs9nUCc",
//    authDomain: "testauth-327b7.firebaseapp.com",
//    databaseURL: "https://testauth-327b7.firebaseio.com",
//    storageBucket: ""
});

app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
            .primaryPalette('light-blue')
            .accentPalette('red');
});

app.config(['$translateProvider', function ($translateProvider) {
        $translateProvider.useStaticFilesLoader({
            prefix: 'data/language/locale-',
            suffix: '.json'
        });
        $translateProvider.preferredLanguage('vi');
    }]);

app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider.when('/', {
            templateUrl: 'view/home/home.html',
            controller: 'homeCtl',
            controllerAs: 'homeCtl',
            resolve: {
                "check": function (AuthFactory, $q, HomeFactory) {
                    var defer = $q.defer();
                    AuthFactory.requireAuth()
                            .then(function () {
                                HomeFactory.getUser().then(function () {
                                    defer.resolve();
                                });
                            })
                            .catch(function (result) {
                                defer.reject(result);
                            });
                    return defer.promise;
                }
            }
        }).when('/login', {
            templateUrl: 'view/login/login.html',
            controller: 'loginCtl',
            controllerAs: 'loginCtl'
        }).when('/logout', {
            template: 'Logout',
            resolve: {
                "check": ["AuthFactory", function (AuthFactory) {
                        return AuthFactory.logout();
                    }]
            }
        }).when('/user/:id', {
            templateUrl: 'view/home/home.html',
            controller: 'userCtl',
            controllerAs: 'homeCtl',
            resolve: {
                "friendState": function (HomeFactory, $q, $route) {
                    var defer = $q.defer();
                    HomeFactory.checkFriend($route.current.params.id)
                            .then(function (result) {
                                defer.resolve(result);
                            });
                    return defer.promise;
                }
            }
        }).when('/message', {
            templateUrl: 'view/message/message.html',
            controller: 'msgCtl',
            controllerAs: 'msgCtl'
        }).otherwise({redirectTo: '/'});

    }]);

app.run(['$rootScope', '$location', function ($rootScope, $location) {
        $rootScope.$on('$routeChangeError', function (event, next, previous, error) {
            if (error === "AUTH_REQUIRED") {
                $location.path("/login");
            }
        });
    }]);

app.directive('editHover', function () {
    return {
        restrict: 'A',
        scope: {
            editHover: '@',
            isauther: '='
        },
        link: function (scope, element) {
            var child = angular.element(element[0].querySelector('.non-visible'));
            if (scope.isauther) {
                element.on('mouseenter', function () {
                    child.addClass(scope.editHover);
                });
                element.on('mouseleave', function () {
                    child.removeClass(scope.editHover);
                });
            }
        }
    };
});


app.directive('uploadfile', function () {
    return {
        restrict: 'A',
        link: function (scope, element) {

            element.bind('click', function (e) {
                angular.element(e.target).siblings('#upload').trigger('click');
            });
        }
    };
});


app.controller('Ctrl', function ($scope, $q, $timeout, AuthFactory, HomeFactory, $window, ToastFactory) {


    var vm = this;
    vm.showSearch = false;
    vm.toggleSearch = function () {
        vm.showSearch = !vm.showSearch;
    }
    vm.simulateQuery = false;
    vm.isDisabled = false;
    vm.querySearch = querySearch;
    vm.selectedItemChange = selectedItemChange;
    vm.searchTextChange = searchTextChange;
    function querySearch(query) {
        return HomeFactory.searchUser(query).then(function (result) {
            var data = [];
            var ids = Object.keys(result);
            angular.forEach(ids, function (id) {
                var item = {};
                item.id = id;
                item.data = result[id].overview;
                item.letter = getName(item.data.name).trim();
                item.isImg = checkImgOK(item.data.img);
                data.push(item);
            })
            return data;
        });
    }
    function searchTextChange(text) {
    }
    function selectedItemChange(item) {
    }



    vm.auth = AuthFactory.getAuth();
    vm.database = HomeFactory.getDatabase();
    vm.email = "";
    vm.img = "";
    vm.showAvatar = true;
    vm.name = "";
    vm.auth.onAuthStateChanged(function (user) {
        if (user) {
            vm.isLogin = true;
            vm.database.ref('users/' + user.uid + '/overview').on('value', function (snapshot) {
                var data = snapshot.val();
                $timeout(function () {
                    vm.email = data.email;
                    vm.img = data.img;
                    if (angular.isUndefined(vm.img) || vm.img.trim().length < 1)
                        vm.showAvatar = false;
                    else
                        vm.showAvatar = true;
                    vm.name = getName(data.name).trim();
                }, 2);
            });
        } else
        {
            vm.isLogin = false;
            $window.location.href = "#/#";
        }
    });


    $scope.$on('friendChange', function (event, data) {
        console.log(data);
        ToastFactory.showCustom("You and " + data.name + " now are friend", data.uid);
    });
    $scope.$on('friendAdd', function (event, data) {
        if (data.value === 2)
        {
            var content = data.name + " send you a request";
            ToastFactory.showCustom(content, data.uid);
        }

    });

});

function checkImgOK(value) {
    console.log(value);
    if (checkOK(value) && value.length > 1)
        return true;
    return false;
}

