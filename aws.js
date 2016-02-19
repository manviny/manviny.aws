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
    


	/**
     * @memberof manviny	
	 * @ngdoc service
	 * @name DFS3
	 * @description
	 *   Services to use S3
	 */     
	.service('AWS',  function ($http, $q, $rootScope) {

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
	  			url: 'http://indinet.es/aws/login/',
	  			// data: {'user': creds.email, 'pass': creds.password}
	  			data: {'user': creds.username, 'pass': creds.password},
	  			// headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
	  		})
	  		.success(function (result) {
	  			console.log("LOGEADO",result);
	  			$rootScope.token = result;
				deferred.resolve(result);
	  		})
	  		.error(function(data){
	  			console.log("NO LOGEADO",data)
	  			$rootScope.token = data;
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
		this.ListObjects = function ( prefix, delimiter ) { 
			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			url: 'http://indinet.es/aws/listobjects/',
	  			data: {'prefix': prefix, 'delimiter': delimiter, 'token': $rootScope.token},
	  			// withCredentials: true,
      //   		headers: {
      //               'Content-Type': 'application/json; charset=utf-8'
      //   		}
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
		}

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
		* get  FILE from S3
		* @memberof DFS3
	 	* @function getFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.getFile = function (path, file, download) {
			// if(download) download = '?download=true';
			download = download ? '?download=true' : '';
			console.debug("DOWNLOAD", this.getPath(path, file)+ download );
			var deferred = $q.defer();


			$http.get( this.getPath(path, file)+ download )
			.then(function (result) {
				if(download!='') {			// Descargar ichero
				    var anchor = angular.element('<a/>');
				    anchor.attr(
				    {
				        href: 'data:text/html;charset=utf-8,' + (result),
				        // href: 'data:image/png,' + encodeURI(result.data),
				        target: '_blank',
				        download: file
				    }
				    )[0].click();						
				}
				// Devolver metadata
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

