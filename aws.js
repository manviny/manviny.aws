'use strict';
   // INSTALL:  bower install manviny/manviny.aws --save
  /**
   * @memberof manviny.aws
   * @ngdoc module
   * @name aws
   * @param {service} $q promises
   * @description 
   *   Manage all related fucntions to chat
   */ 

	angular.module('manviny.aws', [])

	/**
	* UPLOAD FILES
	* @memberof DFS3
    * @ngdoc directive   		
	* @param {path}  path from where to get content
	* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
    * @example
    *   Usage:
    *   		<input type="file" file-model="myFile" />
	*			<button ng-click="uploadFile()">upload me</button>		
	*/	
	.directive('fileModel', ['$parse', function ($parse) {
	    return {
	        restrict: 'A',
	        link: function(scope, element, attrs) {
	            var model = $parse(attrs.fileModel);
	            var modelSetter = model.assign;
	            
	            element.bind('change', function(){
	                scope.$apply(function(){
	                    modelSetter(scope, element[0].files);
	                });
	            });
	        }
	    };
	}])

	.directive('fileChange', [
	    function() {
	        return {
	            link: function(scope, element, attrs) {
	                element[0].onchange = function() {
	                    scope[attrs['fileChange']](element[0])
	                }
	            }
	            
	        }
	    }
	])    
    
	.factory('httpInterceptor', function (INSTANCE_URL) {
	 return {
		  request: function (config) {
		   // Prepend instance url before every api call
		   if (config.url.indexOf('aws') > -1) {
		       config.url = INSTANCE_URL  +config.url;
		   };
		    return config;
	    }
	  }
	})
   .config([ '$httpProvider', function ($httpProvider) {
     	$httpProvider.interceptors.push('httpInterceptor');
     }
    ])
	/**
     * @memberof manviny	
	 * @ngdoc service
	 * @name DFS3
	 * @description
	 *   Services to use S3
	 */     
	.service('AWS',  function ($http, $q, $rootScope, INSTANCE_URL, localStorageService) {

		// var userPath = '/api/v2/'+ BUCKET + '/';

		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.login = function (creds) {
			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			url: 'aws/login/',
	  			data: {'user': creds.username, 'pass': creds.password},
	  		})
	  		.success(function (result) {
	  			$rootScope.session = result;
	  			$rootScope.session.user = creds.username;
	  			// guarda sesion en localstorage
	  			localStorageService.set('sesion', $rootScope.session);
	  			console.log("LOGEADO",$rootScope.session);
				deferred.resolve(result);
	  		})
	  		.error(function(data){
	  			console.log("NO LOGEADO",data)
	  			$rootScope.logged = data;
	  			deferred.reject;
			});	
			return deferred.promise;
		}
		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.logout = function (creds) {
			// borra la sesion
			localStorageService.remove('sesion');
			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			url: 'aws/logout/',
	  			data: {'user': creds.username},
	  		})
	  		.success(function (result) {
	  			$rootScope.session = null;
	  			console.log("Sesion terminada");
				deferred.resolve(result);
	  		})
	  		.error(function(data){
	  			console.log("Sesion terminada",data)
	  			$rootScope.session.user = mull;
	  			deferred.reject;
			});	
			return deferred.promise;
		}


		/**
		* Get bucket files and folders from the given path (1 level, not recursive)
		* @memberof DFS3
	 	* @function getBucketContent	 		
		* @param {path}  path from where to get content
		* @returns {array} array of Objects => {files:files, folders:folders} -> (content_length, content_type, last_modified, name, path, type)
	    * @example
	    *   Usage:
	    *   		DFS3.getBucketContent( || '' || '/' || 'path'|| '/path'|| 'path/' || '/path/')
		*			.then(function (result) { 		
		*/
		this.ListObjects = function ( path ) { 

			// mantiene la sesion en localstorage			
			$rootScope.session=localStorageService.get('sesion') 

			var deferred = $q.defer(); 
			try { $rootScope.session.path = path; }
			catch(err) { deferred.reject; } // o existe sesion todavia -ª salir


	  		$http({
	  			method: 'POST',
	  			url: 'aws/listobjects/',
	  			data: $rootScope.session 
	  		})
	  		.success(function (result) { 
	  			console.log("ListObjects",result)
	  			// Añade nombre a los folders  2015/prueba/1923  = 1923
	  			angular.forEach(result.folders, function(value, key) {
	  				result.folders[key] ={'Prefix': value.Prefix, 'name': value.Prefix.match(/([^\/]*)\/*$/)[1]  }
				});
	  			// Añade nombre a los files  2015/prueba/oto.png  = foto.png
	  			angular.forEach(result.files, function(value, key) {
	  				result.files[key]['name']=value.Key.split('/').pop();
	  				result.files[key]['type']=result.files[key]['name'].split('.').pop();
				});
	  			deferred.resolve(result);
	  		})
	  		.error(function(data){ deferred.reject; });	
			return deferred.promise;
		}



		/**
		* get  FILE from S3
		* @memberof DFS3
	 	* @function getFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.getObjectUrl = function (file) {
			var deferred = $q.defer(); 
			try { $rootScope.session.file = file;}
			catch(err) { deferred.reject; } // o existe sesion todavia -ª salir

	  		$http({
	  			method: 'POST',
	  			url: 'aws/getobjecturl/',
	  			data: $rootScope.session 
	  		})
	  		.success(function (result) { 
	  			// Añade nombre a los folders  2015/prueba/1923  = 1923
	  			angular.forEach(result.folders, function(value, key) {
	  				result.folders[key] ={'Prefix': value.Prefix, 'name': value.Prefix.match(/([^\/]*)\/*$/)[1]  }
				});
	  			deferred.resolve(result);
	  		})
	  		.error(function(data){ deferred.reject; });	
			return deferred.promise;
		};

///////////////////////////////////////////////////
//					ADAPTAR
///////////////////////////////////////////////////
		/**
		* creates FILE in S3, its content is data
		* @memberof DFS3
	 	* @function createFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFile = function (path, file, data) {
			var deferred = $q.defer();
			$http.post( this.getPath(path, file), data ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};



		/**
		* deletes  file in S3
		* @memberof DFS3
	 	* @function deleteFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.deleteFile = function (path, file) {
			console.log(this.getPath(path, file))
			var deferred = $q.defer();
			$http.delete( this.getPath(path, file) ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};

		/**
		* creates FOLDER file in S3
		* @memberof DFS3ΩΩΩ
	 	* @function createFolder	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFolder = function (path, file) {
			var deferred = $q.defer();
			$http.post( this.getPath(path, file) + '/' ).then(function (result) {
				 deferred.resolve(result.data);
			}, deferred.reject);
			return deferred.promise;
		};


		/**
		* converts path to Breadcrumbs
		* @memberof DFS3
	 	* @function pathToBreadcrumb	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.pathToBreadcrumbs = function (path) {
			
			var breadcrumbs = path.split('/');
			breadcrumbs.pop(); 
			return breadcrumbs;
		};

		/**
		* converts Breadcrumbs to path 
		* @memberof DFS3ΩΩΩ
	 	* @function breadcrumbToPath	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.breadcrumbsToPath = function (name) {

		};

		/**
		* Uploads a file to S3
		* @memberof DFS3
	 	* @function uploadFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.uploadFile = function (path, file) {

			var deferred = $q.defer();

		    var fd = new FormData();
		    fd.append("files", file);

		    $http.post( this.getPath(path, file.name) , fd, {	
		        headers: {'Content-Type': undefined },
		        transformRequest: angular.identity
		    })  
		    .success(function(data){
		    	deferred.resolve(data);
			})
			.error(function(data){
		    	deferred.reject(data);
			});	

			return deferred.promise;

		};

		// calula el path 
		this.getPath = function (path, name) {
			console.debug(path, name);
			var url = userPath;
			if(path=='/' || path=='') { url = url + name }
			else { url = url + path.replace(/^\/|\/$/g, '')  + '/' + name}
			console.debug(url);
			return url;
		};




	}) //AWS
