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
	  				var temp = value.Key.split('/');
	  				result.files[key]['name']=temp.pop();
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

<?php 
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, X-Requested-With, Content-Type, Origin, Accept");
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 3600');



// header("Access-Control-Allow-Headers: Content-Type, Depth, User-Agent, X-File-Size, 
//     X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control");


require './aws/aws-autoloader.php';
use Aws\S3\S3Client;

	/**
	*		1.- Crear template, página y role aws 
	*		2.- La plantilla aws restringida acceso a role aws
	*		3.- Crear usuarios con role aws
	*		4.- Crear campo bucketPath para los usuarios (solo visible si tienen role aws)
	*		5.- Crear en la raiz una pagina was history con template aws_history
	*
	*/

	// http://indinet.es/aws/listobjects
	// http://indinet.es/aws/getBucket/hitd 

	// $http({ method: 'POST', url: 'http://indinet.es/aws/', data: {'role':'jrc'} })
	// .success(function (result) { })
	// .error(function(data){ });	


	//////////////////////////////////////////////////////////////
	// 					Hardcoded credentials.
	//////////////////////////////////////////////////////////////
	$key = wire('pages')->get('template=aws')->key;
	$secret = wire('pages')->get('template=aws')->secret;
	$s3 = S3Client::factory([
	    'version'     => 'latest',
	    'region'      => 'eu-west-1',
	    'credentials' => [
	        'key'    => $key,
	        'secret' => $secret,
	    ],
	]);

	//////////////////////////////////////////////////////////////
	// 					Get post Data
	//////////////////////////////////////////////////////////////

	$request = file_get_contents('php://input');
	$param = json_decode($request,true);



	// Si no tiene rol aws, salir
	// if( !wire("session")->es_aws ) return;




	//////////////////////////////////////////////////////////////
	// 					Select method
	//////////////////////////////////////////////////////////////

	// si se quiere logear no comprobar si se esta logeado
	if($input->urlSegment1=='login') login($param['user'], $param['pass']);
	
	// resto de casos comprueba si se esta logeado
	// sino esta logeado salir
	if( !isLoged($param['user'], $param['challenge'], $param['fingerprint'] ) ) return false;

	switch ( $input->urlSegment1 ) {
	    case "listobjects":	ListObjects($s3, $param['user'], $param['path']); break;
	    case "getobjecturl": getObjectUrl($s3, $param['user'], $param['path'], $param['file']); break;
	    case "logout": logout($param['user']); break;
	    case "getBucket": getBucket($s3); break;
		default:
			throw new Wire404Exception();
	} 


	//////////////////////////////////////////////////////////////
	// 						methods
	//////////////////////////////////////////////////////////////
	function getBucket($s3) {
		// // Use an Aws\Sdk class to create the S3Client object.
		// $s3 = $sdk->createS3();

		// // Send a PutObject request and get the result object.
		// $result = $s3->putObject([
		//     'Bucket' => 'mny-tmp',
		//     'Key'    => 'my-key',
		//     'Body'   => 'this is the body!'
		// ]);

		// // Download the contents of the object.
		$result = $s3->getObject([
		    'Bucket' => 'mny-tmp',
		    'Key'    => 'my-key'
		]);

		// // Print the body of the result by indexing into the result object.
		echo $result['Body'];		
	}

	/**
	 * Poperties:
	 * Key, LastModified, ETag, Size, StorageClass, Owner.DisplayName, Owner.ID
	 *
	 */
	function ListObjects($s3, $user, $path) { 

			if($path=='/') $path='';
			// pagina del ultimo login
			// datos  del usuario
			$actual = wire("pages")->get("template=aws")->get("name=$user")->children()->first();

			$bucket = $actual->bucket;	// debe leerse del usuario logeado
			$prefix = $actual->prefix.$path;	// debe leerse del usuario logeado		

			///////////////////
			// FOLDERS
			///////////////////
			$folders = $s3->ListObjects(array( 'Bucket' => $bucket, "Prefix" => $prefix, 'Delimiter' => "/"));


			///////////////////
			// FILES
			///////////////////
			$files = array();
			

			$iterator = $s3->getIterator(
				'ListObjects', 
				array(
			    	"Bucket" => "".$bucket,
			    	"Prefix" => $prefix,
			    	"Delimiter" => "/"
				)
			);

			foreach ($iterator as $object) { array_push($files, $object); }

			///////////////////
			// JSON
			///////////////////

			echo json_encode( 
				array(	
					"files" => $files, 
					"folders" => $folders->get("CommonPrefixes"),
				    "Bucket" => "".$bucket,
				    "Prefix" => $prefix,
				    "Delimiter" => "/"									
				) 
			);
			return;

	}

	/**
	 * Poperties:
	 * Key, LastModified, ETag, Size, StorageClass, Owner.DisplayName, Owner.ID
	 *
	 */
	function getObjectUrl($s3, $user, $path, $file) { 

			if($path=='/') $path='';
			// pagina del ultimo login
			// datos  del usuario
			$actual = wire("pages")->get("template=aws")->get("name=$user")->children()->first();

			$bucket = $actual->bucket;	// debe leerse del usuario logeado
			$prefix = $actual->prefix.$path;	// debe leerse del usuario logeado	

			$url = 	$s3->getObjectUrl($bucket, $prefix.$file, '+1 minute' );

			echo $url;
			return;
	}

	/**
	 * Poperties:
	 * LOGIN
	 *
	 */
	function login($user, $pass) { 
		
	    $u = wire("session")->login( wire("sanitizer")->username($user), $pass);	// login successful
		
	    if($u) { 

	    	wire("session")->user = $u;  

			// Añade una nueva persona al fichero
			$actual = wire('session')->_user;		// datos de la sesion
	    	
			// SI EXISTE DA UN ERROR Y NO SIGUE
			$p = new Page(); // create new page object
			$p->template = 'aws_sesion'; // set template

			$usuario = wire("session")->user->name;
			$p->parent = wire("pages")->get("template=aws")->get("name=$usuario"); // set the parent 
	
			// name, title and other fields
			$hora = date('Ymd_His');
			$result = explode("/", $p->parent->bucketpath); // Pull it apart
			$bucket=array_shift($result);	// debe leerse del usuario logeado

			$p->name = $hora ; // give it a name used in the url for the page
			$p->title = $hora; // set page title 
			$p->bucket = $bucket;  
			$p->prefix = implode("/", $result); 
			$p->sesion_id = $actual['id'];  
			$p->ts = $actual['ts'];  
			$p->challenge = $actual['challenge'];  
			$p->fingerprint = $actual['fingerprint'];  

			// si no existe el usuario bajo aws history falla
			try { $p->save(); echo json_encode($actual); }
			catch(Exception $e) { echo false; }			
	    }	

	    else { echo false; }

	}

	function logout($user) { 

		$sesion = wire("pages")->get("template=aws")->get("name=$user"); // set the parent 
		$sesion->bucket = '';  
		$sesion->prefix = ''; 
		$sesion->sesion_id ='';  
		$sesion->ts = '';  
		$sesion->challenge = 'fin';  
		$sesion->fingerprint = 'fin'; 		
		// wire("session")->logout();
		echo "Has terminado la sesión";
	}


	function isLoged($user, $challenge, $fingerprint) { 

		// pagina del ultimo login
		$actual = wire("pages")->get("template=aws")->get("name=$user")->children()->first();

		// comprueba si esta logeado
		if($actual->challenge == $challenge && $actual->fingerprint == $fingerprint ) return true;

		return false;

	}
 

?>