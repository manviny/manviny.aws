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