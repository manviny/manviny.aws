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
	.service('AWS',  function ($http, $q, $rootScope, INSTANCE_URL) {

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
	  			// guarda session en localstorage
	  		
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
		this.logout = function () { console.log($rootScope.session)
			// borra la session
			var deferred = $q.defer();
	  		$http({
	  			method: 'POST',
	  			url: 'aws/logout/',
	  			data: {'user': $rootScope.session.user},
	  		})
	  		.success(function (result) {
	  			$rootScope.session = null;
				
				deferred.resolve(result);
	  		})
	  		.error(function(data){
	  			$rootScope.session.user = null;
				
	  			deferred.reject("Sesion terminada");
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

			var deferred = $q.defer(); 

	  		$http({ method: 'POST', url: 'aws/listobjects/', data: {path:  path} })
	  		.success(function (result) { 
	  			// console.log("ListObjects",result)

	  			// Añade campo nombre a los FOLDERS  2015/prueba/1923  = 1923
	  			angular.forEach(result.folders, function(value, key) {
	  				result.folders[key] ={'Prefix': value.Prefix, 'name': value.Prefix.match(/([^\/]*)\/*$/)[1]  }
				});

	  			// Añade campo nombre a los FILES  2015/prueba/oto.png  = foto.png
	  			angular.forEach(result.files, function(value, key) {
	  				result.files[key]['name']=value.Key.split('/').pop();
	  				result.files[key]['type']=result.files[key]['name'].split('.').pop();
	  				result.files[key]['thumb']=result.Prefix+'._/'+result.files[key]['name'];
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

	  		$http({
	  			method: 'POST',
	  			url: 'aws/getobjecturl/',
	  			data: {file: file} 
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




		/**
		* deletes  file in S3
		* @memberof AWS
	 	* @function deleteFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.deleteFile = function (objectPath) { 
			var deferred = $q.defer(); 

	  		$http({
	  			method: 'POST',
	  			url: 'aws/deleteobject/',
	  			data: {objectPath: objectPath}  
	  		})
	  		.success(function (result) { 
	  			deferred.resolve(result);
	  		})
	  		.error(function(data){ deferred.reject; });	
			return deferred.promise;
		};

		/**
		* get  FILE from S3
		* @memberof DFS3
	 	* @function getFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.getFileContent = function (file) {

			var deferred = $q.defer(); 

	  		$http({
	  			method: 'POST',
	  			url: 'aws/getfilecontent/',
	  			data: {objectPath: file} 
	  		})
	  		.success(function (result) { deferred.resolve(result); })
	  		.error(function(data){ deferred.reject; });	
			return deferred.promise;
		};



		/**
		* deletes  file in S3
		* @memberof AWS
	 	* @function deleteFile	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.setFileContent = function (objectPath,  DATAJSON) { 

			var deferred = $q.defer(); 

	  		$http({
	  			method: 'POST',
	  			url: 'aws/setfilecontent/',
	  			data: {objectPath: objectPath, content:JSON.stringify(DATAJSON)} 
	  		})
	  		.success(function (result) { 
	  			console.log("CONTENIDO",result)
	  			deferred.resolve(result);
	  		})
	  		.error(function(data){ deferred.reject; });	
			return deferred.promise;
		};


		/**
		* creates FOLDER file in S3
		* @memberof DFS3
	 	* @function createFolder	 		
		* @param {path,name} path in S3, name of the file
		* @returns {Hash} filterd attributes
		*/
		this.createFolder = function (objectPath) {
			var deferred = $q.defer(); 
			
	  		$http({
	  			method: 'POST',
	  			url: 'aws/setfilecontent/',
	  			data: {objectPath: objectPath, content:''} 
	  		})
	  		.success(function (result) { 
	  			console.log("CONTENIDO",result)
	  			deferred.resolve(result);
	  		})
	  		.error(function(data){ deferred.reject; });	
			return deferred.promise;
		};

////////////
////////////
////////////






///////////////////////////////////////////////////
//					ADAPTAR
///////////////////////////////////////////////////


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
